import { Pool } from "pg";
import type { Row, SqlClient, SqlDatabase } from "./sql-database";

/** Driver produksi: node-postgres. Cocok dengan Neon / Vercel Postgres / Supabase lewat DATABASE_URL. */
export function createPgDatabase(connectionString: string): SqlDatabase {
  const pool = new Pool({ connectionString, max: 3, ssl: /localhost|127\.0\.0\.1/.test(connectionString) ? undefined : { rejectUnauthorized: false } });
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
