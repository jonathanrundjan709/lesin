import { api } from "../core/api.js";
import { $, $$, esc } from "../core/dom.js";
import { back } from "../core/forms.js";
import { avColor, rp, waLink } from "../core/format.js";
import { ic } from "../core/icons.js";
import { navigate } from "../core/router.js";
import { cvReady, refreshLeads, session } from "../core/session.js";
import { closeSheet, openSheet, successSheet } from "../core/sheet.js";
import { toast } from "../core/toast.js";
import { cvGate } from "./home.js";
import { bindCopy, contactCard, emptyBox } from "../components/contact.js";
import { requestCard } from "../components/request-card.js";
import { lessonSheet } from "../components/sheets.js";

const BOARD_FILTER = "lesin-board-filter";
const getFilter = () => { try { return localStorage.getItem(BOARD_FILTER) || "Untukku"; } catch { return "Untukku"; } };

/** Papan lowongan untuk tutor. Murni tampilan: kecocokan dan penyamaran sudah dihitung server. */
export const boardView = {
  async load() { return cvReady() ? (await api.requests.board()).requests : null; },
  render(list) {
    if (!list) return `<h1>Lowongan les</h1><div class="section">${cvGate()}</div>`;
    const filt = getFilter();
    const shown = list.filter((r) => filt === "Untukku" ? r.fitsSubject && r.nearby : filt === "Dekat" ? r.nearby : filt === "Semua" ? true : r.subject === filt);
    const chips = ["Untukku", "Dekat", "Semua", ...session.meta.subjects];
    return `<h1>Lowongan les</h1><p class="sub">Murid yang sedang mencari tutor. Buka WhatsApp-nya dengan 1 lead (${rp(session.meta.limits.leadPrice)}). Maksimal ${session.meta.limits.maxResponders} tutor per permintaan.</p>
    <div class="hscroll section" style="margin-top:14px">${chips.map((x) => `<button class="chip ${filt === x ? "pri" : ""}" data-bf="${esc(x)}" style="padding:8px 12px">${esc(x)}</button>`).join("")}</div>
    <div class="stack" style="margin-top:12px">${shown.map((r) => requestCard(r)).join("") || emptyBox("Tidak ada lowongan untuk filter ini.")}</div>`;
  },
  mount(list) {
    if (!list) return;
    $$("[data-bf]").forEach((b) => (b.onclick = () => { try { localStorage.setItem(BOARD_FILTER, b.dataset.bf); } catch { /* abaikan */ } navigate("#/board"); }));
  },
};

/** Sheet konfirmasi: tampilkan biaya (1 lead) dan sisa saldo sebelum membuka. */
function unlockSheet(r, onDone) {
  const l = session.leads;
  const empty = !l || l.leads < 1;
  openSheet(`<h2>Buka WhatsApp calon murid</h2>
    <p class="sub" style="margin-top:4px">Nama lengkap & nomor WhatsApp <b>${esc(r.owner)}</b> akan terbuka. Pemilik permintaan juga melihat CV-mu.</p>
    <div class="quota-box"><span class="mi">${ic("ticket")}</span><span class="grow"><b>${empty ? "Lead kamu habis" : "Pakai 1 lead"}</b>
      <small>${empty ? `Beli lead mulai ${rp(15000)} atau Tutor Plan.` : `Sisa setelah ini: ${l.leads - 1} lead`}</small></span></div>
    <button class="btn" id="useLead" style="margin-top:16px">${empty ? "Beli lead" : "Buka kontak"}</button>`, (sh) => {
    $("#useLead", sh).onclick = async (e) => {
      if (empty) { closeSheet(); return navigate("#/wallet"); }
      e.currentTarget.disabled = true;
      try {
        const res = await api.requests.unlock(r.id);
        await refreshLeads();
        successSheet(sh, { title: "Kontak terbuka", text: `Nama & WhatsApp ${esc(res.contact.name)} tersimpan di menu Kontak.`, cta: "Lihat kontak", onDone });
      } catch (err) {
        if (err.code === "payment_required") { closeSheet(); toast("Lead habis. Beli lead dulu.", "info"); return navigate("#/wallet"); }
        e.currentTarget.disabled = false; toast(esc(err.message), "err");
      }
    };
  });
}

/** Detail lowongan + tombol buka kontak. */
export const lowonganView = {
  async load({ id }) { return cvReady() ? (await api.requests.detail(id)).request : null; },
  render(r) {
    if (!r) return `<h1>Lowongan les</h1><div class="section">${cvGate()}</div>`;
    const me = session.user.name.split(" ")[0];
    const wa = r.contact ? waLink(r.contact.waNumber, `Halo ${r.contact.name}, saya ${me}, tutor ${r.subject} dari LesIn. Saya tertarik dengan kebutuhan les ${r.subject} ${r.level} di ${r.area}. Boleh kita atur jadwal trial?`) : "";
    const fits = r.fitsSubject;
    return `<div class="row" style="margin-bottom:12px">${back()}<h2 class="grow">Detail lowongan</h2></div>
    ${requestCard(r, "detail")}
    ${r.notes ? `<div class="card section"><h3 class="cap-title">Catatan</h3><p class="sub" style="margin-top:6px">${esc(r.notes)}</p></div>` : ""}
    ${r.unlocked
      ? `<div class="section">${contactCard({ color: avColor(r.id), name: r.contact.name, note: `${esc(r.subject)} ${esc(r.level)} · ${esc(r.area)}`, rows: [["WhatsApp", r.contact.phone, true], ["Daerah", r.area]], wa })}</div>
         <button class="btn line" id="lessonBtn" style="margin-top:10px">${ic("calendar")}Atur jadwal les</button>`
      : `<div class="info section">${ic("info")}<span>${fits ? "Cocok dengan mapel & jenjang di CV-mu." : "Mapel/jenjang ini belum ada di CV-mu, peluang dipilih lebih kecil."} Setelah kamu buka kontak, CV-mu juga terkirim ke pencari.</span></div>
         <div style="height:70px"></div>
         <div class="sticky-cta">${r.slotsLeft
           ? `<button class="btn" id="contactBtn">${ic("unlock")}Buka WhatsApp ${esc(r.owner)} · 1 lead</button>`
           : `<button class="btn" disabled>Permintaan sudah penuh (${session.meta.limits.maxResponders} tutor)</button>`}</div>`}`;
  },
  mount(r) {
    if (!r) return;
    bindCopy();
    const b = $("#contactBtn"); if (b) b.onclick = () => unlockSheet(r, () => navigate("#/kontak"));
    const les = $("#lessonBtn"); if (les) les.onclick = () => lessonSheet({ tutorId: session.user.id, seekerId: r.contact.seekerId, defaultSubject: r.subject });
  },
};

