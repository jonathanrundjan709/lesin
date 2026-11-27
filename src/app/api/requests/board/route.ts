import { api } from "@/app/api/_lib/http";

/** Papan lowongan untuk tutor. */
export const GET = api(async (c) => ({ requests: await c.services.requests.board(c.me().id) }));
