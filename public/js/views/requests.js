import { api } from "../core/api.js";
import { esc } from "../core/dom.js";
import { daysLeft, waLink } from "../core/format.js";
import { ic } from "../core/icons.js";
import { session } from "../core/session.js";
import { contactRow, emptyBox } from "../components/contact.js";
import { requestCard } from "../components/request-card.js";
import { lessonSheet, reviewSheet } from "../components/sheets.js";
import { navigate } from "../core/router.js";

/** Postinganku: permintaan milik pencari dan tutor yang sudah merespons (identitasnya terbuka). */
export const myRequestsView = {
  async load() { return (await api.requests.mine()).requests; },
  render(reqs) {
    if (!reqs.length) return `<h1>Postinganku</h1>${emptyBox(`Belum ada permintaan.<br><a class="btn" href="#/post" style="margin-top:14px">Kirim permintaan les</a>`)}`;
    return `<h1>Postinganku</h1><p class="sub">Tutor yang tertarik akan menghubungimu lewat WhatsApp. Identitas dan kontak mereka terbuka di sini. Gratis untukmu.</p>
    <div class="stack section">${reqs.map((r) => `<div class="post-group">
      ${requestCard(r, "own")}
      <div class="row between" style="margin:12px 4px 4px"><b class="small">${r.responders.length} tutor tertarik</b>
        ${r.active ? `<span class="chip">Aktif · ${daysLeft(r.expiresAt)} hari lagi</span>` : `<span class="chip">Kedaluwarsa</span>`}</div>
      <div class="card" style="padding:4px 14px">${r.responders.map((t) => contactRow({
        name: t.name, sub: t.headline || t.subjects.join(", "), colorKey: t.id, href: `#/tutor/${encodeURIComponent(t.id)}`,
        wa: waLink(t.waNumber, `Halo Kak ${t.name.split(" ")[0]}, terima kasih sudah tertarik dengan permintaan les ${r.subject} saya di LesIn.`),
        extra: `<button class="icon-btn" data-lesson="${esc(t.id)}" data-subject="${esc(r.subject)}" title="Atur jadwal" aria-label="Atur jadwal les">${ic("calendar")}</button>`,
      })).join("") || `<p class="small muted" style="padding:12px 0">Menunggu tutor… biasanya dalam beberapa jam.</p>`}</div>
    </div>`).join("")}</div>`;
  },
  mount() {
    document.querySelectorAll("[data-lesson]").forEach((b) => (b.onclick = () => lessonSheet({ tutorId: b.dataset.lesson, seekerId: session.user.id, defaultSubject: b.dataset.subject })));
  },
};

/** Kontak: pencari = tutor yang merespons; tutor = permintaan yang sudah dibuka. */
export const contactsView = {
  async load() {
    if (session.mode === "tutor") return { board: (await api.requests.board()).requests.filter((r) => r.unlocked) };
    const reqs = (await api.requests.mine()).requests;
    const seen = new Map();
    for (const r of reqs) for (const t of r.responders) if (!seen.has(t.id)) seen.set(t.id, { t, subject: r.subject });
    return { tutors: [...seen.values()], reviews: await Promise.all([...seen.keys()].map((id) => api.tutors.reviews(id).then((x) => [id, x.reviews.find((v) => v.mine)]))) };
  },
  render(data) {
    if (session.mode === "tutor") {
      const me = session.user.name.split(" ")[0];
      return `<h1>Kontak</h1><p class="sub">Calon murid yang sudah kamu buka kontaknya. Lanjutkan di WhatsApp.</p>
      ${data.board.length ? `<div class="card section" style="padding:4px 14px">${data.board.map((r) => contactRow({
        name: r.contact.name, sub: `${r.subject} ${r.level} · ${r.area} · ${r.contact.phone}`, colorKey: r.id, href: `#/lowongan/${encodeURIComponent(r.id)}`,
        wa: waLink(r.contact.waNumber, `Halo ${r.contact.name}, saya ${me}, tutor ${r.subject} dari LesIn. Saya tertarik dengan kebutuhan les ${r.subject} ${r.level} di ${r.area}. Boleh kita atur jadwal trial?`),
        extra: `<button class="icon-btn" data-lesson-s="${esc(r.contact.seekerId)}" data-subject="${esc(r.subject)}" title="Atur jadwal" aria-label="Atur jadwal les">${ic("calendar")}</button>`,
      })).join("")}</div>` : emptyBox(`Belum ada kontak. Buka kontak calon murid dari <a href="#/board" class="link">Lowongan</a>.`)}`;
    }
    const mineReview = new Map(data.reviews);
    return `<h1>Kontak</h1><p class="sub">Tutor yang sudah merespons permintaanmu. Chat lewat WhatsApp, lalu beri ulasan setelah les.</p>
    ${data.tutors.length ? `<div class="card section" style="padding:4px 14px">${data.tutors.map(({ t, subject }) => contactRow({
      name: t.name, sub: `${t.subjects.slice(0, 2).join(", ")} · ${t.phone}`, colorKey: t.id, href: `#/tutor/${encodeURIComponent(t.id)}`,
      wa: waLink(t.waNumber, `Halo Kak ${t.name.split(" ")[0]}, terima kasih sudah merespons permintaan les ${subject} saya di LesIn. Apakah masih ada jadwal kosong?`),
      extra: `<button class="icon-btn" data-lesson="${esc(t.id)}" data-subject="${esc(subject)}" title="Atur jadwal" aria-label="Atur jadwal les">${ic("calendar")}</button>
        ${mineReview.get(t.id) ? `<span class="chip">${ic("star", "star")}${mineReview.get(t.id).stars}</span>` : `<button class="icon-btn" aria-label="Tulis ulasan" title="Tulis ulasan" data-review="${esc(t.id)}">${ic("starO")}</button>`}`,
    })).join("")}</div>` : emptyBox(`Belum ada kontak. Kirim permintaan dari <a href="#/search" class="link">pencarian</a>.`)}`;
  },
  mount(data) {
    document.querySelectorAll("[data-lesson]").forEach((b) => (b.onclick = () => lessonSheet({ tutorId: b.dataset.lesson, seekerId: session.user.id, defaultSubject: b.dataset.subject })));
    document.querySelectorAll("[data-lesson-s]").forEach((b) => (b.onclick = () => lessonSheet({ tutorId: session.user.id, seekerId: b.dataset.lessonS, defaultSubject: b.dataset.subject })));
    document.querySelectorAll("[data-review]").forEach((b) => (b.onclick = () => reviewSheet(data.tutors.find((x) => x.t.id === b.dataset.review).t, null, () => navigate("#/kontak"))));
  },
};
