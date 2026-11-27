import { fail } from "@/domain/errors";
import { sanitizeText } from "@/domain/masking";
import type { DocKind, Id, Report, VerificationDoc } from "@/domain/types";
import type { Repositories } from "../ports";
import { parse, reportInput } from "../validation";
import { type BaseDeps, recordEvent } from "./context";
import { TutorService } from "./tutor-service";

export interface AdminQueue { verifications: (VerificationDoc & { tutorName: string })[]; reports: (Report & { tutorName: string; reporterName: string })[] }

/**
 * Trust & safety: laporan, verifikasi identitas/keahlian, dan konsol admin.
 * Berkas KTP/KTM tidak disimpan di sini (penyimpanan privat terenkripsi menyusul); hanya status tinjauan.
 */
export class TrustService {
  constructor(private d: BaseDeps) {}

  /** Hanya pencari yang kontak tutornya sudah terbuka yang boleh melapor: mencegah laporan fiktif. */
  async report(reporterId: Id, tutorId: Id, raw: unknown): Promise<void> {
    const input = parse(reportInput, raw);
    await this.d.uow.run(async (r) => {
      if (!(await r.tutors.byUserId(tutorId))) return fail("not_found", "Tutor tidak ditemukan.");
      if (!(await TutorService.revealedTutorIds(r, reporterId)).has(tutorId)) return fail("forbidden", "Laporan hanya bisa dikirim setelah kontak tutor terbuka.");
      await r.reports.insert({ id: this.d.ids.next(), reporterId, tutorId, reason: sanitizeText(input.reason), status: "open", createdAt: this.d.clock.now() });
      await recordEvent(r, this.d, "report", reporterId, { tutorId });
    });
  }

  /** Tutor mengirim dokumen untuk ditinjau. Status profil menjadi "pending" sampai admin memutuskan. */
  async submitVerification(tutorId: Id, kind: DocKind): Promise<VerificationDoc> {
    if (kind !== "id" && kind !== "skill") fail("validation", "Jenis dokumen tidak dikenal.");
    return this.d.uow.run(async (r) => {
      const p = (await r.tutors.lockByUserId(tutorId)) ?? fail("forbidden", "Lengkapi CV dulu.");
      const doc: VerificationDoc = { id: this.d.ids.next(), tutorId, kind, status: "pending", reviewedBy: null, createdAt: this.d.clock.now() };
      await r.verifications.insert(doc);
      if (kind === "id" && p.verification === "unverified") await r.tutors.upsert({ ...p, verification: "pending", updatedAt: this.d.clock.now() });
      return doc;
    });
  }

  /** Jenis dokumen yang sudah dikirim tutor dan statusnya. Isi dokumen tidak pernah dikembalikan. */
  async myDocs(tutorId: Id): Promise<{ kind: DocKind; status: VerificationDoc["status"] }[]> {
    const docs = await this.d.uow.run((r) => r.verifications.byTutor(tutorId));
    return docs.sort((a, b) => a.createdAt - b.createdAt).map((x) => ({ kind: x.kind, status: x.status }));
  }

  /* ---------- admin ---------- */
  private async requireAdmin(r: Repositories, adminId: Id): Promise<void> {
    const u = await r.users.byId(adminId);
    if (!u?.isAdmin) fail("forbidden", "Hanya admin.");
  }

  async queue(adminId: Id): Promise<AdminQueue> {
    return this.d.uow.run(async (r) => {
      await this.requireAdmin(r, adminId);
      const [docs, reports] = await Promise.all([r.verifications.pending(), r.reports.open()]);
      const users = new Map((await r.users.byIds([...new Set([...docs.map((x) => x.tutorId), ...reports.flatMap((x) => [x.tutorId, x.reporterId])])])).map((u) => [u.id, u.name]));
      return {
        verifications: docs.map((x) => ({ ...x, tutorName: users.get(x.tutorId) ?? "?" })),
        reports: reports.map((x) => ({ ...x, tutorName: users.get(x.tutorId) ?? "?", reporterName: users.get(x.reporterId) ?? "?" })),
      };
    });
  }

  async decideVerification(adminId: Id, docId: Id, approve: boolean): Promise<void> {
    await this.d.uow.run(async (r) => {
      await this.requireAdmin(r, adminId);
      const doc = (await r.verifications.byId(docId)) ?? fail("not_found", "Dokumen tidak ditemukan.");
      await r.verifications.update({ ...doc, status: approve ? "approved" : "rejected", reviewedBy: adminId });
      const p = await r.tutors.lockByUserId(doc.tutorId);
      if (p && doc.kind === "id" && p.verification !== "suspended") await r.tutors.upsert({ ...p, verification: approve ? "verified" : "unverified", updatedAt: this.d.clock.now() });
    });
  }

  async resolveReport(adminId: Id, reportId: Id, suspendTutor: boolean): Promise<void> {
    await this.d.uow.run(async (r) => {
      await this.requireAdmin(r, adminId);
      const rep = (await r.reports.byId(reportId)) ?? fail("not_found", "Laporan tidak ditemukan.");
      await r.reports.update({ ...rep, status: "resolved" });
      if (suspendTutor) {
        const p = await r.tutors.lockByUserId(rep.tutorId);
        if (p) await r.tutors.upsert({ ...p, verification: "suspended", updatedAt: this.d.clock.now() });
      }
    });
  }
}
