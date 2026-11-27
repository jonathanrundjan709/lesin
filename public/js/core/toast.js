import { ic } from "./icons.js";
import { $ } from "./dom.js";

let timer;
/** Notifikasi singkat di kanan atas. `html` boleh berisi markup tepercaya; data pengguna harus sudah di-escape. */
export function toast(html, type = "ok", ms = 3400) {
  const el = $("#toast");
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="t-ic">${ic(type === "err" ? "alert" : type === "info" ? "info" : "check")}</span><span class="t-tx">${html}</span>`;
  requestAnimationFrame(() => el.classList.add("show"));
  clearTimeout(timer);
  timer = setTimeout(() => el.classList.remove("show"), ms);
}
