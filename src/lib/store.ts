import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { Lesson, LedgerEntry, Order, Req, Tutor } from "./types";

export const MAX_TUTORS_PER_REQUEST = 10;
export const MAX_TARGETS = 3;
export const REQUEST_DAYS = 14;
export const LEAD_PRICE = 15000;
export const PRODUCTS = {
  lead1: { label: "1 lead", amount: 15000, leads: 1, plan: false },
  lead5: { label: "5 leads", amount: 65000, leads: 5, plan: false },
  lead10: { label: "10 leads", amount: 125000, leads: 10, plan: false },
  plan: { label: "Tutor Plan / bulan", amount: 99000, leads: 8, plan: true },
} as const;
export type ProductKey = keyof typeof PRODUCTS;
const SECRET = process.env.PAYMENT_WEBHOOK_SECRET ?? "dev-secret";
const DAY = 86_400_000;

const seedTutors: Tutor[] = [
  ["t1","Rizky Pratama","Matematika,Fisika","SMP,SMA","Tebet","S1 Teknik Sipil, UI",3,95000,4.9,41,true,true],
  ["t2","Siti Nurhaliza","Matematika,IPA","SD,SMP","Kebayoran Baru","Guru SD, S1 PGSD UNJ",8,80000,4.8,63,true,false],
  ["t3","Andi Wijaya","Bahasa Inggris","SMP,SMA,Umum","Tebet","S1 Sastra Inggris, UI",4,110000,4.7,28,true,false],
  ["t4","Maya Kusuma","Kimia,Biologi","SMA","Kebayoran Baru","S1 Farmasi, ITB",2,100000,4.9,19,true,true],
  ["t5","Dewi Lestari","Calistung,Matematika","SD","Tebet","Guru TK/SD, S1 PAUD",10,70000,4.8,57,true,false],
  ["t6","Bagas Santoso","UTBK,Matematika","SMA","Kebayoran Baru","S1 Matematika, UGM",5,130000,4.6,22,false,false],
  ["t7","Putri Anindya","Bahasa Inggris,Bahasa Indonesia","SD,SMP","Tebet","S1 Pendidikan Bahasa, UNJ",3,85000,4.7,15,true,false],
  ["t8","Hendra Gunawan","Fisika,Kimia","SMA","Kebayoran Baru","S2 Fisika, UI",9,140000,4.9,34,true,false],
].map(([id,name,s,l,area,edu,y,rate,rating,reviews,verified,plan]) => ({
  id, name, photo: String(name).split(" ").map((w) => w[0]).join(""), whatsapp: `62812${String(id).slice(1)}000111`,
  area, subjects: String(s).split(","), levels: String(l).split(","), mode: ["home","online"], rate, radiusKm: 5,
  education: edu, years: y, bio: "Sabar, terstruktur, dan fokus pada pemahaman konsep. Percobaan pertama didampingi orang tua.",
  rating, reviews, verified, plan,
}) as Tutor);

interface DB { tutors: Tutor[]; requests: Req[]; ledger: LedgerEntry[]; orders: Order[]; lessons: Lesson[]; seenEvents: Set<string> }
const g = globalThis as unknown as { __lesin?: DB };
export function db(): DB {
  if (!g.__lesin) {
    const now = Date.now();
    g.__lesin = { tutors: structuredClone(seedTutors), requests: [], ledger: [], orders: [], lessons: [], seenEvents: new Set() };
    // Founding Tutor credit: first tutors get 2 free leads
    for (const t of g.__lesin.tutors.slice(0, 4)) g.__lesin.ledger.push({ id: randomUUID(), tutorId: t.id, delta: 2, reason: "founding", ref: "founding", at: now });
    g.__lesin.requests.push({ id: "r1", parentId: "p-demo", parentName: "Ibu Ratna", whatsapp: "6281234567890", subject: "Matematika", level: "SMP", area: "Tebet", note: "Anak kelas 8, lemah di aljabar. Sabtu/Minggu sore.", tutorIds: ["t1","t2"], createdAt: now - DAY, expiresAt: now + (REQUEST_DAYS - 1) * DAY, contacted: [] });
    g.__lesin.lessons.push({ id: "l1", tutorId: "t1", parentId: "p-demo", child: "Aksa (kelas 8)", subject: "Matematika", day: "Sabtu", time: "15:00", notes: [{ id: "n1", at: now - 7 * DAY, topic: "Persamaan linear satu variabel", understanding: 3 }] });
  }
  return g.__lesin;
}
export function resetDb() { g.__lesin = undefined; return db(); }

// Strip contact-info from free text (phone numbers, links, @handles)
export function sanitizeText(s: string) { return s.replace(/(\+?\d[\d\s().-]{7,}\d)|(https?:\/\/\S+)|(www\.\S+)|(@\w{3,})/gi, "[disembunyikan]"); }

// Masked CV: name, photo, WhatsApp are NOT sent until an unlock exists (enforced here, server-side)
export function maskTutor(t: Tutor) {
  const { whatsapp: _w, name: _n, photo: _p, ...rest } = t;
  return { ...rest, name: "Tutor terverifikasi", photo: null as string | null, whatsapp: null as string | null, masked: true };
}
export function revealTutor(t: Tutor) { return { ...t, masked: false }; }

export function searchTutors(f: { area?: string; subject?: string; level?: string; mode?: string }) {
  const out = db().tutors
    .filter((t) => !f.area || t.area === f.area).filter((t) => !f.subject || t.subjects.includes(f.subject))
    .filter((t) => !f.level || t.levels.includes(f.level)).filter((t) => !f.mode || t.mode.includes(f.mode as never))
    .map((t) => ({ t, score: (t.verified ? 40 : 0) + t.rating * 8 + Math.min(t.reviews, 50) / 5 + (t.plan ? 10 : 0) }))
    .sort((a, b) => b.score - a.score);
  return out.map(({ t, score }) => ({ ...maskTutor(t), match: Math.min(99, Math.round(score)) }));
}

