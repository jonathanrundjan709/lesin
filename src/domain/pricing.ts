import type { ProductKey } from "./types";

/** Harga dan aturan bisnis. Dua sisi berbayar: tutor membeli lead, pencari membeli kuota kontak setelah trial 7 hari. */
export const LEAD_PRICE = 15_000;
export const MAX_TARGETS = 10;         // tutor pilihan per permintaan
export const MAX_RESPONDERS = 10;      // tutor yang boleh membuka satu permintaan
export const REQUEST_DAYS = 14;
export const ORDER_TTL_MIN = 30;
export const FOUNDING_SLOTS = 200;     // tutor pertama
export const FOUNDING_LEADS = 2;
export const TRIAL_DAYS = 7;           // pencari baru: masa percobaan gratis
export const TRIAL_CONTACTS = 10;      // ... dengan maksimal 10 buka kontak tutor
export const CONTACT_PRICE = 8_000;    // harga normal 1 kuota kontak (dasar harga coret)

export type Audience = "tutor" | "seeker";
/** units = jumlah lead (tutor) atau kuota kontak (pencari). */
export interface Product { label: string; amount: number; units: number; plan: boolean; audience: Audience }
export const PRODUCTS: Readonly<Record<ProductKey, Product>> = {
  lead1: { label: "1 lead", amount: 15_000, units: 1, plan: false, audience: "tutor" },
  lead5: { label: "5 lead", amount: 65_000, units: 5, plan: false, audience: "tutor" },
  lead10: { label: "10 lead", amount: 125_000, units: 10, plan: false, audience: "tutor" },
  plan: { label: "Tutor Plan / bulan", amount: 99_000, units: 8, plan: true, audience: "tutor" },
  contact1: { label: "1 kontak", amount: 8_000, units: 1, plan: false, audience: "seeker" },
  contact5: { label: "5 kontak", amount: 30_000, units: 5, plan: false, audience: "seeker" },
  contact15: { label: "15 kontak", amount: 75_000, units: 15, plan: false, audience: "seeker" },
};

export const isProduct = (k: string): k is ProductKey => Object.hasOwn(PRODUCTS, k);
/** Harga normal tanpa diskon paket (dipakai untuk harga coret di UI). */
export const listPrice = (p: Product): number => p.units * (p.audience === "seeker" ? CONTACT_PRICE : LEAD_PRICE);
export const creditKindOf = (p: Product): "lead" | "contact" => (p.audience === "seeker" ? "contact" : "lead");

/** Fitur yang ada di PRD tetapi ditunda. Nyalakan saat tiernya dikerjakan. */
export const FEATURES = { requestBoost: false } as const;
