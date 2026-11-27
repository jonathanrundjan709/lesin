/** Antarmuka SQL minimal. Repository hanya bergantung pada ini, jadi driver bisa diganti (pg di produksi, PGlite di tes). */
export type Row = Record<string, unknown>;
export interface SqlClient { query(sql: string, params?: readonly unknown[]): Promise<Row[]> }
export interface SqlDatabase extends SqlClient {
  /** Menjalankan `fn` dalam satu transaksi: COMMIT bila selesai, ROLLBACK bila melempar galat. */
  transaction<T>(fn: (tx: SqlClient) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}
