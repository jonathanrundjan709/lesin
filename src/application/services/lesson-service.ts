import { fail } from "@/domain/errors";
import { sanitizeText, toWaNumber } from "@/domain/masking";
import type { Id, Lesson, ScheduleSlot, SessionNote, User } from "@/domain/types";
import type { Notifier, Repositories } from "../ports";
import { lessonInput, noteInput, parse } from "../validation";
import { type BaseDeps } from "./context";
import { TutorService } from "./tutor-service";

export interface LessonView {
  id: Id; child: string; subject: string; slots: ScheduleSlot[]; createdAt: number;
  tutor: { id: Id; name: string; waNumber: string }; seeker: { id: Id; name: string; waNumber: string };
  /** Tutor boleh menambah catatan; orang tua hanya membaca. */
  canAddNote: boolean; notes: SessionNote[];
}

const DAY_INDEX: Record<string, number> = { Min: 0, Sen: 1, Sel: 2, Rab: 3, Kam: 4, Jum: 5, Sab: 6 };
const WIB_OFFSET_MS = 7 * 3_600_000;

/** Lesson hub: jadwal mingguan, pengingat WhatsApp, dan catatan sesi dari tutor. Gratis untuk dua pihak (PRD §6). */
export class LessonService {
  constructor(private d: BaseDeps & { notifier: Notifier }) {}

  /** Dua pihak boleh membuat jadwal hanya bila sudah terhubung: tutor membuka permintaan si pencari, atau pencari membuka kontak tutor. */
  private async connected(r: Repositories, tutorId: Id, seekerId: Id): Promise<boolean> {
    return (await TutorService.revealedTutorIds(r, seekerId)).has(tutorId);
  }

  async create(userId: Id, raw: unknown): Promise<LessonView> {
    const input = parse(lessonInput, raw);
    return this.d.uow.run(async (r) => {
      const seekerId = input.seekerId && input.seekerId !== userId ? input.seekerId : userId;
      const tutorId = input.tutorId;
      if (userId !== tutorId && userId !== seekerId) return fail("forbidden", "Kamu bukan pihak dalam jadwal ini.");
      if (tutorId === seekerId) return fail("validation", "Tutor dan pencari harus berbeda.");
      if (!(await this.connected(r, tutorId, seekerId))) return fail("forbidden", "Jadwal hanya bisa dibuat setelah kontak tutor terbuka.");
      const lesson: Lesson = { id: this.d.ids.next(), tutorId, seekerId, child: sanitizeText(input.child), subject: input.subject, slots: input.slots as ScheduleSlot[], createdAt: this.d.clock.now() };
      await r.lessons.insert(lesson);
      return (await this.views(r, [lesson], userId))[0];
    });
  }

  async list(userId: Id): Promise<LessonView[]> {
    return this.d.uow.run(async (r) => this.views(r, (await r.lessons.byParticipant(userId)).sort((a, b) => b.createdAt - a.createdAt), userId));
  }

  /** Catatan sesi: topik dan pemahaman 1–5, hanya oleh tutor pengajar. */
  async addNote(tutorId: Id, lessonId: Id, raw: unknown): Promise<SessionNote> {
    const input = parse(noteInput, raw);
    return this.d.uow.run(async (r) => {
      const lesson = await r.lessons.byId(lessonId);
      if (!lesson) return fail("not_found", "Jadwal tidak ditemukan.");
      if (lesson.tutorId !== tutorId) return fail("forbidden", "Hanya tutor pengajar yang bisa menulis catatan.");
      const note: SessionNote = { id: this.d.ids.next(), lessonId, topic: sanitizeText(input.topic), understanding: input.understanding as SessionNote["understanding"], createdAt: this.d.clock.now() };
      await r.lessons.insertNote(note);
      return note;
    });
  }

  /** Job terjadwal: kirim pengingat WhatsApp ke dua pihak untuk sesi yang mulai dalam `windowMin` menit. Satu kali per sesi. */
  async sendReminders(windowMin = 24 * 60): Promise<number> {
    const now = this.d.clock.now();
    return this.d.uow.run(async (r) => {
      let sent = 0;
      for (const lesson of await r.lessons.all()) {
        for (const slot of lesson.slots) {
          const start = nextOccurrence(slot, now);
          if (start - now > windowMin * 60_000) continue;
          const key = `reminder:${lesson.id}:${slot.day}:${new Date(start).toISOString().slice(0, 10)}`;
          const fresh = await r.events.insertOnce({ id: this.d.ids.next(), userId: null, type: "reminder", payload: { lessonId: lesson.id }, createdAt: now }, key);
          if (!fresh) continue;
          const users = await r.users.byIds([lesson.tutorId, lesson.seekerId]);
          const msg = (to: User) => `Halo ${to.name.split(" ")[0]}, pengingat les ${lesson.subject} (${lesson.child}) ${slot.day} pukul ${slot.time.replace(":", ".")}. Sampai jumpa!`;
          for (const u of users) if (u.phone) await this.d.notifier.send(toWaNumber(u.phone), msg(u));
          sent++;
        }
      }
      return sent;
    });
  }

  private async views(r: Repositories, lessons: Lesson[], viewerId: Id): Promise<LessonView[]> {
    const users = new Map((await r.users.byIds([...new Set(lessons.flatMap((l) => [l.tutorId, l.seekerId]))])).map((u) => [u.id, u]));
    const notes = await r.lessons.notesByLessons(lessons.map((l) => l.id));
    const party = (id: Id) => { const u = users.get(id); return { id, name: u?.name ?? "Pengguna", waNumber: u?.phone ? toWaNumber(u.phone) : "" }; };
    return lessons.map((l) => ({
      id: l.id, child: l.child, subject: l.subject, slots: l.slots, createdAt: l.createdAt, tutor: party(l.tutorId), seeker: party(l.seekerId),
      canAddNote: viewerId === l.tutorId, notes: notes.filter((n) => n.lessonId === l.id).sort((a, b) => b.createdAt - a.createdAt),
    }));
  }
}

/** Waktu mulai sesi mingguan berikutnya (WIB) yang >= now. */
export function nextOccurrence(slot: ScheduleSlot, now: number): number {
  const [h, m] = slot.time.split(":").map(Number);
  const wib = new Date(now + WIB_OFFSET_MS);
  const base = Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate(), h, m) - WIB_OFFSET_MS;
  let delta = (DAY_INDEX[slot.day] - wib.getUTCDay() + 7) % 7;
  if (delta === 0 && base < now) delta = 7;
  return base + delta * 86_400_000;
}
