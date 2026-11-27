import { $ } from "../core/dom.js";
import { ic } from "../core/icons.js";
import { navigate, returnTo } from "../core/router.js";
import { closeSheet, openSheet } from "../core/sheet.js";

/**
 * Paywall untuk tamu. Sengaja ringkas: satu ikon, satu kalimat, dua tombol sejajar (Masuk | Daftar gratis).
 * Setelah masuk, pengguna kembali ke halaman ini.
 */
export function loginPrompt() {
  openSheet(`<div class="gate-sheet">
    <span class="gate-ic">${ic("lock")}</span>
    <h2>Masuk dulu untuk lanjut</h2>
    <p class="sub">Buka CV lengkap tutor dan kirim permintaan les. Gratis untuk orang tua dan murid.</p>
    <div class="gate-actions"><button class="btn line" id="gateLogin">Masuk</button><button class="btn" id="gateJoin">Daftar gratis</button></div>
    <button class="link gate-later" id="gateLater">Nanti saja</button></div>`, (sh) => {
    const go = (hash) => { returnTo.hash = location.hash || "#/"; closeSheet(); navigate(hash); };
    $("#gateJoin", sh).onclick = () => go("#/daftar");
    $("#gateLogin", sh).onclick = () => go("#/masuk");
    $("#gateLater", sh).onclick = closeSheet;
  });
}
