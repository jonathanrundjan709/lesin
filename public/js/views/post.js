import { api } from "../core/api.js";
import { $, $$, esc } from "../core/dom.js";
import { autoClearErrors, seg, showErrors, withBusy } from "../core/forms.js";
import { DAYS_FULL, DURATIONS, addMin, durLabel, fmtTime, rp } from "../core/format.js";
import { ic } from "../core/icons.js";
import { searchPrefs, selection } from "../core/prefs.js";
import { navigate } from "../core/router.js";
import { session } from "../core/session.js";
import { toast } from "../core/toast.js";
import { areaPicker, bindPickers, curriculumPicker, levelPicker, subjectPicker } from "../components/picker.js";

const chosenChips = () => {
  const l = selection.list(), max = session.meta.limits.maxTargets;
  return `<div class="field" id="targets"><span class="lbl">Dikirim ke</span>
    ${l.length ? `<div class="chips">${l.map((t) => `<span class="chip pri target-chip">${esc(t.label)}<button type="button" data-unpick="${esc(t.id)}" aria-label="Hapus ${esc(t.label)}">${ic("close")}</button></span>`).join("")}</div>
      <span class="hint">${l.length} dari ${max} tutor pilihan. Tutor lain di daerahmu tetap bisa melihat permintaan ini.</span>`
      : `<div class="info">${ic("info")}<span>Terbuka untuk tutor yang cocok di daerahmu. Mau pilih 1–${max} tutor tertentu? <a class="link" href="#/results">Pilih dari hasil pencarian</a>.</span></div>`}</div>`;
};

/** Boost orang tua ditunda (PRD §6: orang tua tidak membayar). Tampil hanya bila fitur dinyalakan di server. */
const boostCard = () => `<section class="card boost-card"><div class="row" style="gap:10px"><span class="boost-ic">${ic("bolt")}</span><div><h3>Boost postingan</h3><p class="small">Belum tersedia.</p></div></div></section>`;

export const postView = {
  render() {
    const s = searchPrefs.get(), L = session.meta.limits;
    const days = Object.entries(DAYS_FULL);
    return `
    <h1>Kirim permintaan les</h1><p class="sub">Gratis. Tutor yang cocok akan menghubungimu lewat WhatsApp. Berlaku ${L.requestDays} hari.</p>
    <form id="postForm" class="section" novalidate>
      ${chosenChips()}
      ${subjectPicker("subject", "Mata pelajaran", s.subject || "Matematika")}
      <div class="row" style="gap:10px;align-items:flex-start">
        <div class="grow" style="min-width:0">${levelPicker("level", s.level || "SD")}</div>
        <div class="grow" style="min-width:0">${curriculumPicker("curriculum", s.curriculum || "Merdeka", "Bebas")}</div>
      </div>
      <label class="field" data-f="studentNote"><span class="lbl">Tentang murid</span><input class="input" name="studentNote" maxlength="120" placeholder="cth. Kelas 8, nilai ulangan turun"></label>
      ${areaPicker("area", "Daerah", s.area)}
      <div class="field"><span class="lbl">Cara belajar</span>${seg("mode", [["offline", "Ke rumah"], ["online", "Online"]], "offline")}</div>
      <div class="field"><span class="lbl">Durasi per sesi</span>${seg("durationMin", DURATIONS, 90)}</div>
      <div class="field" data-f="days"><span class="lbl">Hari & jam les</span>
        <div class="daylist">${days.map(([d, full], i) => { const on = i === 0 || i === 3; return `
          <div class="dayrow ${on ? "on" : ""}" data-day="${d}">
            <label class="daytoggle"><input type="checkbox" name="days" value="${d}" ${on ? "checked" : ""}><span class="dn">${full}</span><span class="dsum"></span><span class="dchk">${ic("check")}</span></label>
            <div class="daytime"><span class="small muted">Jam mulai</span><input class="input" type="time" name="t_${d}" value="16:00" step="900"></div>
          </div>`; }).join("")}</div>
        <span class="hint">Pilih hari, lalu atur jam mulainya. Tiap hari boleh beda jam.</span></div>
      <div class="field"><span class="lbl">Budget per sesi: <span class="range-val" id="pbVal">${rp(120000)}</span><span class="muted" id="pbDur"> / 90 menit</span></span>
        <input type="range" name="budget" min="${L.minBudget}" max="${L.maxBudget}" step="5000" value="120000"><span class="hint">Maksimal ${rp(L.maxBudget)} per sesi. Tarif tutor dibayar langsung ke tutor.</span></div>
      <label class="field"><span class="lbl">Catatan untuk tutor (opsional)</span><textarea class="input" name="notes" maxlength="400" placeholder="cth. Lebih suka tutor perempuan, ada laporan perkembangan"></textarea></label>
      ${session.meta.features.requestBoost ? boostCard() : ""}
      <div class="info" style="margin-bottom:14px">${ic("shield")}<span>Nomor WhatsApp-mu tersamar. Tutor hanya melihat daerah dan kebutuhan les sampai mereka menghubungimu.</span></div>
      <button class="btn" id="postSubmit">Kirim permintaan</button>
    </form>`;
  },
  mount() {
    bindPickers();
    const f = $("#postForm"); autoClearErrors(f);
    const updDays = () => {
      const dur = +f.querySelector("input[name=durationMin]:checked").value;
      $$(".dayrow", f).forEach((r) => {
        const on = r.querySelector("input[type=checkbox]").checked, t = r.querySelector("input[type=time]").value;
        r.classList.toggle("on", on);
        r.querySelector(".dsum").textContent = on && t ? `${fmtTime(t)} – ${addMin(t, dur)}` : "";
      });
      $("#pbDur").textContent = ` / ${durLabel(dur)}`;
    };
    const upd = () => { $("#pbVal").textContent = rp(+f.budget.value); updDays(); };
    f.addEventListener("input", upd); f.addEventListener("change", upd); updDays();
    $$("[data-unpick]").forEach((b) => (b.onclick = () => { selection.remove(b.dataset.unpick); $("#targets").outerHTML = chosenChips(); navigate("#/post"); }));

    f.onsubmit = (e) => { e.preventDefault(); withBusy($("#postSubmit"), async () => {
      const fd = new FormData(f), days = fd.getAll("days");
      const times = Object.fromEntries(days.map((d) => [d, fd.get(`t_${d}`)]));
      const studentNote = fd.get("studentNote").trim();
      if (!showErrors(f, [
        { f: "studentNote", ok: studentNote.length >= 3, msg: "Ceritakan singkat tentang murid, cth. kelas berapa." },
        { f: "days", ok: days.length > 0, msg: "Pilih minimal satu hari." },
        { f: "days", ok: days.every((d) => times[d]), msg: "Isi jam mulai untuk tiap hari yang dipilih." },
      ])) return;
      try {
        await api.requests.create({
          subject: fd.get("subject"), level: fd.get("level"), curriculum: fd.get("curriculum"), studentNote, area: fd.get("area"), mode: fd.get("mode"),
          durationMin: +fd.get("durationMin"), budget: +fd.get("budget"), notes: fd.get("notes").trim(),
          schedule: days.map((day) => ({ day, time: times[day] })), targetTutorIds: selection.list().map((t) => t.id),
        });
        selection.clear();
        toast("Permintaan terkirim. Tutor yang cocok akan menghubungimu.");
        navigate("#/myposts");
      } catch (err) { toast(esc(err.message), "err"); }
    }); };
  },
};
