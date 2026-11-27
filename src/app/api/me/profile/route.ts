import { api } from "@/app/api/_lib/http";

/** CV tutor milik pengguna yang sedang masuk. */
export const GET = api(async (c) => ({ ...(await c.services.tutors.myProfile(c.me().id)), docs: await c.services.trust.myDocs(c.me().id) }));
export const PUT = api(async (c) => c.services.tutors.saveProfile(c.me().id, await c.body()));
