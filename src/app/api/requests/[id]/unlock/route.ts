import { api } from "@/app/api/_lib/http";

/** Tutor membayar 1 lead untuk membuka WhatsApp pemilik permintaan. */
export const POST = api<{ id: string }>(async (c) => c.services.leads.unlock(c.me().id, c.params.id));
