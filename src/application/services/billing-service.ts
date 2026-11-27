import { fail } from "@/domain/errors";
import { monthEnd } from "@/domain/leads";
import { type Audience, creditKindOf, isProduct, listPrice, ORDER_TTL_MIN, PRODUCTS } from "@/domain/pricing";
import type { Id, Millis, Order, ProductKey } from "@/domain/types";
import type { PaymentGateway, Repositories, WebhookSigner } from "../ports";
import { type BaseDeps, recordEvent, requirePhone } from "./context";

export interface OrderView { id: Id; product: ProductKey; audience: Audience; amount: number; units: number; status: Order["status"]; expiresAt: number; qrisPayload: string; /** Tambahan unik di nominal (mode manual) untuk mencocokkan mutasi. */ uniqueCode: number; manual: boolean }
export interface PendingPayment { id: Id; buyerName: string; buyerPhone: string | null; label: string; amount: number; uniqueCode: number; createdAt: Millis }
export interface ProductView { key: ProductKey; audience: Audience; label: string; amount: number; units: number; plan: boolean; listPrice: number; perUnit: number }
export type WebhookResult = { ok: true } | { duplicate: true };

const ORDER_TTL_MS = ORDER_TTL_MIN * 60_000;
const MANUAL_TTL_MS = 24 * 3_600_000;
const MAX_UNIQUE_CODE = 99;

/**
 * Katalog produk, order QRIS, dan webhook untuk dua sisi: tutor (lead, Tutor Plan) dan pencari (paket kuota kontak).
 * Order HANYA menjadi lunas lewat webhook bertanda tangan valid.
 */
export class BillingService {
  constructor(private d: BaseDeps & { gateway: PaymentGateway; signer: WebhookSigner; allowSimulation: boolean; manual?: boolean }) {}

  private get manual(): boolean { return Boolean(this.d.manual); }

  catalog(): ProductView[] {
    return (Object.entries(PRODUCTS) as [ProductKey, (typeof PRODUCTS)[ProductKey]][]).map(([key, p]) => ({
      key, audience: p.audience, label: p.label, amount: p.amount, units: p.units, plan: p.plan, listPrice: listPrice(p), perUnit: Math.round(p.amount / p.units),
    }));
  }

  /** Idempoten per (pembeli, kunci): permintaan ulang dengan kunci yang sama mengembalikan order yang sama. */
  async createOrder(buyerId: Id, product: string, idempotencyKey: string): Promise<OrderView> {
    if (!isProduct(product)) fail("validation", "Produk tidak dikenal.");
    if (!idempotencyKey) fail("validation", "Kunci idempotensi wajib.");
    const p = PRODUCTS[product as ProductKey], now = this.d.clock.now();
    const order = await this.d.uow.run(async (r) => {
      requirePhone((await r.users.byId(buyerId)) ?? fail("unauthorized", "Masuk dulu."));
      if (p.audience === "tutor") {
        const profile = await r.tutors.byUserId(buyerId);
        if (!profile || profile.completedAt === null) return fail("forbidden", "Lengkapi CV dulu sebelum membeli lead.");
      }
      const existing = await r.orders.byKey(buyerId, idempotencyKey);
      if (existing) return existing;
      const amount = p.amount + (this.manual ? await this.freeUniqueCode(r, p.amount, now) : 0);
      const o: Order = {
        id: this.d.ids.next(), buyerId, product: product as ProductKey, amount, units: p.units, isPlan: p.plan, status: "pending",
        idempotencyKey, gatewayRef: "", createdAt: now, expiresAt: now + (this.manual ? MANUAL_TTL_MS : ORDER_TTL_MS),
      };
      await r.orders.insert(o);
      await recordEvent(r, this.d, "order_created", buyerId, { product, amount });
      return o;
    });
    // Tagihan dibuat di luar transaksi DB (panggilan jaringan), lalu referensinya disimpan.
    if (order.gatewayRef) return this.view(order, `QRIS-${order.gatewayRef}`);
    const charge = await this.d.gateway.createCharge(order);
    await this.d.uow.run(async (r) => { const cur = await r.orders.byId(order.id); if (cur && !cur.gatewayRef) await r.orders.update({ ...cur, gatewayRef: charge.gatewayRef }); });
    return this.view({ ...order, gatewayRef: charge.gatewayRef }, charge.qrisPayload);
  }

  async getOrder(buyerId: Id, orderId: Id): Promise<OrderView> {
    const o = await this.d.uow.run((r) => r.orders.byId(orderId));
    if (!o || o.buyerId !== buyerId) return fail("not_found", "Order tidak ditemukan.");
    return this.view(o, `QRIS-${o.gatewayRef}`);
  }

  /** Kode unik 1..99 yang belum dipakai order pending lain dengan harga dasar yang sama, supaya nominal bisa dicocokkan ke mutasi. */
  private async freeUniqueCode(r: Repositories, base: number, now: Millis): Promise<number> {
    const used = new Set((await r.orders.pending(now)).map((o) => o.amount));
    const free = Array.from({ length: MAX_UNIQUE_CODE }, (_, i) => i + 1).filter((c) => !used.has(base + c));
    if (!free.length) return fail("conflict", "Banyak pembayaran sedang menunggu. Coba lagi beberapa menit lagi.");
    return free[Math.floor(Math.random() * free.length)];
  }

