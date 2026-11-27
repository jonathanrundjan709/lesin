import { $$, esc } from "./dom.js";
import { ic } from "./icons.js";

/** Segmented control (radio). items: [[nilai, label], ...] */
export const seg = (name, items, val) => `<div class="seg">${items.map(([v, l]) =>
  `<label><input type="radio" name="${name}" value="${esc(v)}" ${String(v) === String(val) ? "checked" : ""}><span>${esc(l)}</span></label>`).join("")}</div>`;

export const back = (href = "javascript:history.back()", attr = "") => `<a class="back" href="${href}" aria-label="Kembali" ${attr}>${ic("back")}</a>`;

export function clearErr(field) {
  if (!field) return;
  field.classList.remove("err");
  field.querySelector(".err-msg")?.remove();
}

/**
 * Tampilkan pesan galat di bawah kolom (bukan popup browser). rules: [{ f: nama data-f, ok, msg }].
 * Mengembalikan true bila semua valid.
 */
export function showErrors(root, rules) {
  $$(".field.err", root).forEach(clearErr);
  let first = null;
  for (const r of rules.filter((x) => !x.ok)) {
    const field = root.querySelector(`[data-f="${r.f}"]`);
    if (!field) continue;
    field.classList.add("err");
    field.insertAdjacentHTML("beforeend", `<span class="err-msg">${ic("alert")}${esc(r.msg)}</span>`);
    first ??= field;
  }
  if (!first) return true;
  first.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => first.querySelector("input:not([type=hidden]):not([type=checkbox]),textarea")?.focus({ preventScroll: true }), 350);
  return false;
}

/** Hubungkan penghapusan galat otomatis saat pengguna mengetik/mengubah kolom. */
export function autoClearErrors(form) {
  const handler = (e) => clearErr(e.target.closest(".field.err"));
  form.addEventListener("input", handler);
  form.addEventListener("change", handler);
}

/** Matikan tombol selama `task` berjalan (mencegah klik ganda). */
export async function withBusy(button, task) {
  button.disabled = true;
  try { return await task(); } finally { button.disabled = false; }
}
