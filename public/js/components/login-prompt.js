import { $ } from "../core/dom.js";
import { ic } from "../core/icons.js";
import { navigate, returnTo } from "../core/router.js";
import { closeSheet, openSheet } from "../core/sheet.js";

/**
 * Paywall untuk tamu: CV dan pilih tutor butuh akun. Daftar gratis. Setelah masuk, pengguna kembali ke halaman ini.
 * Daftar dan Masuk tidak diulang di sini: satu tombol utama + satu tautan ke halaman masuk.
 */
export function loginPrompt() {
  openSheet(`<div class="auth-gate sheet-gate"><img src="assets/mascot.svg" alt="" width="80" height="80"><h2>Masuk dulu yuk</h2>
    <p class="sub">Daftar gratis untuk membuka CV lengkap tutor dan mengirim permintaan les. Orang tua dan murid tidak pernah membayar.</p>
    <ul class="gate-perks"><li>${ic("check")}Baca CV lengkap, pendidikan, dan ulasan</li><li>${ic("check")}Kirim permintaan ke 1–3 tutor</li><li>${ic("check")}Tutor yang tertarik menghubungimu lewat WhatsApp</li></ul>
    <button class="btn" id="gateJoin">Daftar gratis</button>
    <button class="btn line" id="gateLogin">Sudah punya akun? Masuk</button></div>`, (sh) => {
    const go = (hash) => { returnTo.hash = location.hash || "#/"; closeSheet(); navigate(hash); };
    $("#gateJoin", sh).onclick = () => go("#/daftar");
    $("#gateLogin", sh).onclick = () => go("#/masuk");
  });
}
