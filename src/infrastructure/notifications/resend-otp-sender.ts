import type { OtpSender } from "@/application/ports";

/** Kirim email lewat Resend (https://resend.com). Gratis untuk skala pilot; domain pengirim perlu diverifikasi agar tidak masuk spam. */
export class ResendOtpSender implements OtpSender {
  constructor(private apiKey: string, private from: string, private fetchImpl: typeof fetch = fetch) {}

  async send(email: string, subject: string, body: string): Promise<Record<string, never>> {
    const res = await this.fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: this.from, to: [email], subject, text: body }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return {};
  }
}
