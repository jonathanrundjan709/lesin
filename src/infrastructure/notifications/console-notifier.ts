import type { Notifier } from "@/application/ports";

/** Mencatat pesan ke log. Ganti dengan penyedia WhatsApp Business API saat sudah dipilih (PRD §15). */
export class ConsoleNotifier implements Notifier {
  readonly sent: { phone: string; message: string }[] = [];

  async send(phone: string, message: string): Promise<void> {
    this.sent.push({ phone, message });
    if (process.env.NODE_ENV !== "test") console.info(`[notify] ${phone}: ${message}`);
  }
}
