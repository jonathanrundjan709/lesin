import { NextResponse } from "next/server";
import { api, clearSession, setSession } from "@/app/api/_lib/http";

export const POST = api(async (c) => {
  const { user, token } = await c.services.auth.signup(await c.body());
  return setSession(NextResponse.json({ user }), token);
});
