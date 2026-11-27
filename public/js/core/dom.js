/** Helper DOM kecil tanpa dependensi. */
export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
/** Escape teks sebelum disisipkan ke HTML. Semua data dari server/pengguna wajib lewat sini. */
export const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ENTITIES[c]);

export const debounce = (fn, ms = 250) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};
