import type { LedgerEntry, Millis } from "./types";

const WIB_OFFSET_MS = 7 * 3_600_000;

/** Awal bulan berikutnya menurut WIB: batas kedaluwarsa lead dari Tutor Plan. */
export function monthEnd(now: Millis): Millis {
  const wib = new Date(now + WIB_OFFSET_MS);
  return Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth() + 1, 1) - WIB_OFFSET_MS;
}

/**
 * Saldo lead = jumlah lead yang belum kedaluwarsa pada `now`.
 * Setiap kredit adalah "lot"; setiap pemakaian mengambil dari lot yang masih berlaku dan paling cepat
 * kedaluwarsa (lead Plan dipakai lebih dulu daripada lead beli). Ledger tidak pernah diubah, hanya ditambah.
 */
export function leadBalance(entries: readonly LedgerEntry[], now: Millis): number {
  const lots = entries.filter((e) => e.delta > 0)
    .map((e) => ({ at: e.createdAt, exp: e.expiresAt, left: e.delta }))
    .sort((a, b) => (a.exp ?? Infinity) - (b.exp ?? Infinity) || a.at - b.at);
  const debits = entries.filter((e) => e.delta < 0).sort((a, b) => a.createdAt - b.createdAt);
  for (const d of debits) {
    let need = -d.delta;
    for (const lot of lots) {
      if (need === 0) break;
      const alive = lot.at <= d.createdAt && (lot.exp === null || lot.exp > d.createdAt);
      if (!alive || lot.left === 0) continue;
      const take = Math.min(lot.left, need);
      lot.left -= take; need -= take;
    }
  }
  return lots.filter((l) => l.exp === null || l.exp > now).reduce((s, l) => s + l.left, 0);
}
