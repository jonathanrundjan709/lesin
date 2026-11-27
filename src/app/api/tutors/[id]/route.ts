import { api, queryObject } from "@/app/api/_lib/http";

/** CV lengkap hanya untuk pengguna yang sudah masuk. Daftar hasil pencarian (tersamar) tetap publik. */
export const GET = api<{ id: string }>(async (c) => {
  const viewer = c.me();
  const q = queryObject(c.req, ["budget", "durationMin"]);
  const ctx = typeof q.area === "string" ? { area: q.area, budget: Number(q.budget) || 400_000, durationMin: Number(q.durationMin) || 90 } : undefined;
  return { tutor: await c.services.tutors.get(viewer.id, c.params.id, ctx) };
});
