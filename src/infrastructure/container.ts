import { createHash } from "node:crypto";
import type { UnitOfWork } from "@/application/ports";
import { buildServices, type Ports, type Services } from "@/application/services";
import { ConsoleNotifier } from "./notifications/console-notifier";
import { SimulatedQrisGateway } from "./payment/simulated-qris-gateway";
import { MemoryUnitOfWork } from "./persistence/memory/memory-unit-of-work";
import { createPgDatabase } from "./persistence/postgres/drivers";
import { PostgresUnitOfWork } from "./persistence/postgres/postgres-unit-of-work";
import { seedDemoData } from "./seed/seed-demo-data";
import { HmacSessionTokens, HmacWebhookSigner } from "./security/hmac";
import { ScryptPasswordHasher } from "./security/scrypt-password-hasher";
import { SystemClock, UuidGenerator } from "./system/clock-and-ids";

export type StorageMode = "postgres" | "memory";
export interface Container { services: Services; mode: StorageMode; ports: Ports }

/** Rahasia dari env; bila kosong diturunkan dari DATABASE_URL (rahasia karena memuat password); terakhir, nilai dev. */
function secret(name: string, databaseUrl: string | undefined): string {
  const fromEnv = process.env[name];
  if (fromEnv) return fromEnv;
  if (databaseUrl) return createHash("sha256").update(`${name}:${databaseUrl}`).digest("hex");
  return `dev-insecure-${name.toLowerCase()}`;
}

async function build(): Promise<Container> {
  const env = process.env;
  const databaseUrl = env.DATABASE_URL || env.POSTGRES_URL || undefined;
  const clock = new SystemClock(), hasher = new ScryptPasswordHasher();

  let uow: UnitOfWork, mode: StorageMode;
  if (databaseUrl) {
    const pg = new PostgresUnitOfWork(createPgDatabase(databaseUrl));
    await pg.migrate();
    uow = pg; mode = "postgres";
  } else {
    uow = new MemoryUnitOfWork(); mode = "memory";
  }

  const ports: Ports = {
    uow, clock, hasher, ids: new UuidGenerator(),
    tokens: new HmacSessionTokens(secret("SESSION_SECRET", databaseUrl)),
    signer: new HmacWebhookSigner(secret("PAYMENT_WEBHOOK_SECRET", databaseUrl)),
    gateway: new SimulatedQrisGateway(), notifier: new ConsoleNotifier(),
    // Selama gateway masih simulasi, tombol "bayar" demo harus tersedia. Matikan saat gateway sungguhan dipasang.
    allowPaymentSimulation: env.ALLOW_PAYMENT_SIMULATION !== "false",
  };
  if (env.SEED_DEMO_DATA !== "false") {
    // Bila instance lain sedang mengisi data yang sama, abaikan: yang penting datanya ada.
    await seedDemoData({ uow, clock, hasher }).catch((e) => console.warn("[seed] dilewati:", (e as Error).message));
  }
  await ensureAdmin(ports, env.ADMIN_PHONE, env.ADMIN_PASSWORD);
  return { services: buildServices(ports), mode, ports };
}

/** Membuat akun admin dari env bila belum ada. Konsol admin wajib 2FA di produksi (PRD §8). */
async function ensureAdmin(p: Ports, phone?: string, password?: string): Promise<void> {
  if (!phone || !password) return;
  const passwordHash = await p.hasher.hash(password);
  await p.uow.run(async (r) => {
    const existing = await r.users.byPhone(phone);
    if (existing) { if (!existing.isAdmin) await r.users.update({ ...existing, isAdmin: true }); return; }
    await r.users.insert({ id: p.ids.next(), name: "Admin LesIn", phone, passwordHash, isAdmin: true, status: "active", createdAt: p.clock.now() });
  });
}

const g = globalThis as unknown as { __lesinContainer?: Promise<Container> };
/** Satu container per proses (dan per instance serverless). */
export const getContainer = (): Promise<Container> => {
  if (!g.__lesinContainer) {
    // Gagal start (mis. database belum terjangkau) tidak boleh tersimpan selamanya: coba lagi di permintaan berikutnya.
    g.__lesinContainer = build().catch((e) => { g.__lesinContainer = undefined; throw e; });
  }
  return g.__lesinContainer;
};
