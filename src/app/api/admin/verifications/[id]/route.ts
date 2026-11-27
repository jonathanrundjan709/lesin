import { api } from "@/app/api/_lib/http";

export const POST = api<{ id: string }>(async (c) => {
  const { approve } = (await c.body()) as { approve?: boolean };
  await c.services.trust.decideVerification(c.me().id, c.params.id, Boolean(approve));
  return { ok: true };
});
