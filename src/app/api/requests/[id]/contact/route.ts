import { NextRequest, NextResponse } from "next/server";
import { contactRequest, leadBalance } from "@/lib/store";
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const { tutorId } = await req.json();
  try { const r = contactRequest(tutorId, id); return NextResponse.json({ ...r, balance: leadBalance(tutorId) }); }
  catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 402 }); }
}