export function createRequest(i: { parentId: string; parentName: string; whatsapp: string; subject: string; level: string; area: string; note: string; tutorIds: string[] }) {
  const ids = [...new Set(i.tutorIds)];
  if (ids.length < 1 || ids.length > MAX_TARGETS) throw new Error(`Pilih 1–${MAX_TARGETS} tutor`);
  const now = Date.now();
  const r: Req = { id: randomUUID(), ...i, tutorIds: ids, note: sanitizeText(i.note), createdAt: now, expiresAt: now + REQUEST_DAYS * DAY, contacted: [] };
  db().requests.push(r);
  return r;
}

export function leadBalance(tutorId: string, now = Date.now()) {
  return db().ledger.filter((e) => e.tutorId === tutorId && (!e.expiresAt || e.expiresAt > now)).reduce((s, e) => s + e.delta, 0);
}
// Spend: plan leads (expiring) are consumed before bought leads — implemented by balance of non-expired entries only.
export function tutorRequests(tutorId: string, now = Date.now()) {
  const t = db().tutors.find((x) => x.id === tutorId); if (!t) return [];
  return db().requests.filter((r) => r.expiresAt > now && (r.tutorIds.includes(tutorId) || (t.subjects.includes(r.subject) && t.area === r.area)))
    .map((r) => {
      const unlocked = r.contacted.includes(tutorId);
      return { id: r.id, subject: r.subject, level: r.level, area: r.area, note: r.note, createdAt: r.createdAt, expiresAt: r.expiresAt,
        slotsLeft: MAX_TUTORS_PER_REQUEST - r.contacted.length, unlocked,
        parentName: unlocked ? r.parentName : null, whatsapp: unlocked ? r.whatsapp : null };
    });
}

// Atomic in a single tick: check balance, cap, then spend 1 lead and unlock.
export function contactRequest(tutorId: string, requestId: string, now = Date.now()) {
  const d = db(); const r = d.requests.find((x) => x.id === requestId);
  if (!r || r.expiresAt <= now) throw new Error("Permintaan tidak aktif");
  if (!d.tutors.some((t) => t.id === tutorId)) throw new Error("Tutor tidak ditemukan");
  if (r.contacted.includes(tutorId)) return { whatsapp: r.whatsapp, parentName: r.parentName, charged: false };
  if (r.contacted.length >= MAX_TUTORS_PER_REQUEST) throw new Error("Permintaan sudah penuh (maks 10 tutor)");
  if (leadBalance(tutorId, now) < 1) throw new Error("Lead habis — beli lead atau Tutor Plan");
  // consume expiring plan leads first
  const plan = d.ledger.filter((e) => e.tutorId === tutorId && e.expiresAt && e.expiresAt > now && e.delta > 0).sort((a, b) => a.expiresAt! - b.expiresAt!)[0];
  d.ledger.push({ id: randomUUID(), tutorId, delta: -1, reason: "unlock", ref: requestId, at: now, expiresAt: plan?.expiresAt });
  r.contacted.push(tutorId);
  return { whatsapp: r.whatsapp, parentName: r.parentName, charged: true };
}

export function waLink(phone: string, msg: string) { return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`; }

// --- Payments: order -> (simulated) QRIS -> signed webhook is the ONLY place an order becomes paid
export function createOrder(tutorId: string, product: ProductKey, key: string, now = Date.now()) {
  const p = PRODUCTS[product]; if (!p) throw new Error("Produk tidak dikenal");
  const ex = db().orders.find((o) => o.key === key && o.tutorId === tutorId); if (ex) return ex;
  const o: Order = { id: randomUUID(), tutorId, product, amount: p.amount, leads: p.leads, plan: p.plan, status: "pending", key, expiresAt: now + 30 * 60_000 };
  db().orders.push(o); return o;
}
export function sign(body: string) { return createHmac("sha256", SECRET).update(body).digest("hex"); }
export function handleWebhook(rawBody: string, signature: string, now = Date.now()) {
  const a = Buffer.from(sign(rawBody)), b = Buffer.from(signature || "");
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("Signature tidak valid");
  const ev = JSON.parse(rawBody) as { eventId: string; orderId: string; amount: number };
  const d = db(); if (d.seenEvents.has(ev.eventId)) return { duplicate: true };
  const o = d.orders.find((x) => x.id === ev.orderId); if (!o) throw new Error("Order tidak ditemukan");
  if (o.amount !== ev.amount) throw new Error("Nominal tidak cocok");
  if (o.status === "paid") return { duplicate: true };
  if (o.expiresAt <= now) { o.status = "expired"; throw new Error("Order kedaluwarsa"); }
  d.seenEvents.add(ev.eventId); o.status = "paid";
  const end = new Date(now); const monthEnd = o.plan ? new Date(end.getFullYear(), end.getMonth() + 1, 1).getTime() : undefined;
  d.ledger.push({ id: randomUUID(), tutorId: o.tutorId, delta: o.leads, reason: o.plan ? "plan" : "pack", ref: o.id, at: now, expiresAt: monthEnd });
  return { ok: true };
}

export function addNote(lessonId: string, topic: string, understanding: 1|2|3|4|5) {
  const l = db().lessons.find((x) => x.id === lessonId); if (!l) throw new Error("Pelajaran tidak ada");
  const n = { id: randomUUID(), at: Date.now(), topic: sanitizeText(topic).slice(0, 200), understanding }; l.notes.unshift(n); return n;
}
