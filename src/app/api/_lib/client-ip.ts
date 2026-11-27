import type { NextRequest } from "next/server";

/** Alamat IP peminta (di balik proxy Vercel), dipakai hanya untuk membatasi frekuensi permintaan OTP. */
export const clientIp = (req: NextRequest): string => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";
