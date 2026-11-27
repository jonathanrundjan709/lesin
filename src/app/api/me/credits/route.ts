import { api } from "@/app/api/_lib/http";

/** Kuota buka kontak pencari: trial 7 hari + paket. Riwayat berisi trial, pembelian, dan pemakaian. */
export const GET = api(async (c) => ({ status: await c.services.contacts.status(c.me().id), history: await c.services.contacts.history(c.me().id) }));
