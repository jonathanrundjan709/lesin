import { api } from "@/app/api/_lib/http";

export const POST = api<{ id: string }>(async (c) => { await c.services.trust.report(c.me().id, c.params.id, await c.body()); return { ok: true }; });
