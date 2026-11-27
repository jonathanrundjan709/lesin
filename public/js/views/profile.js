import { api } from "../core/api.js";
import { $, $$, esc } from "../core/dom.js";
import { autoClearErrors, seg, showErrors, withBusy } from "../core/forms.js";
import { DURATIONS, maskName } from "../core/format.js";
import { ic } from "../core/icons.js";
import { navigate } from "../core/router.js";
import { cvReady, refreshProfile, session } from "../core/session.js";
import { closeSheet, openSheet } from "../core/sheet.js";
import { toast } from "../core/toast.js";
import { areaPicker, bindPickers } from "../components/picker.js";
import { tutorCard } from "../components/tutor-card.js";
import { planCard } from "./home.js";
import { planSheet } from "../components/plan-sheet.js";

const DEFAULTS = { headline: "", subjects: ["Matematika"], levels: ["SMP"], curricula: ["Merdeka"], area: "Tebet", rate: 100000, rateDurationMin: 60,
  experienceYears: 1, education: "", bio: "", achievements: "" };

const consentPoints = () => `<ul class="consent-list">${session.meta.consent.points.map((t) => `<li>${ic("check")}<span>${esc(t)}</span></li>`).join("")}</ul>`;

/** Persetujuan wajib saat CV pertama (UU PDP): nama dan WhatsApp tutor boleh dibuka pencari. */
const consentBox = () => `<div class="field" data-f="consent"><span class="lbl">Persetujuan data ${`<b class="req" title="Wajib">*</b>`}</span>
  <div class="consent-box">${consentPoints()}
    <label class="pick consent-ok"><input type="checkbox" name="consent"><span>Saya mengerti dan setuju</span></label></div></div>`;

/** Setelah CV ada: status persetujuan dan tombol cabut/aktifkan. Tutor lama yang belum setuju diajak mengaktifkan. */
const consentCard = () => {
  const on = Boolean(session.profile?.consentAt);
  return `<div class="section"><div class="card consent-card"><div class="row" style="gap:10px"><span class="mi">${ic(on ? "check" : "lock")}</span>
    <div class="grow"><b>${on ? "Kontak langsung aktif" : "Kontak langsung belum aktif"}</b>
      <p class="small muted">${on ? "Pencari bisa membuka nama dan WhatsApp-mu dengan kuota mereka." : "Aktifkan supaya pencari bisa membuka kontakmu dan menghubungimu. Tanpa ini kamu hanya dihubungi lewat permintaan."}</p></div></div>
    ${on ? "" : consentPoints()}
    <button class="btn ${on ? "line" : ""}" id="consentBtn" style="margin-top:10px">${on ? "Cabut persetujuan" : "Setujui & aktifkan"}</button></div></div>`;
};

const docState = (kind) => session.docs.find((d) => d.kind === kind);

function docButton(kind, icon, title, hint) {
  const d = docState(kind);
  const label = d ? (d.status === "approved" ? "Disetujui" : d.status === "rejected" ? "Ditolak, kirim ulang" : "Terkirim, ditinjau 1×2 hari kerja") : hint;
  const done = d && d.status !== "rejected";
  return `<button type="button" class="doc-up ${done ? "done" : ""}" data-doc="${kind}" ${done ? "disabled" : ""}>
    <span class="mi">${ic(done ? "check" : icon)}</span><span class="grow"><b>${title}</b><small>${esc(label)}</small></span></button>`;
}

