import { api } from "@/app/api/_lib/http";

export const GET = api<{ id: string }>(async (c) => ({ reviews: await c.services.reviews.list(c.me().id, c.params.id) }));
export const POST = api<{ id: string }>(async (c) => ({ review: await c.services.reviews.submit(c.me().id, c.params.id, await c.body()) }));
