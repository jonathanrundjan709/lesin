/** Entitas inti LesIn. Tidak bergantung pada framework, database, atau HTTP. */
export type Id = string;
/** Epoch milidetik. */
export type Millis = number;

export type Mode = "offline" | "online";
export type DayCode = "Sen" | "Sel" | "Rab" | "Kam" | "Jum" | "Sab" | "Min";
export type Gender = "L" | "P";
export interface ScheduleSlot { day: DayCode; time: string } // time = "HH:MM"

export interface User {
  id: Id; name: string; passwordHash: string;
  /** Email terverifikasi lewat OTP. Akun lama (sebelum OTP) belum punya. */
  email: string | null; emailVerifiedAt: Millis | null;
  /**
   * Nomor WhatsApp, diisi sesudah email terverifikasi. Wajib untuk membuka kontak, mengirim permintaan, membeli, dan menjadi tutor.
   * Unik: satu nomor satu akun, dan kredit trial diberikan sekali per nomor.
   */
  phone: string | null;
  isAdmin: boolean; status: "active" | "suspended"; createdAt: Millis;
}

export interface OtpChallenge {
  id: Id; email: string; codeHash: string; expiresAt: Millis; attempts: number; consumedAt: Millis | null;
  /** Hash alamat IP peminta, untuk membatasi penyalahgunaan tanpa menyimpan IP mentah. */
  ipHash: string; createdAt: Millis;
}

export type VerificationStatus = "unverified" | "pending" | "verified" | "suspended";

export interface TutorProfile {
  userId: Id;
  headline: string; subjects: string[]; levels: string[]; curricula: string[];
  area: string; rate: number; rateDurationMin: number; experienceYears: number;
  education: string; bio: string; achievements: string;
  teachesOffline: boolean; teachesOnline: boolean;
  gender: Gender | null; age: number | null; availableDays: DayCode[];
  verification: VerificationStatus;
  /** Tutor Plan aktif sampai kapan (null = tidak berlangganan). */
  planUntil: Millis | null;
  ratingAvg: number; reviewCount: number; studentsTaught: number;
  /** Terisi saat CV wajib lengkap pertama kali. */
  completedAt: Millis | null;
  /** Persetujuan pembukaan nama dan WhatsApp (UU PDP). null = belum setuju atau dicabut. */
  consentAt: Millis | null; consentVersion: string | null;
  createdAt: Millis; updatedAt: Millis;
}

export interface LessonRequest {
  id: Id; seekerId: Id;
  subject: string; level: string; curriculum: string; studentNote: string;
  area: string; mode: Mode; durationMin: number; budget: number;
  schedule: ScheduleSlot[]; notes: string;
  /** 0–3 tutor pilihan orang tua. Kosong = tampil di papan lowongan sesuai mapel & daerah. */
  targetTutorIds: Id[];
  /** Boost orang tua ditunda ke P1/P2 (PRD). Disimpan agar skema siap. */
  boostDays: number;
  createdAt: Millis; expiresAt: Millis;
}

/** Tutor membayar 1 lead untuk membuka satu permintaan. */
export interface Unlock { id: Id; tutorId: Id; requestId: Id; createdAt: Millis }

/** lead = kredit tutor untuk membuka permintaan. contact = kuota pencari untuk membuka kontak tutor. */
export type CreditKind = "lead" | "contact";
export type LedgerReason = "founding" | "trial" | "pack" | "plan" | "unlock" | "refund";
export interface LedgerEntry {
  id: Id; userId: Id; kind: CreditKind; delta: number; reason: LedgerReason; refId: Id;
  /** Kedaluwarsa: lead dari Tutor Plan (akhir bulan) dan kuota trial pencari (7 hari). */
  expiresAt: Millis | null; createdAt: Millis;
}

/** Pencari membayar 1 kuota untuk membuka kontak satu tutor. Unik per pasangan. */
export interface ContactUnlock { id: Id; seekerId: Id; tutorId: Id; createdAt: Millis }

export type ProductKey = "lead1" | "lead5" | "lead10" | "plan" | "contact1" | "contact5" | "contact15";
export type OrderStatus = "pending" | "paid" | "expired";
export interface Order {
  /** Pembeli: tutor (lead/Plan) atau pencari (kuota kontak). */
  id: Id; buyerId: Id; product: ProductKey; amount: number; units: number; isPlan: boolean;
  status: OrderStatus; idempotencyKey: string; gatewayRef: string;
  createdAt: Millis; expiresAt: Millis;
}

export interface Lesson {
  id: Id; tutorId: Id; seekerId: Id; child: string; subject: string;
  slots: ScheduleSlot[]; createdAt: Millis;
}
export interface SessionNote { id: Id; lessonId: Id; topic: string; understanding: 1 | 2 | 3 | 4 | 5; createdAt: Millis }

export interface Review { id: Id; tutorId: Id; seekerId: Id; stars: 1 | 2 | 3 | 4 | 5; text: string; createdAt: Millis }

export type ReportStatus = "open" | "resolved";
export interface Report { id: Id; reporterId: Id; tutorId: Id; reason: string; status: ReportStatus; createdAt: Millis }

export type DocKind = "id" | "skill";
export type DocStatus = "pending" | "approved" | "rejected";
export interface VerificationDoc { id: Id; tutorId: Id; kind: DocKind; status: DocStatus; reviewedBy: Id | null; createdAt: Millis }

export interface AppEvent { id: Id; userId: Id | null; type: string; payload: Record<string, unknown>; createdAt: Millis }
