import { api } from "@/app/api/_lib/http";

/** Demo: meniru gateway yang membayar order. Dinonaktifkan dengan ALLOW_PAYMENT_SIMULATION=false. */
export const POST = api<{ id: string }>(async (c) => c.services.billing.simulatePayment(c.me().id, c.params.id));
