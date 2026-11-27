import { api } from "../core/api.js";
import { $, debounce, esc } from "../core/dom.js";
import { back, seg } from "../core/forms.js";
import { DURATIONS, durLabel, rp } from "../core/format.js";
import { ic } from "../core/icons.js";
import { DEFAULT_SEARCH, activeFilters, searchPrefs, selection } from "../core/prefs.js";
import { navigate } from "../core/router.js";
import { session } from "../core/session.js";
import { toast } from "../core/toast.js";
import { areaPicker, bindPickers, curriculumPicker, levelPicker, subjectPicker } from "../components/picker.js";
import { emptyBox } from "../components/contact.js";
import { loginPrompt } from "../components/gate.js";
import { trialBanner } from "../components/trial-banner.js";
import { tutorCard } from "../components/tutor-card.js";

/** Halaman filter lengkap. */
export const searchView = {
  render() {
    const s = searchPrefs.get(), L = session.meta.limits;
    return `
    <div class="row" style="margin-bottom:4px">${back()}<h1 class="grow" style="margin:0">Cari tutor</h1>
      ${activeFilters(s) ? `<button type="button" class="link" id="resetF">Reset</button>` : ""}</div>
    <p class="sub">Atur kriteria, kami cocokkan dengan tutor di sekitarmu.</p>
    <form id="searchForm" class="section" novalidate>
      ${areaPicker("area", "Daerah rumah", s.area)}
      ${subjectPicker("subject", "Mata pelajaran", s.subject, "Semua mata pelajaran")}
      <div class="row" style="gap:10px;align-items:flex-start">
        <div class="grow" style="min-width:0">${levelPicker("level", s.level, "Semua")}</div>
        <div class="grow" style="min-width:0">${curriculumPicker("curriculum", s.curriculum, "Semua")}</div>
      </div>
      <div class="field"><span class="lbl">Cara belajar</span>${seg("mode", [["any", "Bebas"], ["offline", "Ke rumah"], ["online", "Online"]], s.mode)}</div>
      <div class="field"><span class="lbl">Durasi sesi</span>${seg("durationMin", DURATIONS, s.durationMin)}</div>
      <div class="field"><span class="lbl">Budget maks per sesi: <span class="range-val" id="budgetVal">${rp(s.budget)}</span></span>
        <input type="range" name="budget" min="${L.minBudget}" max="${L.maxBudget}" step="10000" value="${s.budget}"><span class="hint">Maksimal ${rp(L.maxBudget)} untuk durasi yang dipilih.</span></div>
      <div class="field"><span class="lbl">Preferensi tutor</span>${seg("gender", [["any", "Bebas"], ["P", "Perempuan"], ["L", "Laki-laki"]], s.gender)}</div>
      <div class="info" style="margin-bottom:14px">${ic("info")}<span><b id="liveCount">…</b> tutor cocok dengan kriteria ini. Daftar gratis untuk membuka CV, 7 hari pertama bebas buka kontak tutor.</span></div>
      <button class="btn">${ic("search")} Tampilkan tutor</button>
    </form>`;
  },
  mount() {
    bindPickers();
    const f = $("#searchForm");
    const read = () => {
      const fd = new FormData(f);
      return { ...searchPrefs.get(), area: fd.get("area"), subject: fd.get("subject"), level: fd.get("level"), curriculum: fd.get("curriculum"),
        mode: fd.get("mode"), budget: +fd.get("budget"), durationMin: +fd.get("durationMin"), gender: fd.get("gender") };
    };
    const live = debounce(async () => { try { $("#liveCount").textContent = (await api.tutors.search(read())).tutors.length; } catch { /* abaikan */ } }, 250);
    const upd = () => { $("#budgetVal").textContent = rp(+f.budget.value); live(); };
    f.oninput = upd; f.onchange = upd; upd();
    f.onsubmit = (e) => { e.preventDefault(); searchPrefs.set(read()); navigate("/results"); };
    const r = $("#resetF");
    if (r) r.onclick = () => { const s = searchPrefs.get(); searchPrefs.reset({ area: s.area, subject: s.subject }); navigate("/search"); toast("Filter direset", "info"); };
  },
};

