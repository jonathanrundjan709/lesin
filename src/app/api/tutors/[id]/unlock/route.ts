import { api } from "@/app/api/_lib/http";

/** Pencari memakai 1 kuota untuk membuka nama asli dan WhatsApp tutor. */
export const POST = api<{ id: string }>(async (c) => c.services.contacts.unlockTutor(c.me().id, c.params.id));
