import { api } from "@/app/api/_lib/http";

export const GET = api(async (c) => ({ lessons: await c.services.lessons.list(c.me().id) }));
export const POST = api(async (c) => ({ lesson: await c.services.lessons.create(c.me().id, await c.body()) }));
