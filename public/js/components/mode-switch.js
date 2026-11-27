import { api } from "../core/api.js";
import { $$, esc, $ } from "../core/dom.js";
import { avColor, initials } from "../core/format.js";
import { ic } from "../core/icons.js";
import { cvReady, applyUser, session, setMode } from "../core/session.js";
import { navigate, returnTo } from "../core/router.js";
import { closeSheet, openSheet } from "../core/sheet.js";
import { toast } from "../core/toast.js";

/** Pindah antara mode Pencari dan Tutor. Tutor wajib melengkapi CV dulu. Tamu diarahkan masuk. */
export function switchMode(mode) {
  if (!session.user) {
    returnTo.hash = location.hash || "#/";
    toast(mode === "tutor" ? "Daftar atau masuk dulu untuk jadi tutor." : "Masuk dulu untuk melanjutkan.", "info");
    return navigate("#/masuk");
  }
  if (session.mode === mode) return;
  setMode(mode);
  if (mode === "tutor" && !cvReady()) {
    toast("Lengkapi <b>CV</b> dulu untuk jadi tutor. <b>Cara mengajar</b> boleh dikosongkan.", "info", 5200);
    return navigate("#/profile");
  }
  toast(mode === "tutor" ? "Beralih ke <b>Mode Tutor</b>" : "Beralih ke <b>Mode Pencari</b>", "info");
  navigate("#/");
}

export async function logout() {
  await api.auth.logout().catch(() => {});
  await applyUser(null);
  toast("Kamu sudah keluar.", "info");
  navigate("#/");
}

/** Sheet pilih mode + akun + keluar (opsi 2: ikon kecil di topbar). */
export function modeSheet() {
  const u = session.user;
  const opt = (m, icon, title, desc) => `<button type="button" class="mode-opt ${session.mode === m ? "on" : ""}" data-role="${m}"><span class="mi">${ic(icon)}</span>
    <span class="grow"><b>${title}</b><small>${desc}</small></span>${session.mode === m ? ic("check", "ck") : ""}</button>`;
  openSheet(`<div class="acc-row"><div class="avatar sm" style="background:${avColor(u.id)}">${esc(initials(u.name))}</div><div class="grow"><b>${esc(u.name)}</b><small>${esc(u.phone)}</small></div>
    <button type="button" class="link" id="logoutBtn">Keluar</button></div>
    <h2>Pakai LesIn sebagai</h2><p class="sub" style="margin:4px 0 14px">Kamu bisa pindah kapan saja. Data dan lead tetap tersimpan.</p>
    <div class="stack">${opt("pencari", "search", "Pencari guru les", "Cari tutor untuk anak atau dirimu sendiri. Gratis.")}${opt("tutor", "cap", "Tutor", "Pasang CV dan temukan murid baru")}</div>`, (sh) => {
    $$("[data-role]", sh).forEach((b) => (b.onclick = () => { closeSheet(); switchMode(b.dataset.role); }));
    $("#logoutBtn", sh).onclick = () => { closeSheet(); logout(); };
  });
}

/** Opsi 1: segmented di atas beranda. */
export const modeSegment = () => `<div class="mode-seg" role="group" aria-label="Mode">
  <button type="button" class="${session.mode === "pencari" ? "on" : ""}" data-setrole="pencari">${ic("search")}Cari guru</button>
  <button type="button" class="${session.mode === "tutor" ? "on" : ""}" data-setrole="tutor">${ic("cap")}Jadi tutor</button></div>`;

/** Opsi 3: kartu di bawah beranda. */
export const modeCard = () => session.mode === "pencari"
  ? `<section class="card mode-card section"><img src="assets/mascot.svg" alt="" width="64" height="64"><div class="grow"><h3>Kamu guru les?</h3><p class="small muted">Pasang CV dan dapatkan murid baru.</p></div><button class="btn sm ghost" data-setrole="tutor">Jadi tutor</button></section>`
  : `<section class="card mode-card section"><img src="assets/mascot.svg" alt="" width="64" height="64"><div class="grow"><h3>Cari guru les?</h3><p class="small muted">Beralih ke mode pencari.</p></div><button class="btn sm ghost" data-setrole="pencari">Mode pencari</button></section>`;

/** Pasang klik pada tombol `data-setrole` di dalam `root`. */
export const bindModeSwitch = (root = document) => $$("[data-setrole]", root).forEach((b) => (b.onclick = () => switchMode(b.dataset.setrole)));
