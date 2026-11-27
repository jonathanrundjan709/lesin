import type { Repositories, UnitOfWork } from "@/application/ports";
import type {
  AppEvent, LedgerEntry, Lesson, LessonRequest, Order, Report, Review, ScheduleSlot, SessionNote, TutorProfile, Unlock, User, VerificationDoc,
} from "@/domain/types";
import { SCHEMA_SQL } from "./schema";
import type { Row, SqlClient, SqlDatabase } from "./sql-database";

const n = (v: unknown): number => Number(v);
const nn = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));
const json = (v: unknown): string => JSON.stringify(v);
const list = <T>(rows: Row[], map: (r: Row) => T): T[] => rows.map(map);
const one = <T>(rows: Row[], map: (r: Row) => T): T | null => (rows[0] ? map(rows[0]) : null);

const user = (r: Row): User => ({ id: String(r.id), name: String(r.name), phone: String(r.phone), passwordHash: String(r.password_hash), isAdmin: Boolean(r.is_admin), status: r.status as User["status"], createdAt: n(r.created_at) });
const tutor = (r: Row): TutorProfile => ({
  userId: String(r.user_id), headline: String(r.headline), subjects: r.subjects as string[], levels: r.levels as string[], curricula: r.curricula as string[],
  area: String(r.area), rate: n(r.rate), rateDurationMin: n(r.rate_duration_min), experienceYears: n(r.experience_years), education: String(r.education),
  bio: String(r.bio), achievements: String(r.achievements), teachesOffline: Boolean(r.teaches_offline), teachesOnline: Boolean(r.teaches_online),
  gender: (r.gender as TutorProfile["gender"]) ?? null, age: nn(r.age), availableDays: r.available_days as TutorProfile["availableDays"],
  verification: r.verification as TutorProfile["verification"], planUntil: nn(r.plan_until), ratingAvg: n(r.rating_avg), reviewCount: n(r.review_count),
  studentsTaught: n(r.students_taught), completedAt: nn(r.completed_at), createdAt: n(r.created_at), updatedAt: n(r.updated_at),
});
const request = (r: Row): LessonRequest => ({
  id: String(r.id), seekerId: String(r.seeker_id), subject: String(r.subject), level: String(r.level), curriculum: String(r.curriculum), studentNote: String(r.student_note),
  area: String(r.area), mode: r.mode as LessonRequest["mode"], durationMin: n(r.duration_min), budget: n(r.budget), schedule: r.schedule as ScheduleSlot[],
  notes: String(r.notes), targetTutorIds: r.target_tutor_ids as string[], boostDays: n(r.boost_days), createdAt: n(r.created_at), expiresAt: n(r.expires_at),
});
const unlock = (r: Row): Unlock => ({ id: String(r.id), tutorId: String(r.tutor_id), requestId: String(r.request_id), createdAt: n(r.created_at) });
const ledger = (r: Row): LedgerEntry => ({ id: String(r.id), tutorId: String(r.tutor_id), delta: n(r.delta), reason: r.reason as LedgerEntry["reason"], refId: String(r.ref_id), expiresAt: nn(r.expires_at), createdAt: n(r.created_at) });
const order = (r: Row): Order => ({
  id: String(r.id), tutorId: String(r.tutor_id), product: r.product as Order["product"], amount: n(r.amount), leads: n(r.leads), isPlan: Boolean(r.is_plan),
  status: r.status as Order["status"], idempotencyKey: String(r.idempotency_key), gatewayRef: String(r.gateway_ref), createdAt: n(r.created_at), expiresAt: n(r.expires_at),
});
const lesson = (r: Row): Lesson => ({ id: String(r.id), tutorId: String(r.tutor_id), seekerId: String(r.seeker_id), child: String(r.child), subject: String(r.subject), slots: r.slots as ScheduleSlot[], createdAt: n(r.created_at) });
const note = (r: Row): SessionNote => ({ id: String(r.id), lessonId: String(r.lesson_id), topic: String(r.topic), understanding: n(r.understanding) as SessionNote["understanding"], createdAt: n(r.created_at) });
const review = (r: Row): Review => ({ id: String(r.id), tutorId: String(r.tutor_id), seekerId: String(r.seeker_id), stars: n(r.stars) as Review["stars"], text: String(r.text), createdAt: n(r.created_at) });
const report = (r: Row): Report => ({ id: String(r.id), reporterId: String(r.reporter_id), tutorId: String(r.tutor_id), reason: String(r.reason), status: r.status as Report["status"], createdAt: n(r.created_at) });
const doc = (r: Row): VerificationDoc => ({ id: String(r.id), tutorId: String(r.tutor_id), kind: r.kind as VerificationDoc["kind"], status: r.status as VerificationDoc["status"], reviewedBy: r.reviewed_by ? String(r.reviewed_by) : null, createdAt: n(r.created_at) });

