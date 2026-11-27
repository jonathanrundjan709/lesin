import { NextRequest, NextResponse } from "next/server";
import { db, addNote } from "@/lib/store";
export function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams; const tid = p.get("tutorId"); const pid = p.get("parentId");
  return NextResponse.json(db().lessons.filter((l) => (tid ? l.tutorId === tid : l.parentId === pid)).map((l) => ({ ...l, tutorName: db().tutors.find((t) => t.id === l.tutorId)?.name })));
}
export async function POST(req: NextRequest) {
  const b = await req.json();
  try { return NextResponse.json(addNote(b.lessonId, String(b.topic ?? ""), b.understanding)); } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }
}
