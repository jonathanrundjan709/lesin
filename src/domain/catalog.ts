import type { DayCode } from "./types";

export const SUBJECTS = ["Matematika", "Fisika", "Kimia", "Biologi", "Bahasa Inggris", "Calistung", "UTBK / SNBT", "Coding", "Piano", "Akuntansi", "Bahasa Mandarin"] as const;
export const LEVELS = ["TK", "SD", "SMP", "SMA", "Kuliah", "Umum"] as const;
export const CURRICULA = ["Merdeka", "K13", "Cambridge", "IGCSE", "IB", "Nasional Plus"] as const;
export const DAYS: readonly DayCode[] = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
/** Durasi sesi yang bisa dipilih (menit). Tarif dan budget selalu dinormalkan per jam. */
export const DURATIONS = [60, 90, 120] as const;

export const MIN_BUDGET = 50_000;
export const MAX_BUDGET = 400_000;
export const MIN_RATE = 25_000;
export const MAX_RATE = 400_000;

export const perHour = (rate: number, durationMin: number): number => (rate / (durationMin || 90)) * 60;
