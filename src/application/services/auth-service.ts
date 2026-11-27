import { fail } from "@/domain/errors";
import { LOGIN_MAX_FAILS_PER_ID, LOGIN_MAX_FAILS_PER_IP, LOGIN_WINDOW_MS } from "@/domain/login-limits";
import { normalizeEmail } from "@/domain/otp";
import type { User } from "@/domain/types";
import type { OtpCodes, PasswordHasher, SessionTokens } from "../ports";
import { emailInput, loginInput, normalizePhone, parse, phoneInput, signupInput, verifyInput } from "../validation";
import { trialEntry } from "./contact-service";
import { type BaseDeps, type PublicUser, toPublicUser } from "./context";
import { assertOtp, type OtpService } from "./otp-service";

export interface AuthResult { user: PublicUser; token: string }
export interface PendingEmail { email: string; echo?: string }

/**
 * Daftar dengan email + OTP, lalu tambah nomor WhatsApp. Satu email satu akun dan satu nomor satu akun;
 * masa percobaan diberikan saat nomor ditambahkan, sekali per nomor, sehingga akun kedua tidak mendapat trial lagi.
 */
export class AuthService {
  constructor(private d: BaseDeps & { hasher: PasswordHasher; tokens: SessionTokens; codes: OtpCodes; otp: OtpService }) {}

  private session(user: User): AuthResult {
    return { user: toPublicUser(user), token: this.d.tokens.issue(user.id, this.d.clock.now()) };
  }

  /** Langkah 1: buat akun (belum aktif) dan kirim kode ke email. Sesi baru terbit setelah kode benar. */
  async signup(raw: unknown, ip: string): Promise<PendingEmail> {
    const input = parse(signupInput, raw);
    const passwordHash = await this.d.hasher.hash(input.password);
    await this.d.uow.run(async (r) => {
      const existing = await r.users.byEmail(input.email);
      if (existing?.emailVerifiedAt) fail("conflict", "Email ini sudah terdaftar. Silakan masuk.");
      // Pendaftaran yang belum diverifikasi boleh diulang: data terbaru yang dipakai.
      if (existing) return r.users.update({ ...existing, name: input.name, passwordHash });
      const u: User = {
        id: this.d.ids.next(), name: input.name, passwordHash, email: input.email, emailVerifiedAt: null, phone: null,
        isAdmin: false, status: "active", createdAt: this.d.clock.now(),
      };
      await r.users.insert(u);
    });
    return { email: input.email, ...(await this.d.otp.issue(input.email, ip)) };
  }

  /** Tolak sebelum menghitung hash bila akun atau jaringan ini sudah terlalu sering gagal. */
  private async assertNotThrottled(idKey: string, ipKey: string): Promise<void> {
    const since = this.d.clock.now() - LOGIN_WINDOW_MS;
    const [byId, byIp] = await this.d.uow.run(async (r) => [await r.loginFailures.countSince(idKey, since), await r.loginFailures.countSince(ipKey, since)]);
    if (byId >= LOGIN_MAX_FAILS_PER_ID || byIp >= LOGIN_MAX_FAILS_PER_IP) fail("rate_limited", "Terlalu banyak percobaan masuk. Coba lagi dalam 15 menit.");
  }

  /** Langkah 2: kode benar -> email terverifikasi dan sesi terbit. */
  async verify(raw: unknown): Promise<AuthResult> {
    const input = parse(verifyInput, raw);
    const { outcome, user } = await this.d.uow.run(async (r) => {
      const u = await r.users.byEmail(input.email);
      if (!u || u.emailVerifiedAt) return { outcome: "expired" as const, user: null };
      const outcome = await this.d.otp.check(r, input.email, input.code);
      if (outcome !== "ok") return { outcome, user: null };
      const verified = { ...u, emailVerifiedAt: this.d.clock.now() };
      await r.users.update(verified);
      return { outcome, user: verified };
    });
    assertOtp(outcome);
    return this.session(user as User);
  }

  /** Kirim ulang kode. Jawabannya sama untuk email yang tidak dikenal, supaya daftar akun tidak bisa ditebak. */
  async resend(raw: unknown, ip: string): Promise<{ echo?: string }> {
    const { email } = parse(emailInput, raw);
    const user = await this.d.uow.run((r) => r.users.byEmail(email));
    if (!user || user.emailVerifiedAt) return {};
    return this.d.otp.issue(email, ip);
  }

  async login(raw: unknown, ip: string): Promise<AuthResult> {
    const input = parse(loginInput, raw);
    const idKey = `id:${this.d.codes.hash("login", input.id.toLowerCase())}`, ipKey = `ip:${this.d.codes.hash("login", ip || "-")}`;
    await this.assertNotThrottled(idKey, ipKey);
    const byEmail = input.id.includes("@");
    const user = await this.d.uow.run((r) => (byEmail ? r.users.byEmail(normalizeEmail(input.id)) : r.users.byPhone(normalizePhone(input.id))));
    // Selalu menghitung hash agar waktu respons tidak membocorkan apakah akun terdaftar.
    const ok = await this.d.hasher.verify(input.password, user?.passwordHash ?? "scrypt$00$00");
    if (!user || !ok) {
      await this.d.uow.run(async (r) => { const at = this.d.clock.now(); await r.loginFailures.insert(this.d.ids.next(), idKey, at); await r.loginFailures.insert(this.d.ids.next(), ipKey, at); });
      return fail("unauthorized", "Email, nomor, atau password salah.");
    }
    if (user.status !== "active") return fail("forbidden", "Akun ini dinonaktifkan.");
    // Password benar tetapi email belum diverifikasi: klien lanjut ke langkah kode (meminta kode lewat resend).
    if (user.email && !user.emailVerifiedAt) return fail("unverified", "Email belum diverifikasi. Verifikasi dulu lewat kode yang dikirim ke emailmu.");
    return this.session(user);
  }

  /**
   * Tambah nomor WhatsApp (wajib). Nomor tidak bisa dipakai dua akun dan tidak bisa diganti sendiri.
   * Masa percobaan diberikan di sini, dengan id berdasarkan nomor, sehingga satu nomor hanya sekali.
   */
  async setPhone(userId: string, raw: unknown): Promise<{ user: PublicUser; trialGranted: boolean }> {
    const { phone } = parse(phoneInput, raw);
    const now = this.d.clock.now();
    return this.d.uow.run(async (r) => {
      const user = (await r.users.lockById(userId)) ?? fail("unauthorized", "Masuk dulu.");
      if (user.phone === phone) return { user: toPublicUser(user), trialGranted: false };
      if (user.phone) return fail("conflict", "Nomor WhatsApp tidak bisa diganti sendiri. Hubungi admin LesIn.");
      const other = await r.users.byPhone(phone);
      if (other) return fail("conflict", "Nomor ini sudah dipakai akun lain. Masuk dengan akun itu, atau pakai nomor lain.");
      const updated: User = { ...user, phone };
      await r.users.update(updated);
      const trialGranted = await r.ledger.insertOnce(trialEntry(updated.id, phone, now)); // 7 hari gratis, maks. 10 buka kontak
      return { user: toPublicUser(updated), trialGranted };
    });
  }

  /** Pengguna dari token sesi, atau null. */
  async authenticate(token: string | undefined): Promise<User | null> {
    if (!token) return null;
    const id = this.d.tokens.verify(token, this.d.clock.now());
    if (!id) return null;
    const u = await this.d.uow.run((r) => r.users.byId(id));
    return u && u.status === "active" ? u : null;
  }
}