function buildRepos(db: SqlClient): Repositories {
  const q = (sql: string, p?: readonly unknown[]) => db.query(sql, p);
  const ANY = (ids: readonly string[]) => [ids as string[]];
  return {
    users: {
      async insert(u) { await q("INSERT INTO users (id,name,phone,password_hash,is_admin,status,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)", [u.id, u.name, u.phone, u.passwordHash, u.isAdmin, u.status, u.createdAt]); },
      async update(u) { await q("UPDATE users SET name=$2, phone=$3, password_hash=$4, is_admin=$5, status=$6 WHERE id=$1", [u.id, u.name, u.phone, u.passwordHash, u.isAdmin, u.status]); },
      async byId(id) { return one(await q("SELECT * FROM users WHERE id=$1", [id]), user); },
      async byIds(ids) { return ids.length ? list(await q("SELECT * FROM users WHERE id = ANY($1::text[])", ANY(ids)), user) : []; },
      async byPhone(phone) { return one(await q("SELECT * FROM users WHERE phone=$1", [phone]), user); },
    },
    tutors: {
      async upsert(p) {
        await q(`INSERT INTO tutor_profiles (user_id,headline,subjects,levels,curricula,area,rate,rate_duration_min,experience_years,education,bio,achievements,teaches_offline,teaches_online,gender,age,available_days,verification,plan_until,rating_avg,review_count,students_taught,completed_at,created_at,updated_at)
          VALUES ($1,$2,$3::jsonb,$4::jsonb,$5::jsonb,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb,$18,$19,$20,$21,$22,$23,$24,$25)
          ON CONFLICT (user_id) DO UPDATE SET headline=$2,subjects=$3::jsonb,levels=$4::jsonb,curricula=$5::jsonb,area=$6,rate=$7,rate_duration_min=$8,experience_years=$9,education=$10,bio=$11,achievements=$12,
          teaches_offline=$13,teaches_online=$14,gender=$15,age=$16,available_days=$17::jsonb,verification=$18,plan_until=$19,rating_avg=$20,review_count=$21,students_taught=$22,completed_at=$23,updated_at=$25`,
          [p.userId, p.headline, json(p.subjects), json(p.levels), json(p.curricula), p.area, p.rate, p.rateDurationMin, p.experienceYears, p.education, p.bio, p.achievements,
            p.teachesOffline, p.teachesOnline, p.gender, p.age, json(p.availableDays), p.verification, p.planUntil, p.ratingAvg, p.reviewCount, p.studentsTaught, p.completedAt, p.createdAt, p.updatedAt]);
      },
      async byUserId(id) { return one(await q("SELECT * FROM tutor_profiles WHERE user_id=$1", [id]), tutor); },
      async lockByUserId(id) { return one(await q("SELECT * FROM tutor_profiles WHERE user_id=$1 FOR UPDATE", [id]), tutor); },
      async all() { return list(await q("SELECT * FROM tutor_profiles"), tutor); },
      async countCompleted() { return n((await q("SELECT COUNT(*) AS c FROM tutor_profiles WHERE completed_at IS NOT NULL"))[0].c); },
    },
    requests: {
      async insert(r) {
        await q(`INSERT INTO requests (id,seeker_id,subject,level,curriculum,student_note,area,mode,duration_min,budget,schedule,notes,target_tutor_ids,boost_days,created_at,expires_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13::jsonb,$14,$15,$16)`,
          [r.id, r.seekerId, r.subject, r.level, r.curriculum, r.studentNote, r.area, r.mode, r.durationMin, r.budget, json(r.schedule), r.notes, json(r.targetTutorIds), r.boostDays, r.createdAt, r.expiresAt]);
      },
      async byId(id) { return one(await q("SELECT * FROM requests WHERE id=$1", [id]), request); },
      async lockById(id) { return one(await q("SELECT * FROM requests WHERE id=$1 FOR UPDATE", [id]), request); },
      async bySeeker(id) { return list(await q("SELECT * FROM requests WHERE seeker_id=$1", [id]), request); },
      async active(now) { return list(await q("SELECT * FROM requests WHERE expires_at > $1", [now]), request); },
    },
    unlocks: {
      async insert(u) { await q("INSERT INTO unlocks (id,tutor_id,request_id,created_at) VALUES ($1,$2,$3,$4)", [u.id, u.tutorId, u.requestId, u.createdAt]); },
      async has(tutorId, requestId) { return (await q("SELECT 1 AS x FROM unlocks WHERE tutor_id=$1 AND request_id=$2", [tutorId, requestId])).length > 0; },
      async byRequestIds(ids) { return ids.length ? list(await q("SELECT * FROM unlocks WHERE request_id = ANY($1::text[])", ANY(ids)), unlock) : []; },
      async byTutor(tutorId) { return list(await q("SELECT * FROM unlocks WHERE tutor_id=$1", [tutorId]), unlock); },
    },
    ledger: {
      async insert(e) { await q("INSERT INTO ledger_entries (id,tutor_id,delta,reason,ref_id,expires_at,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)", [e.id, e.tutorId, e.delta, e.reason, e.refId, e.expiresAt, e.createdAt]); },
      async byTutor(tutorId) { return list(await q("SELECT * FROM ledger_entries WHERE tutor_id=$1 ORDER BY created_at", [tutorId]), ledger); },
    },
    orders: {
      async insert(o) { await q("INSERT INTO orders (id,tutor_id,product,amount,leads,is_plan,status,idempotency_key,gateway_ref,created_at,expires_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)", [o.id, o.tutorId, o.product, o.amount, o.leads, o.isPlan, o.status, o.idempotencyKey, o.gatewayRef, o.createdAt, o.expiresAt]); },
      async update(o) { await q("UPDATE orders SET status=$2, gateway_ref=$3 WHERE id=$1", [o.id, o.status, o.gatewayRef]); },
      async byId(id) { return one(await q("SELECT * FROM orders WHERE id=$1", [id]), order); },
      async byKey(tutorId, key) { return one(await q("SELECT * FROM orders WHERE tutor_id=$1 AND idempotency_key=$2", [tutorId, key]), order); },
      async byTutor(tutorId) { return list(await q("SELECT * FROM orders WHERE tutor_id=$1", [tutorId]), order); },
      async expirePending(now) { return (await q("UPDATE orders SET status='expired' WHERE status='pending' AND expires_at <= $1 RETURNING id", [now])).length; },
    },
    webhookEvents: {
      async claim(eventId, at) { return (await q("INSERT INTO webhook_events (event_id, at) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING event_id", [eventId, at])).length > 0; },
    },
    lessons: {
      async insert(l) { await q("INSERT INTO lessons (id,tutor_id,seeker_id,child,subject,slots,created_at) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7)", [l.id, l.tutorId, l.seekerId, l.child, l.subject, json(l.slots), l.createdAt]); },
      async update(l) { await q("UPDATE lessons SET child=$2, subject=$3, slots=$4::jsonb WHERE id=$1", [l.id, l.child, l.subject, json(l.slots)]); },
      async byId(id) { return one(await q("SELECT * FROM lessons WHERE id=$1", [id]), lesson); },
      async byParticipant(userId) { return list(await q("SELECT * FROM lessons WHERE tutor_id=$1 OR seeker_id=$1", [userId]), lesson); },
      async all() { return list(await q("SELECT * FROM lessons"), lesson); },
      async insertNote(x) { await q("INSERT INTO session_notes (id,lesson_id,topic,understanding,created_at) VALUES ($1,$2,$3,$4,$5)", [x.id, x.lessonId, x.topic, x.understanding, x.createdAt]); },
      async notesByLessons(ids) { return ids.length ? list(await q("SELECT * FROM session_notes WHERE lesson_id = ANY($1::text[])", ANY(ids)), note) : []; },
    },
    reviews: {
      async get(tutorId, seekerId) { return one(await q("SELECT * FROM reviews WHERE tutor_id=$1 AND seeker_id=$2", [tutorId, seekerId]), review); },
      async upsert(r) { await q("INSERT INTO reviews (id,tutor_id,seeker_id,stars,text,created_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (tutor_id, seeker_id) DO UPDATE SET stars=$4, text=$5, created_at=$6", [r.id, r.tutorId, r.seekerId, r.stars, r.text, r.createdAt]); },
      async byTutor(tutorId) { return list(await q("SELECT * FROM reviews WHERE tutor_id=$1", [tutorId]), review); },
    },
    reports: {
      async insert(r) { await q("INSERT INTO reports (id,reporter_id,tutor_id,reason,status,created_at) VALUES ($1,$2,$3,$4,$5,$6)", [r.id, r.reporterId, r.tutorId, r.reason, r.status, r.createdAt]); },
      async byId(id) { return one(await q("SELECT * FROM reports WHERE id=$1", [id]), report); },
      async update(r) { await q("UPDATE reports SET status=$2 WHERE id=$1", [r.id, r.status]); },
      async open() { return list(await q("SELECT * FROM reports WHERE status='open'"), report); },
    },
    verifications: {
      async insert(d) { await q("INSERT INTO verification_docs (id,tutor_id,kind,status,reviewed_by,created_at) VALUES ($1,$2,$3,$4,$5,$6)", [d.id, d.tutorId, d.kind, d.status, d.reviewedBy, d.createdAt]); },
      async update(d) { await q("UPDATE verification_docs SET status=$2, reviewed_by=$3 WHERE id=$1", [d.id, d.status, d.reviewedBy]); },
      async byId(id) { return one(await q("SELECT * FROM verification_docs WHERE id=$1", [id]), doc); },
      async byTutor(tutorId) { return list(await q("SELECT * FROM verification_docs WHERE tutor_id=$1", [tutorId]), doc); },
      async pending() { return list(await q("SELECT * FROM verification_docs WHERE status='pending'"), doc); },
    },
    events: {
      async insert(e: AppEvent) { await q("INSERT INTO events (id,user_id,type,payload,created_at) VALUES ($1,$2,$3,$4::jsonb,$5)", [e.id, e.userId, e.type, json(e.payload), e.createdAt]); },
      async insertOnce(e, key) { return (await q("INSERT INTO events (id,user_id,type,payload,dedupe_key,created_at) VALUES ($1,$2,$3,$4::jsonb,$5,$6) ON CONFLICT (dedupe_key) DO NOTHING RETURNING id", [e.id, e.userId, e.type, json(e.payload), key, e.createdAt])).length > 0; },
    },
  };
}

/** Unit of work di atas transaksi PostgreSQL sungguhan. Baris tutor/permintaan dikunci dengan SELECT ... FOR UPDATE. */
export class PostgresUnitOfWork implements UnitOfWork {
  constructor(private db: SqlDatabase) {}

  /**
   * Membuat tabel bila belum ada (idempoten). Dikunci dengan advisory lock supaya beberapa instance serverless
   * yang start bersamaan tidak saling bentrok saat CREATE TABLE.
   */
  async migrate(): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.query("SELECT pg_advisory_xact_lock(72727401)");
      await tx.query(SCHEMA_SQL);
    });
  }

  run<T>(fn: (repos: Repositories) => Promise<T>): Promise<T> {
    return this.db.transaction((tx) => fn(buildRepos(tx)));
  }
}
