import { fail } from "@/domain/errors";
import type { User } from "@/domain/types";
import type { PasswordHasher, SessionTokens } from "../ports";
import { loginInput, parse, signupInput } from "../validation";
import { trialEntry } from "./contact-service";
import { type BaseDeps, type PublicUser, toPublicUser } from "./context";

export interface AuthResult { user: PublicUser; token: string }

/** Daftar, masuk, dan membaca sesi. Satu nomor WhatsApp = satu akun. */
export class AuthService {
  constructor(private d: BaseDeps & { hasher: PasswordHasher; tokens: SessionTokens }) {}

  async signup(raw: unknown): Promise<AuthResult> {
    const input = parse(signupInput, raw);
    const passwordHash = await this.d.hasher.hash(input.password);
    const user = await this.d.uow.run(async (r) => {
      if (await r.users.byPhone(input.phone)) fail("conflict", "Nomor ini sudah terdaftar. Silakan masuk.");
      const u: User = { id: this.d.ids.next(), name: input.name, phone: input.phone, passwordHash, isAdmin: false, status: "active", createdAt: this.d.clock.now() };
      await r.users.insert(u);
      await r.ledger.insertOnce(trialEntry(u.id, u.createdAt)); // 7 hari gratis, maks. 10 buka kontak
      return u;
    });
    return { user: toPublicUser(user), token: this.d.tokens.issue(user.id, this.d.clock.now()) };
  }

  async login(raw: unknown): Promise<AuthResult> {
    const input = parse(loginInput, raw);
    const user = await this.d.uow.run((r) => r.users.byPhone(input.phone));
    // Selalu menghitung hash agar waktu respons tidak membocorkan apakah nomor terdaftar.
    const ok = await this.d.hasher.verify(input.password, user?.passwordHash ?? "scrypt$00$00");
    if (!user || !ok) return fail("unauthorized", "Nomor atau password salah.");
    if (user.status !== "active") return fail("forbidden", "Akun ini dinonaktifkan.");
    return { user: toPublicUser(user), token: this.d.tokens.issue(user.id, this.d.clock.now()) };
  }

  /** Pengguna dari token sesi, atau null. */
  async authenticate(token: string | undefined): Promise<User | null> {
    if (!token) return null;
    const id = this.d.tokens.verify(token, this.d.clock.now());
    if (!id) return null;
    const u = await this.d.uow.run((r) => r.users.byId(id));
    return u && u.status === "active" ? u : null;
  }
}
