import { esc } from "../core/dom.js";
import { avColor, durLabel, rp } from "../core/format.js";
import { ic } from "../core/icons.js";
import { selection } from "../core/prefs.js";

export const avatarHTML = (t, large = false) => `<div class="avatar ${large ? "lg" : ""} ${t.masked ? "locked" : ""}" style="background:${avColor(t.id)}">
  <span class="ini">${esc(t.initials)}</span>${t.masked ? `<span class="lk">${ic("lock")}</span>` : ""}</div>`;

const shortEdu = (e) => (e.includes("—") ? e.split("—")[1].split("(")[0].split("·")[0].trim() : e);

const locLabel = (t) => (t.reach ? (t.areaLevel === 2 ? "Satu kecamatan · bisa ke rumah" : "Satu kota · bisa ke rumah") : "Online");

export const nameRow = (t, size = "") => `<div class="row" style="gap:4px"><span class="tname ${t.masked ? "masked" : ""}" ${size ? `style="font-size:${size}"` : ""}>${esc(t.name)}</span>
  ${t.verified ? `<span class="verified" title="Identitas terverifikasi">${ic("shield")}</span>` : ""}${t.proBadge ? `<span class="chip acc pro-chip">${ic("bolt")}Pro</span>` : ""}</div>`;

/**
 * Kartu tutor untuk hasil pencarian. `selectable` menambah tombol "Pilih" untuk permintaan ke maksimal 3 tutor.
 * Untuk pratinjau CV sendiri, `preview` mematikan tautan.
 */
export function tutorCard(t, { selectable = false, preview = false, locked = false } = {}) {
  const picked = selection.has(t.id);
  const head = `<div class="row" style="align-items:flex-start;gap:12px">
      ${avatarHTML(t)}
      <div class="grow" style="min-width:0">${nameRow(t)}
        <p class="small" style="color:var(--ink-2);margin-top:2px;line-height:1.35">${esc(t.headline)}</p></div>
      ${t.match ? `<div class="match"><b>${t.match}%</b><span>cocok</span></div>` : ""}
    </div>
    <div class="meta">
      <span>${ic("cap")}${esc(shortEdu(t.education))}</span>
      <span>${ic("clock")}${t.experienceYears} th pengalaman</span>
      <span>${ic("star", "star")}${t.rating ? `${String(t.rating).replace(".", ",")} (${t.reviewCount})` : "Baru"}</span>
      <span>${ic(t.reach ? "pin" : "wifi")}${esc(t.area)} · ${locLabel(t)}</span>
    </div>`;
  const foot = `<div class="divider"></div><div class="row between">
      <div class="chips">${t.subjects.slice(0, 2).map((s) => `<span class="chip">${esc(s)}</span>`).join("")}${t.subjects.length > 2 ? `<span class="chip">+${t.subjects.length - 2}</span>` : ""}</div>
      <div class="price">${rp(t.rate)}<small>/${durLabel(t.rateDurationMin)}</small></div></div>`;
  // Tamu belum boleh membuka CV atau memilih tutor: keduanya membuka paywall "Masuk dulu yuk".
  const pick = !selectable ? "" : locked
    ? `<button type="button" class="btn sm line pick-tutor" data-login>${ic("lock")}Masuk untuk memilih</button>`
    : `<button type="button" class="btn sm ${picked ? "" : "line"} pick-tutor" data-pick="${esc(t.id)}" aria-pressed="${picked}">${ic(picked ? "check" : "plus")}${picked ? "Dipilih" : "Pilih tutor ini"}</button>`;
  const link = preview ? head : locked ? `<button type="button" class="tc-link" data-login>${head}</button>` : `<a class="tc-link" href="/tutor/${encodeURIComponent(t.id)}">${head}</a>`;
  return `<div class="card tcard ${preview ? "" : "tap"}">${link}${foot}${pick}</div>`;
}
