import type { Clock, IdGenerator, Repositories, UnitOfWork } from "../ports";
import type { AppEvent, User } from "@/domain/types";

/** Dependensi dasar yang dibutuhkan semua service. */
export interface BaseDeps { uow: UnitOfWork; clock: Clock; ids: IdGenerator }

/** Rekam peristiwa funnel (pencarian, buka lead, pembelian) untuk metrik PRD §3. */
export async function recordEvent(repos: Repositories, d: BaseDeps, type: string, userId: string | null, payload: Record<string, unknown> = {}): Promise<void> {
  const e: AppEvent = { id: d.ids.next(), userId, type, payload, createdAt: d.clock.now() };
  await repos.events.insert(e);
}

export interface PublicUser { id: string; name: string; phone: string; isAdmin: boolean }
export const toPublicUser = (u: User): PublicUser => ({ id: u.id, name: u.name, phone: u.phone, isAdmin: u.isAdmin });
