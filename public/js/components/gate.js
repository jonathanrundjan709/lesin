import { $ } from "../core/dom.js";
import { ic } from "../core/icons.js";
import { currentPath, navigate, returnTo } from "../core/router.js";
import { closeSheet, openSheet } from "../core/sheet.js";
import { esc } from "../core/dom.js";

const PERKS = [
  "Baca CV lengkap, pendidikan, dan ulasan tutor",
  "7 hari gratis: buka sampai 10 kontak tutor",
  "Kirim permintaan gratis, tutor yang menghubungimu",
];

/** Copy per halaman yang butuh akun: judul + satu kalimat yang menjelaskan apa yang didapat setelah masuk. */
export const GATE_COPY = {
  default: { title: "Masuk dulu yuk", text: "Simpan permintaan, kontak tutor, dan jadwal lesmu di satu tempat. Daftar gratis, kurang dari satu menit." },
  tutor: { title: "Buka CV lengkap tutor", text: "Lihat pendidikan, pengalaman, dan ulasan orang tua lain. Daftar gratis, 7 hari pertama bebas buka kontak." },
  post: { title: "Siap cari guru les?", text: "Buat akun dulu supaya tutor yang cocok bisa menghubungimu lewat WhatsApp. Kirim permintaan selalu gratis." },
  myposts: { title: "Pantau permintaanmu", text: "Masuk untuk melihat permintaan les dan tutor yang sudah merespons." },
  kontak: { title: "Kontak tutormu", text: "Masuk untuk melihat tutor yang sudah merespons dan lanjut ngobrol lewat WhatsApp." },
  les: { title: "Lesson hub", text: "Masuk untuk mengatur jadwal mingguan, pengingat WhatsApp, dan catatan sesi les." },
  profile: { title: "Jadi tutor di LesIn", text: "Buat akun lalu lengkapi CV-mu. Tutor pertama dapat 2 lead gratis." },
  board: { title: "Lowongan untuk tutor", text: "Masuk dan lengkapi CV untuk melihat murid yang sedang mencari guru di sekitarmu." },
};
const copyFor = (page) => GATE_COPY[page] ?? ((["wallet", "harga", "riwayat", "lowongan"].includes(page)) ? GATE_COPY.board : GATE_COPY.default);

/** Kartu gerbang: owl, judul, penjelasan, manfaat, lalu Daftar gratis (utama) dan Masuk (sekunder). Dipakai di sheet dan halaman. */
export function gateCard({ page, asSheet }) {
  const c = copyFor(page);
  return `<div class="auth-gate gate-owl ${asSheet ? "sheet-gate" : ""}"><img src="/assets/mascot.svg" alt="" width="${asSheet ? 80 : 96}" height="${asSheet ? 80 : 96}">
    <h2>${esc(c.title)}</h2><p class="sub">${esc(c.text)}</p>
    <ul class="gate-perks">${PERKS.map((p) => `<li>${ic("check")}${esc(p)}</li>`).join("")}</ul>
    <button class="btn" data-gate="/daftar">Daftar gratis</button>
    <button class="btn line" data-gate="/masuk">Sudah punya akun? Masuk</button>
    ${asSheet ? `<button class="link gate-later" data-gate-close>Nanti saja</button>` : ""}</div>`;
}

/** Paywall untuk tamu di dalam sheet. Setelah masuk, pengguna kembali ke halaman ini. */
export function loginPrompt(page = "tutor") {
  openSheet(gateCard({ page, asSheet: true }), (sh) => {
    sh.querySelectorAll("[data-gate]").forEach((b) => (b.onclick = () => { returnTo.path = currentPath(); closeSheet(); navigate(b.dataset.gate); }));
    $("[data-gate-close]", sh).onclick = closeSheet;
  });
}

/** Pasang klik pada tombol gerbang di halaman (bukan sheet). returnTo sudah diisi router. */
export const bindGatePage = () => document.querySelectorAll("[data-gate]").forEach((b) => (b.onclick = () => navigate(b.dataset.gate)));
