import { api } from "../core/api.js";
import { $, $$, debounce, esc } from "../core/dom.js";
import { rp } from "../core/format.js";
import { ic } from "../core/icons.js";
import { cvReady, session } from "../core/session.js";
import { HERO_COPY, searchPrefs, ui } from "../core/prefs.js";
import { navigate } from "../core/router.js";
import { areaPicker, curriculumPicker, levelPicker, subjectPicker, bindPickers } from "../components/picker.js";
import { bindModeSwitch, modeCard, modeSegment } from "../components/mode-switch.js";
import { planSheet } from "../components/plan-sheet.js";
import { requestCard } from "../components/request-card.js";
import { emptyBox } from "../components/contact.js";
import { mono } from "../components/mono.js";

export const cvGate = () => `<section class="card cv-gate"><img src="/assets/mascot.svg" alt="" width="64" height="64"><div class="grow"><h3>Lengkapi CV untuk mulai</h3>
  <p class="small" style="color:var(--ink-2);margin-top:2px;line-height:1.45">Nama, mapel, jenjang, pendidikan, dan tarif wajib diisi. “Tentang caramu mengajar” boleh dikosongkan.</p>
  <a class="btn sm" href="/profile" style="margin-top:10px">Isi CV sekarang ${ic("arrow")}</a></div></section>`;

const lessonCard = () => `<a class="card tap link-row section" href="/les"><span class="mi">${ic("calendar")}</span><span class="grow"><b>Lesson hub</b><small>Jadwal mingguan, pengingat WhatsApp, dan catatan sesi</small></span>${ic("chevR")}</a>`;

