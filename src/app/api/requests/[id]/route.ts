import { api } from "@/app/api/_lib/http";

export const GET = api<{ id: string }>(async (c) => ({ request: await c.services.requests.boardDetail(c.me().id, c.params.id) }));
