import { $ } from "./core/dom.js";
import { ic } from "./core/icons.js";
import { currentRoute } from "./core/router.js";
import { cvReady, session } from "./core/session.js";
import { ui } from "./core/prefs.js";

const NAV = {
  pencari: [["", "home", "Beranda"], ["search", "search", "Cari"], ["post", "plus", "Posting", true], ["kontak", "users", "Kontak"], ["myposts", "board", "Postinganku"]],
  tutor: [["", "home", "Beranda"], ["board", "board", "Lowongan"], ["profile", "user", "CV Saya"], ["kontak", "users", "Kontak"], ["wallet", "wallet", "Lead"]],
};
/** Halaman anak yang menyorot tab induknya. */
const ACTIVE = { tutor: "search", results: "search", lowongan: "board", les: "" };

/** Topbar (tombol mode, pil lead/masuk) dan navigasi bawah. Dipanggil setiap selesai render. */
export function renderChrome() {
  const rb = $("#roleBtn");
  rb.hidden = ui.sw !== "2" || !session.user;
  rb.innerHTML = `${ic(session.mode === "tutor" ? "cap" : "user")}<span class="mdot"></span>`;
  rb.setAttribute("aria-label", session.mode === "tutor" ? "Mode tutor, ganti mode" : "Mode pencari, ganti mode");

  $("#footAuth").hidden = Boolean(session.user);
  const pill = $("#walletPill");
  if (!session.user) { pill.hidden = false; pill.href = "/masuk"; pill.innerHTML = `${ic("user")}Masuk`; }
  else if (session.mode === "tutor" && cvReady() && session.leads) { pill.hidden = false; pill.href = "/wallet"; pill.innerHTML = `${ic("ticket")}${session.leads.leads} lead`; }
  else if (session.mode === "pencari" && session.contact) { pill.hidden = false; pill.href = "/kuota"; pill.innerHTML = `${ic("ticket")}${session.contact.credits} kuota`; }
  else pill.hidden = true;

  const { page } = currentRoute();
  const active = page in ACTIVE ? ACTIVE[page] : page;
  $("#nav").innerHTML = NAV[session.mode].map(([p, i, l, center]) => `
    <a href="/${p}" class="${active === p ? "on" : ""} ${center ? "center" : ""}">${center ? `<span class="ic">${ic(i)}</span>` : ic(i)}${l}</a>`).join("");
}
