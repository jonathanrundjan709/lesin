import { NextResponse } from "next/server";
import { api, setSession } from "@/app/api/_lib/http";

/** Langkah 2: kode email benar -> akun aktif dan sesi terbit. */
export const POST = api(async (c) => {
  const { user, token } = await c.services.auth.verify(await c.body());
  return setSession(NextResponse.json({ user }), token);
});
