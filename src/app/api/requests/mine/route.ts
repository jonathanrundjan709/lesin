import { api } from "@/app/api/_lib/http";

export const GET = api(async (c) => ({ requests: await c.services.requests.mine(c.me().id) }));
