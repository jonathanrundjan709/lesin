import { NextRequest, NextResponse } from "next/server";
import { createOrder, PRODUCTS, ProductKey } from "@/lib/store";
export async function POST(req: NextRequest) {
  const b = await req.json();
  if (!(b.product in PRODUCTS)) return NextResponse.json({ error: "Produk tidak dikenal" }, { status: 400 });
  const o = createOrder(b.tutorId, b.product as ProductKey, b.key || crypto.randomUUID());
  return NextResponse.json({ order: o, qris: `QRIS-SIM-${o.id.slice(0, 8)}` });
}
