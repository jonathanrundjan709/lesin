import { NextResponse } from "next/server";
import { api, setSession } from "@/app/api/_lib/http";
import { clientIp } from "@/app/api/_lib/client-ip";

export const POST = api(async (c) => {
  const { user, token } = await c.services.auth.login(await c.body(), clientIp(c.req));
  return setSession(NextResponse.json({ user }), token);
});