  /** Satu-satunya jalur yang mengubah order menjadi lunas dan menambah kredit (lead atau kuota kontak). */
  async handleWebhook(rawBody: string, signature: string): Promise<WebhookResult> {
    if (!this.d.signer.verify(rawBody, signature)) return fail("unauthorized", "Signature tidak valid.");
    let ev: { eventId?: string; orderId?: string; amount?: number };
    try { ev = JSON.parse(rawBody); } catch { return fail("validation", "Body webhook tidak valid."); }
    if (!ev.eventId || !ev.orderId || typeof ev.amount !== "number") return fail("validation", "Body webhook tidak lengkap.");
    const now = this.d.clock.now();
    return this.d.uow.run(async (r) => {
      const o = await r.orders.byId(ev.orderId!);
      if (!o) return fail("not_found", "Order tidak ditemukan.");
      if (o.amount !== ev.amount) return fail("validation", "Nominal tidak cocok.");
      if (o.status === "paid") return { duplicate: true } as const;
      if (o.expiresAt <= now || o.status === "expired") { await r.orders.update({ ...o, status: "expired" }); return fail("conflict", "Order kedaluwarsa."); }
      if (!(await r.webhookEvents.claim(ev.eventId!, now))) return { duplicate: true } as const;
      await this.settle(r, o, now);
      return { ok: true } as const;
    });
  }

  /** Tandai lunas dan tambahkan kredit (lead atau kuota kontak). Dipakai webhook dan konfirmasi manual. */
  private async settle(r: Repositories, o: Order, now: Millis): Promise<void> {
    await r.orders.update({ ...o, status: "paid" });
    const product = PRODUCTS[o.product];
    const expiry = o.isPlan ? monthEnd(now) : null;
    await r.ledger.insert({ id: this.d.ids.next(), userId: o.buyerId, kind: creditKindOf(product), delta: o.units, reason: o.isPlan ? "plan" : "pack", refId: o.id, expiresAt: expiry, createdAt: now });
    if (o.isPlan) {
      const profile = await r.tutors.lockByUserId(o.buyerId);
      if (profile) await r.tutors.upsert({ ...profile, planUntil: expiry, updatedAt: now });
    }
    await recordEvent(r, this.d, "purchase", o.buyerId, { product: o.product, amount: o.amount });
  }

  private async requireAdmin(r: Repositories, id: Id): Promise<void> {
    if (!(await r.users.byId(id))?.isAdmin) fail("forbidden", "Khusus admin.");
  }

  /** Antrean pembayaran manual yang menunggu konfirmasi admin. */
  async pendingPayments(adminId: Id): Promise<PendingPayment[]> {
    return this.d.uow.run(async (r) => {
      await this.requireAdmin(r, adminId);
      const orders = await r.orders.pending(this.d.clock.now());
      const users = new Map((await r.users.byIds([...new Set(orders.map((o) => o.buyerId))])).map((u) => [u.id, u]));
      return orders.map((o) => ({
        id: o.id, buyerName: users.get(o.buyerId)?.name ?? "?", buyerPhone: users.get(o.buyerId)?.phone ?? null, label: PRODUCTS[o.product].label,
        amount: o.amount, uniqueCode: o.amount - PRODUCTS[o.product].amount, createdAt: o.createdAt,
      }));
    });
  }

  /** Admin mencocokkan mutasi dengan nominal, lalu mengonfirmasi. Idempoten: konfirmasi ulang tidak menambah kredit. */
  async confirmManual(adminId: Id, orderId: Id): Promise<WebhookResult> {
    if (!this.manual) fail("forbidden", "Konfirmasi manual tidak aktif.");
    const now = this.d.clock.now();
    return this.d.uow.run(async (r) => {
      await this.requireAdmin(r, adminId);
      const o = (await r.orders.byId(orderId)) ?? fail("not_found", "Order tidak ditemukan.");
      if (o.status === "paid") return { duplicate: true } as const;
      if (o.status !== "pending" || o.expiresAt <= now) return fail("conflict", "Order sudah kedaluwarsa. Minta pembeli membuat order baru.");
      await r.webhookEvents.claim(`manual-${o.id}`, now);
      await this.settle(r, o, now);
      await recordEvent(r, this.d, "manual_confirm", adminId, { orderId: o.id });
      return { ok: true } as const;
    });
  }

  /** Hanya untuk demo/dev: meniru gateway yang membayar order (yang akan terjadi saat QRIS dipindai). */
  async simulatePayment(buyerId: Id, orderId: Id): Promise<WebhookResult> {
    if (!this.d.allowSimulation) fail("forbidden", "Simulasi pembayaran dinonaktifkan.");
    const o = await this.d.uow.run((r) => r.orders.byId(orderId));
    if (!o || o.buyerId !== buyerId) return fail("not_found", "Order tidak ditemukan.");
    const body = JSON.stringify({ eventId: `sim-${o.id}`, orderId: o.id, amount: o.amount });
    return this.handleWebhook(body, this.d.signer.sign(body));
  }

  /** Job terjadwal: order pending yang lewat 30 menit menjadi kedaluwarsa. */
  expirePending(): Promise<number> {
    return this.d.uow.run((r) => r.orders.expirePending(this.d.clock.now()));
  }

  private view(o: Order, qrisPayload: string): OrderView {
    return {
      id: o.id, product: o.product, audience: PRODUCTS[o.product].audience, amount: o.amount, units: o.units, status: o.status, expiresAt: o.expiresAt, qrisPayload,
      uniqueCode: o.amount - PRODUCTS[o.product].amount, manual: this.manual,
    };
  }
}
