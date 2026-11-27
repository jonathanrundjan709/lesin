import { api } from "@/app/api/_lib/http";

/** Orang tua/murid membuat permintaan les (gratis). */
export const POST = api(async (c) => ({ request: await c.services.requests.create(c.me().id, await c.body()) }));
