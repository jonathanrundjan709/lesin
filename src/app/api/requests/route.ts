import { NextRequest, NextResponse } from "next/server";
import { createRequest, tutorRequests } from "@/lib/store";
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const r = createRequest({ parentId: "p-demo", parentName: String(b.parentName || "Orang tua").slice(0, 60), whatsapp: String(b.whatsapp || "").replace(/\D/g, ""), subject: b.subject, level: b.level, area: b.area, note: String(b.note || "").slice(0, 400), tutorIds: b.tutorIds ?? [] });
    return NextResponse.json({ id: r.id, expiresAt: r.expiresAt });
  } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }
}
export function GET(req: NextRequest) { return NextResponse.json(tutorRequests(req.nextUrl.searchParams.get("tutorId") ?? "")); }
