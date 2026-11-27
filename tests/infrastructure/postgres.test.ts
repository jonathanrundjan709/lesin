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
