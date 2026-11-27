import { NextResponse } from "next/server";
import { api, clearSession, setSession } from "@/app/api/_lib/http";

export const POST = api(async () => clearSession(NextResponse.json({ ok: true })));
