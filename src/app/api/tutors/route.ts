import { NextRequest, NextResponse } from "next/server";
import { searchTutors } from "@/lib/store";
export function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  return NextResponse.json(searchTutors({ area: p.get("area") || undefined, subject: p.get("subject") || undefined, level: p.get("level") || undefined, mode: p.get("mode") || undefined }));
}
