import { api } from "@/app/api/_lib/http";

/** Tambah nomor WhatsApp (wajib). Memberi masa percobaan sekali per nomor. */
export const POST = api(async (c) => c.services.auth.setPhone(c.me().id, await c.body()));
