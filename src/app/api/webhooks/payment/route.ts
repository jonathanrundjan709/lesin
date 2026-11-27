import { api } from "@/app/api/_lib/http";

/** Satu-satunya jalur yang membuat order lunas: body mentah + header x-signature (HMAC-SHA256). */
export const POST = api(async (c) => c.services.billing.handleWebhook(await c.req.text(), c.req.headers.get("x-signature") ?? ""), { skipOriginCheck: true });
