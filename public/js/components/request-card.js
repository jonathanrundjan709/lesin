import { esc } from "../core/dom.js";
import { agoText, durLabel, rp, scheduleText } from "../core/format.js";
import { ic } from "../core/icons.js";
import { mono } from "./mono.js";

/**
 * Kartu permintaan les. kind: "board" (tutor melihat lowongan), "detail" (halaman lowongan), "own" (milik pencari).
 * `r` adalah RequestView/BoardRequestView/SeekerRequestView dari server.
 */
export function requestCard(r, kind = "board") {
  const link = kind === "board";
  const owner = kind === "own" ? "Kamu" : r.owner;
  const badge = r.unlocked ? `<span class="chip">${ic("check")}Dihubungi</span>`
    : r.targeted ? `<span class="chip pri">${ic("user")}Untukmu</span>`
    : r.boostDays ? `<span class="chip pri">${ic("bolt")}Boost</span>`
    : Date.now() - r.createdAt < 6 * 3_600_000 ? `<span class="chip acc">Baru</span>` : "";
  const mode = r.mode === "online" ? "Online" : "Ke rumah";
  const footer = kind === "board"
    ? `<div class="row between" style="margin-top:10px"><span class="small muted">${r.contacted} tutor menghubungi · ${r.slotsLeft ? `sisa ${r.slotsLeft} slot` : "penuh"}</span>
        ${r.nearby && r.mode !== "online" ? `<span class="chip">${ic("pin")}Satu kota denganmu</span>` : ""}</div>` : "";
  return `<${link ? "a" : "div"} class="card ${link ? "tap" : ""}" ${link ? `href="#/lowongan/${encodeURIComponent(r.id)}"` : ""}>
    <div class="post-top">
      <div class="row" style="gap:12px;align-items:flex-start">${mono(r.subject, "md")}
        <div><h3>${esc(r.subject)} · ${esc(r.level)}</h3><p class="small muted" style="margin-top:2px">${esc(owner)} · ${agoText(r.createdAt)}</p></div></div>
      ${badge}
    </div>
    <p class="sub" style="margin-top:10px;font-size:13px">${esc(r.studentNote)}</p>
    <div class="post-meta">
      <div><span>Daerah</span><b>${esc(r.area)}</b></div>
      <div><span>Budget / ${durLabel(r.durationMin)}</span><b>${rp(r.budget)}</b></div>
      <div><span>Jadwal</span><b>${esc(scheduleText(r.schedule))}</b></div>
      <div><span>Mode · Kurikulum</span><b>${mode} · ${esc(r.curriculum || "Bebas")}</b></div>
    </div>${footer}
  </${link ? "a" : "div"}>`;
}
