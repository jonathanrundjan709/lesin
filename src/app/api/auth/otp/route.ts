import { api } from "@/app/api/_lib/http";
import { clientIp } from "@/app/api/_lib/client-ip";

/** Kirim ulang kode ke email yang belum diverifikasi. */
export const POST = api(async (c) => c.services.auth.resend(await c.body(), clientIp(c.req)));