/** Kelengkapan CV (persen), hanya untuk motivasi mengisi. */
function profileCompletion(p, docs) {
  if (!p) return 0;
  const checks = [session.user?.name, p.headline, p.education, p.bio, p.achievements, p.subjects.length, p.levels.length, docs.length >= 2];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export const homeView = {
  async load() {
    if (session.mode === "tutor" && session.user) {
      const board = cvReady() ? (await api.requests.board()).requests : [];
      return { board };
    }
    const s = searchPrefs.get();
    const all = (await api.tutors.search({ area: s.area, budget: session.meta.limits.maxBudget, durationMin: 90 })).tutors;
    const filtered = (await api.tutors.search(s)).tutors;
    return { all, count: filtered.length, s };
  },
  render(data) { return session.mode === "tutor" && session.user ? tutorHome(data) : seekerHome(data); },
  mount(data) {
    bindModeSwitch();
    if (session.mode === "tutor" && session.user) { $("#goPlan") && ($("#goPlan").onclick = planSheet); return; }
    bindPickers();
    const f = $("#quickForm");
    const read = () => { const fd = new FormData(f); return { ...data.s, area: fd.get("area"), subject: fd.get("subject"), level: fd.get("level"), curriculum: fd.get("curriculum") }; };
    const count = debounce(async () => { try { $("#qCount").textContent = (await api.tutors.search(read())).tutors.length; } catch { /* abaikan */ } }, 300);
    f.oninput = count;
    f.onsubmit = (e) => { e.preventDefault(); searchPrefs.set(read()); navigate("/results"); };
    $$("[data-subj]").forEach((a) => (a.onclick = () => searchPrefs.set({ ...searchPrefs.reset({ area: data.s.area }), subject: a.dataset.subj })));
  },
};

function seekerHome({ all, count, s }) {
  const [eyebrow, title, sub] = HERO_COPY[ui.copy];
  const popular = session.meta.subjects.slice(0, 6);
  const verified = all.filter((t) => t.verified).length;
  const rated = all.filter((t) => t.rating);
  const avg = rated.length ? (rated.reduce((a, t) => a + t.rating, 0) / rated.length).toFixed(1).replace(".", ",") : "—";
  return `${ui.sw === "1" ? modeSegment() : ""}
  <section class="hero">
    <img class="hero-mascot" src="/assets/mascot.svg" alt="" width="120" height="120">
    <p class="eyebrow light">${esc(eyebrow)}</p>
    <h1 style="margin-top:6px">${esc(title)}</h1>
    <p style="margin-top:6px">${esc(sub)}</p>
    <div style="height:40px"></div>
  </section>
  <form class="card quick" id="quickForm">
    ${areaPicker("area", "Daerah rumah", s.area)}
    ${subjectPicker("subject", "Mata pelajaran", s.subject)}
    <div class="row" style="gap:10px;align-items:flex-start">
      <div class="grow" style="min-width:0">${levelPicker("level", s.level, "Semua")}</div>
      <div class="grow" style="min-width:0">${curriculumPicker("curriculum", s.curriculum, "Semua")}</div>
    </div>
    <button class="btn">${ic("search")} Cari tutor</button>
    <p class="small muted" style="text-align:center;margin-top:8px"><b id="qCount">${count}</b> tutor cocok dengan pilihan ini</p>
  </form>

  <div class="section">
    <div class="section-head"><h2>Pelajaran populer</h2><a href="/search">Semua</a></div>
    <div class="subj-grid">${popular.map((x) => `<a class="subj-card" href="/results" data-subj="${esc(x)}">${mono(x, "md")}<b>${esc(x)}</b><span>${all.filter((t) => t.subjects.includes(x)).length} tutor</span></a>`).join("")}</div>
  </div>

  <section class="cta-post section">
    <div class="cta-ic">${ic("megaphone")}</div>
    <div class="grow">
      <p class="eyebrow">Permintaan les · gratis</p>
      <h3>Biar tutor yang menghubungimu</h3>
      <p class="small" style="color:var(--ink-2);margin-top:4px;line-height:1.5">Tulis kebutuhan les sekali, atau pilih 1–3 tutor. Tutor yang cocok langsung WhatsApp kamu.</p>
      <a class="btn sm dark" href="/post" style="margin-top:12px">Buat permintaan ${ic("arrow")}</a>
    </div>
  </section>

  ${session.user ? lessonCard() : ""}

  <div class="section">
    <div class="section-head"><h2>Cara kerja</h2></div>
    <ol class="timeline card">
      <li><span class="tl-dot">${ic("search")}</span><div class="grow"><div class="row between"><b>Cari & bandingkan CV</b><span class="chip ok">Gratis</span></div>
        <p>Filter daerah, mapel, kurikulum, budget. Daftar gratis untuk membuka CV lengkap: pendidikan, pengalaman, dan rating. Nama dan kontak tutor tersamar.</p></div></li>
      <li><span class="tl-dot">${ic("megaphone")}</span><div class="grow"><div class="row between"><b>Kirim permintaan</b><span class="chip ok">Gratis</span></div>
        <p>Pilih 1–3 tutor atau biarkan terbuka untuk tutor di daerahmu. Berlaku 14 hari. Kamu tidak pernah membayar LesIn.</p></div></li>
      <li><span class="tl-dot">${ic("wa")}</span><div class="grow"><div class="row between"><b>Tutor menghubungimu</b><span class="chip ok">Gratis</span></div>
        <p>Tutor yang tertarik membuka kontakmu. Identitas dan WhatsApp-nya terbuka untukmu. Atur trial lewat WhatsApp, lalu pakai Lesson hub.</p></div></li>
    </ol>
  </div>

  <div class="section stat-row">
    <div class="stat"><b>${all.length}</b><span>Tutor aktif</span></div>
    <div class="stat"><b>${verified}</b><span>Terverifikasi</span></div>
    <div class="stat"><b>${avg}</b><span>Rata-rata rating</span></div>
  </div>
  ${ui.sw === "3" ? modeCard() : ""}`;
}

function tutorHome({ board }) {
  const p = session.profile, name = session.user.name.split(" ")[0];
  const fit = board.filter((r) => r.fitsSubject && r.nearby && !r.unlocked);
  const unlocked = board.filter((r) => r.unlocked).length;
  const comp = profileCompletion(p, session.docs);
  const l = session.leads;
  return `${ui.sw === "1" ? modeSegment() : ""}
  ${cvReady() ? "" : cvGate()}
  <section class="card tutor-sum">
    <div class="row between" style="align-items:flex-start">
      <div><p class="eyebrow">Mode tutor</p><h1 style="font-size:22px;margin-top:4px">Halo, ${esc(name)}</h1>
        <p class="small muted">${esc(p ? p.subjects.join(", ") : "Belum pilih mapel")}${p ? ` · ${esc(p.area)}` : ""}</p></div>
      ${l?.planActive ? `<span class="chip acc">${ic("bolt")}Pro</span>` : ""}
    </div>
    <div class="mini-stats">
      <a href="/board"><b>${fit.length}</b><span>Lowongan cocok</span></a>
      <a href="/kontak"><b>${unlocked}</b><span>Sudah dihubungi</span></a>
      <a href="/wallet"><b>${l ? l.leads : 0}</b><span>Lead</span></a>
    </div>
    ${cvReady() ? `<a href="/board" class="btn" style="margin-top:14px">Lihat lowongan les ${ic("arrow")}</a>` : ""}
  </section>

  <a class="card tap section" href="/profile">
    <div class="row between"><h3>Kelengkapan CV</h3><b style="color:var(--pri)">${comp}%</b></div>
    <div class="progress" style="margin-top:10px"><i style="width:${comp}%"></i></div>
    <p class="small muted" style="margin-top:8px">${comp < 100 ? "CV lengkap muncul lebih tinggi di hasil pencarian orang tua." : "CV kamu sudah lengkap."}</p>
  </a>

  ${cvReady() ? `<div class="section">
    <div class="section-head"><h2>Cocok untukmu</h2><a href="/board">Semua</a></div>
    <div class="stack">${fit.slice(0, 3).map((r) => requestCard(r)).join("") || emptyBox("Belum ada lowongan yang cocok di sekitarmu.")}</div>
  </div>` : ""}

  ${lessonCard()}
  ${planCard()}
  ${ui.sw === "3" ? modeCard() : ""}`;
}

export function planCard() {
  const l = session.leads;
  if (l?.planActive) return `<div class="pro-card section"><div class="row"><span class="pro-ic">${ic("bolt")}</span><div><h3>Tutor Plan aktif</h3><p class="small" style="color:#7A4E00">Prioritas pencarian dan badge Pro sampai ${new Date(l.planUntil).toLocaleDateString("id-ID", { dateStyle: "long" })}.</p></div></div></div>`;
  const plan = session.meta.products.find((p) => p.plan);
  return `<div class="pro-card section">
    <div class="row" style="align-items:flex-start"><span class="pro-ic">${ic("bolt")}</span><div class="grow"><h3>Tutor Plan — ${rp(plan.amount)}/bulan</h3>
    <p class="small" style="color:#7A4E00;margin-top:4px;line-height:1.5">${plan.leads} lead per bulan, prioritas di pencarian, dan badge Pro.</p></div></div>
    <button class="btn acc" id="goPlan" style="margin-top:12px">Lihat keuntungan Tutor Plan</button></div>`;
}
