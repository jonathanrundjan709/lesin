import { api } from "@/app/api/_lib/http";

export const POST = api(async (c) => {
  const { kind } = (await c.body()) as { kind?: "id" | "skill" };
  return { doc: await c.services.trust.submitVerification(c.me().id, kind as "id" | "skill") };
});
