import type { ProductKey } from "./types";

/** Harga dan aturan bisnis menurut PRD §5–6 (model terbaru: orang tua gratis, tutor membayar lead). */
export const LEAD_PRICE = 15_000;
export const MAX_TARGETS = 3;          // tutor pilihan per permintaan
export const MAX_RESPONDERS = 10;      // tutor yang boleh membuka satu permintaan
export const REQUEST_DAYS = 14;
export const ORDER_TTL_MIN = 30;
export const FOUNDING_SLOTS = 200;     // tutor pertama
export const FOUNDING_LEADS = 2;

export interface Product { label: string; amount: number; leads: number; plan: boolean }
export const PRODUCTS: Readonly<Record<ProductKey, Product>> = {
  lead1: { label: "1 lead", amount: 15_000, leads: 1, plan: false },
  lead5: { label: "5 lead", amount: 65_000, leads: 5, plan: false },
  lead10: { label: "10 lead", amount: 125_000, leads: 10, plan: false },
  plan: { label: "Tutor Plan / bulan", amount: 99_000, leads: 8, plan: true },
};

export const isProduct = (k: string): k is ProductKey => Object.hasOwn(PRODUCTS, k);
/** Harga normal tanpa diskon paket (dipakai untuk harga coret di UI). */
export const listPrice = (p: Product): number => p.leads * LEAD_PRICE;

/** Fitur yang ada di PRD tetapi ditunda. Nyalakan saat tiernya dikerjakan. */
export const FEATURES = { requestBoost: false } as const;
