import { api } from "@/app/api/_lib/http";

export const POST = api<{ id: string }>(async (c) => {
  const { suspend } = (await c.body()) as { suspend?: boolean };
  await c.services.trust.resolveReport(c.me().id, c.params.id, Boolean(suspend));
  return { ok: true };
});
