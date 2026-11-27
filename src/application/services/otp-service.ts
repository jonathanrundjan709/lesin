import { fail } from "@/domain/errors";
import {
  normalizeEmail, otpBody, otpSubject, OTP_MAX_ATTEMPTS, OTP_MAX_PER_EMAIL, OTP_MAX_PER_IP, OTP_RESEND_COOLDOWN_MS, OTP_TTL_MS,
} from "@/domain/otp";
import type { OtpCodes, OtpSender, Repositories } from "../ports";
import type { BaseDeps } from "./context";

export type OtpOutcome = "ok" | "wrong" | "expired" | "locked";

/**
 * Kode OTP email: terbit dengan batas frekuensi, disimpan sebagai hash, berlaku sebentar, dan terkunci setelah terlalu banyak salah.
 * Pengiriman email dilakukan di luar transaksi database supaya koneksi tidak tertahan oleh penyedia email.
 */
export class OtpService {
  constructor(private d: BaseDeps & { sender: OtpSender; codes: OtpCodes }) {}

  /** Buat kode baru dan kirim. Mengembalikan `echo` (kode) hanya bila pengirimnya mode demo. */
  async issue(rawEmail: string, ip: string): Promise<{ echo?: string }> {
    const email = normalizeEmail(rawEmail), now = this.d.clock.now(), ipHash = this.d.codes.hash("ip", ip || "-");
    const code = this.d.codes.generate();
    await this.d.uow.run(async (r) => {
      const last = await r.otp.latest(email);
      if (last && now - last.createdAt < OTP_RESEND_COOLDOWN_MS) {
        fail("rate_limited", `Tunggu ${Math.ceil((OTP_RESEND_COOLDOWN_MS - (now - last.createdAt)) / 1000)} detik sebelum meminta kode lagi.`);
      }
      if ((await r.otp.countByEmailSince(email, now - OTP_MAX_PER_EMAIL.windowMs)) >= OTP_MAX_PER_EMAIL.count) fail("rate_limited", "Terlalu banyak permintaan kode untuk email ini. Coba lagi nanti.");
      if ((await r.otp.countByIpSince(ipHash, now - OTP_MAX_PER_IP.windowMs)) >= OTP_MAX_PER_IP.count) fail("rate_limited", "Terlalu banyak permintaan dari jaringan ini. Coba lagi nanti.");
      const id = this.d.ids.next();
      await r.otp.insert({ id, email, codeHash: this.d.codes.hash(id, code), expiresAt: now + OTP_TTL_MS, attempts: 0, consumedAt: null, ipHash, createdAt: now });
    });
    try {
      return await this.d.sender.send(email, otpSubject(code), otpBody(code), code);
    } catch (e) {
      console.error("[otp] gagal mengirim email:", (e as Error).message);
      return fail("conflict", "Kode belum bisa dikirim ke email itu. Coba lagi sebentar lagi.");
    }
  }

  /**
   * Periksa kode di dalam transaksi pemanggil. Tidak melempar galat: percobaan salah harus tetap tercatat (transaksi tidak
   * boleh dibatalkan), jadi pemanggil menerjemahkan hasilnya menjadi pesan sesudah transaksi selesai.
   */
  async check(r: Repositories, rawEmail: string, code: string): Promise<OtpOutcome> {
    const email = normalizeEmail(rawEmail), now = this.d.clock.now();
    const c = await r.otp.latest(email);
    if (!c || c.consumedAt !== null || c.expiresAt <= now) return "expired";
    if (c.attempts >= OTP_MAX_ATTEMPTS) return "locked";
    if (this.d.codes.hash(c.id, code) !== c.codeHash) {
      await r.otp.update({ ...c, attempts: c.attempts + 1 });
      return c.attempts + 1 >= OTP_MAX_ATTEMPTS ? "locked" : "wrong";
    }
    await r.otp.update({ ...c, consumedAt: now });
    return "ok";
  }
}

export function assertOtp(outcome: OtpOutcome): void {
  if (outcome === "ok") return;
  if (outcome === "wrong") fail("validation", "Kode salah. Periksa lagi kodenya.");
  if (outcome === "locked") fail("rate_limited", "Terlalu banyak percobaan. Minta kode baru.");
  fail("validation", "Kode sudah kedaluwarsa. Minta kode baru.");
}
