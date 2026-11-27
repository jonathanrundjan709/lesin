import { api } from "@/app/api/_lib/http";

export const POST = api<{ id: string }>(async (c) => ({ note: await c.services.lessons.addNote(c.me().id, c.params.id, await c.body()) }));