/** Kolom bertanda * wajib. "Tentang caramu mengajar" opsional (PRD: CV wajib, cara mengajar opsional). */
export const profileView = {
  render() {
    const p = { ...DEFAULTS, ...(session.profile ?? {}) }, req = `<b class="req" title="Wajib">*</b>`, L = session.meta.limits;
    const preview = { id: "me", masked: true, name: maskName(session.user.name), initials: session.user.name.split(" ").map((w) => w[0]).slice(0, 2).join(""),
      headline: p.headline || "Headline singkat tentang caramu mengajar", education: p.education || "Pendidikan terakhir", experienceYears: p.experienceYears,
      rating: 0, reviewCount: 0, subjects: p.subjects.length ? p.subjects : ["Mapel"], rate: p.rate, rateDurationMin: p.rateDurationMin, area: p.area,
      verified: p.verification === "verified", proBadge: Boolean(session.leads?.planActive), reach: true, areaLevel: 2 };
    const subjOpts = [...new Set([...session.meta.subjects, ...p.subjects])];
    return `<h1>CV Saya</h1><p class="sub">Ini yang dilihat pencari. Nama & kontakmu tersamar sampai kamu merespons permintaan mereka.</p>
    ${cvReady() ? "" : `<div class="info" style="margin-top:12px">${ic("info")}<span><b>CV wajib diisi</b> untuk memakai mode tutor. Kolom bertanda <b class="req">*</b> harus lengkap. “Tentang caramu mengajar” boleh kosong. Tutor pertama dapat <b>2 lead gratis</b> (Founding Tutor).</span></div>`}
    <div class="section"><p class="small muted" style="margin-bottom:6px;font-weight:700">PRATINJAU DI HASIL PENCARIAN</p>${tutorCard(preview, { preview: true })}</div>
    <form id="cvForm" class="section" novalidate>
      <label class="field" data-f="name"><span class="lbl">Nama lengkap ${req}</span><input class="input" name="name" value="${esc(session.user.name)}" placeholder="Nama sesuai identitas"></label>
      <label class="field"><span class="lbl">Nomor WhatsApp (akun)</span><input class="input" value="${esc(session.user.phone ?? "")}" disabled>
        <span class="hint">Nomor akun tidak bisa diubah. Terbuka untuk pencari setelah kamu merespons permintaan mereka.</span></label>
      <label class="field"><span class="lbl">Headline (opsional)</span><input class="input" name="headline" maxlength="60" value="${esc(p.headline)}" placeholder="cth. Bikin Matematika jadi masuk akal"></label>
      <div class="field" data-f="subjects"><span class="lbl">Mata pelajaran ${req}</span><div class="chips" id="subjChips">${subjOpts.map((s) => `<label class="pick"><input type="checkbox" name="subjects" value="${esc(s)}" ${p.subjects.includes(s) ? "checked" : ""}><span>${esc(s)}</span></label>`).join("")}
        <button type="button" class="pick-add" id="addSubj">${ic("plus")}Tambah</button></div></div>
      <div class="field" data-f="levels"><span class="lbl">Jenjang ${req}</span><div class="chips">${session.meta.levels.map((s) => `<label class="pick"><input type="checkbox" name="levels" value="${s}" ${p.levels.includes(s) ? "checked" : ""}><span>${s}</span></label>`).join("")}</div></div>
      <div class="field"><span class="lbl">Kurikulum yang dikuasai</span><div class="chips">${session.meta.curricula.map((s) => `<label class="pick"><input type="checkbox" name="curricula" value="${s}" ${p.curricula.includes(s) ? "checked" : ""}><span>${s}</span></label>`).join("")}</div></div>
      ${areaPicker("area", "Domisili (kecamatan)", p.area)}
      <label class="field" data-f="rate"><span class="lbl">Tarif (Rp) ${req}</span><input class="input" type="number" step="5000" min="${L.minRate}" max="${L.maxRate}" name="rate" value="${p.rate}"></label>
      <div class="field"><span class="lbl">Tarif itu untuk durasi</span>${seg("rateDurationMin", DURATIONS, p.rateDurationMin)}<span class="hint">Pencari melihat tarifmu per jam atau per sesi yang kamu pilih. Dibayar langsung ke kamu, LesIn tidak memotong komisi.</span></div>
      <label class="field"><span class="lbl">Pengalaman mengajar (tahun)</span><input class="input" type="number" min="0" max="50" name="experienceYears" value="${p.experienceYears}"></label>
      <label class="field" data-f="education"><span class="lbl">Pendidikan ${req}</span><input class="input" name="education" maxlength="120" value="${esc(p.education)}" placeholder="cth. S1 Matematika — Universitas ..."></label>
      <label class="field"><span class="lbl">Tentang caramu mengajar (opsional)</span><textarea class="input" name="bio" maxlength="600" placeholder="Jangan tulis nomor HP atau akun sosmed di sini.">${esc(p.bio)}</textarea></label>
      <label class="field"><span class="lbl">Prestasi & pengalaman</span><textarea class="input" name="achievements" maxlength="600">${esc(p.achievements)}</textarea></label>
      <div class="field"><span class="lbl">Verifikasi</span>
        ${docButton("id", "idcard", "Foto identitas (KTP/KTM)", "Hanya dilihat tim verifikasi, dihapus 90 hari setelah diverifikasi")}
        ${docButton("skill", "doc", "Bukti keahlian", "Sertifikat kursus, sertifikat lomba, atau portofolio")}
        <p class="hint" style="margin-top:8px">Dokumen tidak pernah ditampilkan ke pencari. Pencari hanya melihat badge "Identitas terverifikasi".</p></div>
      ${cvReady() ? "" : consentBox()}
      <button class="btn" id="cvSave">${cvReady() ? "Simpan CV" : "Simpan CV & mulai jadi tutor"}</button>
    </form>
    ${cvReady() ? consentCard() : ""}
    ${planCard()}`;
  },
  mount() {
    bindPickers();
    const f = $("#cvForm"); autoClearErrors(f);
    const read = () => {
      const fd = new FormData(f);
      return { name: fd.get("name").trim(), headline: fd.get("headline").trim(), subjects: fd.getAll("subjects"), levels: fd.getAll("levels"), curricula: fd.getAll("curricula"),
        area: fd.get("area"), rate: +fd.get("rate"), rateDurationMin: +fd.get("rateDurationMin"), experienceYears: +fd.get("experienceYears"),
        education: fd.get("education").trim(), bio: fd.get("bio").trim(), achievements: fd.get("achievements").trim(), consent: fd.get("consent") === "on" };
    };

    $("#addSubj").onclick = () => openSheet(`<h2>Tambah mata pelajaran</h2>
      <p class="sub" style="margin-top:4px">Untuk mapel di luar daftar bawaan.</p>
      <label class="field" data-f="nm" style="margin-top:14px"><span class="lbl">Nama mata pelajaran</span><input class="input" id="subjName" maxlength="40" placeholder="cth. Ekonomi, Gitar" autocomplete="off"></label>
      <button class="btn" id="subjGo">Tambahkan</button>`, (sh) => {
      $("#subjGo", sh).onclick = () => {
        const v = $("#subjName", sh).value.trim().replace(/\s+/g, " ");
        if (!showErrors(sh, [{ f: "nm", ok: v.length >= 2, msg: "Tulis nama mapel minimal 2 huruf." }])) return;
        const chips = $("#subjChips");
        const exist = $$("input[name=subjects]", chips).find((i) => i.value.toLowerCase() === v.toLowerCase());
        if (exist) exist.checked = true;
        else $("#addSubj").insertAdjacentHTML("beforebegin", `<label class="pick"><input type="checkbox" name="subjects" value="${esc(v)}" checked><span>${esc(v)}</span></label>`);
        closeSheet();
      };
    });

    $$("[data-doc]").forEach((b) => (b.onclick = async () => {
      if (!cvReady()) return toast("Simpan CV dulu, baru kirim dokumen verifikasi.", "info");
      try { await api.me.verify(b.dataset.doc); await refreshProfile(); toast("Dokumen terkirim untuk ditinjau."); navigate("/profile"); }
      catch (e) { toast(esc(e.message), "err"); }
    }));
    const plan = $("#goPlan"); if (plan) plan.onclick = planSheet;
    const consent = $("#consentBtn");
    if (consent) consent.onclick = () => withBusy(consent, async () => {
      const accept = !session.profile?.consentAt;
      try { await api.me.consent(accept); await refreshProfile(); toast(accept ? "Kontak langsung aktif." : "Persetujuan dicabut. Kontak yang sudah terbuka tidak ditarik kembali."); navigate("/profile"); }
      catch (e) { toast(esc(e.message), "err"); }
    });

    f.onsubmit = (e) => { e.preventDefault(); withBusy($("#cvSave"), async () => {
      const v = read();
      if (!showErrors(f, [
        { f: "name", ok: v.name.length >= 3, msg: "Isi nama lengkapmu." },
        { f: "subjects", ok: v.subjects.length > 0, msg: "Pilih minimal satu mata pelajaran." },
        { f: "levels", ok: v.levels.length > 0, msg: "Pilih minimal satu jenjang." },
        { f: "rate", ok: v.rate >= session.meta.limits.minRate && v.rate <= session.meta.limits.maxRate, msg: "Isi tarif antara Rp25.000 dan Rp400.000." },
        { f: "education", ok: v.education.length >= 3, msg: "Isi pendidikan terakhirmu." },
        { f: "consent", ok: cvReady() || v.consent, msg: "Centang persetujuan untuk melanjutkan." },
      ])) return;
      const first = !cvReady();
      try {
        const res = await api.me.saveProfile(v);
        await refreshProfile();
        toast(first ? (res.foundingGranted ? "CV tersimpan. Kamu dapat <b>2 lead gratis</b> (Founding Tutor)." : "CV tersimpan. Kamu siap jadi tutor.") : "CV tersimpan", "ok", 4500);
        navigate(first && session.mode === "tutor" ? "/" : "/profile");
      } catch (err) { toast(esc(err.message), "err"); }
    }); };
  },
};
