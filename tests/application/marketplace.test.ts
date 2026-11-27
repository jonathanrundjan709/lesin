import assert from "node:assert/strict";
import { after, describe, test } from "node:test";
import { DomainError } from "@/domain/errors";
import { ADAPTERS, buyAndPay, DAY, type Env, makeEnv, makeTutor, signup, validProfile, validRequest } from "../support/harness";

const rejects = (p: Promise<unknown>, code: string, msg?: RegExp) =>
  assert.rejects(p, (e: unknown) => e instanceof DomainError && e.code === code && (!msg || msg.test(e.message)));

for (const adapter of ADAPTERS) {
  describe(`backend (${adapter})`, () => {
    const envs: Env[] = [];
    const fresh = async () => { const e = await makeEnv(adapter); envs.push(e); return e; };
    after(async () => { for (const e of envs) await e.close(); });

    test("daftar, masuk, nomor kembar, password salah, token sesi", async () => {
      const env = await fresh(); const { auth } = env.services;
      const a = await auth.signup({ name: "Ibu Ratna", phone: "0812-1111-2222", password: "rahasia1" });
      assert.equal(a.user.phone, "081211112222");
      await rejects(auth.signup({ name: "Orang Lain", phone: "081211112222", password: "abcdef" }), "conflict", /sudah terdaftar/);
      await rejects(auth.signup({ name: "Ab", phone: "0812", password: "1" }), "validation");
      await rejects(auth.login({ phone: "081211112222", password: "salah" }), "unauthorized", /salah/);
      await rejects(auth.login({ phone: "081299990000", password: "rahasia1" }), "unauthorized");
      const l = await auth.login({ phone: "+62 812-1111-2222", password: "rahasia1" });
      assert.equal((await auth.authenticate(l.token))?.id, a.user.id);
      assert.equal(await auth.authenticate(l.token + "x"), null);
      env.clock.advance(31 * DAY);
      assert.equal(await auth.authenticate(l.token), null, "sesi kedaluwarsa 30 hari");
    });

    test("CV: wajib lengkap; teks bebas dibersihkan; Founding Tutor 2 lead sekali saja", async () => {
      const env = await fresh(); const { tutors, leads } = env.services;
      const u = await signup(env);
      await rejects(tutors.saveProfile(u.id, validProfile({ subjects: [] })), "validation", /mata pelajaran/);
      await rejects(tutors.saveProfile(u.id, validProfile({ education: "" })), "validation", /pendidikan/);
      await rejects(tutors.saveProfile(u.id, validProfile({ rate: 500_000 })), "validation", /Rp400.000/);
      const r = await tutors.saveProfile(u.id, validProfile({ bio: "Hubungi 0812-3456-7890 atau @budi_les" }));
      assert.equal(r.foundingGranted, true);
      assert.ok(!r.profile!.bio.includes("0812"), "nomor telepon disembunyikan");
      assert.equal((await leads.status(u.id)).leads, 2);
      await tutors.saveProfile(u.id, validProfile({ headline: "Baru" }));
      assert.equal((await leads.status(u.id)).leads, 2, "tidak dobel");
    });

    test("pencarian tidak pernah membocorkan nama asli, foto, atau WhatsApp", async () => {
      const env = await fresh();
      await makeTutor(env, { name: "Rizky Pratama" });
      const list = await env.services.tutors.search(null, { area: "Tebet", subject: "Matematika" });
      assert.equal(list.length, 1);
      const t = list[0], raw = JSON.stringify(list);
      assert.equal(t.masked, true); assert.equal(t.phone, null); assert.equal(t.waNumber, null);
      assert.ok(!raw.includes("Rizky") && !raw.includes("Pratama"), "nama asli tidak ada di payload");
      assert.ok(!raw.includes("0812"), "nomor tidak ada di payload");
    });

    test("alur inti: permintaan gratis → tutor buka 1 lead → identitas dua pihak terbuka", async () => {
      const env = await fresh(); const { requests, leads, tutors } = env.services;
      const tutor = await makeTutor(env, { name: "Rizky Pratama" });
      const parent = await signup(env, "Ibu Ratna");
      const req = await requests.create(parent.id, validRequest({ targetTutorIds: [tutor.user.id] }));

      // Orang tua: tutor masih tersamar sebelum merespons.
      assert.equal((await tutors.get(parent.id, tutor.user.id)).masked, true);
      // Tutor melihat permintaan dengan nama pemilik tersamar.
      const board = await requests.board(tutor.user.id);
      assert.equal(board.length, 1);
      assert.equal(board[0].unlocked, false); assert.equal(board[0].contact, null);
      assert.equal(board[0].owner, "Ibu R•••"); assert.equal(board[0].targeted, true);

      const res = await leads.unlock(tutor.user.id, req.id);
      assert.equal(res.charged, true); assert.equal(res.leads, 1); assert.equal(res.contact.name, "Ibu Ratna");
      assert.match(res.contact.waNumber, /^62812/);

      // Membuka lagi tidak dikenai biaya.
      const again = await leads.unlock(tutor.user.id, req.id);
      assert.equal(again.charged, false); assert.equal(again.leads, 1);

      // Sekarang orang tua melihat identitas tutor.
      const t = await tutors.get(parent.id, tutor.user.id);
      assert.equal(t.masked, false); assert.equal(t.name, "Rizky Pratama"); assert.ok(t.waNumber);
      const mine = await requests.mine(parent.id);
      assert.equal(mine[0].responders.length, 1); assert.equal(mine[0].responders[0].name, "Rizky Pratama");
      assert.equal((await requests.board(tutor.user.id))[0].contact?.name, "Ibu Ratna");
    });

    test("permintaan: maksimal 10 tutor, budget maks Rp400rb, boost ditunda, kedaluwarsa 14 hari", async () => {
      const env = await fresh(); const { requests } = env.services;
      const parent = await signup(env);
      const ts = []; for (let i = 0; i < 11; i++) ts.push(await makeTutor(env));
      await rejects(requests.create(parent.id, validRequest({ targetTutorIds: ts.map((t) => t.user.id) })), "validation", /maksimal 10/);
      await rejects(requests.create(parent.id, validRequest({ budget: 450_000 })), "validation", /400.000/);
      await rejects(requests.create(parent.id, validRequest({ boostDays: 7 })), "validation", /Boost/);
      await rejects(requests.create(parent.id, validRequest({ schedule: [] })), "validation", /hari/);
      await rejects(requests.create(parent.id, validRequest({ area: "Bandung" })), "validation");
      await rejects(requests.create(parent.id, validRequest({ targetTutorIds: ["tidak-ada"] })), "validation");
      const ok = await requests.create(parent.id, validRequest({ notes: "WA saya 0812-9999-8888" }));
      assert.ok(!(await requests.mine(parent.id))[0].notes.includes("0812"), "catatan dibersihkan");
      assert.equal(ok.expiresAt - ok.createdAt, 14 * DAY);
      env.clock.advance(15 * DAY);
      assert.equal((await requests.mine(parent.id))[0].active, false);
      assert.equal((await requests.board((await makeTutor(env)).user.id)).length, 0, "tidak tampil di papan setelah kedaluwarsa");
    });

    test("lead habis → diblokir; maksimal 10 tutor per permintaan; tidak bisa buka milik sendiri", async () => {
      const env = await fresh(); const { requests, leads, billing } = env.services;
      const parent = await signup(env);
      const req = await requests.create(parent.id, validRequest());
      const broke = await makeTutor(env);
      await env.uow.run(async (r) => { await r.ledger.insert({ id: "burn", userId: broke.user.id, kind: "lead", delta: -2, reason: "unlock", refId: "x", expiresAt: null, createdAt: env.clock.now() + 1 }); });
      await rejects(leads.unlock(broke.user.id, req.id), "payment_required", /Lead habis/);
      await rejects(leads.unlock(parent.id, req.id), "forbidden", /CV/);

      for (let i = 0; i < 10; i++) { const t = await makeTutor(env); await leads.unlock(t.user.id, req.id); }
      const eleventh = await makeTutor(env);
      await rejects(leads.unlock(eleventh.user.id, req.id), "conflict", /penuh/);
      assert.equal((await leads.status(eleventh.user.id)).leads, 2, "tidak dipotong saat penuh");
      assert.equal((await requests.board(eleventh.user.id))[0].slotsLeft, 0);
      void billing;
    });

    test("dua pembukaan bersamaan dengan 1 lead: hanya satu yang berhasil", async () => {
      const env = await fresh(); const { requests, leads } = env.services;
      const parent = await signup(env), tutor = await makeTutor(env);
      await env.uow.run(async (r) => { await r.ledger.insert({ id: "spend1", userId: tutor.user.id, kind: "lead", delta: -1, reason: "unlock", refId: "x", expiresAt: null, createdAt: env.clock.now() + 1 }); });
      const a = await requests.create(parent.id, validRequest()), b = await requests.create(parent.id, validRequest());
      const results = await Promise.allSettled([leads.unlock(tutor.user.id, a.id), leads.unlock(tutor.user.id, b.id)]);
      assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
      assert.equal((await leads.status(tutor.user.id)).leads, 0);
    });

    test("pembayaran: order idempoten; webhook hanya sah bila bertanda tangan, nominal cocok; tidak dobel", async () => {
      const env = await fresh(); const { billing, leads } = env.services;
      const tutor = await makeTutor(env);
      assert.deepEqual(billing.catalog().map((p) => [p.key, p.amount, p.units, p.listPrice]), [["lead1", 15_000, 1, 15_000], ["lead5", 65_000, 5, 75_000], ["lead10", 125_000, 10, 150_000], ["plan", 99_000, 8, 120_000],
        ["contact1", 8_000, 1, 8_000], ["contact5", 30_000, 5, 40_000], ["contact15", 75_000, 15, 120_000]]);
      await rejects(billing.createOrder(tutor.user.id, "lead99", "k"), "validation");
      const o = await billing.createOrder(tutor.user.id, "lead5", "kunci-1");
      assert.equal((await billing.createOrder(tutor.user.id, "lead5", "kunci-1")).id, o.id, "kunci sama → order sama");
      assert.match(o.qrisPayload, /^QRIS-/);

      const body = JSON.stringify({ eventId: "e1", orderId: o.id, amount: o.amount });
      await rejects(billing.handleWebhook(body, "palsu"), "unauthorized", /Signature/);
      assert.equal((await leads.status(tutor.user.id)).leads, 2, "tanpa signature valid, saldo tidak berubah");
      const bad = JSON.stringify({ eventId: "e2", orderId: o.id, amount: 1 });
      await rejects(billing.handleWebhook(bad, env.signer.sign(bad)), "validation", /Nominal/);
      assert.deepEqual(await billing.handleWebhook(body, env.signer.sign(body)), { ok: true });
      assert.equal((await leads.status(tutor.user.id)).leads, 7);
      assert.deepEqual(await billing.handleWebhook(body, env.signer.sign(body)), { duplicate: true });
      const replay = JSON.stringify({ eventId: "e3", orderId: o.id, amount: o.amount });
      assert.deepEqual(await billing.handleWebhook(replay, env.signer.sign(replay)), { duplicate: true }, "order lunas tidak diproses lagi");
      assert.equal((await leads.status(tutor.user.id)).leads, 7);
      assert.equal((await billing.getOrder(tutor.user.id, o.id)).status, "paid");
    });

    test("order kedaluwarsa setelah 30 menit dan tidak bisa dibayar", async () => {
      const env = await fresh(); const { billing, leads } = env.services;
      const tutor = await makeTutor(env);
      const o = await billing.createOrder(tutor.user.id, "lead1", "k-exp");
      env.clock.advance(31 * 60_000);
      assert.equal(await billing.expirePending(), 1);
      const body = JSON.stringify({ eventId: "late", orderId: o.id, amount: o.amount });
      await rejects(billing.handleWebhook(body, env.signer.sign(body)), "conflict", /kedaluwarsa/);
      assert.equal((await leads.status(tutor.user.id)).leads, 2);
    });

    test("Tutor Plan: 8 lead + badge Pro; lead Plan hangus di akhir bulan, lead beli tidak", async () => {
      const env = await fresh(); const { leads, tutors } = env.services;
      const tutor = await makeTutor(env);
      await buyAndPay(env, tutor.user.id, "lead1");
      await buyAndPay(env, tutor.user.id, "plan");
      const s = await leads.status(tutor.user.id);
      assert.equal(s.leads, 2 + 1 + 8); assert.equal(s.planActive, true);
      assert.equal((await tutors.get(null, tutor.user.id)).proBadge, true);
      env.clock.advance(2 * DAY); // 2 Des 2026, bulan baru
      const after = await leads.status(tutor.user.id);
      assert.equal(after.leads, 2 + 1, "8 lead Plan hangus; Founding dan lead beli tetap");
      assert.equal(after.planActive, false);
      assert.equal((await tutors.get(null, tutor.user.id)).proBadge, false);
    });

    test("Lesson hub: jadwal hanya setelah terhubung; catatan hanya oleh tutor; pengingat sekali per sesi", async () => {
      const env = await fresh(); const { requests, leads, lessons } = env.services;
      const tutor = await makeTutor(env, { name: "Rizky Pratama" }), parent = await signup(env, "Ibu Ratna"), stranger = await signup(env);
      const input = { tutorId: tutor.user.id, child: "Aksa", subject: "Matematika", slots: [{ day: "Sel", time: "15:00" }] };
      await rejects(lessons.create(parent.id, input), "forbidden", /kontak tutor terbuka/);
      const req = await requests.create(parent.id, validRequest());
      await leads.unlock(tutor.user.id, req.id);
      await rejects(lessons.create(stranger.id, { ...input, seekerId: parent.id }), "forbidden");
      const lesson = await lessons.create(parent.id, input);
      assert.equal(lesson.canAddNote, false);
      assert.equal((await lessons.list(tutor.user.id))[0].canAddNote, true);

      await rejects(lessons.addNote(parent.id, lesson.id, { topic: "PLSV", understanding: 3 }), "forbidden");
      await rejects(lessons.addNote(tutor.user.id, lesson.id, { topic: "PLSV", understanding: 9 }), "validation");
      await lessons.addNote(tutor.user.id, lesson.id, { topic: "Persamaan linear, hubungi 0812-3333-4444", understanding: 4 });
      const seen = (await lessons.list(parent.id))[0];
      assert.equal(seen.notes.length, 1); assert.ok(!seen.notes[0].topic.includes("0812"));

      // Hari ini Senin 10:00 WIB; sesi Selasa 15:00 WIB dimulai dalam < 24 jam? (29 jam) → belum
      assert.equal(await lessons.sendReminders(), 0);
      env.clock.advance(6 * 3_600_000); // Senin 16:00 → Selasa 15:00 = 23 jam
      assert.equal(await lessons.sendReminders(), 1);
      assert.equal(env.notifier.sent.length, 2, "ke tutor dan orang tua");
      assert.equal(await lessons.sendReminders(), 0, "tidak dikirim ulang");
    });

    test("ulasan hanya dari pencari yang tutornya sudah merespons; rata-rata diperbarui", async () => {
      const env = await fresh(); const { requests, leads, reviews, tutors } = env.services;
      const tutor = await makeTutor(env), parent = await signup(env, "Ibu Ratna");
      await rejects(reviews.submit(parent.id, tutor.user.id, { stars: 5, text: "Bagus sekali" }), "forbidden");
      const req = await requests.create(parent.id, validRequest());
      await leads.unlock(tutor.user.id, req.id);
      await reviews.submit(parent.id, tutor.user.id, { stars: 4, text: "Sabar dan tepat waktu" });
      assert.equal((await tutors.get(null, tutor.user.id)).rating, 4);
      await reviews.submit(parent.id, tutor.user.id, { stars: 5, text: "Makin bagus sekarang" });
      const t = await tutors.get(null, tutor.user.id);
      assert.equal(t.rating, 5); assert.equal(t.reviewCount, 1, "mengubah ulasan tidak menambah jumlah");
      assert.equal((await reviews.list(parent.id, tutor.user.id))[0].author, "Kamu");
      await rejects(reviews.submit(parent.id, tutor.user.id, { stars: 5, text: "x" }), "validation");
    });

    test("pencari baru: trial 7 hari berisi 10 kuota buka kontak, kedaluwarsa setelah 7 hari", async () => {
      const env = await fresh(); const { contacts } = env.services;
      const parent = await signup(env);
      const s = await contacts.status(parent.id);
      assert.equal(s.credits, 10); assert.equal(s.trialActive, true); assert.equal(s.trialLimit, 10);
      assert.equal(s.trialEndsAt, env.clock.now() + 7 * DAY);
      env.clock.advance(7 * DAY + 1000);
      const after = await contacts.status(parent.id);
      assert.equal(after.credits, 0); assert.equal(after.trialActive, false);
    });

    test("akun lama (dibuat sebelum fitur trial) mendapat trial sekali saat pertama dicek, tidak dobel", async () => {
      const env = await fresh(); const { contacts } = env.services;
      await env.uow.run(async (r) => { await r.users.insert({ id: "legacy", name: "Akun Lama", phone: "081200009999", passwordHash: "x", isAdmin: false, status: "active", createdAt: 1 }); });
      const first = await contacts.status("legacy");
      assert.equal(first.credits, 10); assert.equal(first.trialEndsAt, env.clock.now() + 7 * DAY);
      env.clock.advance(3 * DAY);
      const second = await contacts.status("legacy");
      assert.equal(second.credits, 10, "dipanggil lagi tidak menambah");
      assert.equal(second.trialEndsAt, first.trialEndsAt, "masa trial tidak diperpanjang");
    });

    test("pencari membuka kontak tutor dengan kuota: identitas terbuka, tutor tidak membayar, idempoten", async () => {
      const env = await fresh(); const { contacts, tutors, leads } = env.services;
      const tutor = await makeTutor(env, { name: "Rizky Pratama" }), parent = await signup(env, "Ibu Ratna");
      assert.equal((await tutors.get(parent.id, tutor.user.id)).masked, true);
      const before = (await leads.status(tutor.user.id)).leads;
      const r1 = await contacts.unlockTutor(parent.id, tutor.user.id);
      assert.equal(r1.charged, true); assert.equal(r1.status.credits, 9);
      assert.equal(r1.tutor.name, "Rizky Pratama"); assert.ok(r1.tutor.waNumber);
      const again = await contacts.unlockTutor(parent.id, tutor.user.id);
      assert.equal(again.charged, false); assert.equal(again.status.credits, 9, "buka ulang gratis");
      assert.equal((await tutors.get(parent.id, tutor.user.id)).masked, false);
      assert.equal((await leads.status(tutor.user.id)).leads, before, "lead tutor tidak terpakai");
      await rejects(contacts.unlockTutor(tutor.user.id, tutor.user.id), "validation", /sendiri/);
      await rejects(contacts.unlockTutor(parent.id, "tidak-ada"), "not_found");
    });

    test("trial: maksimal 10 kontak; setelah habis atau lewat 7 hari harus beli paket", async () => {
      const env = await fresh(); const { contacts, billing } = env.services;
      const parent = await signup(env), ts = [];
      for (let i = 0; i < 11; i++) ts.push(await makeTutor(env));
      for (let i = 0; i < 10; i++) await contacts.unlockTutor(parent.id, ts[i].user.id);
      await rejects(contacts.unlockTutor(parent.id, ts[10].user.id), "payment_required", /Kuota/);
      // beli paket 5 kontak lewat webhook bertanda tangan
      await buyAndPay(env, parent.id, "contact5");
      assert.equal((await contacts.status(parent.id)).credits, 5);
      const ok = await contacts.unlockTutor(parent.id, ts[10].user.id);
      assert.equal(ok.charged, true); assert.equal(ok.status.credits, 4);
      // seluruh kuota trial hangus setelah 7 hari, kuota beli tidak
      env.clock.advance(8 * DAY);
      assert.equal((await contacts.status(parent.id)).credits, 4);
      const fresh2 = await signup(env);
      env.clock.advance(8 * DAY);
      await rejects(contacts.unlockTutor(fresh2.id, ts[0].user.id), "payment_required", /Masa percobaan gratis sudah selesai/);
      void billing;
    });

    test("dua buka kontak bersamaan dengan 1 kuota: hanya satu yang berhasil", async () => {
      const env = await fresh(); const { contacts } = env.services;
      const parent = await signup(env), a = await makeTutor(env), b = await makeTutor(env);
      env.clock.advance(1);
      await env.uow.run(async (r) => { await r.ledger.insert({ id: "burn9", userId: parent.id, kind: "contact", delta: -9, reason: "unlock", refId: "x", expiresAt: null, createdAt: env.clock.now() }); });
      const res = await Promise.allSettled([contacts.unlockTutor(parent.id, a.user.id), contacts.unlockTutor(parent.id, b.user.id)]);
      assert.equal(res.filter((x) => x.status === "fulfilled").length, 1);
      assert.equal((await contacts.status(parent.id)).credits, 0);
    });

    test("pencari yang sudah membuka kontak boleh membuat jadwal, mengulas, dan melapor; paket kontak tidak butuh CV", async () => {
      const env = await fresh(); const { contacts, lessons, reviews, trust, billing } = env.services;
      const tutor = await makeTutor(env), parent = await signup(env, "Ibu Ratna");
      const slots = [{ day: "Sab", time: "09:00" }];
      await rejects(lessons.create(parent.id, { tutorId: tutor.user.id, child: "Aksa", subject: "Matematika", slots }), "forbidden", /kontak tutor terbuka/);
      await rejects(reviews.submit(parent.id, tutor.user.id, { stars: 5, text: "Bagus sekali" }), "forbidden");
      await rejects(trust.report(parent.id, tutor.user.id, { reason: "Meminta bayar di luar aplikasi" }), "forbidden");
      await contacts.unlockTutor(parent.id, tutor.user.id);
      await lessons.create(parent.id, { tutorId: tutor.user.id, child: "Aksa", subject: "Matematika", slots });
      await reviews.submit(parent.id, tutor.user.id, { stars: 5, text: "Bagus sekali" });
      await trust.report(parent.id, tutor.user.id, { reason: "Meminta bayar di luar aplikasi" });
      // pencari tanpa CV bisa beli paket kontak, tapi tidak bisa beli lead
      await billing.createOrder(parent.id, "contact1", "k-seeker");
      await rejects(billing.createOrder(parent.id, "lead1", "k-lead"), "forbidden", /CV/);
    });

    test("riwayat kuota pencari memuat trial, pembelian, dan pemakaian; riwayat lead tutor tidak tercampur", async () => {
      const env = await fresh(); const { contacts, leads } = env.services;
      const tutor = await makeTutor(env), parent = await signup(env);
      await contacts.unlockTutor(parent.id, tutor.user.id);
      await buyAndPay(env, parent.id, "contact1");
      const h = await contacts.history(parent.id);
      assert.deepEqual(h.map((x) => x.label).sort(), ["Beli paket 1 kontak", "Buka kontak tutor", "Kuota gratis 7 hari pertama"].sort());
      assert.ok(!(await leads.history(tutor.user.id)).some((x) => /kontak/i.test(x.label)), "riwayat tutor tidak memuat kuota pencari");
    });

    test("trust & safety: laporan, verifikasi manual oleh admin, tutor ditangguhkan hilang dari pencarian", async () => {
      const env = await fresh(); const { trust, tutors } = env.services;
      const tutor = await makeTutor(env), parent = await signup(env);
      const admin = await signup(env, "Admin");
      await env.uow.run(async (r) => { const u = (await r.users.byId(admin.id))!; await r.users.update({ ...u, isAdmin: true }); });
      const { requests, leads } = env.services;

      await trust.submitVerification(tutor.user.id, "id");
      assert.equal((await tutors.myProfile(tutor.user.id)).profile!.verification, "pending");
      assert.equal((await tutors.get(null, tutor.user.id)).verified, false);
      await rejects(trust.queue(parent.id), "forbidden", /admin/);
      const q = await trust.queue(admin.id);
      assert.equal(q.verifications.length, 1);
      await trust.decideVerification(admin.id, q.verifications[0].id, true);
      assert.equal((await tutors.get(null, tutor.user.id)).verified, true);

      await rejects(trust.report(parent.id, tutor.user.id, { reason: "Meminta pembayaran di luar aplikasi" }), "forbidden", /kontak tutor terbuka/);
      const req = await requests.create(parent.id, validRequest());
      await leads.unlock(tutor.user.id, req.id);
      await trust.report(parent.id, tutor.user.id, { reason: "Meminta pembayaran di luar aplikasi" });
      await rejects(trust.report(parent.id, tutor.user.id, { reason: "x" }), "validation");
      const q2 = await trust.queue(admin.id);
      assert.equal(q2.reports.length, 1);
      await trust.resolveReport(admin.id, q2.reports[0].id, true);
      assert.equal((await tutors.search(null, { area: "Tebet" })).length, 0, "tutor ditangguhkan tidak tampil");
      assert.equal((await trust.queue(admin.id)).reports.length, 0);
    });
  });
}
