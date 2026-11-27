import { fail } from "@/domain/errors";
import { creditBalance } from "@/domain/leads";
import { CONTACT_PRICE, PRODUCTS, TRIAL_CONTACTS, TRIAL_DAYS } from "@/domain/pricing";
import type { Id, LedgerEntry } from "@/domain/types";
import { toTutorView, type TutorView } from "@/domain/views";
import type { Repositories } from "../ports";
import { type BaseDeps, recordEvent } from "./context";
import { TutorService } from "./tutor-service";
import type { HistoryItem } from "./lead-service";

const DAY_MS = 86_400_000;

export interface ContactStatus {
  /** Kuota buka kontak yang masih berlaku (trial + paket). */
  credits: number;
  trialActive: boolean;
  trialEndsAt: number | null;
  trialLimit: number;
  contactPrice: number;
}
export interface ContactUnlockResult { charged: boolean; tutor: TutorView; status: ContactStatus }

/** Kredit trial pencari baru. Id deterministik supaya tidak pernah diberikan dua kali. */
export const trialEntry = (userId: Id, now: number): LedgerEntry => ({
  id: `trial:${userId}`, userId, kind: "contact", delta: TRIAL_CONTACTS, reason: "trial", refId: "trial", expiresAt: now + TRIAL_DAYS * DAY_MS, createdAt: now,
});

/**
 * Kuota buka kontak untuk pencari: trial 7 hari (maks. 10 kontak) lalu paket berbayar.
 * Membuka kontak seorang tutor memberi pencari nama asli dan WhatsApp-nya. Tutor tidak membayar untuk ini.
 */
export class ContactService {
  constructor(private d: BaseDeps) {}

  private async snapshot(r: Repositories, userId: Id, now: number): Promise<ContactStatus> {
    // Akun lama (sebelum fitur ini) mendapat trial sekali, mulai saat pertama kali dicek.
    await r.ledger.insertOnce(trialEntry(userId, now));
    const entries = await r.ledger.byUser(userId, "contact");
    const trial = entries.find((e) => e.reason === "trial");
    return {
      credits: creditBalance(entries, now), trialActive: Boolean(trial?.expiresAt && trial.expiresAt > now), trialEndsAt: trial?.expiresAt ?? null,
      trialLimit: TRIAL_CONTACTS, contactPrice: CONTACT_PRICE,
    };
  }

  async status(userId: Id): Promise<ContactStatus> {
    const now = this.d.clock.now();
    return this.d.uow.run((r) => this.snapshot(r, userId, now));
  }

  /**
   * Atomik: kunci pencari, cek kuota, potong 1, catat unlock. Membuka ulang tutor yang sama tidak dikenai biaya.
   * Kuota habis (trial selesai dan belum beli paket) -> 402 agar UI mengarahkan ke pembelian paket.
   */
  async unlockTutor(seekerId: Id, tutorId: Id): Promise<ContactUnlockResult> {
    const now = this.d.clock.now();
    return this.d.uow.run(async (r) => {
      const seeker = (await r.users.lockById(seekerId)) ?? fail("unauthorized", "Masuk dulu.");
      if (seekerId === tutorId) return fail("validation", "Ini CV-mu sendiri.");
      const [tutorUser, profile] = await Promise.all([r.users.byId(tutorId), r.tutors.byUserId(tutorId)]);
      if (!tutorUser || !profile || profile.completedAt === null || profile.verification === "suspended") return fail("not_found", "Tutor tidak ditemukan.");

      const status0 = await this.snapshot(r, seeker.id, now);
      if (await r.contactUnlocks.has(seekerId, tutorId)) return { charged: false, tutor: toTutorView(tutorUser, profile, true, now), status: status0 };
      if (status0.credits < 1) {
        return fail("payment_required", status0.trialEndsAt && !status0.trialActive
          ? "Masa percobaan gratis sudah selesai. Beli paket kontak untuk membuka tutor ini."
          : "Kuota buka kontak habis. Beli paket kontak untuk membuka tutor ini.");
      }
      await r.ledger.insert({ id: this.d.ids.next(), userId: seekerId, kind: "contact", delta: -1, reason: "unlock", refId: tutorId, expiresAt: null, createdAt: now });
      await r.contactUnlocks.insert({ id: this.d.ids.next(), seekerId, tutorId, createdAt: now });
      await recordEvent(r, this.d, "contact_unlock", seekerId, { tutorId });
      return { charged: true, tutor: toTutorView(tutorUser, profile, true, now), status: { ...status0, credits: status0.credits - 1 } };
    });
  }

  /** Semua tutor yang kontaknya terbuka untuk pencari ini: dari kuota sendiri atau karena tutor merespons permintaannya. */
  async revealedTutors(seekerId: Id): Promise<TutorView[]> {
    const now = this.d.clock.now();
    return this.d.uow.run(async (r) => {
      const ids = [...(await TutorService.revealedTutorIds(r, seekerId))];
      const [users, profiles] = await Promise.all([r.users.byIds(ids), Promise.all(ids.map((id) => r.tutors.byUserId(id)))]);
      const userMap = new Map(users.map((u) => [u.id, u]));
      return profiles.flatMap((p) => { const u = p && userMap.get(p.userId); return p && u ? [toTutorView(u, p, true, now)] : []; });
    });
  }

  /** Riwayat kuota: trial, pembelian paket (Rp), dan pemakaian. */
  async history(userId: Id): Promise<HistoryItem[]> {
    return this.d.uow.run(async (r) => {
      const [ledger, orders] = await Promise.all([r.ledger.byUser(userId, "contact"), r.orders.byBuyer(userId)]);
      const items: HistoryItem[] = [
        ...ledger.filter((e) => e.reason !== "pack").map((e) => ({
          id: e.id, at: e.createdAt, leadDelta: e.delta, amount: null,
          label: e.reason === "trial" ? `Kuota gratis ${TRIAL_DAYS} hari pertama` : e.reason === "unlock" ? "Buka kontak tutor" : "Pengembalian kuota",
        })),
        ...orders.filter((o) => o.status === "paid" && PRODUCTS[o.product].audience === "seeker").map((o) => ({ id: o.id, at: o.createdAt, leadDelta: o.units, amount: -o.amount, label: `Beli paket ${o.units} kontak` })),
      ];
      return items.sort((a, b) => b.at - a.at);
    });
  }
}
