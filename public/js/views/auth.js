import { api } from "../core/api.js";
import { $, $$, esc } from "../core/dom.js";
import { autoClearErrors, showErrors, withBusy } from "../core/forms.js";
import { ic } from "../core/icons.js";
import { navigate, returnTo } from "../core/router.js";
import { applyUser, cvReady, session, setMode } from "../core/session.js";
import { toast } from "../core/toast.js";
import { bindGatePage, gateCard } from "../components/gate.js";

const normPhone = (p) => { const d = String(p).replace(/\D/g, ""); return d.startsWith("62") ? "0" + d.slice(2) : d; };
const validPhone = (p) => /^08\d{8,12}$/.test(normPhone(p));
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

/** Peran yang dipilih di depan ("masuk/daftar sebagai"). Bertahan saat pindah antara tab Masuk dan Daftar. */
const ROLE_KEY = "lesin-auth-role";
const getRole = () => { try { return sessionStorage.getItem(ROLE_KEY) === "tutor" ? "tutor" : "pencari"; } catch { return "pencari"; } };
const setRole = (r) => { try { sessionStorage.setItem(ROLE_KEY, r); } catch { /* abaikan */ } };

const passwordField = (autocomplete) => `<label class="field" data-f="pw"><span class="lbl">Password</span>
  <span class="pw"><input class="input" type="password" name="pw" autocomplete="${autocomplete}" placeholder="Minimal 6 karakter"><button type="button" class="pw-eye" data-eye aria-label="Lihat password">${ic("eye")}</button></span></label>`;

const ROLES = {
  pencari: { icon: "search", title: "Cari guru les", desc: "Daftar gratis, 7 hari pertama bebas buka kontak" },
  tutor: { icon: "cap", title: "Jadi tutor", desc: "Dapatkan murid baru di sekitarmu" },
};

