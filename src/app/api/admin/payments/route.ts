import { api } from "@/app/api/_lib/http";

/** Pembayaran manual yang menunggu konfirmasi admin. */
export const GET = api(async (c) => ({ payments: await c.services.billing.pendingPayments(c.me().id) }));
