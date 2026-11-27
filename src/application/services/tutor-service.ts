import { fail } from "@/domain/errors";
import { type Match, matchTutor, sorters } from "@/domain/matching";
import { sanitizeText } from "@/domain/masking";
import { CONSENT_VERSION } from "@/domain/consent";
import { FOUNDING_LEADS, FOUNDING_SLOTS } from "@/domain/pricing";
import type { Id, TutorProfile } from "@/domain/types";
import { toTutorView, type TutorView } from "@/domain/views";
import type { Repositories } from "../ports";
import { parse, profileInput, searchInput } from "../validation";
import { type BaseDeps, recordEvent, requirePhone } from "./context";

export type TutorListItem = TutorView & { match: number; reach: boolean; areaLevel: 0 | 1 | 2 };
export interface MyProfile { name: string; phone: string | null; profile: TutorProfile | null }

/** Pencarian tutor, CV publik (tersamar), dan CV milik tutor sendiri. */
export class TutorService {
  constructor(private d: BaseDeps) {}

  /**
   * Tutor yang kontaknya boleh dilihat pencari ini: (a) tutor yang membuka salah satu permintaannya (tutor sudah bayar lead),
   * atau (b) tutor yang kontaknya dibuka sendiri oleh pencari dengan kuota (trial atau paket).
   */
  static async revealedTutorIds(r: Repositories, seekerId: Id): Promise<Set<Id>> {
    const reqs = await r.requests.bySeeker(seekerId);
    const [unlocks, bought] = await Promise.all([r.unlocks.byRequestIds(reqs.map((x) => x.id)), r.contactUnlocks.bySeeker(seekerId)]);
    return new Set([...unlocks.map((u) => u.tutorId), ...bought.map((u) => u.tutorId)]);
  }

  async search(viewerId: Id | null, raw: unknown): Promise<TutorListItem[]> {
    const f = parse(searchInput, raw);
    const now = this.d.clock.now();
    return this.d.uow.run(async (r) => {
      const [profiles, revealed] = await Promise.all([r.tutors.all(), viewerId ? TutorService.revealedTutorIds(r, viewerId) : new Set<Id>()]);
      const scored = profiles.map((p) => ({ p, m: matchTutor(p, f, now) })).filter((x) => x.m.ok);
      scored.sort(sorters[f.sort]);
      const users = new Map((await r.users.byIds(scored.map((x) => x.p.userId))).map((u) => [u.id, u]));
      await recordEvent(r, this.d, "search", viewerId, { area: f.area, subject: f.subject ?? null, results: scored.length });
      return scored.flatMap(({ p, m }) => {
        const u = users.get(p.userId);
        return u ? [{ ...toTutorView(u, p, revealed.has(p.userId) || p.userId === viewerId, now), match: m.score, reach: m.reach, areaLevel: m.areaLevel }] : [];
      });
    });
  }

  async get(viewerId: Id | null, tutorId: Id, context?: { area: string; budget: number; durationMin: number }): Promise<TutorListItem> {
    const now = this.d.clock.now();
    return this.d.uow.run(async (r) => {
      const [p, u] = await Promise.all([r.tutors.byUserId(tutorId), r.users.byId(tutorId)]);
      if (!p || !u || p.completedAt === null) return fail("not_found", "Tutor tidak ditemukan.");
      const revealed = viewerId === tutorId || (viewerId ? (await TutorService.revealedTutorIds(r, viewerId)).has(tutorId) : false);
      const m: Match = matchTutor(p, { area: context?.area ?? p.area, budget: context?.budget ?? 400_000, durationMin: context?.durationMin ?? 90 }, now);
      await recordEvent(r, this.d, "cv_view", viewerId, { tutorId });
      return { ...toTutorView(u, p, revealed, now), match: m.score, reach: m.reach, areaLevel: m.areaLevel };
    });
  }

