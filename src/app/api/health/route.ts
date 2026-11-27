import { api } from "@/app/api/_lib/http";

export const GET = api(async ({ container }) => ({ ok: true, storage: container.mode }));