/** Hasil pencarian dengan pilihan tutor untuk permintaan (maks. 3). */
export const resultsView = {
  async load() {
    const s = searchPrefs.get();
    return { s, tutors: (await api.tutors.search(s)).tutors };
  },
  render({ s, tutors }) {
    const nf = activeFilters(s), max = session.meta.limits.maxTargets, picked = selection.list(), guest = !session.user;
    const sum = [s.subject || "Semua pelajaran", s.level || "semua jenjang", s.curriculum, s.area,
      s.mode === "online" ? "online" : s.mode === "offline" ? "ke rumah" : null,
      nf && (s.budget !== DEFAULT_SEARCH.budget || s.durationMin !== DEFAULT_SEARCH.durationMin) ? `≤ ${rp(s.budget)} / ${durLabel(s.durationMin)}` : null,
      s.gender === "P" ? "tutor perempuan" : s.gender === "L" ? "tutor laki-laki" : null].filter(Boolean).join(" · ");
    return `
    <div class="row" style="margin-bottom:12px">${back("/", "data-reset")}<h2 class="grow">Hasil pencarian</h2>
      <a href="/search" class="btn sm ${nf ? "filter-on" : "line"}">${ic("filter")}Filter${nf ? `<span class="fcount">${nf}</span>` : ""}</a></div>
    <div class="result-head"><div class="row" style="gap:12px"><b class="big">${tutors.length}</b><div><b>tutor cocok dengan kriteriamu</b><p class="filters-sum">${esc(sum)}</p></div></div></div>
    <div style="margin-top:10px">${trialBanner()}</div>
    <div class="info" style="margin-top:10px">${ic("shield")}<span>${guest ? "Masuk (gratis) untuk membuka CV lengkap dan memilih tutor." : `Nama, foto, dan WhatsApp tutor tersamar. Buka kontak dengan kuota, atau pilih sampai ${max} tutor dan kirim permintaan gratis.`}</span></div>
    <div class="hscroll" style="margin-top:12px">${[["match", "Paling cocok"], ["dist", "Terdekat"], ["price", "Termurah"], ["rating", "Rating"]].map(([v, l]) =>
      `<button class="chip ${s.sort === v ? "pri" : ""}" data-sort="${v}" style="padding:8px 12px">${l}</button>`).join("")}</div>
    <div class="stack" style="margin-top:12px">
      ${tutors.map((t) => tutorCard(t, { selectable: true, locked: guest })).join("") || emptyBox(`Belum ada tutor yang cocok. Coba longgarkan filter,<br>atau <a href="/post" class="link">kirim permintaan terbuka</a>.`)}
    </div>
    ${picked.length ? `<div style="height:70px"></div><div class="sticky-cta"><a class="btn" href="/post">Kirim permintaan ke ${picked.length} tutor ${ic("arrow")}</a></div>` : ""}`;
  },
  mount({ tutors }) {
    document.querySelectorAll("[data-sort]").forEach((b) => (b.onclick = () => { searchPrefs.set({ ...searchPrefs.get(), sort: b.dataset.sort }); navigate("/results"); }));
    // Kembali dari hasil = batal mencari: filter tambahan direset.
    $("[data-reset]").onclick = () => { searchPrefs.reset({ area: searchPrefs.get().area }); };
    document.querySelectorAll("[data-login]").forEach((b) => (b.onclick = loginPrompt));
    const max = session.meta.limits.maxTargets;
    document.querySelectorAll("[data-pick]").forEach((b) => (b.onclick = () => {
      const t = tutors.find((x) => x.id === b.dataset.pick);
      if (!selection.toggle(t, max)) return toast(`Maksimal ${max} tutor per permintaan.`, "info");
      navigate("/results");
    }));
  },
};
