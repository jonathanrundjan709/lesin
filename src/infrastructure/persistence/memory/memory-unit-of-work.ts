import type { Repositories, UnitOfWork } from "@/application/ports";
import type {
  AppEvent, LedgerEntry, Lesson, LessonRequest, Order, Report, Review, SessionNote, TutorProfile, Unlock, User, VerificationDoc,
} from "@/domain/types";

/** Seluruh data dalam memori. Dipakai untuk tes, pengembangan lokal, dan mode demo tanpa DATABASE_URL. */
export interface MemoryData {
  users: Map<string, User>; tutors: Map<string, TutorProfile>; requests: Map<string, LessonRequest>; unlocks: Unlock[];
  ledger: LedgerEntry[]; orders: Map<string, Order>; webhookEvents: Set<string>; lessons: Map<string, Lesson>; notes: SessionNote[];
  reviews: Review[]; reports: Map<string, Report>; verifications: Map<string, VerificationDoc>; events: AppEvent[]; eventKeys: Set<string>;
}
export const emptyData = (): MemoryData => ({
  users: new Map(), tutors: new Map(), requests: new Map(), unlocks: [], ledger: [], orders: new Map(), webhookEvents: new Set(),
  lessons: new Map(), notes: [], reviews: [], reports: new Map(), verifications: new Map(), events: [], eventKeys: new Set(),
});

const clone = <T>(v: T): T => structuredClone(v);

function buildRepos(db: MemoryData): Repositories {
  return {
    users: {
      async insert(u) { db.users.set(u.id, clone(u)); },
      async update(u) { db.users.set(u.id, clone(u)); },
      async byId(id) { return clone(db.users.get(id) ?? null); },
      async byIds(ids) { return ids.flatMap((id) => { const u = db.users.get(id); return u ? [clone(u)] : []; }); },
      async byPhone(phone) { return clone([...db.users.values()].find((u) => u.phone === phone) ?? null); },
    },
    tutors: {
      async upsert(p) { db.tutors.set(p.userId, clone(p)); },
      async byUserId(id) { return clone(db.tutors.get(id) ?? null); },
      async lockByUserId(id) { return clone(db.tutors.get(id) ?? null); }, // transaksi sudah serial
      async all() { return [...db.tutors.values()].map(clone); },
      async countCompleted() { return [...db.tutors.values()].filter((p) => p.completedAt !== null).length; },
    },
    requests: {
      async insert(r) { db.requests.set(r.id, clone(r)); },
      async byId(id) { return clone(db.requests.get(id) ?? null); },
      async lockById(id) { return clone(db.requests.get(id) ?? null); },
      async bySeeker(id) { return [...db.requests.values()].filter((r) => r.seekerId === id).map(clone); },
      async active(now) { return [...db.requests.values()].filter((r) => r.expiresAt > now).map(clone); },
    },
    unlocks: {
      async insert(u) {
        if (db.unlocks.some((x) => x.tutorId === u.tutorId && x.requestId === u.requestId)) throw new Error("unlock duplikat");
        db.unlocks.push(clone(u));
      },
      async has(tutorId, requestId) { return db.unlocks.some((u) => u.tutorId === tutorId && u.requestId === requestId); },
      async byRequestIds(ids) { const s = new Set(ids); return db.unlocks.filter((u) => s.has(u.requestId)).map(clone); },
      async byTutor(tutorId) { return db.unlocks.filter((u) => u.tutorId === tutorId).map(clone); },
    },
    ledger: {
      async insert(e) { db.ledger.push(clone(e)); },
      async byTutor(tutorId) { return db.ledger.filter((e) => e.tutorId === tutorId).map(clone); },
    },
    orders: {
      async insert(o) { db.orders.set(o.id, clone(o)); },
      async update(o) { db.orders.set(o.id, clone(o)); },
      async byId(id) { return clone(db.orders.get(id) ?? null); },
      async byKey(tutorId, key) { return clone([...db.orders.values()].find((o) => o.tutorId === tutorId && o.idempotencyKey === key) ?? null); },
      async byTutor(tutorId) { return [...db.orders.values()].filter((o) => o.tutorId === tutorId).map(clone); },
      async expirePending(now) {
        let n = 0;
        for (const o of db.orders.values()) if (o.status === "pending" && o.expiresAt <= now) { o.status = "expired"; n++; }
        return n;
      },
    },
    webhookEvents: {
      async claim(eventId) { if (db.webhookEvents.has(eventId)) return false; db.webhookEvents.add(eventId); return true; },
    },
    lessons: {
      async insert(l) { db.lessons.set(l.id, clone(l)); },
      async update(l) { db.lessons.set(l.id, clone(l)); },
      async byId(id) { return clone(db.lessons.get(id) ?? null); },
      async byParticipant(userId) { return [...db.lessons.values()].filter((l) => l.tutorId === userId || l.seekerId === userId).map(clone); },
      async all() { return [...db.lessons.values()].map(clone); },
      async insertNote(n) { db.notes.push(clone(n)); },
      async notesByLessons(ids) { const s = new Set(ids); return db.notes.filter((n) => s.has(n.lessonId)).map(clone); },
    },
    reviews: {
      async get(tutorId, seekerId) { return clone(db.reviews.find((r) => r.tutorId === tutorId && r.seekerId === seekerId) ?? null); },
      async upsert(r) {
        const i = db.reviews.findIndex((x) => x.tutorId === r.tutorId && x.seekerId === r.seekerId);
        if (i >= 0) db.reviews[i] = clone(r); else db.reviews.push(clone(r));
      },
      async byTutor(tutorId) { return db.reviews.filter((r) => r.tutorId === tutorId).map(clone); },
    },
    reports: {
      async insert(r) { db.reports.set(r.id, clone(r)); },
      async byId(id) { return clone(db.reports.get(id) ?? null); },
      async update(r) { db.reports.set(r.id, clone(r)); },
      async open() { return [...db.reports.values()].filter((r) => r.status === "open").map(clone); },
    },
    verifications: {
      async insert(d) { db.verifications.set(d.id, clone(d)); },
      async update(d) { db.verifications.set(d.id, clone(d)); },
      async byId(id) { return clone(db.verifications.get(id) ?? null); },
      async byTutor(tutorId) { return [...db.verifications.values()].filter((d) => d.tutorId === tutorId).map(clone); },
      async pending() { return [...db.verifications.values()].filter((d) => d.status === "pending").map(clone); },
    },
    events: {
      async insert(e) { db.events.push(clone(e)); },
      async insertOnce(e, key) { if (db.eventKeys.has(key)) return false; db.eventKeys.add(key); db.events.push(clone(e)); return true; },
    },
  };
}

/**
 * Transaksi serial (satu per satu) dengan rollback: bila `fn` melempar galat, data dikembalikan ke keadaan semula.
 * Cukup untuk skala pilot; adapter Postgres memakai transaksi database sungguhan.
 */
export class MemoryUnitOfWork implements UnitOfWork {
  private tail: Promise<unknown> = Promise.resolve();
  constructor(readonly data: MemoryData = emptyData()) {}

  run<T>(fn: (repos: Repositories) => Promise<T>): Promise<T> {
    const result = this.tail.then(async () => {
      const snapshot = structuredClone(this.data);
      try { return await fn(buildRepos(this.data)); }
      catch (e) { Object.assign(this.data, snapshot); throw e; }
    });
    this.tail = result.catch(() => undefined);
    return result;
  }
}
