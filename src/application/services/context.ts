import type { Clock, IdGenerator, Repositories, UnitOfWork } from "../ports";
import { fail } from "@/domain/errors";
import type { AppEvent, User } from "@/domain/types";

/** Dependensi dasar yang dibutuhkan semua service. */
export interface BaseDeps { uow: UnitOfWork; clock: Clock; ids: IdGenerator }

/** Rekam peristiwa funnel (pencarian, buka lead, pembelian) untuk metrik PRD §3. */
export async function recordEvent(repos: Repositories, d: BaseDeps, type: string, userId: string | null, payload: Record<string, unknown> = {}): Promise<void> {
  const e: AppEvent = { id: d.ids.next(), userId, type, payload, createdAt: d.clock.now() };
  await repos.events.insert(e);
}

export interface PublicUser { id: string; name: string; email: string | null; phone: string | null; isAdmin: boolean; needsPhone: boolean }
export const toPublicUser = (u: User): PublicUser => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, isAdmin: u.isAdmin, needsPhone: u.phone === null });

/**
 * Pagar nomor WhatsApp: aksi yang membuka kontak, memakai uang, atau menampilkan identitas butuh nomor yang terdaftar.
 * Nomor inilah yang membuat satu orang hanya mendapat satu masa percobaan.
 */
export function requirePhone(u: User): string {
  return u.phone ?? fail("unverified", "Tambahkan nomor WhatsApp dulu untuk melanjutkan.");
}
