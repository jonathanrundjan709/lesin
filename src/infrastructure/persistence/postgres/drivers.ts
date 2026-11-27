import { Pool, type PoolConfig } from "pg";
import type { Row, SqlClient, SqlDatabase } from "./sql-database";

/**
 * Opsi koneksi dari URL. Parameter `sslmode`/`supa` dibuang dari URL karena driver `pg` memperlakukan `sslmode=require`
 * sebagai verify-full dan menolak sertifikat pooler (Supabase/Neon). SSL diatur eksplisit: aktif kecuali ke localhost.
 */
export function pgPoolConfig(url: string): PoolConfig {
  const u = new URL(url);
  for (const k of ["sslmode", "supa", "pgbouncer"]) u.searchParams.delete(k);
  const local = ["localhost", "127.0.0.1", "::1"].includes(u.hostname) || u.hostname.endsWith(".sock");
  return { connectionString: u.toString(), max: 3, ssl: local ? undefined : { rejectUnauthorized: false } };
}

/** Driver produksi: node-postgres. Cocok dengan Supabase / Neon / Vercel Postgres lewat DATABASE_URL atau POSTGRES_URL. */
export function createPgDatabase(connectionString: string): SqlDatabase {
  const pool = new Pool(pgPoolConfig(connectionString));
  const wrap = (c: { query: (s: string, p?: unknown[]) => Promise<{ rows: Row[] }> }): SqlClient => ({
    query: async (sql, params) => (await c.query(sql, params ? [...params] : undefined)).rows,
  });
  return {
    ...wrap(pool),
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const out = await fn(wrap(client));
        await client.query("COMMIT");
        return out;
      } catch (e) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw e;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
}
