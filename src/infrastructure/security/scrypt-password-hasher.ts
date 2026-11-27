import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import type { PasswordHasher } from "@/application/ports";

const KEY_LEN = 32;
const derive = (password: string, salt: Buffer): Promise<Buffer> =>
  new Promise((res, rej) => scrypt(password, salt, KEY_LEN, (e, k) => (e ? rej(e) : res(k))));

/** scrypt dengan salt acak. Format: scrypt$<salt hex>$<hash hex>. */
export class ScryptPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    return `scrypt$${salt.toString("hex")}$${(await derive(password, salt)).toString("hex")}`;
  }

  async verify(password: string, stored: string): Promise<boolean> {
    const [scheme, saltHex, hashHex] = stored.split("$");
    if (scheme !== "scrypt" || !saltHex || !hashHex) { await derive(password, Buffer.alloc(16)); return false; }
    const expected = Buffer.from(hashHex, "hex");
    const actual = await derive(password, Buffer.from(saltHex, "hex"));
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}
