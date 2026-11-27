import { $$, esc } from "../core/dom.js";
import { avColor, initials } from "../core/format.js";
import { ic } from "../core/icons.js";
import { toast } from "../core/toast.js";

/** Kartu kontak yang sudah terbuka: nomor, tombol salin, dan tombol WhatsApp. */
export function contactCard({ color, name, rows, wa, note }) {
  return `<div class="card contact-card">
    <div class="cc-head"><div class="avatar sm" style="background:${color}">${esc(initials(name))}</div>
      <div class="grow"><b>${esc(name)}</b><p class="small muted">${note}</p></div><span class="cc-badge">${ic("unlock")}Terbuka</span></div>
    <dl class="cc-rows">${rows.map(([k, v, copy]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}${copy ? `<button class="icon-btn xs" data-copy="${esc(v)}" aria-label="Salin">${ic("copy")}</button>` : ""}</dd></div>`).join("")}</dl>
    <a class="btn wa" href="${wa}" target="_blank" rel="noopener">${ic("wa")}Chat via WhatsApp</a>
  </div>`;
}

/** Baris kontak ringkas untuk daftar. `extra` = HTML tambahan (tombol) sebelum tombol WA. */
export function contactRow({ name, sub, colorKey, wa, href, extra = "" }) {
  return `<div class="contact-row">
    <a href="${href}" class="row grow" style="min-width:0;gap:10px"><div class="avatar sm" style="background:${avColor(colorKey)}">${esc(initials(name))}</div>
      <div style="min-width:0"><b class="small">${esc(name)}</b><div class="last">${esc(sub)}</div></div></a>
    ${extra}<a class="btn sm wa" href="${wa}" target="_blank" rel="noopener">${ic("wa")}WA</a>
  </div>`;
}

/** Pasang perilaku tombol salin nomor. */
export function bindCopy(root = document) {
  $$("[data-copy]", root).forEach((b) => (b.onclick = () => {
    const txt = b.dataset.copy;
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast("Nomor disalin"), () => toast(`Nomor: ${esc(txt)}`, "info"));
  }));
}

export const emptyBox = (html) => `<div class="empty"><img class="empty-mascot" src="assets/mascot.svg" alt="" width="84" height="84">${html}</div>`;
