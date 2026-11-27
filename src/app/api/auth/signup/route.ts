import { api } from "@/app/api/_lib/http";
import { clientIp } from "@/app/api/_lib/client-ip";

/** Langkah 1: kirim kode ke email. Sesi baru terbit di /api/auth/verify. */
export const POST = api(async (c) => c.services.auth.signup(await c.body(), clientIp(c.req)));
