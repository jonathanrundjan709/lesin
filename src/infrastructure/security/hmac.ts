import { createHmac, timingSafeEqual } from "node:crypto";
import type { SessionTokens, WebhookSigner } from "@/application/ports";
import type { Id, Millis } from "@/domain/types";

const hmac = (secret: string, data: string): string => createHmac("sha256", secret).update(data).digest("base64url");
const safeEqual = (a: string, b: string): boolean => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };

export const SESSION_TTL_MS = 30 * 86_400_000;

/** Token sesi: base64url(payload).tanda-tangan. Tanpa penyimpanan di server. */
export class HmacSessionTokens implements SessionTokens {
  constructor(private secret: string) {}

  issue(userId: Id, now: Millis): string {
    const payload = Buffer.from(JSON.stringify({ uid: userId, exp: now + SESSION_TTL_MS })).toString("base64url");
    return `${payload}.${hmac(this.secret, payload)}`;
  }

  verify(token: string, now: Millis): Id | null {
    const [payload, sig] = token.split(".");
    if (!payload || !sig || !safeEqual(sig, hmac(this.secret, payload))) return null;
    try {
      const { uid, exp } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { uid: string; exp: number };
      return typeof uid === "string" && exp > now ? uid : null;
    } catch { return null; }
  }
}

/** HMAC-SHA256 hex, seperti yang dikirim gateway pembayaran pada header x-signature. */
export class HmacWebhookSigner implements WebhookSigner {
  constructor(private secret: string) {}
  sign(body: string): string { return createHmac("sha256", this.secret).update(body).digest("hex"); }
  verify(body: string, signature: string): boolean { return safeEqual(this.sign(body), signature || ""); }
}
