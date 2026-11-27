import type {
  AppEvent, ContactUnlock, CreditKind, Id, LedgerEntry, Lesson, LessonRequest, Millis, Order, Report, Review, SessionNote,
  TutorProfile, Unlock, User, VerificationDoc,
} from "@/domain/types";

/* ---------- penyimpanan (satu antarmuka kecil per agregat) ---------- */
export interface UserRepo {
  insert(u: User): Promise<void>;
  update(u: User): Promise<void>;
  byId(id: Id): Promise<User | null>;
  /** Kunci baris pengguna sampai transaksi selesai (serialisasi pemakaian kuota kontak). */
  lockById(id: Id): Promise<User | null>;
  byIds(ids: readonly Id[]): Promise<User[]>;
  byPhone(phone: string): Promise<User | null>;
}
export interface TutorRepo {
  upsert(p: TutorProfile): Promise<void>;
  byUserId(id: Id): Promise<TutorProfile | null>;
  /** Kunci baris tutor sampai transaksi selesai (serialisasi pemakaian lead). */
  lockByUserId(id: Id): Promise<TutorProfile | null>;
  all(): Promise<TutorProfile[]>;
  countCompleted(): Promise<number>;
}
export interface RequestRepo {
  insert(r: LessonRequest): Promise<void>;
  byId(id: Id): Promise<LessonRequest | null>;
  lockById(id: Id): Promise<LessonRequest | null>;
  bySeeker(seekerId: Id): Promise<LessonRequest[]>;
  /** Permintaan yang belum kedaluwarsa pada `now`. */
  active(now: Millis): Promise<LessonRequest[]>;
}
export interface UnlockRepo {
  insert(u: Unlock): Promise<void>;
  has(tutorId: Id, requestId: Id): Promise<boolean>;
  byRequestIds(ids: readonly Id[]): Promise<Unlock[]>;
  byTutor(tutorId: Id): Promise<Unlock[]>;
}
export interface LedgerRepo {
  insert(e: LedgerEntry): Promise<void>;
  /** Simpan hanya bila id belum ada (mis. kredit trial). true bila tersimpan. */
  insertOnce(e: LedgerEntry): Promise<boolean>;
  byUser(userId: Id, kind: CreditKind): Promise<LedgerEntry[]>;
}
export interface ContactUnlockRepo {
  insert(u: ContactUnlock): Promise<void>;
  has(seekerId: Id, tutorId: Id): Promise<boolean>;
  bySeeker(seekerId: Id): Promise<ContactUnlock[]>;
}
export interface OrderRepo {
  insert(o: Order): Promise<void>;
  update(o: Order): Promise<void>;
  byId(id: Id): Promise<Order | null>;
  byKey(buyerId: Id, key: string): Promise<Order | null>;
  byBuyer(buyerId: Id): Promise<Order[]>;
  /** Tandai kedaluwarsa semua order pending yang lewat batas. Mengembalikan jumlahnya. */
  expirePending(now: Millis): Promise<number>;
}
export interface WebhookEventRepo {
  /** true bila event baru (belum pernah diproses). Menjamin idempotensi. */
  claim(eventId: string, at: Millis): Promise<boolean>;
}
export interface LessonRepo {
  insert(l: Lesson): Promise<void>;
  update(l: Lesson): Promise<void>;
  byId(id: Id): Promise<Lesson | null>;
  byParticipant(userId: Id): Promise<Lesson[]>;
  all(): Promise<Lesson[]>;
  insertNote(n: SessionNote): Promise<void>;
  notesByLessons(ids: readonly Id[]): Promise<SessionNote[]>;
}
export interface ReviewRepo {
  get(tutorId: Id, seekerId: Id): Promise<Review | null>;
  upsert(r: Review): Promise<void>;
  byTutor(tutorId: Id): Promise<Review[]>;
}
export interface ReportRepo {
  insert(r: Report): Promise<void>;
  byId(id: Id): Promise<Report | null>;
  update(r: Report): Promise<void>;
  open(): Promise<Report[]>;
}
export interface VerificationRepo {
  insert(d: VerificationDoc): Promise<void>;
  update(d: VerificationDoc): Promise<void>;
  byId(id: Id): Promise<VerificationDoc | null>;
  byTutor(tutorId: Id): Promise<VerificationDoc[]>;
  pending(): Promise<VerificationDoc[]>;
}
export interface EventRepo {
  insert(e: AppEvent): Promise<void>;
  /** Simpan hanya jika `key` belum ada. true bila tersimpan. */
  insertOnce(e: AppEvent, key: string): Promise<boolean>;
}

export interface Repositories {
  users: UserRepo; tutors: TutorRepo; requests: RequestRepo; unlocks: UnlockRepo; contactUnlocks: ContactUnlockRepo; ledger: LedgerRepo;
  orders: OrderRepo; webhookEvents: WebhookEventRepo; lessons: LessonRepo; reviews: ReviewRepo;
  reports: ReportRepo; verifications: VerificationRepo; events: EventRepo;
}
/** Menjalankan `fn` secara atomik: semua perubahan berhasil bersama atau dibatalkan bersama. */
export interface UnitOfWork { run<T>(fn: (repos: Repositories) => Promise<T>): Promise<T> }

/* ---------- layanan teknis ---------- */
export interface Clock { now(): Millis }
export interface IdGenerator { next(): Id }
export interface PasswordHasher { hash(password: string): Promise<string>; verify(password: string, hash: string): Promise<boolean> }
/** Token sesi bertanda tangan (tanpa penyimpanan server). */
export interface SessionTokens { issue(userId: Id, now: Millis): string; verify(token: string, now: Millis): Id | null }
/** Tanda tangan webhook pembayaran. */
export interface WebhookSigner { sign(body: string): string; verify(body: string, signature: string): boolean }
export interface PaymentGateway {
  /** Membuat tagihan QRIS untuk order. */
  createCharge(order: Order): Promise<{ gatewayRef: string; qrisPayload: string }>;
}
export interface Notifier { send(phone: string, message: string): Promise<void> }
