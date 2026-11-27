import { randomBytes } from "node:crypto";
import type { Clock, PasswordHasher, UnitOfWork } from "@/application/ports";
import type { DayCode, LedgerEntry, LessonRequest, Review, TutorProfile, Unlock, User } from "@/domain/types";
import { SEED_POSTS, SEED_REVIEWS, SEED_TUTORS } from "./seed-data";

const HOUR = 3_600_000, DAY = 86_400_000;

/**
 * Mengisi data contoh (16 tutor, 8 lowongan, beberapa ulasan) bila database masih kosong.
 * Akun contoh tidak bisa dipakai masuk (password acak yang tidak diketahui siapa pun).
 * Mengembalikan true bila data baru dimasukkan.
 */
export async function seedDemoData(d: { uow: UnitOfWork; clock: Clock; hasher: PasswordHasher }): Promise<boolean> {
  const now = d.clock.now();
  const passwordHash = await d.hasher.hash(randomBytes(24).toString("hex"));
  return d.uow.run(async (r) => {
    if (await r.users.byPhone(SEED_TUTORS[0].phone)) return false;
    const mkUser = (id: string, name: string, phone: string): User => ({ id, name, phone, passwordHash, isAdmin: false, status: "active", createdAt: now });

    for (const t of SEED_TUTORS) {
      await r.users.insert(mkUser(t.id, t.name, t.phone));
      const p: TutorProfile = {
        userId: t.id, headline: t.headline, subjects: t.subjects, levels: t.levels, curricula: t.curricula, area: t.area, rate: t.rate, rateDurationMin: 90,
        experienceYears: t.exp, education: t.edu, bio: t.bio, achievements: t.achievements, teachesOffline: t.offline, teachesOnline: t.online,
        gender: t.gender, age: t.age, availableDays: t.avail as DayCode[], verification: t.verified ? "verified" : "unverified", planUntil: null,
        ratingAvg: t.rating, reviewCount: t.reviews, studentsTaught: t.students, completedAt: now, createdAt: now, updatedAt: now,
      };
      await r.tutors.upsert(p);
    }

    for (const post of SEED_POSTS) {
      const seekerId = `seed-${post.id}`;
      await r.users.insert(mkUser(seekerId, post.owner, post.phone));
      const createdAt = now - post.hoursAgo * HOUR;
      const req: LessonRequest = {
        id: post.id, seekerId, subject: post.subject, level: post.level, curriculum: post.curr, studentNote: post.student, area: post.area, mode: post.mode,
        durationMin: post.dur, budget: post.budget, schedule: post.days.map((day) => ({ day: day as DayCode, time: post.start })), notes: post.notes,
        targetTutorIds: [], boostDays: 0, createdAt, expiresAt: createdAt + 14 * DAY,
      };
      await r.requests.insert(req);
      // Tutor yang "sudah menghubungi": utamakan yang mengajar mapel itu. Lead-nya dibuatkan dulu agar ledger tetap konsisten.
      const pool = [...SEED_TUTORS].sort((a, b) => Number(b.subjects.includes(post.subject)) - Number(a.subjects.includes(post.subject)));
      for (const t of pool.slice(0, post.contacted)) {
        const grant: LedgerEntry = { id: `seed-grant-${post.id}-${t.id}`, userId: t.id, kind: "lead", delta: 1, reason: "pack", refId: "seed", expiresAt: null, createdAt };
        const spend: LedgerEntry = { id: `seed-spend-${post.id}-${t.id}`, userId: t.id, kind: "lead", delta: -1, reason: "unlock", refId: post.id, expiresAt: null, createdAt: createdAt + 1 };
        const unlock: Unlock = { id: `seed-unlock-${post.id}-${t.id}`, tutorId: t.id, requestId: post.id, createdAt: createdAt + 1 };
        await r.ledger.insert(grant); await r.ledger.insert(spend); await r.unlocks.insert(unlock);
      }
    }
    // Founding Tutor: 4 tutor pertama mendapat 2 lead gratis.
    for (const t of SEED_TUTORS.slice(0, 4)) {
      await r.ledger.insert({ id: `seed-founding-${t.id}`, userId: t.id, kind: "lead", delta: 2, reason: "founding", refId: "founding", expiresAt: null, createdAt: now });
    }

    for (const [i, v] of SEED_REVIEWS.entries()) {
      const id = `seed-rv-${i}`;
      await r.users.insert(mkUser(id, v.name, `089900000${String(i).padStart(3, "0")}`));
      const rev: Review = { id, tutorId: v.tutorId, seekerId: id, stars: v.stars as Review["stars"], text: v.text, createdAt: now - (i + 1) * DAY };
      await r.reviews.upsert(rev);
    }
    return true;
  });
}
