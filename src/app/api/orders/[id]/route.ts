import { api } from "@/app/api/_lib/http";

export const GET = api<{ id: string }>(async (c) => ({ order: await c.services.billing.getOrder(c.me().id, c.params.id) }));
