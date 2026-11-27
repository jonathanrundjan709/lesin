import { AREA_TREE, COMING_SOON_CITIES } from "@/domain/areas";
import { CURRICULA, DAYS, DURATIONS, LEVELS, MAX_BUDGET, MAX_RATE, MIN_BUDGET, MIN_RATE, SUBJECTS } from "@/domain/catalog";
import { CONTACT_PRICE, FEATURES, LEAD_PRICE, listPrice, MAX_RESPONDERS, MAX_TARGETS, PRODUCTS, REQUEST_DAYS, TRIAL_CONTACTS, TRIAL_DAYS } from "@/domain/pricing";
import { CONSENT_POINTS, CONSENT_VERSION } from "@/domain/consent";
import { OTP_LENGTH, OTP_RESEND_COOLDOWN_MS, OTP_TTL_MS } from "@/domain/otp";
import type { ProductKey } from "@/domain/types";

/** Data referensi untuk UI: satu sumber kebenaran, jadi daftar di frontend tidak perlu disalin. */
export const buildMeta = (opts: { paymentSimulation: boolean; storage: "postgres" | "memory"; otpDemo: boolean }) => ({
  paymentSimulation: opts.paymentSimulation,
  otp: { demo: opts.otpDemo, length: OTP_LENGTH, ttlMin: OTP_TTL_MS / 60_000, resendSec: OTP_RESEND_COOLDOWN_MS / 1000 },
  consent: { version: CONSENT_VERSION, points: CONSENT_POINTS },
  storage: opts.storage,
  areas: AREA_TREE, comingSoon: COMING_SOON_CITIES,
  subjects: SUBJECTS, levels: LEVELS, curricula: CURRICULA, days: DAYS, durations: DURATIONS,
  limits: { minBudget: MIN_BUDGET, maxBudget: MAX_BUDGET, minRate: MIN_RATE, maxRate: MAX_RATE, maxTargets: MAX_TARGETS, maxResponders: MAX_RESPONDERS, requestDays: REQUEST_DAYS, leadPrice: LEAD_PRICE, contactPrice: CONTACT_PRICE },
  trial: { days: TRIAL_DAYS, contacts: TRIAL_CONTACTS },
  features: FEATURES,
  products: (Object.entries(PRODUCTS) as [ProductKey, (typeof PRODUCTS)[ProductKey]][]).map(([key, p]) => ({
    key, audience: p.audience, label: p.label, amount: p.amount, units: p.units, plan: p.plan, listPrice: listPrice(p), perUnit: Math.round(p.amount / p.units),
  })),
});