/** Urutan tampil: peran dulu, lalu tab Masuk/Daftar, lalu formulir. Tab adalah satu-satunya penukar Masuk/Daftar. */
function head(mode) {
  const role = getRole();
  return `<div class="auth-head"><img src="/assets/mascot.svg" alt="" width="84" height="84">
    <h1>${mode === "masuk" ? "Masuk ke LesIn" : "Buat akun LesIn"}</h1></div>
  <div class="role-pick" role="radiogroup" aria-label="${mode === "masuk" ? "Masuk sebagai" : "Daftar sebagai"}">
    <span class="lbl">${mode === "masuk" ? "Masuk sebagai" : "Daftar sebagai"}</span>
    <div class="role-grid">${Object.entries(ROLES).map(([k, r]) => `<button type="button" role="radio" aria-checked="${role === k}" class="role-opt ${role === k ? "on" : ""}" data-as="${k}">
      <span class="mi">${ic(r.icon)}</span><b>${r.title}</b><small>${r.desc}</small></button>`).join("")}</div>
  </div>
  <div class="auth-tabs" role="tablist"><a href="/masuk" role="tab" aria-selected="${mode === "masuk"}" class="${mode === "masuk" ? "on" : ""}">Masuk</a><a href="/daftar" role="tab" aria-selected="${mode === "daftar"}" class="${mode === "daftar" ? "on" : ""}">Daftar</a></div>`;
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

/** Setelah akun siap (OTP benar dan nomor ada): terapkan peran yang dipilih, lalu kembali ke halaman yang dituju. */
async function proceed(welcome) {
  const role = getRole();
  setMode(role);
  const to = returnTo.path; returnTo.path = "/";
  if (role === "tutor" && !cvReady()) {
    toast("Lengkapi <b>CV</b> untuk mulai jadi tutor. <b>Cara mengajar</b> boleh dikosongkan.", "info", 5000);
    return navigate("/profile");
  }
  toast(welcome);
  navigate(role === "tutor" || to === "/masuk" || to === "/daftar" || to === "/whatsapp" ? "/" : to);
}

/** Setelah berhasil masuk/verifikasi: akun tanpa nomor WhatsApp wajib menambahkannya dulu (paywall dan penjaga satu trial per nomor). */
async function finish(user, welcome) {
  await applyUser(user);
  if (user.needsPhone) {
    toast("Satu langkah lagi: tambahkan nomor WhatsApp.", "info", 4500);
    return navigate("/whatsapp");
  }
  return proceed(welcome);
}

const maskEmail = (e) => e.replace(/^(.).*(@.*)$/, "$1•••$2");

/** Langkah kode email. Dipakai setelah daftar dan saat masuk dengan email yang belum diverifikasi. */
function otpStep(email, echo, welcome) {
  const o = session.meta.otp;
  const app = $("#app");
  const html = (code) => `<div class="auth-head"><img src="/assets/mascot.svg" alt="" width="84" height="84">
    <h1>Cek emailmu</h1><p class="sub">Kami kirim kode ${o.length} angka ke <b>${esc(maskEmail(email))}</b>. Berlaku ${o.ttlMin} menit.</p></div>
    ${o.demo ? `<div class="info otp-demo">${ic("info")}<span><b>Mode demo:</b> email belum dikirim sungguhan. ${code ? `Kodemu <b class="otp-code">${esc(code)}</b>. <button type="button" class="link" id="otpFill">Isi otomatis</button>` : "Minta kode baru untuk melihatnya di sini."}</span></div>` : ""}
    <form id="otpForm" class="section" novalidate>
      <label class="field" data-f="code"><span class="lbl">Kode verifikasi</span>
        <input class="input otp-input" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="${o.length}" placeholder="${"•".repeat(o.length)}"></label>
      <button class="btn" id="otpGo">Verifikasi</button>
    </form>
    <p class="otp-links small muted"><button type="button" class="link" id="otpResend" disabled></button> · <a href="/daftar" id="otpBack">Ganti email</a></p>`;
  let timer;
  const render = (code) => {
    app.innerHTML = html(code);
    const f = $("#otpForm"); autoClearErrors(f);
    const input = f.querySelector("[name=code]"); input.focus();
    const fill = $("#otpFill"); if (fill) fill.onclick = () => { input.value = code; };
    // Jeda kirim ulang dihitung mundur di tombol.
    const btn = $("#otpResend"); let left = o.resendSec;
    const tick = () => { btn.disabled = left > 0; btn.textContent = left > 0 ? `Kirim ulang (${left})` : "Kirim ulang kode"; if (left-- > 0) timer = setTimeout(tick, 1000); };
    clearTimeout(timer); tick();
    btn.onclick = () => withBusy(btn, async () => {
      try { const r = await api.auth.resend({ email }); toast("Kode baru dikirim."); render(r.echo); }
      catch (err) { toast(esc(err.message), "err"); }
    });
    f.onsubmit = (e) => { e.preventDefault(); withBusy($("#otpGo"), async () => {
      const code = String(new FormData(f).get("code")).replace(/\D/g, "");
      if (!showErrors(f, [{ f: "code", ok: code.length === o.length, msg: `Isi ${o.length} angka kode dari emailmu.` }])) return;
      try {
        const { user } = await api.auth.verify({ email, code });
        clearTimeout(timer);
        await finish(user, welcome);
      } catch (err) { showErrors(f, [{ f: "code", ok: false, msg: err.message }]); }
    }); };
  };
  render(echo);
}

export const loginView = {
  render() {
    return `${head("masuk")}
    <form id="authForm" class="section" novalidate>
      <label class="field" data-f="id"><span class="lbl">Email</span><input class="input" name="id" type="text" inputmode="email" autocomplete="username" placeholder="nama@email.com">
        <span class="hint">Akun lama yang daftar dengan nomor WhatsApp: isi nomornya di sini.</span></label>
      ${passwordField("current-password")}
      <button class="btn" id="authGo">Masuk</button>
    </form>`;
  },
  mount() {
    const f = $("#authForm"); bindHead(f); autoClearErrors(f);
    f.onsubmit = (e) => { e.preventDefault(); withBusy($("#authGo"), async () => {
      const fd = new FormData(f), id = String(fd.get("id")).trim(), pw = fd.get("pw");
      if (!showErrors(f, [{ f: "id", ok: id.length >= 3, msg: "Isi email atau nomor WhatsApp." }, { f: "pw", ok: pw.length > 0, msg: "Isi password." }])) return;
      try {
        const { user } = await api.auth.login({ id, password: pw });
        await finish(user, `Halo, <b>${esc(user.name.split(" ")[0])}</b>. Selamat datang kembali.`);
      } catch (err) {
        if (err.code === "unverified") { // password benar, email belum diverifikasi: minta kode baru lalu lanjut ke langkah kode
          const r = await api.auth.resend({ email: id }).catch(() => ({}));
          return otpStep(id.toLowerCase(), r.echo, "Email terverifikasi. Selamat datang!");
        }
        showErrors(f, [{ f: "pw", ok: false, msg: err.message }]);
      }
    }); };
  },
};

export const signupView = {
  render() {
    return `${head("daftar")}
    <form id="authForm" class="section" novalidate>
      <label class="field" data-f="name"><span class="lbl">Nama lengkap</span><input class="input" name="name" autocomplete="name" placeholder="Nama kamu"></label>
      <label class="field" data-f="email"><span class="lbl">Email</span><input class="input" name="email" type="email" inputmode="email" autocomplete="email" placeholder="nama@email.com">
        <span class="hint">Kami kirim kode verifikasi ke sini. Nomor WhatsApp diisi di langkah berikutnya.</span></label>
      ${passwordField("new-password")}
      <button class="btn" id="authGo">Kirim kode ke email</button>
    </form>`;
  },
  mount() {
    const f = $("#authForm"); bindHead(f); autoClearErrors(f);
    f.onsubmit = (e) => { e.preventDefault(); withBusy($("#authGo"), async () => {
      const fd = new FormData(f), name = fd.get("name").trim().replace(/\s+/g, " "), email = fd.get("email").trim().toLowerCase(), pw = fd.get("pw");
      if (!showErrors(f, [{ f: "name", ok: name.length >= 3, msg: "Isi nama lengkapmu." },
        { f: "email", ok: validEmail(email), msg: "Isi alamat email yang benar." },
        { f: "pw", ok: pw.length >= 6, msg: "Password minimal 6 karakter." }])) return;
      try {
        const r = await api.auth.signup({ name, email, password: pw });
        otpStep(r.email, r.echo, "Akun dibuat. Selamat mencari guru les!");
      } catch (err) { showErrors(f, [{ f: err.code === "conflict" ? "email" : "pw", ok: false, msg: err.message }]); }
    }); };
  },
};

/** Langkah wajib setelah email terverifikasi: nomor WhatsApp. Sekaligus pagar satu trial per nomor. */
export const phoneView = {
  render() {
    const { days, contacts } = session.meta.trial;
    return `<div class="auth-head"><img src="/assets/mascot.svg" alt="" width="84" height="84"><h1>Tambah nomor WhatsApp</h1>
      <p class="sub">Langkah terakhir. Wajib diisi untuk membuka kontak, mengirim permintaan, atau jadi tutor.</p></div>
    <div class="info" style="margin-top:12px">${ic("info")}<span><b>${days} hari gratis, sampai ${contacts} kontak tutor.</b> Satu nomor satu akun, jadi masa gratis hanya sekali per orang. Nomor tidak bisa diganti sendiri dan tidak ditampilkan ke siapa pun sebelum kamu mengizinkan.</span></div>
    <form id="phoneForm" class="section" novalidate>
      <label class="field" data-f="phone"><span class="lbl">Nomor WhatsApp</span><input class="input" name="phone" inputmode="tel" autocomplete="tel" placeholder="08xx-xxxx-xxxx"></label>
      <button class="btn" id="phoneGo">Simpan & mulai</button>
    </form>`;
  },
  mount() {
    if (!session.user.needsPhone) return navigate("/");
    const f = $("#phoneForm"); autoClearErrors(f);
    f.querySelector("[name=phone]").focus();
    f.onsubmit = (e) => { e.preventDefault(); withBusy($("#phoneGo"), async () => {
      const phone = new FormData(f).get("phone");
      if (!showErrors(f, [{ f: "phone", ok: validPhone(phone), msg: "Nomor WhatsApp harus diawali 08, 10–13 angka." }])) return;
      try {
        const { user, trialGranted } = await api.me.setPhone(phone);
        await applyUser(user);
        await proceed(trialGranted ? `Nomor tersimpan. <b>${session.meta.trial.days} hari gratis</b> dimulai.` : "Nomor tersimpan.");
      } catch (err) { showErrors(f, [{ f: "phone", ok: false, msg: err.message }]); }
    }); };
  },
};

/** Ditampilkan menggantikan halaman yang butuh akun. */
export const gateView = {
  render(ctx) { return gateCard({ page: ctx?.page, asSheet: false }); },
  mount() { bindGatePage(); },
};

export const tutorGateView = {
  render() {
    return `<div class="auth-gate"><img src="/assets/mascot.svg" alt="" width="96" height="96"><h2>Halaman untuk tutor</h2>
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
    return `<div class="auth-gate"><img src="/assets/mascot.svg" alt="" width="96" height="96"><h2>${offline ? "Tidak ada koneksi" : "Ada yang tidak beres"}</h2>
      <p class="sub">${esc(e?.message || "Coba muat ulang halaman.")}</p><button class="btn" onclick="location.reload()">Muat ulang</button></div>`;
  },
};
