import { $, esc } from "../core/dom.js";
import { closeSheet, openSheet } from "../core/sheet.js";

/**
 * Sheet konfirmasi untuk aksi yang tidak boleh terjadi karena salah pencet.
 * `lines` = [[label, nilai], ...] ringkasan singkat yang akan dikirim/dilakukan.
 * Tombol utama di atas, "kembali" di bawah. Menutup lewat overlay sama dengan membatalkan.
 */
export function confirmSheet({ title, body, lines = [], confirmLabel, cancelLabel = "Batal", onConfirm }) {
  openSheet(`<h2>${esc(title)}</h2>
    ${body ? `<p class="sub" style="margin-top:6px">${body}</p>` : ""}
    ${lines.length ? `<dl class="confirm-lines">${lines.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : ""}
    <button class="btn" id="cfOk" style="margin-top:16px">${esc(confirmLabel)}</button>
    <button class="btn line" id="cfNo" style="margin-top:8px">${esc(cancelLabel)}</button>`, (sh) => {
    $("#cfNo", sh).onclick = closeSheet;
    $("#cfOk", sh).onclick = async (e) => {
      e.currentTarget.disabled = true;
      try { await onConfirm(sh); } finally { if (sh.isConnected) { const b = $("#cfOk", sh); if (b) b.disabled = false; } }
    };
  });
}
