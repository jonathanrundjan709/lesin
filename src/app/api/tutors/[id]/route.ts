import { api, queryObject } from "@/app/api/_lib/http";

export const GET = api<{ id: string }>(async (c) => {
  const q = queryObject(c.req, ["budget", "durationMin"]);
  const ctx = typeof q.area === "string" ? { area: q.area, budget: Number(q.budget) || 400_000, durationMin: Number(q.durationMin) || 90 } : undefined;
  return { tutor: await c.services.tutors.get(c.user?.id ?? null, c.params.id, ctx) };
});
