import assert from "node:assert/strict";
import { test } from "node:test";
import { areaLevel, isArea } from "@/domain/areas";
import { leadBalance, monthEnd } from "@/domain/leads";
import { initialsOf, maskName, maskOwner, sanitizeText, toWaNumber } from "@/domain/masking";
import { matchTutor } from "@/domain/matching";
import { LEAD_PRICE, listPrice, PRODUCTS } from "@/domain/pricing";
import type { LedgerEntry, TutorProfile } from "@/domain/types";

const T = Date.UTC(2026, 10, 30, 3, 0, 0); // Senin 30 Nov 2026 10:00 WIB
const entry = (over: Partial<LedgerEntry>): LedgerEntry => ({ id: Math.random().toString(), tutorId: "t", delta: 1, reason: "pack", refId: "r", expiresAt: null, createdAt: T, ...over });

test("harga mengikuti PRD §6", () => {
  assert.equal(LEAD_PRICE, 15_000);
  assert.deepEqual(Object.entries(PRODUCTS).map(([k, p]) => [k, p.amount, p.leads]), [["lead1", 15_000, 1], ["lead5", 65_000, 5], ["lead10", 125_000, 10], ["plan", 99_000, 8]]);
  assert.equal(listPrice(PRODUCTS.lead5), 75_000); // harga coret
  assert.equal(PRODUCTS.plan.plan, true);
});

test("saldo lead: jumlah kredit dikurangi pemakaian", () => {
  const e = [entry({ delta: 5 }), entry({ delta: -1, reason: "unlock", createdAt: T + 1 }), entry({ delta: -1, reason: "unlock", createdAt: T + 2 })];
  assert.equal(leadBalance(e, T + 10), 3);
});

test("lead Plan kedaluwarsa di akhir bulan, lead beli tidak", () => {
  const end = monthEnd(T);
  assert.equal(new Date(end).toISOString(), "2026-11-30T17:00:00.000Z"); // 1 Des 00:00 WIB
  const e = [entry({ delta: 8, reason: "plan", expiresAt: end }), entry({ delta: 3, reason: "pack" })];
  assert.equal(leadBalance(e, T), 11);
  assert.equal(leadBalance(e, end + 1), 3);
});

test("pemakaian mengambil lead Plan (yang segera kedaluwarsa) lebih dulu", () => {
  const end = monthEnd(T);
  const e = [entry({ delta: 2, reason: "pack" }), entry({ delta: 2, reason: "plan", expiresAt: end }), entry({ delta: -2, reason: "unlock", createdAt: T + 5 })];
  assert.equal(leadBalance(e, T + 10), 2);
  assert.equal(leadBalance(e, end + 1), 2, "lead beli yang tersisa tidak ikut hangus");
});

test("pemakaian tidak mengambil lead yang belum ada atau sudah kedaluwarsa saat itu", () => {
  const e = [entry({ delta: 1, createdAt: T + 100 }), entry({ delta: -1, reason: "unlock", createdAt: T })];
  assert.equal(leadBalance(e, T + 200), 1, "pemakaian sebelum kredit tidak memakan kredit berikutnya");
});

test("penyamaran nama dan pembersihan kontak", () => {
  assert.equal(maskName("Rizky Pratama"), "R•••• P••••••");
  assert.equal(initialsOf("rizky pratama"), "RP");
  assert.equal(maskOwner("Ibu Ratna"), "Ibu R•••");
  assert.equal(toWaNumber("0812-3456-7890"), "6281234567890");
  assert.equal(sanitizeText("wa 0812-3456-7890 ig @budi_les http://x.co"), "wa [disembunyikan] ig [disembunyikan] [disembunyikan]");
});

test("daerah: kecamatan L3 Jabodetabek, tanpa radius", () => {
  assert.ok(isArea("Tebet") && isArea("Cipayung (Depok)") && !isArea("Bandung"));
  assert.equal(areaLevel("Tebet", "Tebet"), 2);
  assert.equal(areaLevel("Tebet", "Kebayoran Baru"), 1, "satu kota");
  assert.equal(areaLevel("Tebet", "Beji"), 0, "beda kota");
});

const profile = (over: Partial<TutorProfile> = {}): TutorProfile => ({
  userId: "t", headline: "", subjects: ["Matematika"], levels: ["SMP"], curricula: ["Merdeka"], area: "Tebet", rate: 120_000, rateDurationMin: 90, experienceYears: 3,
  education: "S1", bio: "", achievements: "", teachesOffline: true, teachesOnline: true, gender: null, age: null, availableDays: [], verification: "unverified",
  planUntil: null, ratingAvg: 0, reviewCount: 0, studentsTaught: 0, completedAt: T, createdAt: T, updatedAt: T, ...over,
});
const filter = { area: "Tebet", subject: "Matematika", budget: 120_000, durationMin: 90 };

test("kecocokan: tarif dibandingkan per jam, bukan per sesi", () => {
  // Rp120rb/90 menit = Rp80rb/jam. Budget Rp80rb/60 menit cocok persis; Rp50rb/60 menit di luar toleransi 25%.
  assert.ok(matchTutor(profile(), { ...filter, budget: 80_000, durationMin: 60 }, T).ok);
  assert.ok(!matchTutor(profile(), { ...filter, budget: 50_000, durationMin: 60 }, T).ok);
});

test("kecocokan: CV belum lengkap atau ditangguhkan tidak tampil; Plan aktif dapat prioritas", () => {
  assert.ok(!matchTutor(profile({ completedAt: null }), filter, T).ok);
  assert.ok(!matchTutor(profile({ verification: "suspended" }), filter, T).ok);
  const plain = matchTutor(profile(), filter, T).score, plan = matchTutor(profile({ planUntil: T + DAYS }), filter, T).score;
  assert.ok(plan > plain);
});
const DAYS = 86_400_000;

test("kecocokan: mode online mengabaikan jarak; ke rumah butuh satu kota", () => {
  const far = profile({ area: "Beji" });
  assert.ok(matchTutor(far, { ...filter, mode: "online" }, T).ok);
  assert.ok(!matchTutor(far, { ...filter, mode: "offline" }, T).ok);
});