  async myProfile(userId: Id): Promise<MyProfile> {
    return this.d.uow.run(async (r) => {
      const u = (await r.users.byId(userId)) ?? fail("unauthorized", "Masuk dulu.");
      return { name: u.name, phone: u.phone, profile: await r.tutors.byUserId(userId) };
    });
  }

  /** Setuju atau cabut persetujuan pembukaan nama dan WhatsApp (UU PDP). Kontak yang sudah terbuka tidak ditarik kembali. */
  async setConsent(userId: Id, accept: boolean): Promise<MyProfile> {
    const now = this.d.clock.now();
    return this.d.uow.run(async (r) => {
      const user = (await r.users.byId(userId)) ?? fail("unauthorized", "Masuk dulu.");
      const p = (await r.tutors.lockByUserId(userId)) ?? fail("not_found", "Lengkapi CV dulu.");
      const updated: TutorProfile = { ...p, consentAt: accept ? now : null, consentVersion: accept ? CONSENT_VERSION : null, updatedAt: now };
      await r.tutors.upsert(updated);
      return { name: user.name, phone: user.phone, profile: updated };
    });
  }

  /** Simpan CV. Saat CV pertama kali lengkap: tutor terdaftar dan (200 tutor pertama) mendapat 2 lead Founding Tutor. */
  async saveProfile(userId: Id, raw: unknown): Promise<MyProfile & { foundingGranted: boolean }> {
    const input = parse(profileInput, raw);
    const now = this.d.clock.now();
    return this.d.uow.run(async (r) => {
      const user = (await r.users.byId(userId)) ?? fail("unauthorized", "Masuk dulu.");
      requirePhone(user);
      const existing = await r.tutors.lockByUserId(userId);
      const first = !existing || existing.completedAt === null;
      if (first && input.consent !== true) {
        return fail("validation", "Setujui dulu pembukaan nama dan WhatsApp-mu kepada pencari yang memakai kuota.");
      }
      const base: TutorProfile = existing ?? {
        userId, headline: "", subjects: [], levels: [], curricula: [], area: input.area, rate: input.rate, rateDurationMin: input.rateDurationMin,
        experienceYears: 0, education: "", bio: "", achievements: "", teachesOffline: true, teachesOnline: true, gender: null, age: null, availableDays: [],
        verification: "unverified", planUntil: null, ratingAvg: 0, reviewCount: 0, studentsTaught: 0, completedAt: null, consentAt: null, consentVersion: null, createdAt: now, updatedAt: now,
      };
      const profile: TutorProfile = {
        ...base, headline: sanitizeText(input.headline), subjects: [...new Set(input.subjects)], levels: [...new Set(input.levels)],
        curricula: [...new Set(input.curricula)], area: input.area, rate: input.rate, rateDurationMin: input.rateDurationMin,
        experienceYears: input.experienceYears, education: sanitizeText(input.education), bio: sanitizeText(input.bio),
        achievements: sanitizeText(input.achievements), completedAt: base.completedAt ?? now, updatedAt: now,
        ...(first ? { consentAt: now, consentVersion: CONSENT_VERSION } : {}), // persetujuan hanya lewat centang CV pertama atau tombol di halaman CV
      };
      await r.tutors.upsert(profile);
      if (input.name !== user.name) await r.users.update({ ...user, name: input.name });
      let foundingGranted = false;
      if (first) {
        // Hitung termasuk tutor ini (sudah di-upsert), jadi tutor ke-200 masih mendapat kredit.
        foundingGranted = (await r.tutors.countCompleted()) <= FOUNDING_SLOTS;
        if (foundingGranted) await r.ledger.insert({ id: this.d.ids.next(), userId, kind: "lead", delta: FOUNDING_LEADS, reason: "founding", refId: "founding", expiresAt: null, createdAt: now });
        await recordEvent(r, this.d, "tutor_registered", userId, { foundingGranted });
      }
      return { name: input.name, phone: user.phone, profile, foundingGranted };
    });
  }
}

