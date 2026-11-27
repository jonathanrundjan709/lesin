import { NextRequest, NextResponse } from "next/server";
import type { Services } from "@/application/services";
import { DomainError } from "@/domain/errors";
import type { User } from "@/domain/types";
import { getContainer, type Container } from "@/infrastructure/container";

export const SESSION_COOKIE = "lesin_session";
const MAX_AGE_S = 30 * 86_400;

export interface Ctx<P> {
  req: NextRequest; services: Services; container: Container; params: P;
  /** Pengguna dari cookie sesi (null bila tamu). */
  user: User | null;
  /** Pengguna yang wajib ada; melempar 401 bila tamu. */
  me(): User;
  body(): Promise<unknown>;
}
type Handler<P> = (c: Ctx<P>) => Promise<unknown>;
type RouteCtx<P> = { params: Promise<P> };

export const setSession = (res: NextResponse, token: string): NextResponse => {
  res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE_S });
  return res;
};
export const clearSession = (res: NextResponse): NextResponse => { res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 }); return res; };

/** Permintaan yang mengubah data harus berasal dari situs ini (perlindungan CSRF tambahan di atas SameSite=Lax). */
function assertSameOrigin(req: NextRequest): void {
  if (req.method === "GET" || req.method === "HEAD") return;
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) throw new DomainError("forbidden", "Permintaan lintas situs ditolak.");
}

/**
 * Pembungkus controller: menyiapkan service, pengguna, dan memetakan galat domain ke respons JSON.
 * Controller hanya menerjemahkan HTTP <-> service; tidak ada logika bisnis di sini.
 */
export function api<P = object>(handler: Handler<P>, opts: { skipOriginCheck?: boolean } = {}) {
  return async (req: NextRequest, rc: RouteCtx<P>): Promise<Response> => {
    try {
      if (!opts.skipOriginCheck) assertSameOrigin(req);
      const container = await getContainer();
      const user = await container.services.auth.authenticate(req.cookies.get(SESSION_COOKIE)?.value);
      const ctx: Ctx<P> = {
        req, container, services: container.services, user, params: await rc.params,
        me() { if (!user) throw new DomainError("unauthorized", "Masuk dulu untuk melanjutkan."); return user; },
        async body() { try { return await req.json(); } catch { throw new DomainError("validation", "Body harus berupa JSON."); } },
      };
      const out = await handler(ctx);
      const res = out instanceof Response ? out : NextResponse.json(out ?? { ok: true });
      res.headers.set("Cache-Control", "no-store");
      return res;
    } catch (e) {
      if (e instanceof DomainError) return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
      console.error("[api]", e);
      return NextResponse.json({ error: "Terjadi kesalahan di server.", code: "internal" }, { status: 500 });
    }
  };
}

/** Ubah query string menjadi objek; angka diubah hanya untuk kunci yang disebut. */
export function queryObject(req: NextRequest, numeric: string[] = []): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  req.nextUrl.searchParams.forEach((v, k) => { if (v !== "") out[k] = numeric.includes(k) ? Number(v) : v; });
  return out;
}
