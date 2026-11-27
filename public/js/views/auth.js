import { api } from "../core/api.js";
import { $, $$, esc } from "../core/dom.js";
import { autoClearErrors, showErrors, withBusy } from "../core/forms.js";
import { ic } from "../core/icons.js";
import { navigate, returnTo } from "../core/router.js";
import { applyUser, cvReady, setMode } from "../core/session.js";
import { toast } from "../core/toast.js";

const normPhone = (p) => { const d = String(p).replace(/\D/g, ""); return d.startsWith("62") ? "0" + d.slice(2) : d; };
const validPhone = (p) => /^08\d{8,12}$/.test(normPhone(p));

/** Peran yang dipilih di depan ("masuk/daftar sebagai"). Bertahan saat pindah antara tab Masuk dan Daftar. */
const ROLE_KEY = "lesin-auth-role";
const getRole = () => { try { return sessionStorage.getItem(ROLE_KEY) === "tutor" ? "tutor" : "pencari"; } catch { return "pencari"; } };
const setRole = (r) => { try { sessionStorage.setItem(ROLE_KEY, r); } catch { /* abaikan */ } };

const passwordField = (autocomplete) => `<label class="field" data-f="pw"><span class="lbl">Password</span>
  <span class="pw"><input class="input" type="password" name="pw" autocomplete="${autocomplete}" placeholder="Minimal 6 karakter"><button type="button" class="pw-eye" data-eye aria-label="Lihat password">${ic("eye")}</button></span></label>`;

const ROLES = {
  pencari: { icon: "search", title: "Cari guru les", desc: "Gratis untuk orang tua dan murid" },
  tutor: { icon: "cap", title: "Jadi tutor", desc: "Dapatkan murid baru di sekitarmu" },
};

/** Urutan tampil: peran dulu, lalu tab Masuk/Daftar, lalu formulir. Tab adalah satu-satunya penukar Masuk/Daftar. */
function head(mode) {
  const role = getRole();
  return `<div class="auth-head"><img src="assets/mascot.svg" alt="" width="84" height="84">
    <h1>${mode === "masuk" ? "Masuk ke LesIn" : "Buat akun LesIn"}</h1></div>
  <div class="role-pick" role="radiogroup" aria-label="${mode === "masuk" ? "Masuk sebagai" : "Daftar sebagai"}">
    <span class="lbl">${mode === "masuk" ? "Masuk sebagai" : "Daftar sebagai"}</span>
    <div class="role-grid">${Object.entries(ROLES).map(([k, r]) => `<button type="button" role="radio" aria-checked="${role === k}" class="role-opt ${role === k ? "on" : ""}" data-as="${k}">
      <span class="mi">${ic(r.icon)}</span><b>${r.title}</b><small>${r.desc}</small></button>`).join("")}</div>
  </div>
  <div class="auth-tabs" role="tablist"><a href="#/masuk" role="tab" aria-selected="${mode === "masuk"}" class="${mode === "masuk" ? "on" : ""}">Masuk</a><a href="#/daftar" role="tab" aria-selected="${mode === "daftar"}" class="${mode === "daftar" ? "on" : ""}">Daftar</a></div>`;
}

