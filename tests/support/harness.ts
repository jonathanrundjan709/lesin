import { buildServices, type Services } from "@/application/services";
import type { UnitOfWork } from "@/application/ports";
import { ConsoleNotifier } from "@/infrastructure/notifications/console-notifier";
import { EchoOtpSender } from "@/infrastructure/notifications/echo-otp-sender";
import { SimulatedQrisGateway } from "@/infrastructure/payment/simulated-qris-gateway";
import { MemoryUnitOfWork } from "@/infrastructure/persistence/memory/memory-unit-of-work";
import { PostgresUnitOfWork } from "@/infrastructure/persistence/postgres/postgres-unit-of-work";
import { HmacSessionTokens, HmacWebhookSigner } from "@/infrastructure/security/hmac";
import { CryptoOtpCodes } from "@/infrastructure/security/otp-codes";
import { ScryptPasswordHasher } from "@/infrastructure/security/scrypt-password-hasher";
import { FakeClock, UuidGenerator } from "@/infrastructure/system/clock-and-ids";
import { createPgDatabase } from "@/infrastructure/persistence/postgres/drivers";
import { createPgliteDatabase } from "./pglite-database";

/** memory = adapter memori, postgres = PGlite (WASM), pg = server PostgreSQL sungguhan lewat driver produksi (bila TEST_DATABASE_URL diisi). */
export type Adapter = "memory" | "postgres" | "pg";
export const ADAPTERS: Adapter[] = process.env.TEST_DATABASE_URL ? ["memory", "postgres", "pg"] : ["memory", "postgres"];

/** Senin, 30 Nov 2026 10:00 WIB. */
export const T0 = Date.UTC(2026, 10, 30, 3, 0, 0);
export const DAY = 86_400_000;

export interface Env { adapter: Adapter; services: Services; clock: FakeClock; uow: UnitOfWork; notifier: ConsoleNotifier; otp: EchoOtpSender; signer: HmacWebhookSigner; close(): Promise<void> }

export async function makeEnv(adapter: Adapter, opts: { manualPayment?: boolean } = {}): Promise<Env> {
  let uow: UnitOfWork, close = async () => {};
  if (adapter === "postgres" || adapter === "pg") {
    const db = adapter === "pg" ? createPgDatabase(process.env.TEST_DATABASE_URL!) : await createPgliteDatabase();
    if (adapter === "pg") await db.transaction(async (tx) => { await tx.query("DROP SCHEMA public CASCADE"); await tx.query("CREATE SCHEMA public"); });
    const pg = new PostgresUnitOfWork(db);
    await pg.migrate();
    uow = pg; close = () => db.close();
  } else {
    uow = new MemoryUnitOfWork();
  }
  const clock = new FakeClock(T0), notifier = new ConsoleNotifier(), otp = new EchoOtpSender(), signer = new HmacWebhookSigner("test-webhook-secret");
  const services = buildServices({
    uow, clock, ids: new UuidGenerator(), hasher: new ScryptPasswordHasher(), tokens: new HmacSessionTokens("test-session-secret"),
    signer, gateway: new SimulatedQrisGateway(), notifier, allowPaymentSimulation: !opts.manualPayment, manualPayment: opts.manualPayment, otpSender: otp, otpCodes: new CryptoOtpCodes(),
  });
  return { adapter, services, clock, uow, notifier, otp, signer, close };
}

let counter = 0;
export const phoneN = (): string => `0812${String(10_000_000 + ++counter)}`;

export const emailN = (): string => `uji${++counter}@contoh.id`;
/** Kode OTP terakhir yang "dikirim" ke email ini. */
export const lastCode = (env: Env, email: string): string => env.otp.sent.filter((s) => s.email === email).at(-1)!.code;

/** Daftar akun baru sampai siap dipakai: email terverifikasi OTP dan nomor WhatsApp terisi (trial sudah aktif). */
export async function signup(env: Env, name = "Pengguna Uji", over: { email?: string; phone?: string } = {}) {
  const email = over.email ?? emailN();
  await env.services.auth.signup({ name, email, password: "rahasia1" }, `10.0.0.${counter % 250}`);
  const { user } = await env.services.auth.verify({ email, code: lastCode(env, email) });
  const { user: withPhone } = await env.services.auth.setPhone(user.id, { phone: over.phone ?? phoneN() });
  return withPhone;
}

export const validProfile = (over: Record<string, unknown> = {}) => ({
  name: "Budi Santoso", headline: "Sabar dan runtut", subjects: ["Matematika"], levels: ["SMP"], curricula: ["Merdeka"], area: "Tebet",
  rate: 100_000, rateDurationMin: 60, experienceYears: 2, education: "S1 Matematika UI", bio: "", achievements: "", consent: true, ...over,
});

/** Akun yang CV-nya sudah lengkap (jadi tutor). */
export async function makeTutor(env: Env, over: Record<string, unknown> = {}) {
  const user = await signup(env, (over.name as string) ?? "Budi Santoso");
  const saved = await env.services.tutors.saveProfile(user.id, validProfile(over));
  return { user, saved };
}

export const validRequest = (over: Record<string, unknown> = {}) => ({
  subject: "Matematika", level: "SMP", curriculum: "Merdeka", studentNote: "Kelas 8, nilai turun", area: "Tebet", mode: "offline",
  durationMin: 90, budget: 120_000, schedule: [{ day: "Sen", time: "16:00" }, { day: "Kam", time: "17:30" }], notes: "", targetTutorIds: [], ...over,
});

/** Beli dan lunasi paket lewat webhook bertanda tangan (jalur yang sama dengan gateway). */
export async function buyAndPay(env: Env, tutorId: string, product: string, key = `k-${Math.random()}`) {
  const order = await env.services.billing.createOrder(tutorId, product, key);
  const body = JSON.stringify({ eventId: `e-${order.id}`, orderId: order.id, amount: order.amount });
  await env.services.billing.handleWebhook(body, env.signer.sign(body));
  return order;
}
