import { api } from "@/app/api/_lib/http";

/** Tutor menyetujui (POST) atau mencabut (DELETE) pembukaan nama dan WhatsApp-nya kepada pencari. */
export const POST = api(async (c) => c.services.tutors.setConsent(c.me().id, true));
export const DELETE = api(async (c) => c.services.tutors.setConsent(c.me().id, false));
