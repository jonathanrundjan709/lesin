import { fail } from "@/domain/errors";
import { requestFitsTutor } from "@/domain/matching";
import { maskOwner, sanitizeText, toWaNumber } from "@/domain/masking";
import { FEATURES, MAX_RESPONDERS, REQUEST_DAYS } from "@/domain/pricing";
import type { Id, LessonRequest, ScheduleSlot, TutorProfile, Unlock } from "@/domain/types";
import { toTutorView, type TutorView } from "@/domain/views";
import { parse, requestInput } from "../validation";
import { type BaseDeps, recordEvent, requirePhone } from "./context";

const DAY_MS = 86_400_000;

export interface RequestView {
  id: Id; subject: string; level: string; curriculum: string; studentNote: string; area: string; mode: "offline" | "online";
  durationMin: number; budget: number; schedule: ScheduleSlot[]; notes: string; boostDays: number; createdAt: number; expiresAt: number;
}
export interface SeekerRequestView extends RequestView { active: boolean; targetTutorIds: Id[]; responders: TutorView[] }
export interface BoardRequestView extends RequestView {
  owner: string; contacted: number; slotsLeft: number; unlocked: boolean;
  fitsSubject: boolean; nearby: boolean; targeted: boolean;
  /** Terisi hanya setelah tutor ini membuka permintaannya. */
  contact: { seekerId: Id; name: string; phone: string; waNumber: string } | null;
}

const toView = (r: LessonRequest): RequestView => ({
  id: r.id, subject: r.subject, level: r.level, curriculum: r.curriculum, studentNote: r.studentNote, area: r.area, mode: r.mode,
  durationMin: r.durationMin, budget: r.budget, schedule: r.schedule, notes: r.notes, boostDays: r.boostDays, createdAt: r.createdAt, expiresAt: r.expiresAt,
});

/** Permintaan les gratis dari orang tua/murid, dan papan lowongan untuk tutor. */
export class RequestService {
  constructor(private d: BaseDeps) {}

  async create(seekerId: Id, raw: unknown): Promise<RequestView> {
    const input = parse(requestInput, raw);
    if (!FEATURES.requestBoost && input.boostDays > 0) fail("validation", "Boost postingan belum tersedia.");
    const now = this.d.clock.now();
    return this.d.uow.run(async (r) => {
      requirePhone((await r.users.byId(seekerId)) ?? fail("unauthorized", "Masuk dulu."));
      const targets = [...new Set(input.targetTutorIds)];
      for (const id of targets) {
        const p = await r.tutors.byUserId(id);
        if (!p || p.completedAt === null || p.verification === "suspended") fail("validation", "Salah satu tutor pilihan tidak tersedia.");
        if (id === seekerId) fail("validation", "Kamu tidak bisa mengajukan permintaan ke dirimu sendiri.");
      }
      const req: LessonRequest = {
        id: this.d.ids.next(), seekerId, subject: input.subject, level: input.level, curriculum: input.curriculum, studentNote: sanitizeText(input.studentNote),
        area: input.area, mode: input.mode, durationMin: input.durationMin, budget: input.budget, schedule: input.schedule as ScheduleSlot[], notes: sanitizeText(input.notes),
        targetTutorIds: targets, boostDays: input.boostDays, createdAt: now, expiresAt: now + REQUEST_DAYS * DAY_MS,
      };
      await r.requests.insert(req);
      await recordEvent(r, this.d, "request_created", seekerId, { requestId: req.id, targets: targets.length });
      return toView(req);
    });
  }

  /** Permintaan milik pencari, lengkap dengan tutor yang sudah merespons (identitas terbuka). */
  async mine(seekerId: Id): Promise<SeekerRequestView[]> {
    const now = this.d.clock.now();
    return this.d.uow.run(async (r) => {
      const reqs = (await r.requests.bySeeker(seekerId)).sort((a, b) => b.createdAt - a.createdAt);
      const unlocks = await r.unlocks.byRequestIds(reqs.map((x) => x.id));
      const tutorIds = [...new Set(unlocks.map((u) => u.tutorId))];
      const [users, profiles] = await Promise.all([r.users.byIds(tutorIds), Promise.all(tutorIds.map((id) => r.tutors.byUserId(id)))]);
      const userMap = new Map(users.map((u) => [u.id, u]));
      const profMap = new Map(profiles.flatMap((p) => (p ? [[p.userId, p] as const] : [])));
      return reqs.map((req) => ({
        ...toView(req), active: req.expiresAt > now, targetTutorIds: req.targetTutorIds,
        responders: unlocks.filter((u) => u.requestId === req.id).sort((a, b) => a.createdAt - b.createdAt).flatMap((u) => {
          const usr = userMap.get(u.tutorId), p = profMap.get(u.tutorId);
          return usr && p ? [toTutorView(usr, p, true, now)] : [];
        }),
      }));
    });
  }

  /** Papan lowongan: permintaan aktif dengan penanda kecocokan. Nama pemilik tersamar sampai dibuka. */
  async board(tutorId: Id): Promise<BoardRequestView[]> {
    const now = this.d.clock.now();
    return this.d.uow.run(async (r) => {
      const profile = await r.tutors.byUserId(tutorId);
      if (!profile || profile.completedAt === null) return fail("forbidden", "Lengkapi CV dulu untuk melihat lowongan.");
      const reqs = (await r.requests.active(now)).filter((x) => x.seekerId !== tutorId).sort((a, b) => b.createdAt - a.createdAt);
      const unlocks = await r.unlocks.byRequestIds(reqs.map((x) => x.id));
      const owners = new Map((await r.users.byIds([...new Set(reqs.map((x) => x.seekerId))])).map((u) => [u.id, u]));
      return reqs.map((req) => this.boardView(req, profile, unlocks.filter((u) => u.requestId === req.id), owners.get(req.seekerId)));
    });
  }

  async boardDetail(tutorId: Id, requestId: Id): Promise<BoardRequestView> {
    const now = this.d.clock.now();
    return this.d.uow.run(async (r) => {
      const profile = await r.tutors.byUserId(tutorId);
      if (!profile || profile.completedAt === null) return fail("forbidden", "Lengkapi CV dulu untuk melihat lowongan.");
      const req = await r.requests.byId(requestId);
      if (!req || req.expiresAt <= now) return fail("not_found", "Permintaan tidak aktif.");
      const [unlocks, owner] = await Promise.all([r.unlocks.byRequestIds([requestId]), r.users.byId(req.seekerId)]);
      return this.boardView(req, profile, unlocks, owner ?? undefined);
    });
  }

  private boardView(req: LessonRequest, p: TutorProfile, unlocks: Unlock[], owner?: { name: string; phone: string | null }): BoardRequestView {
    const mine = unlocks.some((u) => u.tutorId === p.userId);
    const name = owner?.name ?? "Pencari";
    return {
      ...toView(req), owner: mine ? name : maskOwner(name), contacted: unlocks.length, slotsLeft: Math.max(0, MAX_RESPONDERS - unlocks.length), unlocked: mine,
      ...requestFitsTutor(req, p),
      contact: mine && owner?.phone ? { seekerId: req.seekerId, name, phone: owner.phone, waNumber: toWaNumber(owner.phone) } : null,
    };
  }
}
