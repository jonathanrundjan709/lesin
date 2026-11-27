import { NextRequest, NextResponse } from "next/server";
import { db, leadBalance } from "@/lib/store";
export function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("tutorId") ?? ""; const t = db().tutors.find((x) => x.id === id);
  if (!t) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ id: t.id, name: t.name, area: t.area, subjects: t.subjects, balance: leadBalance(id), plan: t.plan });
}
