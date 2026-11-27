import { areaLevel } from "./areas";
import { perHour } from "./catalog";
import { isPlanActive } from "./views";
import type { Gender, LessonRequest, Millis, TutorProfile } from "./types";

export interface SearchFilter {
  area: string; subject?: string; level?: string; curriculum?: string;
  mode?: "any" | "offline" | "online"; gender?: "any" | Gender;
  budget: number; durationMin: number;
}
export interface Match { ok: boolean; score: number; reach: boolean; areaLevel: 0 | 1 | 2 }

/** Apakah tutor muncul di hasil dan seberapa cocok (0–99). Tutor Plan mendapat prioritas kecil (PRD §6). */
export function matchTutor(p: TutorProfile, f: SearchFilter, now: Millis): Match {
  const level = areaLevel(f.area, p.area);
  const reach = p.teachesOffline && level > 0;
  const modeOk = f.mode === "online" ? p.teachesOnline : f.mode === "offline" ? reach : reach || p.teachesOnline;
  const listed = p.completedAt !== null && p.verification !== "suspended";
  const withinBudget = perHour(p.rate, p.rateDurationMin) <= perHour(f.budget, f.durationMin) * 1.25;
  const ok = listed && modeOk && withinBudget
    && (!f.subject || p.subjects.includes(f.subject)) && (!f.level || p.levels.includes(f.level))
    && (!f.curriculum || p.curricula.includes(f.curriculum))
    && (!f.gender || f.gender === "any" || p.gender === f.gender);
  const rating = p.reviewCount ? p.ratingAvg : 4.5; // tutor baru dinilai netral
  let score = 52;
  score += f.subject && p.subjects[0] === f.subject ? 10 : 5;
  score += reach ? (level === 2 ? 18 : 10) : 6;
  score += perHour(p.rate, p.rateDurationMin) <= perHour(f.budget, f.durationMin) ? 10 : 2;
  score += Math.round((rating - 4.5) * 14) + Math.min(p.experienceYears, 8);
  if (p.verification === "verified") score += 3;
  if (isPlanActive(p, now)) score += 4;
  return { ok, score: Math.max(1, Math.min(99, score)), reach, areaLevel: level };
}

export type SortKey = "match" | "dist" | "price" | "rating";
export const sorters: Record<SortKey, (a: { m: Match; p: TutorProfile }, b: { m: Match; p: TutorProfile }) => number> = {
  match: (a, b) => b.m.score - a.m.score,
  dist: (a, b) => b.m.areaLevel - a.m.areaLevel || b.m.score - a.m.score,
  price: (a, b) => perHour(a.p.rate, a.p.rateDurationMin) - perHour(b.p.rate, b.p.rateDurationMin),
  rating: (a, b) => b.p.ratingAvg - a.p.ratingAvg,
};

/** Permintaan relevan untuk tutor: ditujukan padanya, atau cocok mapel dan (online atau satu kota). */
export function requestFitsTutor(r: LessonRequest, p: TutorProfile): { fitsSubject: boolean; nearby: boolean; targeted: boolean } {
  const targeted = r.targetTutorIds.includes(p.userId);
  const fitsSubject = p.subjects.includes(r.subject) && p.levels.includes(r.level);
  const nearby = r.mode === "online" ? p.teachesOnline : areaLevel(p.area, r.area) > 0;
  return { fitsSubject, nearby, targeted };
}
