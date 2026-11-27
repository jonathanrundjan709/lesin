import { api } from "../core/api.js";
import { $$, esc } from "../core/dom.js";
import { back } from "../core/forms.js";
import { fmtTime, waLink } from "../core/format.js";
import { ic } from "../core/icons.js";
import { navigate } from "../core/router.js";
import { session } from "../core/session.js";
import { emptyBox } from "../components/contact.js";
import { noteSheet } from "../components/sheets.js";

const DAY_ORDER = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

/** Lesson hub: jadwal mingguan, pengingat WhatsApp, catatan sesi. Gratis untuk dua pihak. */
export const lessonsView = {
  async load() { return (await api.lessons.list()).lessons; },
  render(lessons) {
    const head = `<div class="row" style="margin-bottom:6px">${back("/")}<h1 class="grow" style="margin:0">Lesson hub</h1></div>
      <p class="sub">Jadwal mingguan, pengingat WhatsApp sebelum sesi, dan catatan sesi dari tutor. Gratis untuk kedua pihak.</p>`;
    if (!lessons.length) return `${head}${emptyBox(session.mode === "tutor"
      ? `Belum ada jadwal. Buka kontak calon murid lalu atur jadwal dari menu <a href="/kontak" class="link">Kontak</a>.`
      : `Belum ada jadwal. Setelah tutor merespons, atur jadwal dari menu <a href="/kontak" class="link">Kontak</a>.`)}`;
    return `${head}<div class="stack section">${lessons.map((l) => {
      const other = session.user.id === l.tutor.id ? l.seeker : l.tutor;
      const slots = [...l.slots].sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
      return `<div class="card lesson">
        <div class="row between" style="align-items:flex-start"><div><h3>${esc(l.subject)} · ${esc(l.child)}</h3><p class="small muted" style="margin-top:2px">${session.user.id === l.tutor.id ? "Orang tua" : "Tutor"}: ${esc(other.name)}</p></div>
          <a class="btn sm wa" href="${waLink(other.waNumber, `Halo ${other.name.split(" ")[0]}, soal jadwal les ${l.subject} ${l.child}.`)}" target="_blank" rel="noopener">${ic("wa")}WA</a></div>
        <div class="slots">${slots.map((s) => `<span class="slot">${esc(s.day)} <b>${fmtTime(s.time)}</b></span>`).join("")}</div>
        <div class="divider"></div>
        <div class="row between"><h3 class="cap-title">Catatan sesi</h3>${l.canAddNote ? `<button class="btn sm ghost" data-note="${esc(l.id)}">${ic("plus")}Tambah catatan</button>` : ""}</div>
        ${l.notes.length ? `<ul class="notes">${l.notes.map((n) => `<li><div class="row between"><b class="small">${esc(n.topic)}</b><span class="chip pri u${n.understanding}">${n.understanding}/5</span></div>
          <span class="small muted">${new Date(n.createdAt).toLocaleDateString("id-ID", { dateStyle: "medium" })}</span></li>`).join("")}</ul>`
          : `<p class="small muted" style="margin-top:8px">${l.canAddNote ? "Catat topik dan pemahaman murid setelah tiap sesi." : "Tutor akan menulis catatan setelah sesi."}</p>`}
      </div>`;
    }).join("")}</div>`;
  },
  mount(lessons) {
    $$("[data-note]").forEach((b) => (b.onclick = () => noteSheet(lessons.find((l) => l.id === b.dataset.note), () => navigate("/les"))));
  },
};
