import { NextRequest, NextResponse } from "next/server";
import { handleWebhook, sign, db } from "@/lib/store";
export async function POST(req: NextRequest) {
  const raw = await req.text();
  try { return NextResponse.json(handleWebhook(raw, req.headers.get("x-signature") ?? "")); }
  catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }
}
// Dev-only: simulates the gateway paying an order (what a real QRIS scan would trigger).
export async function PUT(req: NextRequest) {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "disabled" }, { status: 404 });
  const { orderId } = await req.json(); const o = db().orders.find((x) => x.id === orderId);
  if (!o) return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
  const body = JSON.stringify({ eventId: crypto.randomUUID(), orderId: o.id, amount: o.amount });
  try { return NextResponse.json(handleWebhook(body, sign(body))); } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }
}
