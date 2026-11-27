import { fail } from "@/domain/errors";
import { sanitizeText } from "@/domain/masking";
import type { Id, Review } from "@/domain/types";
import { parse, reviewInput } from "../validation";
import { type BaseDeps } from "./context";
import { TutorService } from "./tutor-service";

export interface ReviewView { author: string; stars: number; text: string; createdAt: number; mine: boolean }

/** Ulasan hanya dari pencari yang kontak tutornya sudah terbuka (tutor membuka permintaannya). */
export class ReviewService {
  constructor(private d: BaseDeps) {}

  async submit(seekerId: Id, tutorId: Id, raw: unknown): Promise<ReviewView> {
    const input = parse(reviewInput, raw);
    const now = this.d.clock.now();
    return this.d.uow.run(async (r) => {
      if (!(await TutorService.revealedTutorIds(r, seekerId)).has(tutorId)) return fail("forbidden", "Ulasan hanya bisa ditulis setelah tutor merespons permintaanmu.");
      const profile = (await r.tutors.lockByUserId(tutorId)) ?? fail("not_found", "Tutor tidak ditemukan.");
      const prev = await r.reviews.get(tutorId, seekerId);
      const review: Review = { id: prev?.id ?? this.d.ids.next(), tutorId, seekerId, stars: input.stars as Review["stars"], text: sanitizeText(input.text), createdAt: now };
      await r.reviews.upsert(review);
      // Rata-rata diperbarui bertahap supaya statistik awal (seed) ikut terhitung.
      const count = prev ? profile.reviewCount : profile.reviewCount + 1;
      const sum = profile.ratingAvg * profile.reviewCount - (prev?.stars ?? 0) + input.stars;
      await r.tutors.upsert({ ...profile, reviewCount: count, ratingAvg: Math.round((sum / count) * 10) / 10, updatedAt: now });
      return { author: "Kamu", stars: input.stars, text: review.text, createdAt: now, mine: true };
    });
  }

  async list(viewerId: Id | null, tutorId: Id): Promise<ReviewView[]> {
    return this.d.uow.run(async (r) => {
      const reviews = (await r.reviews.byTutor(tutorId)).sort((a, b) => b.createdAt - a.createdAt);
      const users = new Map((await r.users.byIds([...new Set(reviews.map((x) => x.seekerId))])).map((u) => [u.id, u]));
      return reviews.map((v) => {
        const name = users.get(v.seekerId)?.name ?? "Pengguna";
        const [first, ...rest] = name.split(/\s+/);
        return { author: v.seekerId === viewerId ? "Kamu" : rest.length ? `${first} ${rest[0][0]}.` : first, stars: v.stars, text: v.text, createdAt: v.createdAt, mine: v.seekerId === viewerId };
      });
    });
  }
}
