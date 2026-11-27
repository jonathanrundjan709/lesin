import { api, queryObject } from "@/app/api/_lib/http";

export const GET = api(async (c) => ({ tutors: await c.services.tutors.search(c.user?.id ?? null, queryObject(c.req, ["budget", "durationMin"])) }));
