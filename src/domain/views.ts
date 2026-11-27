import { initialsOf, maskName, waOrNull } from "./masking";
import type { DayCode, Id, Millis, TutorProfile, User } from "./types";

/**
 * Bentuk data yang boleh keluar dari API. Penyamaran dilakukan DI SINI (server), bukan di UI:
 * nama asli dan WhatsApp tutor tidak ada di payload sampai tutor membuka permintaan orang tua itu (PRD §8).
 */
export interface TutorView {
  id: Id; masked: boolean;
  /** Nama asli bila terbuka, selain itu bentuk tersamar. */
  name: string; initials: string; phone: string | null; waNumber: string | null;
  headline: string; subjects: string[]; levels: string[]; curricula: string[];
  area: string; rate: number; rateDurationMin: number; experienceYears: number;
  education: string; bio: string; achievements: string[];
  teachesOffline: boolean; teachesOnline: boolean; availableDays: DayCode[]; age: number | null;
  verified: boolean; proBadge: boolean;
  /** Tutor sudah menyetujui kontaknya dibuka pencari dengan kuota. */
  directContact: boolean;
  rating: number; reviewCount: number; studentsTaught: number;
}

export const isPlanActive = (p: TutorProfile, now: Millis): boolean => p.planUntil !== null && p.planUntil > now;

export function toTutorView(user: User, p: TutorProfile, revealed: boolean, now: Millis): TutorView {
  return {
    id: p.userId, masked: !revealed,
    name: revealed ? user.name : maskName(user.name), initials: initialsOf(user.name),
    phone: revealed ? user.phone : null, waNumber: revealed ? waOrNull(user.phone) : null,
    headline: p.headline, subjects: p.subjects, levels: p.levels, curricula: p.curricula,
    area: p.area, rate: p.rate, rateDurationMin: p.rateDurationMin, experienceYears: p.experienceYears,
    education: p.education, bio: p.bio, achievements: p.achievements.split("\n").map((s) => s.trim()).filter(Boolean),
    teachesOffline: p.teachesOffline, teachesOnline: p.teachesOnline, availableDays: p.availableDays, age: revealed ? p.age : null,
    verified: p.verification === "verified", proBadge: isPlanActive(p, now), directContact: p.consentAt !== null,
    rating: p.reviewCount ? p.ratingAvg : 0, reviewCount: p.reviewCount, studentsTaught: p.studentsTaught,
  };
}