function bindHead(form) {
  $$("[data-as]").forEach((b) => (b.onclick = () => {
    setRole(b.dataset.as);
    $$("[data-as]").forEach((x) => { const on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-checked", String(on)); });
  }));
  $$("[data-eye]", form).forEach((b) => (b.onclick = () => {
    const i = b.previousElementSibling;
    i.type = i.type === "password" ? "text" : "password";
    b.classList.toggle("on", i.type === "text");
  }));
}

/** Setelah berhasil masuk/daftar: terapkan peran yang dipilih, lalu kembali ke halaman yang dituju. */
async function finish(user, welcome) {
  await applyUser(user);
  const role = getRole();
  setMode(role);
  const to = returnTo.hash; returnTo.hash = "#/";
  if (role === "tutor" && !cvReady()) {
    toast("Lengkapi <b>CV</b> untuk mulai jadi tutor. <b>Cara mengajar</b> boleh dikosongkan.", "info", 5000);
    return navigate("#/profile");
  }
  toast(welcome);
  navigate(role === "tutor" || to === "#/masuk" || to === "#/daftar" ? "#/" : to);
}

export const loginView = {
  render() {
    return `${head("masuk")}
    <form id="authForm" class="section" novalidate>
      <label class="field" data-f="phone"><span class="lbl">Nomor WhatsApp</span><input class="input" name="phone" inputmode="tel" autocomplete="tel" placeholder="08xx-xxxx-xxxx"></label>
      ${passwordField("current-password")}
      <button class="btn" id="authGo">Masuk</button>
    </form>`;
  },
  mount() {
    const f = $("#authForm"); bindHead(f); autoClearErrors(f);
    f.onsubmit = (e) => { e.preventDefault(); withBusy($("#authGo"), async () => {
      const fd = new FormData(f), phone = fd.get("phone"), pw = fd.get("pw");
      if (!showErrors(f, [{ f: "phone", ok: validPhone(phone), msg: "Isi nomor WhatsApp yang diawali 08." }, { f: "pw", ok: pw.length > 0, msg: "Isi password." }])) return;
      try {
        const { user } = await api.auth.login({ phone, password: pw });
        await finish(user, `Halo, <b>${esc(user.name.split(" ")[0])}</b>. Selamat datang kembali.`);
      } catch (err) { showErrors(f, [{ f: "pw", ok: false, msg: err.message }]); }
    }); };
  },
};

export const signupView = {
  render() {
    return `${head("daftar")}
    <form id="authForm" class="section" novalidate>
      <label class="field" data-f="name"><span class="lbl">Nama lengkap</span><input class="input" name="name" autocomplete="name" placeholder="Nama kamu"></label>
      <label class="field" data-f="phone"><span class="lbl">Nomor WhatsApp</span><input class="input" name="phone" inputmode="tel" autocomplete="tel" placeholder="08xx-xxxx-xxxx">
        <span class="hint">Dipakai untuk masuk. Tidak ditampilkan ke siapa pun sebelum kamu mengizinkan.</span></label>
      ${passwordField("new-password")}
      <button class="btn" id="authGo">Buat akun</button>
    </form>`;
  },
  mount() {
    const f = $("#authForm"); bindHead(f); autoClearErrors(f);
    f.onsubmit = (e) => { e.preventDefault(); withBusy($("#authGo"), async () => {
      const fd = new FormData(f), name = fd.get("name").trim().replace(/\s+/g, " "), phone = fd.get("phone"), pw = fd.get("pw");
      if (!showErrors(f, [{ f: "name", ok: name.length >= 3, msg: "Isi nama lengkapmu." },
        { f: "phone", ok: validPhone(phone), msg: "Nomor WhatsApp harus diawali 08, 10–13 angka." },
        { f: "pw", ok: pw.length >= 6, msg: "Password minimal 6 karakter." }])) return;
      try {
        const { user } = await api.auth.signup({ name, phone, password: pw });
        await finish(user, "Akun dibuat. Selamat mencari guru les!");
      } catch (err) { showErrors(f, [{ f: err.code === "conflict" ? "phone" : "pw", ok: false, msg: err.message }]); }
    }); };
  },
};

/** Ditampilkan menggantikan halaman yang butuh akun. */
export const gateView = {
  render() {
    return `<div class="auth-gate"><img src="assets/mascot.svg" alt="" width="96" height="96"><h2>Masuk dulu yuk</h2>
      <p class="sub">Halaman ini khusus pengguna LesIn. Daftar gratis, tidak sampai satu menit.</p>
      <a class="btn" href="#/masuk">Masuk</a><a class="btn line" href="#/daftar">Daftar gratis</a></div>`;
  },
};

export const tutorGateView = {
  render() {
    return `<div class="auth-gate"><img src="assets/mascot.svg" alt="" width="96" height="96"><h2>Halaman untuk tutor</h2>
      <p class="sub">Beralih ke mode tutor untuk membuka halaman ini.</p><button class="btn" id="goTutor">Beralih ke mode tutor</button></div>`;
  },
  async mount() {
    const { switchMode } = await import("../components/mode-switch.js");
    $("#goTutor").onclick = () => switchMode("tutor");
  },
};

export const errorView = {
  render(e) {
    const offline = e?.code === "network";
    return `<div class="auth-gate"><img src="assets/mascot.svg" alt="" width="96" height="96"><h2>${offline ? "Tidak ada koneksi" : "Ada yang tidak beres"}</h2>
      <p class="sub">${esc(e?.message || "Coba muat ulang halaman.")}</p><button class="btn" onclick="location.reload()">Muat ulang</button></div>`;
  },
};
