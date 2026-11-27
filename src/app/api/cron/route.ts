import { api } from "@/app/api/_lib/http";
import { DomainError } from "@/domain/errors";

/** Dipanggil penjadwal (mis. Vercel Cron): order kedaluwarsa + pengingat sesi. Wajib `Authorization: Bearer $CRON_SECRET`. */
export const GET = api(async (c) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || c.req.headers.get("authorization") !== `Bearer ${secret}`) throw new DomainError("unauthorized", "Tidak diizinkan.");
  return c.services.jobs.runAll();
});
