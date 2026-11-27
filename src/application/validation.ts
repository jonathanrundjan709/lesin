import { z } from "zod";
import { DAYS, DURATIONS, MAX_BUDGET, MAX_RATE, MIN_BUDGET, MIN_RATE, LEVELS, CURRICULA } from "@/domain/catalog";
import { isArea } from "@/domain/areas";
import { DomainError } from "@/domain/errors";
import { MAX_TARGETS } from "@/domain/pricing";

export const normalizePhone = (p: string): string => {
  const d = p.replace(/\D/g, "");
  return d.startsWith("62") ? "0" + d.slice(2) : d;
};
export const isValidPhone = (p: string): boolean => /^08\d{8,12}$/.test(normalizePhone(p));

const phone = z.string().refine(isValidPhone, "Nomor WhatsApp harus diawali 08, 10–13 angka.").transform(normalizePhone);
const area = z.string().refine(isArea, "Pilih kecamatan di Jabodetabek.");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Jam tidak valid.");
const day = z.enum(DAYS as unknown as [string, ...string[]]);
const duration = z.number().refine((d) => (DURATIONS as readonly number[]).includes(d), "Durasi harus 60, 90, atau 120 menit.");
const slots = z.array(z.object({ day, time })).min(1, "Pilih minimal satu hari.").max(7);

export const signupInput = z.object({
  name: z.string().trim().min(3, "Isi nama lengkapmu.").max(60),
  phone, password: z.string().min(6, "Password minimal 6 karakter.").max(100),
});
export const loginInput = z.object({ phone, password: z.string().min(1, "Isi password.") });

export const searchInput = z.object({
  area, subject: z.string().max(40).optional(), level: z.string().max(20).optional(), curriculum: z.string().max(20).optional(),
  mode: z.enum(["any", "offline", "online"]).default("any"), gender: z.enum(["any", "L", "P"]).default("any"),
  budget: z.number().min(MIN_BUDGET).max(MAX_BUDGET).default(150_000), durationMin: duration.default(90),
  sort: z.enum(["match", "dist", "price", "rating"]).default("match"),
});

export const profileInput = z.object({
  name: z.string().trim().min(3, "Isi nama lengkapmu.").max(60),
  headline: z.string().trim().max(60).default(""),
  subjects: z.array(z.string().trim().min(2).max(40)).min(1, "Pilih minimal satu mata pelajaran.").max(30),
  levels: z.array(z.enum(LEVELS)).min(1, "Pilih minimal satu jenjang."),
  curricula: z.array(z.enum(CURRICULA)).default([]),
  area, rate: z.number().int().min(MIN_RATE, "Tarif minimal Rp25.000.").max(MAX_RATE, "Tarif maksimal Rp400.000."),
  rateDurationMin: duration,
  experienceYears: z.number().int().min(0).max(50).default(0),
  education: z.string().trim().min(3, "Isi pendidikan terakhirmu.").max(120),
  bio: z.string().trim().max(600).default(""),
  achievements: z.string().trim().max(600).default(""),
});

export const requestInput = z.object({
  subject: z.string().trim().min(2).max(40), level: z.enum(LEVELS),
  curriculum: z.string().max(20).default(""), studentNote: z.string().trim().min(3, "Ceritakan singkat tentang murid.").max(120),
  area, mode: z.enum(["offline", "online"]), durationMin: duration,
  budget: z.number().int().min(MIN_BUDGET).max(MAX_BUDGET, "Budget maksimal Rp400.000 per sesi."),
  schedule: slots, notes: z.string().max(400).default(""),
  targetTutorIds: z.array(z.string()).max(MAX_TARGETS, `Pilih maksimal ${MAX_TARGETS} tutor.`).default([]),
  boostDays: z.number().int().min(0).max(14).default(0),
});

export const lessonInput = z.object({
  tutorId: z.string(), seekerId: z.string().optional(), child: z.string().trim().min(2, "Isi nama murid.").max(60),
  subject: z.string().trim().min(2).max(40), slots,
});
export const noteInput = z.object({ topic: z.string().trim().min(2, "Tulis topik singkat.").max(200), understanding: z.number().int().min(1).max(5) });
export const reviewInput = z.object({ stars: z.number().int().min(1).max(5), text: z.string().trim().min(5, "Tulis minimal 5 huruf.").max(300) });
export const reportInput = z.object({ reason: z.string().trim().min(5, "Jelaskan singkat alasannya.").max(400) });

/** Parse dengan pesan galat pertama yang ramah pengguna. */
export function parse<T extends z.ZodType>(schema: T, data: unknown): z.output<T> {
  const r = schema.safeParse(data);
  if (r.success) return r.data;
  throw new DomainError("validation", r.error.issues[0]?.message ?? "Data tidak valid.");
}
