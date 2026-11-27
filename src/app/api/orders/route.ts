import { api } from "@/app/api/_lib/http";

export const POST = api(async (c) => {
  const b = (await c.body()) as { product?: string; key?: string };
  return { order: await c.services.billing.createOrder(c.me().id, String(b.product ?? ""), String(b.key ?? "")) };
});
