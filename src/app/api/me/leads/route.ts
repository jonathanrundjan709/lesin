import { api } from "@/app/api/_lib/http";

export const GET = api(async (c) => ({ status: await c.services.leads.status(c.me().id), history: await c.services.leads.history(c.me().id) }));
