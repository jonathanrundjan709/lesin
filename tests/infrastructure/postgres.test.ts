import assert from "node:assert/strict";
import { test } from "node:test";
import { pgPoolConfig } from "@/infrastructure/persistence/postgres/drivers";
import { PostgresUnitOfWork } from "@/infrastructure/persistence/postgres/postgres-unit-of-work";
import { createPgliteDatabase } from "../support/pglite-database";

test("URL Supabase: sslmode dibuang dan SSL diatur eksplisit", () => {
  const url = "postgres://postgres.abc:pw@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";
  const c = pgPoolConfig(url);
  assert.equal(new URL(c.connectionString!).search, "", "parameter yang memicu verify-full dibuang dari query string");
  assert.deepEqual(c.ssl, { rejectUnauthorized: false });
  assert.ok(c.connectionString!.startsWith("postgres://postgres.abc:pw@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"));
});

test("URL lokal tidak memakai SSL", () => {
  assert.equal(pgPoolConfig("postgres://lesin:lesin@localhost:5432/lesin?sslmode=disable").ssl, undefined);
  assert.equal(pgPoolConfig("postgres://u@127.0.0.1:5432/db").ssl, undefined);
});

test("migrasi idempoten, aman dijalankan bersamaan, dan RLS aktif di semua tabel", async () => {
  const db = await createPgliteDatabase();
  const uow = new PostgresUnitOfWork(db);
  await Promise.all([uow.migrate(), uow.migrate(), uow.migrate()]);
  await uow.migrate();
  const tables = await db.query("SELECT c.relname AS name, c.relrowsecurity AS rls FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind = 'r'");
  assert.ok(tables.length >= 13, "semua tabel dibuat");
  const open = tables.filter((t) => !t.rls).map((t) => t.name);
  assert.deepEqual(open, [], "tidak ada tabel tanpa RLS (Supabase membuka skema public lewat REST API)");
  await db.close();
});

test("migrasi dari skema lama (kolom tutor_id/leads) tanpa kehilangan data", async () => {
  const db = await createPgliteDatabase();
  // Skema versi pertama yang sudah hidup di database staging.
  await db.query(`CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, is_admin BOOLEAN NOT NULL DEFAULT FALSE, status TEXT NOT NULL DEFAULT 'active', created_at BIGINT NOT NULL)`);
  await db.query(`CREATE TABLE ledger_entries (id TEXT PRIMARY KEY, tutor_id TEXT NOT NULL REFERENCES users(id), delta INTEGER NOT NULL, reason TEXT NOT NULL, ref_id TEXT NOT NULL, expires_at BIGINT, created_at BIGINT NOT NULL)`);
  await db.query(`CREATE TABLE orders (id TEXT PRIMARY KEY, tutor_id TEXT NOT NULL REFERENCES users(id), product TEXT NOT NULL, amount INTEGER NOT NULL, leads INTEGER NOT NULL, is_plan BOOLEAN NOT NULL, status TEXT NOT NULL, idempotency_key TEXT NOT NULL, gateway_ref TEXT NOT NULL DEFAULT '', created_at BIGINT NOT NULL, expires_at BIGINT NOT NULL, UNIQUE (tutor_id, idempotency_key))`);
  await db.query("INSERT INTO users VALUES ('u1','Budi','081200000001','x',false,'active',1)");
  await db.query("INSERT INTO ledger_entries VALUES ('l1','u1',2,'founding','founding',NULL,1)");
  await db.query("INSERT INTO orders VALUES ('o1','u1','lead5',65000,5,false,'paid','k','',1,2)");

  const uow = new PostgresUnitOfWork(db);
  await uow.migrate();
  await uow.migrate();

  const [l] = await db.query("SELECT user_id, kind, delta FROM ledger_entries WHERE id='l1'");
  assert.deepEqual({ user: l.user_id, kind: l.kind, delta: Number(l.delta) }, { user: "u1", kind: "lead", delta: 2 }, "entri lama jadi kredit lead milik pengguna");
  const [o] = await db.query("SELECT buyer_id, units FROM orders WHERE id='o1'");
  assert.deepEqual({ buyer: o.buyer_id, units: Number(o.units) }, { buyer: "u1", units: 5 });
  await uow.run(async (r) => {
    assert.equal((await r.ledger.byUser("u1", "lead")).length, 1);
    assert.equal((await r.orders.byBuyer("u1")).length, 1);
    const legacy = await r.users.byPhone("081200000001");
    assert.deepEqual({ email: legacy?.email, verified: legacy?.emailVerifiedAt, phone: legacy?.phone }, { email: null, verified: null, phone: "081200000001" }, "akun lama tetap bisa masuk dengan nomor");
    await r.users.insert({ id: "u2", name: "Baru", passwordHash: "x", email: "baru@contoh.id", emailVerifiedAt: null, phone: null, isAdmin: false, status: "active", createdAt: 5 });
    assert.equal((await r.users.byEmail("baru@contoh.id"))?.phone, null, "nomor boleh kosong sampai diisi");
    assert.equal(await r.ledger.insertOnce({ id: "trial:u1", userId: "u1", kind: "contact", delta: 10, reason: "trial", refId: "t", expiresAt: null, createdAt: 3 }), true);
    assert.equal(await r.ledger.insertOnce({ id: "trial:u1", userId: "u1", kind: "contact", delta: 10, reason: "trial", refId: "t", expiresAt: null, createdAt: 3 }), false);
  });
  await db.close();
});
