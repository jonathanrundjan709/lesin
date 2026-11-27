import type { OtpSender } from "@/application/ports";

/**
 * Mode demo: tidak mengirim email, kode dikembalikan ke pemanggil supaya alur bisa dicoba tanpa penyedia email.
 * JANGAN dipakai untuk peluncuran: siapa pun bisa mendaftar dengan email orang lain. Pasang RESEND_API_KEY sebelum iklan berbayar.
 */
export class EchoOtpSender implements OtpSender {
  readonly sent: { email: string; code: string }[] = [];

  async send(email: string, _subject: string, _body: string, code: string): Promise<{ echo: string }> {
    this.sent.push({ email, code });
    if (process.env.NODE_ENV !== "test") console.info(`[otp-demo] ${email}: ${code}`);
    return { echo: code };
  }
}
