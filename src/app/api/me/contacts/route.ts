import { api } from "@/app/api/_lib/http";

/** Tutor yang kontaknya sudah terbuka untuk pencari ini (kuota sendiri atau tutor merespons permintaan). */
export const GET = api(async (c) => ({ tutors: await c.services.contacts.revealedTutors(c.me().id) }));
