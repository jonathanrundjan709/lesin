import type { BillingService } from "./billing-service";
import type { LessonService } from "./lesson-service";

export interface JobsReport { expiredOrders: number; remindersSent: number }

/** Pekerjaan terjadwal (dipanggil cron): order kedaluwarsa dan pengingat sesi. Permintaan kedaluwarsa dihitung saat dibaca. */
export class JobsService {
  constructor(private d: { billing: BillingService; lessons: LessonService }) {}
  async runAll(): Promise<JobsReport> {
    const [expiredOrders, remindersSent] = await Promise.all([this.d.billing.expirePending(), this.d.lessons.sendReminders()]);
    return { expiredOrders, remindersSent };
  }
}
