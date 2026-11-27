import { PGlite } from "@electric-sql/pglite";
import type { Row, SqlClient, SqlDatabase } from "@/infrastructure/persistence/postgres/sql-database";

/** Postgres sungguhan di dalam proses (WASM) untuk menguji SQL dan transaksi tanpa server database. */
export async function createPgliteDatabase(): Promise<SqlDatabase> {
  const db = new PGlite();
  await db.waitReady;
  const wrap = (c: { query: (s: string, p?: unknown[]) => Promise<{ rows: unknown[] }>; exec: (s: string) => Promise<unknown> }): SqlClient => ({
    async query(sql, params) {
      if (!params || params.length === 0) {
        if (sql.includes(";\n") || /;\s*\S/.test(sql.trim())) { await c.exec(sql); return []; } // skrip multi-pernyataan (migrasi)
      }
      return (await c.query(sql, params ? [...params] : undefined)).rows as Row[];
    },
  });
  return {
    ...wrap(db),
    transaction: (fn) => db.transaction((tx) => fn(wrap(tx as unknown as Parameters<typeof wrap>[0]))),
    close: () => db.close(),
  };
}
