import { fail } from "@/domain/errors";
import { leadBalance } from "@/domain/leads";
import { toWaNumber } from "@/domain/masking";
import { LEAD_PRICE, MAX_RESPONDERS, PRODUCTS } from "@/domain/pricing";
import type { Id } from "@/domain/types";
import { isPlanActive } from "@/domain/views";
import { type BaseDeps, recordEvent } from "./context";

export interface LeadStatus { leads: number; planActive: boolean; planUntil: number | null; leadPrice: number }
export interface UnlockResult extends LeadStatus {
  charged: boolean;
  contact: { seekerId: Id; name: string; phone: string; waNumber: string };
}
export interface HistoryItem { id: string; at: number; label: string; leadDelta: number; amount: number | null }

/** Saldo lead tutor dan pembukaan permintaan (1 lead = 1 permintaan, maksimal 10 tutor per permintaan). */
export class LeadService {
  constructor(private d: BaseDeps) {}

  async status(tutorId: Id): Promise<LeadStatus> {
    const now = this.d.clock.now();
    return this.d.uow.run(async (r) => {
      const [entries, profile] = await Promise.all([r.ledger.byUser(tutorId, "lead"), r.tutors.byUserId(tutorId)]);
      return { leads: leadBalance(entries, now), planActive: profile ? isPlanActive(profile, now) : false, planUntil: profile?.planUntil ?? null, leadPrice: LEAD_PRICE };
    });
  }

  /**
   * Atomik: kunci tutor dan permintaan, cek batas 10 tutor dan saldo, lalu potong 1 lead dan catat unlock.
   * Membuka ulang permintaan yang sama tidak dikenai biaya lagi.
   */
  async unlock(tutorId: Id, requestId: Id): Promise<UnlockResult> {
    const now = this.d.clock.now();
    return this.d.uow.run(async (r) => {
      const profile = await r.tutors.lockByUserId(tutorId);
      if (!profile || profile.completedAt === null) return fail("forbidden", "Lengkapi CV dulu untuk menghubungi calon murid.");
      if (profile.verification === "suspended") return fail("forbidden", "Akun tutor ini ditangguhkan.");
      const req = await r.requests.lockById(requestId);
      if (!req || req.expiresAt <= now) return fail("not_found", "Permintaan tidak aktif.");
      if (req.seekerId === tutorId) return fail("validation", "Ini permintaanmu sendiri.");
      const owner = (await r.users.byId(req.seekerId)) ?? fail("not_found", "Pemilik permintaan tidak ditemukan.");
      const contact = { seekerId: owner.id, name: owner.name, phone: owner.phone, waNumber: toWaNumber(owner.phone) };
      const entries = await r.ledger.byUser(tutorId, "lead");
      const planActive = isPlanActive(profile, now);

      if (await r.unlocks.has(tutorId, requestId)) {
        return { charged: false, contact, leads: leadBalance(entries, now), planActive, planUntil: profile.planUntil, leadPrice: LEAD_PRICE };
      }
      const responders = (await r.unlocks.byRequestIds([requestId])).length;
      if (responders >= MAX_RESPONDERS) return fail("conflict", `Permintaan sudah penuh (maks ${MAX_RESPONDERS} tutor).`);
      const before = leadBalance(entries, now);
      if (before < 1) return fail("payment_required", "Lead habis. Beli lead atau Tutor Plan.");

      await r.ledger.insert({ id: this.d.ids.next(), userId: tutorId, kind: "lead", delta: -1, reason: "unlock", refId: requestId, expiresAt: null, createdAt: now });
      await r.unlocks.insert({ id: this.d.ids.next(), tutorId, requestId, createdAt: now });
      await recordEvent(r, this.d, "lead_unlock", tutorId, { requestId });
      return { charged: true, contact, leads: before - 1, planActive, planUntil: profile.planUntil, leadPrice: LEAD_PRICE };
    });
  }

  /** Riwayat gabungan: pembelian (Rp) dan pergerakan lead. */
  async history(tutorId: Id): Promise<HistoryItem[]> {
    return this.d.uow.run(async (r) => {
      const [ledger, orders] = await Promise.all([r.ledger.byUser(tutorId, "lead"), r.orders.byBuyer(tutorId)]);
      const items: HistoryItem[] = [
        ...ledger.filter((e) => e.reason !== "pack" && e.reason !== "plan").map((e) => ({
          id: e.id, at: e.createdAt, leadDelta: e.delta, amount: null,
          label: e.reason === "unlock" ? "Buka kontak calon murid" : e.reason === "founding" ? "Kredit Founding Tutor" : "Pengembalian lead",
        })),
        ...orders.filter((o) => o.status === "paid" && PRODUCTS[o.product].audience === "tutor").map((o) => ({ id: o.id, at: o.createdAt, leadDelta: o.units, amount: -o.amount, label: o.isPlan ? "Langganan Tutor Plan" : `Beli ${o.units} lead` })),
      ];
      return items.sort((a, b) => b.at - a.at);
    });
  }
}
