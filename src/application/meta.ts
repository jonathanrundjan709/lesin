import { AREA_TREE, COMING_SOON_CITIES } from "@/domain/areas";
import { CURRICULA, DAYS, DURATIONS, LEVELS, MAX_BUDGET, MAX_RATE, MIN_BUDGET, MIN_RATE, SUBJECTS } from "@/domain/catalog";
import { FEATURES, LEAD_PRICE, listPrice, MAX_RESPONDERS, MAX_TARGETS, PRODUCTS, REQUEST_DAYS } from "@/domain/pricing";
import type { ProductKey } from "@/domain/types";

/** Data referensi untuk UI: satu sumber kebenaran, jadi daftar di frontend tidak perlu disalin. */
export const buildMeta = (opts: { paymentSimulation: boolean }) => ({
  paymentSimulation: opts.paymentSimulation,
  areas: AREA_TREE, comingSoon: COMING_SOON_CITIES,
  subjects: SUBJECTS, levels: LEVELS, curricula: CURRICULA, days: DAYS, durations: DURATIONS,
  limits: { minBudget: MIN_BUDGET, maxBudget: MAX_BUDGET, minRate: MIN_RATE, maxRate: MAX_RATE, maxTargets: MAX_TARGETS, maxResponders: MAX_RESPONDERS, requestDays: REQUEST_DAYS, leadPrice: LEAD_PRICE },
  features: FEATURES,
  products: (Object.entries(PRODUCTS) as [ProductKey, (typeof PRODUCTS)[ProductKey]][]).map(([key, p]) => ({
    key, label: p.label, amount: p.amount, leads: p.leads, plan: p.plan, listPrice: listPrice(p), perLead: Math.round(p.amount / p.leads),
  })),
});
