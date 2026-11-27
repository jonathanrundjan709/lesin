import { api } from "@/app/api/_lib/http";

export const GET = api(async (c) => c.services.trust.queue(c.me().id));
