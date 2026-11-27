/* ============ LesIn — MVP marketplace tutor ↔ murid ============
   Semua data disimpan di localStorage (belum ada backend).
   Pembayaran = simulasi. Kontak lanjut lewat WhatsApp (tanpa chat in-app).
   Pencari membeli KUOTA buka kontak dalam paket; tutor membayar per lowongan. */

// ---------- helpers ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const rp = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");
const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const now = () => Date.now();
const uid = () => Math.random().toString(36).slice(2, 9);

const ICON = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  wallet: '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18M16 15h2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  board: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill="currentColor" stroke="none"/>',
  starO: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  cap: '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  wifi: '<path d="M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0"/><circle cx="12" cy="19" r="1"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  swap: '<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2 .8 3.5 3 3.5 6"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  filter: '<path d="M3 5h18M6 12h12M10 19h4"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
  bank: '<path d="M3 10 12 4l9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  idcard: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.5-1.5 1.7-2 3-2s2.5.5 3 2M15 10h3M15 13h3"/>',
  doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  wa: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8c-1-.5-1.8-1.3-2.3-2.3l.8-1-1-2z"/>',
  megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM15 8a5 5 0 0 1 0 8M18 5a9 9 0 0 1 0 14"/>',
  chevR: '<path d="m9 6 6 6-6 6"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.2"/>',
  ticket: '<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6v12" stroke-dasharray="2 2"/>',
};
const ic = (n, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;

// Tile mapel: singkatan tipografis, bukan emoji
const SUBJ_ABBR = { "Matematika": "MTK", "Fisika": "FIS", "Kimia": "KIM", "Biologi": "BIO", "Bahasa Inggris": "ENG", "Calistung": "ABC",
  "UTBK / SNBT": "UTBK", "Coding": "</>", "Piano": "PNO", "Akuntansi": "AKT", "Bahasa Mandarin": "中文" };
const subjAbbr = (s) => SUBJ_ABBR[s] || s.replace(/[^A-Za-z ]/g, "").split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 3).toUpperCase() || "?";
const AV_COLORS = ["#5B4BFF", "#12A16B", "#E0662B", "#D9467A", "#0E8FB8", "#8B5CF6", "#B7791F", "#3A2CC7"];
const avColor = (id) => AV_COLORS[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length];
const mono = (s, cls = "") => `<span class="mono ${cls}" style="--c:${avColor(s)}">${esc(subjAbbr(s))}</span>`;
const initials = (n) => n.split(" ").slice(0, 2).map((w) => w[0]).join("");
const maskName = (n) => n.split(" ").map((w) => w[0] + "•".repeat(Math.max(3, w.length - 1))).join(" ");
const maskOwner = (n) => { const [a, ...b] = n.split(" "); return a + " " + b.map((w) => (w.startsWith("(") ? w : w[0] + "•••")).join(" "); };
const waLink = (phone, text) => `https://wa.me/62${String(phone).replace(/\D/g, "").replace(/^0/, "")}?text=${encodeURIComponent(text)}`;
const stars = (n) => `<span class="stars">${[1, 2, 3, 4, 5].map((i) => ic(i <= n ? "star" : "starO")).join("")}</span>`;
const minPerContact = () => Math.min(...PRICE.UNLOCK_PACKS.map((p) => p.price / p.n));

// Tanpa radius: 2 = satu kecamatan, 1 = satu kota/kabupaten, 0 = beda kota.
const areaLevel = (a, b) => (a === b ? 2 : AREAS[a] && AREAS[a] === AREAS[b] ? 1 : 0);
// Tarif selalu dibandingkan per jam, supaya sesi 60/90/120 menit adil.
const DURS = [[60, "1 jam"], [90, "1,5 jam"], [120, "2 jam"]];
const durLabel = (d) => (d === 60 ? "jam" : d === 90 ? "90 menit" : d === 120 ? "2 jam" : d + " menit");
const perHour = (rate, dur) => (rate / (dur || 90)) * 60;
TUTORS.forEach((t) => { t.dur = t.dur || 90; });
const DAYS_FULL = { Sen: "Senin", Sel: "Selasa", Rab: "Rabu", Kam: "Kamis", Jum: "Jumat", Sab: "Sabtu", Min: "Minggu" };
const fmtT = (t) => String(t).replace(":", ".");
const addMin = (t, m) => { const [h, mi] = t.split(":").map(Number); const x = h * 60 + mi + m; return String(Math.floor(x / 60) % 24).padStart(2, "0") + "." + String(x % 60).padStart(2, "0"); };

// Opsi tampilan untuk dicoba lewat URL: ?sw=1|2|3 (tempat ganti mode) dan ?copy=A|B|C|D (teks hero). Tersimpan di browser.
const UI = (() => {
  let o = {};
  try {
    o = JSON.parse(localStorage.getItem("lesin-ui") || "{}");
    const q = new URLSearchParams(location.search);
    ["sw", "copy"].forEach((k) => { if (q.get(k)) o[k] = q.get(k); });
    localStorage.setItem("lesin-ui", JSON.stringify(o));
  } catch {}
  return { sw: ["1", "2", "3"].includes(o.sw) ? o.sw : "2", copy: ["A", "B", "C", "D"].includes((o.copy || "").toUpperCase()) ? o.copy.toUpperCase() : "A" };
})();
const HERO_COPY = {
  A: ["Cari guru les", "Temukan guru les yang pas untuk anakmu.", "Baca CV tutor dulu, gratis. Bayar hanya saat kamu siap menghubungi."],
  B: ["Les di rumah", "Les di rumah, tanpa ribet.", "Pilih tutor terverifikasi di sekitarmu, lalu lanjut chat lewat WhatsApp."],
  C: ["Cari guru les", "Cari guru les yang cocok, bukan asal dekat.", "Lihat CV lengkap dan rating dulu. Kontak dibuka kalau kamu sudah yakin."],
  D: ["Guru les terpercaya", "Guru les terpercaya, dekat dari rumah.", "Semua CV bisa dibaca gratis. Kamu bayar hanya saat membuka kontak tutor."],
};

// ---------- state ----------
const KEY = "lesin-mvp-v4";
// Akun (demo): disimpan di browser, belum ada server. Data tiap akun terpisah.
const ACC_KEY = "lesin-accounts", SES_KEY = "lesin-session";
const readAcc = () => { try { return JSON.parse(localStorage.getItem(ACC_KEY) || "[]"); } catch { return []; } };
let SESSION = (() => { try { const id = localStorage.getItem(SES_KEY) || ""; return readAcc().some((a) => a.id === id) ? id : ""; } catch { return ""; } })();
const me = () => readAcc().find((a) => a.id === SESSION);
const keyFor = (id = SESSION) => KEY + ":" + (id || "guest");
const normPhone = (p) => { const d = String(p).replace(/\D/g, ""); return d.startsWith("62") ? "0" + d.slice(2) : d; };
const validPhone = (p) => /^08\d{8,12}$/.test(normPhone(p));
async function hashPw(pw, salt) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + ":" + pw));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
let authNext = "#/";
const DEFAULT_SEARCH = { area: "Tebet", subject: "Matematika", level: "", curr: "", mode: "any", budget: 150000, dur: 90, gender: "any", sort: "match" };
const DEFAULT_STATE = {
  role: "pencari",
  balance: 0,
  credits: 1,                 // kuota buka kontak (1 gratis untuk akun baru)
  unlocked: [],
  contactedPosts: [],
  myPosts: [],
  newInterest: 0,
  reviews: {},
  customSubjects: [],
  tx: [],
  search: { ...DEFAULT_SEARCH },
  profile: {
    name: "", phone: "", headline: "", area: "Tebet", rate: 100000, dur: 60, cvDone: false, subjects: ["Matematika"], levels: ["SMP"], curricula: ["Merdeka"],
    edu: "", exp: 1, bio: "", achievements: "", online: true, offline: true, pro: false, docs: [],
  },
};
let S = load();
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(keyFor()) || "{}");
    const st = Object.assign(structuredClone(DEFAULT_STATE), saved);
    st.search = Object.assign({ ...DEFAULT_SEARCH }, saved.search || {});
    st.profile = Object.assign(structuredClone(DEFAULT_STATE.profile), saved.profile || {});
    if (!AREAS[st.search.area]) st.search.area = DEFAULT_SEARCH.area;
    if (!AREAS[st.profile.area]) st.profile.area = DEFAULT_STATE.profile.area;
    return st;
  } catch { return structuredClone(DEFAULT_STATE); }
}
const save = () => localStorage.setItem(keyFor(), JSON.stringify(S));
const addTx = (label, amount) => { S.tx.unshift({ id: uid(), label, amount, t: now() }); };
const allSubjects = () => [...SUBJECTS, ...S.customSubjects];
// Filter tambahan yang sedang aktif (di luar daerah & mapel)
const activeFilters = (s) => [s.level, s.curr, s.mode !== "any", s.budget !== DEFAULT_SEARCH.budget || s.dur !== DEFAULT_SEARCH.dur, s.gender !== "any"].filter(Boolean).length;

// ---------- matching ----------
function matchTutors(f) {
  return TUTORS.map((t) => {
    const lvl = areaLevel(f.area, t.area), d = 2 - lvl;
    const reach = t.offline && lvl > 0;
    const modeOk = f.mode === "online" ? t.online : f.mode === "offline" ? reach : reach || t.online;
    const ok = (!f.subject || t.subjects.includes(f.subject)) && (!f.level || t.levels.includes(f.level))
      && (!f.curr || t.curricula.includes(f.curr)) && modeOk && (f.gender === "any" || t.gender === f.gender) && perHour(t.rate, t.dur) <= perHour(f.budget, f.dur) * 1.25;
    let score = 52;
    score += f.subject && t.subjects[0] === f.subject ? 10 : 5;
    score += reach ? (lvl === 2 ? 18 : 10) : 6;
    score += perHour(t.rate, t.dur) <= perHour(f.budget, f.dur) ? 10 : 2;
    score += Math.round((t.rating - 4.5) * 14);
    score += Math.min(t.exp, 8);
    if (t.verified) score += 3;
    return { t, d, reach, same: lvl === 2, ok, score: Math.min(99, score) };
  }).filter((r) => r.ok);
}
function sortResults(list, by) {
  const fn = { match: (a, b) => b.score - a.score, dist: (a, b) => a.d - b.d, price: (a, b) => perHour(a.t.rate, a.t.dur) - perHour(b.t.rate, b.t.dur), rating: (a, b) => b.t.rating - a.t.rating }[by] || ((a, b) => b.score - a.score);
  return list.sort(fn);
}
const isUnlocked = (id) => S.unlocked.includes(id);
const locLabel = (r) => (r.reach ? (r.same ? "Satu kecamatan · bisa ke rumah" : "Satu kota · bisa ke rumah") : "Online");

// ---------- sheet ----------
function openSheet(html, onMount) {
  const root = $("#sheet-root");
  root.innerHTML = `<div class="overlay"></div><div class="sheet"><div class="grab"></div>${html}</div>`;
  root.onclick = (e) => { if (e.target.matches(".overlay")) closeSheet(); };
  onMount && onMount($(".sheet", root));
}
function closeSheet() { $("#sheet-root").innerHTML = ""; }
function successSheet(sh, title, text, cta = "Selesai") {
  sh.innerHTML = `<div class="grab"></div><div class="success"><div class="ck">${ic("check")}</div><h2>${esc(title)}</h2>
    <p class="sub" style="margin-top:6px">${text}</p></div>
    <button class="btn" id="doneBtn" style="margin-top:18px">${cta}</button>`;
  $("#doneBtn", sh).onclick = () => { closeSheet(); render(); };
}

// ---------- custom picker (pengganti <select> bawaan HP) ----------
const PK = {};
function picker(name, label, value, cfg) {
  PK[name] = cfg;
  const shown = value || cfg.blank || cfg.placeholder || "Pilih";
  return `<div class="field" data-f="${name}"><span class="lbl">${label}</span>
    <button type="button" class="input picker ${value || cfg.blank ? "" : "ph"}" data-pk="${name}" data-label="${esc(label)}">
      ${cfg.mono && value ? mono(value, "xs") : ""}<span class="pv">${esc(shown)}</span>${ic("chev")}</button>
    <input type="hidden" name="${name}" value="${esc(value || "")}"></div>`;
}
function bindPickers() { $$("[data-pk]").forEach((b) => (b.onclick = () => openPicker(b))); }
function openPicker(btn) {
  const cfg = PK[btn.dataset.pk], hidden = btn.nextElementSibling, cur = hidden.value;
  // groups: [{title, items}] — dipakai daerah (Jabodetabek dulu, lalu kota lain)
  const groups = cfg.groups ? cfg.groups() : [{ title: "", items: cfg.options() }];
  const all = groups.filter((g) => !g.soon).flatMap((g) => g.items);
  const optHTML = (list) => list.map((v) => `<button type="button" class="opt ${v === cur ? "on" : ""}" data-v="${esc(v)}">
      ${cfg.mono && v ? mono(v, "xs") : ""}<span>${esc(v || cfg.blank)}</span>${v === cur ? ic("check", "ck") : ""}</button>`).join("");
  const listHTML = (q = "") => {
    const blank = cfg.blank && !q ? `<div class="opt-grid ${cfg.cols === 1 ? "one" : ""}">${optHTML([""])}</div>` : "";
    const body = groups.map((g) => {
      const items = g.items.filter((v) => v.toLowerCase().includes(q));
      if (!items.length) return "";
      const grid = g.soon ? items.map((v) => `<span class="opt dis"><span>${esc(v)}</span></span>`).join("") : optHTML(items);
      return `${g.title ? `<p class="opt-group">${esc(g.title)}${g.soon ? ` <em class="soon">Segera hadir</em>` : ""}</p>` : ""}<div class="opt-grid ${cfg.cols === 1 ? "one" : ""}">${grid}</div>`;
    }).join("");
    return blank + (body || `<p class="small muted" style="padding:8px 2px">Tidak ditemukan. Tambahkan di bawah.</p>`);
  };
  openSheet(`
    <div class="row between" style="margin-bottom:12px"><h2>${esc(btn.dataset.label)}</h2><button type="button" class="link" data-x>Tutup</button></div>
    ${cfg.search ? `<input class="input" id="pkSearch" placeholder="${cfg.searchHint || `Cari ${esc(btn.dataset.label.toLowerCase())}…`}" style="margin-bottom:12px">` : ""}
    <div class="opt-scroll" id="pkList">${listHTML()}</div>
    ${cfg.custom ? `<div class="custom-add"><p class="small muted" style="margin-bottom:8px">${esc(cfg.customHint || "Tidak ada di daftar?")}</p>
      <div class="row"><input class="input grow" id="pkCustom" placeholder="${esc(cfg.custom)}" maxlength="40"><button type="button" class="btn sm" id="pkAdd">${ic("plus")}Tambah</button></div></div>` : ""}
  `, (sh) => {
    const choose = (v) => {
      hidden.value = v;
      btn.innerHTML = `${cfg.mono && v ? mono(v, "xs") : ""}<span class="pv">${esc(v || cfg.blank || cfg.placeholder)}</span>${ic("chev")}`;
      btn.classList.toggle("ph", !v && !cfg.blank);
      hidden.dispatchEvent(new Event("input", { bubbles: true }));
      closeSheet();
    };
    const bindOpts = () => $$(".opt", sh).forEach((o) => (o.onclick = () => choose(o.dataset.v)));
    bindOpts();
    $("[data-x]", sh).onclick = closeSheet;
    const s = $("#pkSearch", sh);
    if (s) s.oninput = () => { $("#pkList", sh).innerHTML = listHTML(s.value.trim().toLowerCase()); bindOpts(); };
    const add = $("#pkAdd", sh);
    if (add) add.onclick = () => {
      const v = $("#pkCustom", sh).value.trim().replace(/\s+/g, " ");
      if (v.length < 2) return toast("Tulis minimal 2 huruf.", "err");
      const exist = all.find((o) => o.toLowerCase() === v.toLowerCase());
      if (!exist) { cfg.onAdd(v); save(); }
      choose(exist || v);
    };
  });
}
const areaPicker = (name, label, value) => picker(name, label, value, {
  groups: () => [...Object.entries(AREA_TREE).map(([city, items]) => ({ title: city, items })), { title: "Kota lain", items: OTHER_CITIES, soon: true }],
  search: true, searchHint: "Cari kecamatan atau kota…", placeholder: "Pilih kecamatan" });
const subjectPicker = (name, label, value, blank) => picker(name, label, value, { options: allSubjects, blank, mono: true, custom: "cth. Ekonomi, Gitar", customHint: "Mata pelajaran lain?", onAdd: (v) => S.customSubjects.push(v) });
const levelPicker = (name, value, blank) => picker(name, "Jenjang", value, { options: () => LEVELS, blank });
const currPicker = (name, value, blank) => picker(name, "Kurikulum", value, { options: () => CURRICULA, blank });

// ---------- payment ----------
function pay(o) {
  const canSaldo = o.allowSaldo !== false && S.balance >= o.amount;
  const methods = [
    o.allowSaldo !== false && { v: "saldo", i: "wallet", t: "Saldo LesIn", s: `Tersedia ${rp(S.balance)}`, dis: !canSaldo },
    { v: "qris", i: "qr", t: "QRIS", s: "Scan dari aplikasi bank / e-wallet apa pun" },
    { v: "ewallet", i: "phone", t: "E-Wallet", s: "Bayar lewat aplikasi dompet digital" },
    { v: "va", i: "bank", t: "Virtual Account", s: "Transfer dari m-banking" },
  ].filter(Boolean);
  const first = methods.find((m) => !m.dis).v;
  openSheet(`
    <h2>${esc(o.title)}</h2>
    <p class="sub" style="margin-top:4px">${o.desc}</p>
    <div class="pay-amt"><span class="muted small">Total bayar</span><b>${rp(o.amount)}</b></div>
    ${methods.map((m) => `
      <label class="method ${m.dis ? "dis" : ""}"><span class="mi">${ic(m.i)}</span><span class="grow"><b>${m.t}</b><small>${m.s}${m.dis ? " · saldo kurang" : ""}</small></span>
      <input type="radio" name="pm" value="${m.v}" ${m.v === first ? "checked" : ""}></label>`).join("")}
    <button class="btn" id="payBtn" style="margin-top:16px">Bayar ${rp(o.amount)}</button>
    <p class="demo-note">Mode demo — tidak ada uang sungguhan yang ditarik.</p>
  `, (sh) => {
    $("#payBtn", sh).onclick = () => {
      const m = $("input[name=pm]:checked", sh).value;
      const b = $("#payBtn", sh);
      b.innerHTML = '<span class="spinner"></span>'; b.disabled = true;
      setTimeout(() => {
        if (m === "saldo") S.balance -= o.amount;
        o.onSuccess(m); save();
        successSheet(sh, o.successTitle || "Pembayaran berhasil", o.successText || "Pembayaran diterima.", o.successCta);
      }, 1100);
    };
  });
}

// ---------- kuota buka kontak (pencari) ----------
function packList(sel = 1) {
  return `<div class="boost-list">${PRICE.UNLOCK_PACKS.map((p, i) => `
    <label class="boost"><input type="radio" name="pack" value="${i}" ${i === sel ? "checked" : ""}>
      <span class="bx"><span class="grow"><b>${p.n} kontak</b>${p.tag ? `<em>${p.tag}</em>` : ""}<small>${rp(p.price / p.n)} per kontak</small></span><strong>${rp(p.price)}</strong></span></label>`).join("")}</div>`;
}
function buyPack(i, after) {
  const p = PRICE.UNLOCK_PACKS[i];
  pay({ title: `Paket ${p.n} kontak`, desc: `Kuota buka kontak tutor bertambah ${p.n}. Tidak ada masa berlaku.`, amount: p.price,
    successTitle: after ? "Kontak terbuka" : "Kuota bertambah",
    successText: after ? after.text : `Kuota kontakmu sekarang ${S.credits + p.n}.`,
    onSuccess: () => { S.credits += p.n; addTx(`Paket ${p.n} kontak`, -p.price); after && after.run(); } });
}
function unlockFlow(t) {
  if (!SESSION) return needLogin("Masuk atau daftar gratis dulu untuk membuka kontak. Akun baru dapat 1 kuota.");
  const done = () => { S.credits--; S.unlocked.push(t.id); addTx(`Buka kontak ${t.name}`, 0); };
  const text = `Nama & WhatsApp ${esc(t.name)} sudah terbuka dan tersimpan di menu Kontak.`;
  if (S.credits > 0) {
    openSheet(`<h2>Buka kontak tutor</h2>
      <p class="sub" style="margin-top:4px">Nama lengkap & nomor WhatsApp <b>${maskName(t.name)}</b> akan terbuka selamanya.</p>
      <div class="quota-box"><span class="mi">${ic("ticket")}</span><span class="grow"><b>Pakai 1 kuota kontak</b><small>Sisa setelah ini: ${S.credits - 1} kuota</small></span></div>
      <button class="btn" id="useQ" style="margin-top:16px">Buka kontak</button>`, (sh) => {
      $("#useQ", sh).onclick = () => { done(); save(); successSheet(sh, "Kontak terbuka", text, "Lihat kontak"); };
    });
  } else {
    openSheet(`<h2>Kuota kontakmu habis</h2>
      <p class="sub" style="margin-top:4px">Pilih paket. Satu kuota langsung dipakai untuk membuka <b>${maskName(t.name)}</b>, sisanya tersimpan.</p>
      <div style="margin-top:14px">${packList()}</div>
      <button class="btn" id="packGo" style="margin-top:16px">Lanjut bayar</button>`, (sh) => {
      $("#packGo", sh).onclick = () => buyPack(+$("input[name=pack]:checked", sh).value, { text, run: done });
    });
  }
}

// ---------- ulasan ----------
function reviewSheet(t) {
  let val = S.reviews[t.id]?.stars || 0;
  openSheet(`<h2>Ulas ${esc(t.name.split(" ")[0])}</h2>
    <p class="sub" style="margin-top:4px">Ulasanmu membantu orang tua lain memilih tutor. Nama kamu disingkat.</p>
    <div class="field" data-f="stars" style="margin-top:16px"><span class="lbl">Rating</span>
      <div class="star-pick">${[1, 2, 3, 4, 5].map((i) => `<button type="button" data-s="${i}" aria-label="${i} bintang">${ic("star")}</button>`).join("")}</div></div>
    <label class="field" data-f="text"><span class="lbl">Ceritakan pengalamanmu</span>
      <textarea class="input" id="revText" maxlength="300" placeholder="cth. Sabar, tepat waktu, nilai anak naik">${esc(S.reviews[t.id]?.text || "")}</textarea></label>
    <button class="btn" id="revSend">Kirim ulasan</button>`, (sh) => {
    const paint = () => $$("[data-s]", sh).forEach((b) => b.classList.toggle("on", +b.dataset.s <= val));
    paint();
    $$("[data-s]", sh).forEach((b) => (b.onclick = () => { val = +b.dataset.s; paint(); clearErr($("[data-f=stars]", sh)); }));
    $("#revSend", sh).onclick = () => {
      const text = $("#revText", sh).value.trim();
      const ok = showErrors(sh, [{ f: "stars", ok: val > 0, msg: "Pilih jumlah bintang dulu." }, { f: "text", ok: text.length >= 5, msg: "Tulis minimal 5 huruf." }]);
      if (!ok) return;
      S.reviews[t.id] = { stars: val, text, t: now() }; save(); closeSheet(); render(); toast("Terima kasih, ulasanmu sudah tayang.");
    };
  });
}

// ---------- validasi form (pesan di bawah field, bukan popup browser) ----------
function clearErr(field) { if (!field) return; field.classList.remove("err"); field.querySelector(".err-msg")?.remove(); }
function showErrors(root, rules) {
  $$(".field.err", root).forEach(clearErr);
  let first = null;
  rules.filter((r) => !r.ok).forEach((r) => {
    const field = root.querySelector(`[data-f="${r.f}"]`); if (!field) return;
    field.classList.add("err");
    field.insertAdjacentHTML("beforeend", `<span class="err-msg">${ic("alert")}${r.msg}</span>`);
    first = first || field;
  });
  if (first) {
    first.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => first.querySelector("input:not([type=hidden]):not([type=checkbox]),textarea")?.focus({ preventScroll: true }), 350);
    return false;
  }
  return true;
}

function toast(html, type = "ok", ms = 3400) {
  const t = $("#toast");
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="t-ic">${ic(type === "err" ? "alert" : type === "info" ? "info" : "check")}</span><span class="t-tx">${html}</span>`;
  requestAnimationFrame(() => t.classList.add("show"));
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), ms);
}
function copyText(txt) {
  (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast("Nomor disalin"), () => toast(`Nomor: ${esc(txt)}`, "info"));
}

// ---------- routing ----------
function currentRoute() {
  const [page = "", id = ""] = location.hash.replace(/^#\/?/, "").split("/");
  return { page, id: decodeURIComponent(id) };
}
const VIEWS = {};
const PUBLIC = new Set(["", "search", "results", "tutor", "masuk", "daftar"]);
function render() {
  const { page, id } = currentRoute();
  const needAuth = !SESSION && !PUBLIC.has(page);
  if (needAuth) authNext = location.hash || "#/";
  const view = needAuth ? VIEWS.gate : VIEWS[page] || VIEWS[""];
  $("#app").innerHTML = `<div class="fade-in">${view(id)}</div>`;
  view.mount && view.mount(id);
  bindPickers();
  bindCopy();
  bindRole();
  renderChrome();
}
function renderChrome() {
  const rb = $("#roleBtn");
  rb.hidden = UI.sw !== "2" || !SESSION;
  rb.innerHTML = `${ic(S.role === "tutor" ? "cap" : "user")}<span class="mdot"></span>`;
  rb.setAttribute("aria-label", S.role === "tutor" ? "Mode tutor — ganti mode" : "Mode pencari — ganti mode");
  const wp = $("#walletPill");
  if (!SESSION) { wp.setAttribute("href", "#/masuk"); wp.innerHTML = `${ic("user")}Masuk`; }
  else { wp.setAttribute("href", "#/wallet"); wp.innerHTML = S.role === "tutor" ? `${ic("wallet")}${rp(S.balance)}` : `${ic("ticket")}${S.credits} kuota`; }
  renderNav();
}
function renderNav() {
  const { page } = currentRoute();
  const items = S.role === "pencari"
    ? [["", "home", "Beranda"], ["search", "search", "Cari"], ["post", "plus", "Posting", true], ["kontak", "users", "Kontak"], ["myposts", "board", "Postinganku"]]
    : [["", "home", "Beranda"], ["board", "board", "Lowongan"], ["profile", "user", "CV Saya"], ["kontak", "users", "Kontak"], ["wallet", "wallet", "Saldo"]];
  const active = { tutor: "search", results: "search", lowongan: "board", harga: "wallet", riwayat: "wallet" }[page] || page;
  $("#nav").innerHTML = items.map(([p, i, l, center]) => `
    <a href="#/${p}" class="${active === p ? "on" : ""} ${center ? "center" : ""}">
      ${center ? `<span class="ic">${ic(i)}</span>` : ic(i)}${l}
      ${p === "myposts" && S.newInterest ? `<span class="badge-dot">${S.newInterest}</span>` : ""}
    </a>`).join("");
}
const cvReady = () => { const p = S.profile; return !!(p.cvDone && p.name && p.phone && p.subjects.length && p.levels.length && p.edu && p.rate); };
function needLogin(msg) {
  authNext = location.hash || "#/";
  toast(msg || "Masuk dulu untuk melanjutkan.", "info");
  location.hash = "#/masuk";
}
function setRole(r) {
  if (!SESSION) return needLogin(r === "tutor" ? "Daftar atau masuk dulu untuk jadi tutor." : "Masuk dulu untuk melanjutkan.");
  if (S.role === r) return;
  S.role = r; save();
  if (r === "tutor" && !cvReady()) {
    location.hash = "#/profile"; render();
    toast("Lengkapi <b>CV</b> dulu untuk jadi tutor. <b>Cara mengajar</b> boleh dikosongkan.", "info", 5200);
    return;
  }
  toast(r === "tutor" ? "Beralih ke <b>Mode Tutor</b>" : "Beralih ke <b>Mode Pencari</b>", "info");
  location.hash = "#/"; render();
}
function modeSheet() {
  const opt = (r, icon, t, d) => `<button type="button" class="mode-opt ${S.role === r ? "on" : ""}" data-role="${r}"><span class="mi">${ic(icon)}</span>
    <span class="grow"><b>${t}</b><small>${d}</small></span>${S.role === r ? ic("check", "ck") : ""}</button>`;
  const acc = me();
  openSheet(`<div class="acc-row"><div class="avatar sm" style="background:${avColor(acc.id)}">${esc(initials(acc.name))}</div><div class="grow"><b>${esc(acc.name)}</b><small>${esc(acc.phone)}</small></div>
    <button type="button" class="link" id="logoutBtn">Keluar</button></div>
    <h2>Pakai LesIn sebagai</h2><p class="sub" style="margin:4px 0 14px">Kamu bisa pindah kapan saja. Data dan saldo tetap tersimpan.</p>
    <div class="stack">${opt("pencari", "search", "Pencari guru les", "Cari tutor untuk anak atau dirimu sendiri")}${opt("tutor", "cap", "Tutor", "Pasang CV dan temukan murid baru")}</div>`, (sh) => {
    $$("[data-role]", sh).forEach((b) => (b.onclick = () => { closeSheet(); setRole(b.dataset.role); }));
    $("#logoutBtn", sh).onclick = () => { closeSheet(); logout(); };
  });
}
$("#roleBtn").onclick = modeSheet;
const bindRole = () => $$("[data-setrole]").forEach((b) => (b.onclick = () => setRole(b.dataset.setrole)));
const modeSeg = () => `<div class="mode-seg" role="group" aria-label="Mode">
  <button type="button" class="${S.role === "pencari" ? "on" : ""}" data-setrole="pencari">${ic("search")}Cari guru</button>
  <button type="button" class="${S.role === "tutor" ? "on" : ""}" data-setrole="tutor">${ic("cap")}Jadi tutor</button></div>`;
const modeCard = () => S.role === "pencari"
  ? `<section class="card mode-card section"><img src="assets/mascot.svg" alt="" width="64" height="64"><div class="grow"><h3>Kamu guru les?</h3><p class="small muted">Pasang CV dan dapatkan murid baru.</p></div><button class="btn sm ghost" data-setrole="tutor">Jadi tutor</button></section>`
  : `<section class="card mode-card section"><img src="assets/mascot.svg" alt="" width="64" height="64"><div class="grow"><h3>Cari guru les?</h3><p class="small muted">Beralih ke mode pencari.</p></div><button class="btn sm ghost" data-setrole="pencari">Mode pencari</button></section>`;
window.addEventListener("hashchange", () => { closeSheet(); window.scrollTo(0, 0); render(); });

// ---------- shared components ----------
const seg = (name, items, val) => `<div class="seg">${items.map(([v, l]) => `<label><input type="radio" name="${name}" value="${v}" ${v === val ? "checked" : ""}><span>${l}</span></label>`).join("")}</div>`;
const back = (href = "javascript:history.back()", attr = "") => `<a class="back" href="${href}" aria-label="Kembali" ${attr}>${ic("back")}</a>`;
const emptyBox = (icon, html) => `<div class="empty"><img class="empty-mascot" src="assets/mascot.svg" alt="" width="84" height="84">${html}</div>`;
const inRadius = (p) => p.mode === "online" || areaLevel(S.profile.area, p.area) > 0;
const bindCopy = () => $$("[data-copy]").forEach((b) => (b.onclick = () => copyText(b.dataset.copy)));

function avatarHTML(t, lg) {
  const lock = !isUnlocked(t.id);
  return `<div class="avatar ${lg ? "lg" : ""} ${lock ? "locked" : ""}" style="background:${avColor(t.id)}"><span class="ini">${initials(t.name)}</span>${lock ? `<span class="lk">${ic("lock")}</span>` : ""}</div>`;
}
// Kartu kontak yang sudah terbuka (netral, tanpa kotak hijau)
function contactCard({ color, name, rows, wa, note }) {
  return `<div class="card contact-card">
    <div class="cc-head"><div class="avatar sm" style="background:${color}">${initials(name)}</div>
      <div class="grow"><b>${esc(name)}</b><p class="small muted">${note}</p></div><span class="cc-badge">${ic("unlock")}Terbuka</span></div>
    <dl class="cc-rows">${rows.map(([k, v, copy]) => `<div><dt>${k}</dt><dd>${esc(v)}${copy ? `<button class="icon-btn xs" data-copy="${esc(v)}" aria-label="Salin">${ic("copy")}</button>` : ""}</dd></div>`).join("")}</dl>
    <a class="btn wa" href="${wa}" target="_blank" rel="noopener">${ic("wa")}Chat via WhatsApp</a>
  </div>`;
}
const shortEdu = (e) => (e.split("—")[1] ? e.split("—")[1].split("(")[0].split("·")[0].trim() : e);
function tutorCard(r, asDiv) {
  const { t, score } = r; const open = isUnlocked(t.id);
  const tag = asDiv ? "div" : "a";
  return `<${tag} class="card ${asDiv ? "" : "tap"}" ${asDiv ? "" : `href="#/tutor/${t.id}"`}>
    <div class="row" style="align-items:flex-start;gap:12px">
      ${avatarHTML(t)}
      <div class="grow" style="min-width:0">
        <div class="row" style="gap:4px"><span class="tname ${open ? "" : "masked"}">${open ? esc(t.name) : maskName(t.name)}</span>${t.verified ? `<span class="verified">${ic("shield")}</span>` : ""}</div>
        <p class="small" style="color:var(--ink-2);margin-top:2px;line-height:1.35">${esc(t.headline)}</p>
      </div>
      <div class="match"><b>${score}%</b><span>cocok</span></div>
    </div>
    <div class="meta">
      <span>${ic("cap")}${esc(shortEdu(t.edu))}</span>
      <span>${ic("clock")}${t.exp} th pengalaman</span>
      <span>${ic("star", "star")}${t.rating} (${t.reviews})</span>
      <span>${ic(r.reach ? "pin" : "wifi")}${esc(t.area || "")}${t.area ? " · " : ""}${locLabel(r)}</span>
    </div>
    <div class="divider"></div>
    <div class="row between">
      <div class="chips">${t.subjects.slice(0, 2).map((s) => `<span class="chip">${esc(s)}</span>`).join("")}${t.subjects.length > 2 ? `<span class="chip">+${t.subjects.length - 2}</span>` : ""}</div>
      <div class="price">${rp(t.rate)}<small>/${durLabel(t.dur)}</small></div>
    </div>
  </${tag}>`;
}
const agoText = (h) => (h < 1 ? "baru saja" : h < 24 ? `${h} jam lalu` : `${Math.floor(h / 24)} hari lalu`);
function postCard(p, mode = "tutor") {
  const contacted = S.contactedPosts.includes(p.id);
  const tag = mode === "tutor" ? "a" : "div";
  return `<${tag} class="card ${tag === "a" ? "tap" : ""}" ${tag === "a" ? `href="#/lowongan/${p.id}"` : ""}>
    <div class="post-top">
      <div class="row" style="gap:12px;align-items:flex-start">
        ${mono(p.subject, "md")}
        <div><h3>${esc(p.subject)} · ${esc(p.level)}</h3><p class="small muted" style="margin-top:2px">${esc(mode === "own" || contacted ? p.owner : maskOwner(p.owner))} · ${agoText(p.hoursAgo)}</p></div>
      </div>
      ${contacted ? `<span class="chip">${ic("check")}Dihubungi</span>` : p.boost ? `<span class="chip pri">${ic("bolt")}Boost</span>` : p.hoursAgo < 6 ? `<span class="chip acc">Baru</span>` : ""}
    </div>
    <p class="sub" style="margin-top:10px;font-size:13px">${esc(p.student)}</p>
    <div class="post-meta">
      <div><span>Daerah</span><b>${esc(p.area)}</b></div>
      <div><span>Budget / ${durLabel(p.dur || 90)}</span><b>${rp(p.budget)}</b></div>
      <div><span>Jadwal</span><b>${p.times ? p.days.map((d) => `${d} ${fmtT(p.times[d])}`).join(" · ") : `${p.days.join(", ")} · ${esc(p.time)}`}</b></div>
      <div><span>Mode · Kurikulum</span><b>${p.mode === "online" ? "Online" : p.mode === "offline" ? "Ke rumah" : "Bebas"} · ${esc(p.curr || "Bebas")}</b></div>
    </div>
    ${mode !== "own" ? `<div class="row between" style="margin-top:10px"><span class="small muted">${p.contacted} tutor sudah menghubungi</span>${inRadius(p) && p.mode !== "online" ? `<span class="chip">${ic("pin")}Satu kota denganmu</span>` : ""}</div>` : ""}
  </${tag}>`;
}

/* ===================================================================
   VIEWS
   =================================================================== */

// ---------- HOME ----------
VIEWS[""] = () => (S.role === "tutor" ? homeTutor() : homePencari());

function homePencari() {
  const s = S.search;
  const n = matchTutors(s).length;
  const popular = SUBJECTS.slice(0, 6);
  const hc = HERO_COPY[UI.copy];
  return `${UI.sw === "1" ? modeSeg() : ""}
  <section class="hero">
    <img class="hero-mascot" src="assets/mascot.svg" alt="" width="120" height="120">
    <p class="eyebrow light">${hc[0]}</p>
    <h1 style="margin-top:6px">${hc[1]}</h1>
    <p style="margin-top:6px">${hc[2]}</p>
    <div style="height:40px"></div>
  </section>
  <form class="card quick" id="quickForm">
    ${areaPicker("area", "Daerah rumah", s.area)}
    ${subjectPicker("subject", "Mata pelajaran", s.subject)}
    <div class="row" style="gap:10px;align-items:flex-start">
      <div class="grow" style="min-width:0">${levelPicker("level", s.level, "Semua")}</div>
      <div class="grow" style="min-width:0">${currPicker("curr", s.curr, "Semua")}</div>
    </div>
    <button class="btn">${ic("search")} Cari tutor</button>
    <p class="small muted" style="text-align:center;margin-top:8px"><b id="qCount">${n}</b> tutor cocok dengan pilihan ini</p>
  </form>

  <div class="section">
    <div class="section-head"><h2>Pelajaran populer</h2><a href="#/search">Semua</a></div>
    <div class="subj-grid">${popular.map((x) => `<a class="subj-card" href="#/results" data-subj="${esc(x)}">${mono(x, "md")}<b>${esc(x)}</b><span>${TUTORS.filter((t) => t.subjects.includes(x)).length} tutor</span></a>`).join("")}</div>
  </div>

  <section class="cta-post section">
    <div class="cta-ic">${ic("megaphone")}</div>
    <div class="grow">
      <p class="eyebrow">Posting kebutuhan · gratis</p>
      <h3>Biar tutor yang menghubungimu</h3>
      <p class="small" style="color:var(--ink-2);margin-top:4px;line-height:1.5">Tulis kebutuhan les sekali. Tutor yang cocok langsung WhatsApp kamu.</p>
      <a class="btn sm dark" href="#/post" style="margin-top:12px">Buat postingan ${ic("arrow")}</a>
    </div>
  </section>

  <div class="section">
    <div class="section-head"><h2>Cara kerja</h2></div>
    <ol class="timeline card">
      <li><span class="tl-dot">${ic("search")}</span><div class="grow"><div class="row between"><b>Cari & bandingkan CV</b><span class="chip ok">Gratis</span></div>
        <p>Filter daerah, mapel, kurikulum, budget. Pendidikan, pengalaman & rating bisa dibaca semua.</p></div></li>
      <li><span class="tl-dot">${ic("unlock")}</span><div class="grow"><div class="row between"><b>Buka kontak tutor</b><span class="chip pri">mulai ${rp(minPerContact())}</span></div>
        <p>Nama, foto & nomor WhatsApp terbuka. Beli paket, makin hemat. Akun baru dapat 1 kuota gratis.</p></div></li>
      <li><span class="tl-dot">${ic("wa")}</span><div class="grow"><div class="row between"><b>Chat langsung di WhatsApp</b><span class="chip ok">Gratis</span></div>
        <p>Atur jadwal trial langsung dengan tutor. Setelah les, beri ulasan.</p></div></li>
    </ol>
  </div>

  <div class="section stat-row">
    <div class="stat"><b>${TUTORS.length}</b><span>Tutor aktif</span></div>
    <div class="stat"><b>${TUTORS.filter((t) => t.verified).length}</b><span>Terverifikasi</span></div>
    <div class="stat"><b>4,8</b><span>Rata-rata rating</span></div>
  </div>
  ${UI.sw === "3" ? modeCard() : ""}`;
}

function homeTutor() {
  const p = S.profile;
  const near = SEED_POSTS.filter(inRadius);
  const mine = near.filter((x) => p.subjects.includes(x.subject));
  const comp = profileCompletion();
  return `${UI.sw === "1" ? modeSeg() : ""}
  ${cvReady() ? "" : cvGate()}
  <section class="card tutor-sum">
    <div class="row between" style="align-items:flex-start">
      <div><p class="eyebrow">Mode tutor</p><h1 style="font-size:22px;margin-top:4px">Halo, ${esc((p.name || "Tutor").split(" ")[0])}</h1>
        <p class="small muted">${esc(p.subjects.join(", ") || "Belum pilih mapel")} · ${esc(p.area)}</p></div>
      ${p.pro ? `<span class="chip acc">${ic("bolt")}Pro</span>` : ""}
    </div>
    <div class="mini-stats">
      <a href="#/board"><b>${mine.length}</b><span>Lowongan cocok</span></a>
      <a href="#/kontak"><b>${S.contactedPosts.length}</b><span>Sudah dihubungi</span></a>
      <a href="#/wallet"><b>${rp(S.balance)}</b><span>Saldo</span></a>
    </div>
    <a href="#/board" class="btn" style="margin-top:14px">Lihat lowongan les ${ic("arrow")}</a>
  </section>

  <a class="card tap section" href="#/profile">
    <div class="row between"><h3>Kelengkapan CV</h3><b style="color:var(--pri)">${comp}%</b></div>
    <div class="progress" style="margin-top:10px"><i style="width:${comp}%"></i></div>
    <p class="small muted" style="margin-top:8px">${comp < 100 ? "CV lengkap muncul lebih tinggi di hasil pencarian murid." : "CV kamu sudah lengkap."}</p>
  </a>

  <div class="section">
    <div class="section-head"><h2>Cocok untukmu</h2><a href="#/board">Semua</a></div>
    <div class="stack">${(mine.length ? mine : near).slice(0, 3).map((x) => postCard(x)).join("") || emptyBox("board", "Belum ada postingan di sekitarmu.")}</div>
  </div>

  ${proCard()}
  ${UI.sw === "3" ? modeCard() : ""}`;
}
function cvGate() {
  return `<section class="card cv-gate"><img src="assets/mascot.svg" alt="" width="64" height="64"><div class="grow"><h3>Lengkapi CV untuk mulai</h3>
    <p class="small" style="color:var(--ink-2);margin-top:2px;line-height:1.45">Nama, WhatsApp, mapel, jenjang, pendidikan, dan tarif wajib diisi. “Tentang caramu mengajar” boleh dikosongkan.</p>
    <a class="btn sm" href="#/profile" style="margin-top:10px">Isi CV sekarang ${ic("arrow")}</a></div></section>`;
}
function proCard() {
  if (S.profile.pro) return `<div class="pro-card section"><div class="row"><span class="pro-ic">${ic("bolt")}</span><div><h3>Tutor Pro aktif</h3><p class="small" style="color:#7A4E00">CV-mu diprioritaskan & dapat 5 kredit hubungi gratis/bulan.</p></div></div></div>`;
  return `<div class="pro-card section">
    <div class="row" style="align-items:flex-start"><span class="pro-ic">${ic("bolt")}</span><div class="grow"><h3>Tutor Pro — ${rp(PRICE.PRO)}/bulan</h3>
    <p class="small" style="color:#7A4E00;margin-top:4px;line-height:1.5">CV-mu tampil lebih tinggi dan dapat kredit hubungi gratis tiap bulan.</p></div></div>
    <button class="btn acc" id="goPro" style="margin-top:12px">Lihat keuntungan Pro</button>
  </div>`;
}
VIEWS[""].mount = () => {
  const f = $("#quickForm");
  if (f) {
    const read = () => { const fd = new FormData(f); return { ...S.search, area: fd.get("area"), subject: fd.get("subject"), level: fd.get("level"), curr: fd.get("curr") }; };
    f.oninput = () => { $("#qCount").textContent = matchTutors(read()).length; };
    f.onsubmit = (e) => { e.preventDefault(); S.search = read(); save(); location.hash = "#/results"; };
  }
  $$("[data-subj]").forEach((a) => (a.onclick = () => { S.search = { ...DEFAULT_SEARCH, area: S.search.area, subject: a.dataset.subj }; save(); }));
  bindPro();
};
function bindPro() { const g = $("#goPro"); if (g) g.onclick = proSheet; }
function proSheet() {
  const perks = [["bolt", "Badge Pro di CV", "Pencari langsung melihat kamu tutor yang aktif dan serius."], ["eye", "Tampil paling atas", "CV-mu diprioritaskan di hasil pencarian daerahmu, jadi lebih sering dilihat."],
    ["ticket", "5 kredit hubungi gratis / bulan", `Setara ${rp(PRICE.CHAT * 5)}. Pakai untuk menghubungi murid dari Lowongan.`], ["board", "Statistik pelihat CV", "Lihat berapa pencari yang membuka CV-mu tiap minggu."]];
  openSheet(`<div class="pro-hero"><img src="assets/mascot.svg" alt="" width="72" height="72"><div><p class="eyebrow">Langganan bulanan</p><h2>Tutor Pro</h2></div></div>
    <ul class="perks">${perks.map(([i, t, d]) => `<li><span class="pi">${ic(i)}</span><div><b>${t}</b><p>${d}</p></div></li>`).join("")}</ul>
    <div class="pro-price"><span class="muted small">Harga</span><b>${rp(PRICE.PRO)}<small> / bulan</small></b></div>
    <button class="btn acc" id="proGo">Langganan Tutor Pro</button>
    <button class="btn line" id="proLater" style="margin-top:8px">Nanti saja</button>
    <p class="demo-note">Berlaku 30 hari, bisa berhenti kapan saja.</p>`, (sh) => {
    $("#proLater", sh).onclick = closeSheet;
    $("#proGo", sh).onclick = () => pay({ title: "Langganan Tutor Pro", desc: "Berlaku 30 hari, bisa berhenti kapan saja.", amount: PRICE.PRO,
      successTitle: "Tutor Pro aktif", successText: "CV-mu sekarang diprioritaskan di hasil pencarian.", onSuccess: () => { S.profile.pro = true; addTx("Langganan Tutor Pro", -PRICE.PRO); } });
  });
}

// ---------- SEARCH (filters) ----------
VIEWS.search = () => {
  const s = S.search;
  return `
  <div class="row" style="margin-bottom:4px">${back()}<h1 class="grow" style="margin:0">Cari tutor</h1>
    ${activeFilters(s) ? `<button type="button" class="link" id="resetF">Reset</button>` : ""}</div>
  <p class="sub">Atur kriteria, kami cocokkan dengan tutor di sekitarmu.</p>
  <form id="searchForm" class="section">
    ${areaPicker("area", "Daerah rumah", s.area)}
    ${subjectPicker("subject", "Mata pelajaran", s.subject, "Semua mata pelajaran")}
    <div class="row" style="gap:10px;align-items:flex-start">
      <div class="grow" style="min-width:0">${levelPicker("level", s.level, "Semua")}</div>
      <div class="grow" style="min-width:0">${currPicker("curr", s.curr, "Semua")}</div>
    </div>
    <div class="field"><span class="lbl">Cara belajar</span>${seg("mode", [["any", "Bebas"], ["offline", "Ke rumah"], ["online", "Online"]], s.mode)}</div>
    <div class="field"><span class="lbl">Durasi sesi</span>${seg("dur", DURS, s.dur)}</div>
    <div class="field"><span class="lbl">Budget maks per sesi: <span class="range-val" id="budgetVal">${rp(s.budget)}</span></span>
      <input type="range" name="budget" min="50000" max="400000" step="10000" value="${s.budget}"><span class="hint">Maksimal Rp400.000 untuk durasi yang dipilih.</span></div>
    <div class="field"><span class="lbl">Preferensi tutor</span>${seg("gender", [["any", "Bebas"], ["P", "Perempuan"], ["L", "Laki-laki"]], s.gender)}</div>
    <div class="info" style="margin-bottom:14px">${ic("info")}<span><b id="liveCount">0</b> tutor cocok dengan kriteria ini. CV bisa dilihat gratis — kontak dibuka mulai ${rp(minPerContact())}.</span></div>
    <button class="btn">${ic("search")} Tampilkan tutor</button>
  </form>`;
};
VIEWS.search.mount = () => {
  const f = $("#searchForm");
  const read = () => { const fd = new FormData(f); return { ...S.search, area: fd.get("area"), subject: fd.get("subject"), level: fd.get("level"), curr: fd.get("curr"),
    mode: fd.get("mode"), budget: +fd.get("budget"), dur: +fd.get("dur"), gender: fd.get("gender") }; };
  const upd = () => { const v = read(); $("#budgetVal").textContent = rp(v.budget); $("#liveCount").textContent = matchTutors(v).length; };
  f.oninput = upd; f.onchange = upd; upd();
  f.onsubmit = (e) => { e.preventDefault(); S.search = read(); save(); location.hash = "#/results"; };
  const r = $("#resetF");
  if (r) r.onclick = () => { S.search = { ...DEFAULT_SEARCH, area: S.search.area, subject: S.search.subject }; save(); render(); toast("Filter direset", "info"); };
};

// ---------- RESULTS ----------
VIEWS.results = () => {
  const s = S.search;
  const list = sortResults(matchTutors(s), s.sort);
  const nf = activeFilters(s);
  const sum = [s.subject || "Semua pelajaran", s.level || "semua jenjang", s.curr, s.area, s.mode === "online" ? "online" : s.mode === "offline" ? "ke rumah" : null, nf && (s.budget !== DEFAULT_SEARCH.budget || s.dur !== DEFAULT_SEARCH.dur) ? `≤ ${rp(s.budget)} / ${durLabel(s.dur)}` : null, s.gender === "P" ? "tutor perempuan" : s.gender === "L" ? "tutor laki-laki" : null].filter(Boolean).join(" · ");
  return `
  <div class="row" style="margin-bottom:12px">${back("#/", "data-reset")}<h2 class="grow">Hasil pencarian</h2>
    <a href="#/search" class="btn sm ${nf ? "filter-on" : "line"}">${ic("filter")}Filter${nf ? `<span class="fcount">${nf}</span>` : ""}</a></div>
  <div class="result-head">
    <div class="row" style="gap:12px"><b class="big">${list.length}</b><div><b>tutor cocok dengan kriteriamu</b><p class="filters-sum">${esc(sum)}</p></div></div>
  </div>
  <div class="hscroll" style="margin-top:12px">${[["match", "Paling cocok"], ["dist", "Terdekat"], ["price", "Termurah"], ["rating", "Rating"]].map(([v, l]) =>
    `<button class="chip ${s.sort === v ? "pri" : ""}" data-sort="${v}" style="padding:8px 12px">${l}</button>`).join("")}</div>
  <div class="stack" style="margin-top:12px">
    ${list.map((r) => tutorCard(r)).join("") || emptyBox("search", `Belum ada tutor yang cocok. Coba longgarkan filter,<br>atau <a href="#/post" class="link">posting kebutuhanmu</a>.`)}
  </div>`;
};
VIEWS.results.mount = () => {
  $$("[data-sort]").forEach((b) => (b.onclick = () => { S.search.sort = b.dataset.sort; save(); render(); }));
  // Kembali dari hasil = batal mencari → filter otomatis direset
  $("[data-reset]").onclick = () => { S.search = { ...DEFAULT_SEARCH, area: S.search.area }; save(); };
};

// ---------- TUTOR DETAIL (CV) ----------
VIEWS.tutor = (id) => {
  const t = TUTORS.find((x) => x.id === id); if (!t) return emptyBox("search", "Tutor tidak ditemukan.");
  const r = matchTutors({ ...S.search, subject: "", level: "", curr: "", gender: "any", budget: 9e9 }).find((x) => x.t.id === id);
  const open = isUnlocked(id);
  const msg = `Halo Kak ${t.name.split(" ")[0]}, saya lihat profil Kakak di LesIn. Saya sedang cari les ${S.search.subject || t.subjects[0]}${S.search.level ? " " + S.search.level : ""} di daerah ${S.search.area}. Apakah masih ada jadwal kosong?`;
  const mine = S.reviews[t.id];
  const revs = [...(mine ? [{ ...mine, name: "Kamu", when: "baru saja" }] : []), ...(REVIEWS[t.id] || [])];
  return `
  <div class="row" style="margin-bottom:12px">${back()}<h2 class="grow">CV Tutor</h2></div>
  <div class="card">
    <div class="row" style="gap:14px;align-items:flex-start">
      ${avatarHTML(t, true)}
      <div class="grow">
        <div class="row" style="gap:4px"><span class="tname ${open ? "" : "masked"}" style="font-size:18px">${open ? esc(t.name) : maskName(t.name)}</span>${t.verified ? `<span class="verified">${ic("shield")}</span>` : ""}</div>
        <p class="small" style="color:var(--ink-2);margin-top:4px">${esc(t.headline)}</p>
        <div class="chips" style="margin-top:8px">${t.verified ? `<span class="chip pri">${ic("shield")}Identitas terverifikasi</span>` : `<span class="chip">Belum terverifikasi</span>`}</div>
      </div>
    </div>
    <div class="stat-row" style="margin-top:14px">
      <div class="stat"><b><span class="star" style="display:inline-flex;width:15px;vertical-align:-1px">${ic("star")}</span> ${t.rating}</b><span>${t.reviews} ulasan</span></div>
      <div class="stat"><b>${t.students}</b><span>Murid diajar</span></div>
      <div class="stat"><b>${t.exp} th</b><span>Pengalaman</span></div>
    </div>
  </div>

  <div class="section">${open ? contactCard({ color: avColor(t.id), name: t.name, note: `${t.age} tahun · ${esc(t.area)}`, rows: [["WhatsApp", t.phone, true], ["Domisili", t.area]], wa: waLink(t.phone, msg) })
    : `<div class="lockbox">
      <div class="row"><span style="display:inline-flex;width:20px;color:var(--acc)">${ic("lock")}</span><h3>Identitas & kontak masih terkunci</h3></div>
      <ul>
        <li>${ic("check")}Nama lengkap & foto asli</li>
        <li>${ic("check")}Nomor WhatsApp — langsung chat</li>
        <li>${ic("check")}Tersimpan selamanya di menu Kontak</li>
      </ul>
      <button class="btn acc" id="unlockBtn">${S.credits > 0 ? `Buka kontak — pakai 1 kuota` : `Buka kontak — mulai ${rp(minPerContact())}`}</button>
      ${S.credits > 0 ? `<p class="small" style="text-align:center;margin-top:8px;color:rgba(255,255,255,.7)">Sisa kuota: ${S.credits}</p>` : ""}
    </div>`}
  </div>

  <div class="card section">
    <div class="cv-sec"><h3>Tentang</h3><p class="sub">${esc(t.bio)}</p></div>
    <div class="cv-sec"><h3>Pendidikan</h3><p style="font-weight:600;font-size:14px">${esc(t.edu)}</p></div>
    <div class="cv-sec"><h3>Pengalaman & prestasi</h3><ul class="bullets"><li>${t.exp} tahun mengajar</li>${t.achievements.map((a) => `<li>${esc(a)}</li>`).join("")}</ul></div>
    <div class="cv-sec"><h3>Mengajar</h3><div class="chips">${t.subjects.map((s) => `<span class="chip pri">${esc(s)}</span>`).join("")}</div>
      <div class="chips" style="margin-top:6px">${t.levels.map((s) => `<span class="chip">${s}</span>`).join("")}</div></div>
    <div class="cv-sec"><h3>Kurikulum</h3><div class="chips">${t.curricula.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div></div>
    <div class="cv-sec"><h3>Hari tersedia</h3><div class="days">${DAYS.map((x) => `<span class="${t.avail.includes(x) ? "on" : ""}">${x}</span>`).join("")}</div></div>
    <div class="cv-sec"><h3>Daerah & cara mengajar</h3>
      <dl class="kv"><dt>Domisili</dt><dd>Kec. ${esc(t.area)}</dd><dt>Ke rumah</dt><dd>${t.offline ? `Ya, area ${esc(AREAS[t.area] || t.area)}` : "Tidak"}</dd><dt>Online</dt><dd>${t.online ? "Ya" : "Tidak"}</dd></dl></div>
  </div>

  <div class="card section">
    <div class="row between" style="margin-bottom:6px"><h3 class="cap-title">Ulasan</h3><span class="small muted">${t.rating} dari ${t.reviews} ulasan</span></div>
    ${revs.map((v) => `<div class="review"><div class="row between"><b class="small">${esc(v.name)}</b>${stars(v.stars)}</div><p class="sub" style="font-size:13px;margin-top:4px">${esc(v.text)}</p><span class="small muted">${esc(v.when)}</span></div>`).join("")
      || `<p class="small muted">Belum ada ulasan tertulis.</p>`}
    ${open ? `<button class="btn line" id="revBtn" style="margin-top:12px">${ic("starO")}${mine ? "Ubah ulasanmu" : "Tulis ulasan"}</button>`
      : `<p class="hint" style="margin-top:10px">Ulasan hanya bisa ditulis oleh pencari yang sudah membuka kontak tutor ini.</p>`}
  </div>

  <div class="card section row between">
    <div><span class="small muted">Tarif tutor (dibayar langsung ke tutor)</span><div class="price" style="font-size:20px">${rp(t.rate)}<small> / ${durLabel(t.dur)}</small></div></div>
    ${r ? `<div class="match"><b>${r.score}%</b><span>cocok</span></div>` : ""}
  </div>`;
};
VIEWS.tutor.mount = (id) => {
  const t = TUTORS.find((x) => x.id === id); if (!t) return;
  const u = $("#unlockBtn"); if (u) u.onclick = () => unlockFlow(t);
  const rv = $("#revBtn"); if (rv) rv.onclick = () => reviewSheet(t);
};

// ---------- POST (pencari membuat kebutuhan) ----------
VIEWS.post = () => {
  const s = S.search;
  const pk = [[0, "Tanpa boost", "Tampil normal di lowongan", "Gratis"], [3, "Boost 3 hari", "Paling atas selama 3 hari", rp(PRICE.BOOST[3])],
    [7, "Boost 7 hari", "Paling atas selama 7 hari", rp(PRICE.BOOST[7]), "Populer"], [14, "Boost 14 hari", "Paling atas selama 14 hari", rp(PRICE.BOOST[14]), "Paling hemat"]];
  return `
  <h1>Posting kebutuhan les</h1><p class="sub">Gratis. Tutor yang cocok akan menghubungimu lewat WhatsApp.</p>
  <form id="postForm" class="section" novalidate>
    <label class="field" data-f="owner"><span class="lbl">Nama yang tampil</span><input class="input" name="owner" placeholder="cth. Ibu Ratna" value="${esc(S.lastOwner || "")}"></label>
    <label class="field" data-f="phone"><span class="lbl">Nomor WhatsApp</span><input class="input" name="phone" inputmode="tel" placeholder="08xx-xxxx-xxxx" value="${esc(S.lastPhone || "")}">
      <span class="hint">Hanya terlihat oleh tutor yang membayar untuk menghubungimu.</span></label>
    ${subjectPicker("subject", "Mata pelajaran", s.subject || "Matematika")}
    <div class="row" style="gap:10px;align-items:flex-start">
      <div class="grow" style="min-width:0">${levelPicker("level", s.level || "SD")}</div>
      <div class="grow" style="min-width:0">${currPicker("curr", s.curr || "Merdeka", "Bebas")}</div>
    </div>
    <label class="field" data-f="student"><span class="lbl">Tentang murid</span><input class="input" name="student" placeholder="cth. Kelas 8, nilai ulangan turun"></label>
    ${areaPicker("area", "Daerah", s.area)}
    <div class="field"><span class="lbl">Cara belajar</span>${seg("mode", [["offline", "Ke rumah"], ["online", "Online"]], "offline")}</div>
    <div class="field"><span class="lbl">Durasi per sesi</span>${seg("dur", DURS, 90)}</div>
    <div class="field" data-f="days"><span class="lbl">Hari & jam les</span>
      <div class="daylist">${Object.entries(DAYS_FULL).map(([d, full], i) => { const on = i === 0 || i === 3; return `
        <div class="dayrow ${on ? "on" : ""}" data-day="${d}">
          <label class="daytoggle"><input type="checkbox" name="days" value="${d}" ${on ? "checked" : ""}><span class="dn">${full}</span><span class="dsum"></span><span class="dchk">${ic("check")}</span></label>
          <div class="daytime"><span class="small muted">Jam mulai</span><input class="input" type="time" name="t_${d}" value="16:00" step="900"></div>
        </div>`; }).join("")}</div>
      <span class="hint">Pilih hari, lalu atur jam mulainya. Tiap hari boleh beda jam.</span></div>
    <div class="field"><span class="lbl">Budget per sesi: <span class="range-val" id="pbVal">${rp(120000)}</span><span class="muted" id="pbDur"> / 90 menit</span></span>
      <input type="range" name="budget" min="50000" max="400000" step="5000" value="120000"><span class="hint">Maksimal Rp400.000 per sesi.</span></div>
    <label class="field"><span class="lbl">Catatan untuk tutor (opsional)</span><textarea class="input" name="notes" placeholder="cth. Lebih suka tutor perempuan, ada laporan perkembangan"></textarea></label>
    <section class="card boost-card">
      <div class="row" style="gap:10px;margin-bottom:12px"><span class="boost-ic">${ic("bolt")}</span>
        <div><h3>Boost postingan</h3><p class="small" style="color:var(--ink-2);margin-top:2px">Tampil paling atas supaya tutor lebih cepat melihat kebutuhanmu.</p></div></div>
      <div class="boost-list">${pk.map(([d, t, sub, price, tag]) => `
        <label class="boost"><input type="radio" name="boost" value="${d}" ${d === 0 ? "checked" : ""}>
          <span class="bx"><span class="grow"><b>${t}</b>${tag ? `<em>${tag}</em>` : ""}<small>${sub}</small></span><strong>${price}</strong></span></label>`).join("")}</div>
    </section>
    <div class="info" style="margin-bottom:14px">${ic("shield")}<span>Nama lengkap & alamatmu tidak ditampilkan. Tutor hanya melihat daerah dan kebutuhan les.</span></div>
    <button class="btn" id="postSubmit">Tayangkan postingan</button>
  </form>`;
};
VIEWS.post.mount = () => {
  const f = $("#postForm");
  const updBtn = () => { const d = +f.querySelector("input[name=boost]:checked").value; $("#postSubmit").textContent = d ? `Tayangkan + boost ${d} hari — ${rp(PRICE.BOOST[d])}` : "Tayangkan postingan"; };
  const updDays = () => {
    const dur = +f.querySelector("input[name=dur]:checked").value;
    $$(".dayrow", f).forEach((r) => {
      const on = r.querySelector("input[type=checkbox]").checked, t = r.querySelector("input[type=time]").value;
      r.classList.toggle("on", on);
      r.querySelector(".dsum").textContent = on && t ? `${fmtT(t)} – ${addMin(t, dur)}` : "";
    });
    $("#pbDur").textContent = ` / ${durLabel(dur)}`;
  };
  const upd = (e) => { $("#pbVal").textContent = rp(+f.budget.value); updDays(); updBtn(); e && clearErr(e.target.closest(".field.err")); };
  f.addEventListener("input", upd); f.addEventListener("change", upd); updDays();
  f.onsubmit = (e) => {
    e.preventDefault(); const fd = new FormData(f);
    const p = { id: "m" + uid(), owner: fd.get("owner").trim(), phone: fd.get("phone").trim(), subject: fd.get("subject"), level: fd.get("level"), curr: fd.get("curr"),
      student: fd.get("student").trim(), area: fd.get("area"), mode: fd.get("mode"), days: fd.getAll("days"), dur: +fd.get("dur"), budget: +fd.get("budget"),
      notes: fd.get("notes").trim(), hoursAgo: 0, contacted: 0, created: now(), boost: 0, interested: [] };
    const digits = p.phone.replace(/\D/g, "");
    p.times = {}; p.days.forEach((d) => { p.times[d] = fd.get("t_" + d); });
    const t0 = p.times[p.days[0]];
    p.time = t0 ? `${fmtT(t0)}–${addMin(t0, p.dur)}` : "";
    const ok = showErrors(f, [
      { f: "owner", ok: p.owner.length >= 2, msg: "Isi nama yang akan tampil, cth. Ibu Ratna." },
      { f: "phone", ok: /^(0|62)8\d{7,12}$/.test(digits), msg: p.phone ? "Nomor WhatsApp harus diawali 08, 10–13 angka." : "Isi nomor WhatsApp supaya tutor bisa menghubungimu." },
      { f: "student", ok: p.student.length >= 3, msg: "Ceritakan singkat tentang murid, cth. kelas berapa." },
      { f: "days", ok: p.days.length > 0, msg: "Pilih minimal satu hari." },
      { f: "days", ok: p.days.every((d) => p.times[d]), msg: "Isi jam mulai untuk tiap hari yang dipilih." },
    ]);
    if (!ok) return;
    S.lastOwner = p.owner; S.lastPhone = p.phone;
    const publish = () => { S.myPosts.unshift(p); save(); location.hash = "#/myposts"; toast("Postingan tayang. Tutor di sekitarmu sedang diberi tahu."); simulateTutorReach(p.id); };
    const d = +fd.get("boost");
    if (d) pay({ title: `Boost postingan ${d} hari`, desc: `Postinganmu tampil paling atas di lowongan tutor selama ${d} hari.`, amount: PRICE.BOOST[d],
      successTitle: "Postingan tayang", successText: `Boost ${d} hari aktif. Tutor di sekitarmu akan melihat postinganmu paling atas.`, successCta: "Lihat postingan",
      onSuccess: () => { p.boost = d; addTx(`Boost postingan ${d} hari`, -PRICE.BOOST[d]); S.myPosts.unshift(p); location.hash = "#/myposts"; simulateTutorReach(p.id); } });
    else publish();
  };
};
// Simulasi: tutor yang cocok membayar untuk menghubungi postinganmu → muncul di "Tutor tertarik".
function simulateTutorReach(postId) {
  const p = S.myPosts.find((x) => x.id === postId); if (!p) return;
  const cands = TUTORS.filter((t) => t.subjects.includes(p.subject) && t.levels.includes(p.level));
  const pick = (cands.length ? cands : TUTORS.filter((t) => t.online)).slice().sort(() => Math.random() - 0.5).slice(0, 2);
  pick.forEach((t, i) => setTimeout(() => {
    const post = S.myPosts.find((x) => x.id === postId); if (!post) return;
    post.interested.push(t.id); post.contacted++;
    if (!S.unlocked.includes(t.id)) S.unlocked.push(t.id); // tutor sudah bayar → kontaknya terbuka gratis untukmu
    S.newInterest++; save();
    if (S.role !== "pencari") return;
    if (currentRoute().page === "myposts") render(); else renderNav();
    toast(`<b>${esc(t.name)}</b> tertarik dengan postinganmu <a href="#/myposts">Lihat</a>`, "info");
  }, 4500 + i * 6000));
}

// ---------- MY POSTS ----------
VIEWS.myposts = () => {
  if (S.newInterest) { S.newInterest = 0; save(); }
  if (!S.myPosts.length) return `<h1>Postinganku</h1>${emptyBox("board", `Belum ada postingan.<br><a class="btn" href="#/post" style="margin-top:14px">Posting kebutuhan les</a>`)}`;
  return `<h1>Postinganku</h1><p class="sub">Tutor yang tertarik akan menghubungimu lewat WhatsApp. Kontak mereka otomatis terbuka gratis untukmu.</p>
  <div class="stack section">${S.myPosts.map((p) => {
    const ts = (p.interested || []).map((id) => TUTORS.find((t) => t.id === id)).filter(Boolean);
    return `<div class="post-group">
      ${postCard(p, "own")}
      <div class="row between" style="margin:12px 4px 4px"><b class="small">${ts.length} tutor tertarik</b>${p.boost ? `<span class="chip pri">${ic("bolt")}Boost ${p.boost} hari</span>` : `<span class="chip">Aktif</span>`}</div>
      <div class="card" style="padding:4px 14px">${ts.map((t) => contactRow(t.name, t.headline, t.id, waLink(t.phone, `Halo Kak ${t.name.split(" ")[0]}, terima kasih sudah tertarik dengan postingan les ${p.subject} saya di LesIn.`), `#/tutor/${t.id}`)).join("")
        || `<p class="small muted" style="padding:12px 0">Menunggu tutor… biasanya dalam beberapa jam.</p>`}</div>
    </div>`;
  }).join("")}</div>`;
};
function contactRow(name, sub, colorKey, wa, href, extra = "") {
  return `<div class="contact-row">
    <a href="${href}" class="row grow" style="min-width:0;gap:10px"><div class="avatar sm" style="background:${avColor(colorKey)}">${initials(name)}</div>
      <div style="min-width:0"><b class="small">${esc(name)}</b><div class="last">${esc(sub)}</div></div></a>
    ${extra}<a class="btn sm wa" href="${wa}" target="_blank" rel="noopener">${ic("wa")}WA</a>
  </div>`;
}

// ---------- KONTAK ----------
VIEWS.kontak = () => {
  if (S.role === "tutor") {
    const posts = SEED_POSTS.filter((p) => S.contactedPosts.includes(p.id));
    const me = S.profile.name ? S.profile.name.split(" ")[0] : "tutor";
    return `<h1>Kontak</h1><p class="sub">Calon murid yang sudah kamu buka kontaknya. Lanjutkan di WhatsApp.</p>
    ${posts.length ? `<div class="card section" style="padding:4px 14px">${posts.map((p) => contactRow(p.owner, `${p.subject} ${p.level} · ${p.area} · ${p.phone}`, p.id,
      waLink(p.phone, `Halo ${p.owner}, saya ${me}, tutor ${p.subject} dari LesIn. Saya tertarik dengan kebutuhan les ${p.subject} ${p.level} di ${p.area}. Boleh kita atur jadwal trial?`), `#/lowongan/${p.id}`)).join("")}</div>`
      : emptyBox("users", "Belum ada kontak. Buka kontak calon murid dari <a href='#/board' class='link'>Lowongan</a>.")}`;
  }
  const ts = S.unlocked.map((id) => TUTORS.find((t) => t.id === id)).filter(Boolean);
  return `<h1>Kontak</h1><p class="sub">Tutor yang kontaknya sudah terbuka. Chat lewat WhatsApp, lalu beri ulasan setelah les.</p>
  ${ts.length ? `<div class="card section" style="padding:4px 14px">${ts.map((t) => contactRow(t.name, `${t.subjects.slice(0, 2).join(", ")} · ${t.phone}`, t.id,
    waLink(t.phone, `Halo Kak ${t.name.split(" ")[0]}, saya lihat profil Kakak di LesIn. Apakah masih ada jadwal kosong untuk les ${t.subjects[0]}?`), `#/tutor/${t.id}`,
    S.reviews[t.id] ? `<span class="chip">${ic("star", "star")}${S.reviews[t.id].stars}</span>` : `<button class="icon-btn" aria-label="Tulis ulasan" title="Tulis ulasan" data-review="${t.id}">${ic("starO")}</button>`)).join("")}</div>`
    : emptyBox("users", "Belum ada kontak. Buka kontak tutor dari <a href='#/search' class='link'>pencarian</a>.")}`;
};
VIEWS.kontak.mount = () => $$("[data-review]").forEach((b) => (b.onclick = () => reviewSheet(TUTORS.find((x) => x.id === b.dataset.review))));

// ---------- BOARD (tutor melihat postingan) ----------
VIEWS.board = () => {
  if (!cvReady()) return `<h1>Lowongan les</h1><div class="section">${cvGate()}</div>`;
  const filt = S.boardFilter || "Untukku";
  const p = S.profile;
  let list = [...SEED_POSTS];
  if (filt === "Untukku") list = list.filter((x) => p.subjects.includes(x.subject));
  else if (filt === "Dekat") list = list.filter(inRadius);
  else if (filt !== "Semua") list = list.filter((x) => x.subject === filt);
  list.sort((a, b) => a.hoursAgo - b.hoursAgo);
  return `<h1>Lowongan les</h1><p class="sub">Murid yang sedang mencari tutor. Buka kontak WhatsApp-nya seharga ${rp(PRICE.CHAT)}.</p>
  <div class="hscroll section" style="margin-top:14px">${["Untukku", "Dekat", "Semua", ...SUBJECTS].map((x) => `<button class="chip ${filt === x ? "pri" : ""}" data-bf="${esc(x)}" style="padding:8px 12px">${esc(x)}</button>`).join("")}</div>
  <div class="stack" style="margin-top:12px">${list.map((x) => postCard(x)).join("") || emptyBox("board", "Tidak ada lowongan untuk filter ini.")}</div>`;
};
VIEWS.board.mount = () => !cvReady() ? 0 : $$("[data-bf]").forEach((b) => (b.onclick = () => { S.boardFilter = b.dataset.bf; save(); render(); }));

VIEWS.lowongan = (id) => {
  if (!cvReady()) return `<h1>Lowongan les</h1><div class="section">${cvGate()}</div>`;
  const p = SEED_POSTS.find((x) => x.id === id); if (!p) return emptyBox("board", "Postingan tidak ditemukan.");
  const done = S.contactedPosts.includes(id);
  const fit = S.profile.subjects.includes(p.subject) && S.profile.levels.includes(p.level);
  const me = S.profile.name ? S.profile.name.split(" ")[0] : "tutor";
  const wa = waLink(p.phone, `Halo ${p.owner}, saya ${me}, tutor ${p.subject} dari LesIn. Saya tertarik dengan kebutuhan les ${p.subject} ${p.level} di ${p.area}. Boleh kita atur jadwal trial?`);
  return `<div class="row" style="margin-bottom:12px">${back()}<h2 class="grow">Detail lowongan</h2></div>
  ${postCard(p, "detail")}
  ${p.notes ? `<div class="card section"><h3 class="cap-title">Catatan</h3><p class="sub" style="margin-top:6px">${esc(p.notes)}</p></div>` : ""}
  ${done ? `<div class="section">${contactCard({ color: avColor(p.id), name: p.owner, note: `${esc(p.subject)} ${esc(p.level)} · ${esc(p.area)}`, rows: [["WhatsApp", p.phone, true], ["Daerah", p.area]], wa })}</div>`
    : `<div class="info section">${ic("info")}<span>${fit ? "Cocok dengan mapel & jenjang di CV-mu." : "Mapel/jenjang ini belum ada di CV-mu — peluang dipilih lebih kecil."} Setelah kamu buka kontak, CV-mu juga terkirim ke pencari.</span></div>
       <div style="height:70px"></div>
       <div class="sticky-cta"><button class="btn" id="contactBtn">${ic("unlock")}Buka WhatsApp ${esc(maskOwner(p.owner))} — ${rp(PRICE.CHAT)}</button></div>`}`;
};
VIEWS.lowongan.mount = (id) => {
  if (!cvReady()) return;
  const p = SEED_POSTS.find((x) => x.id === id); const b = $("#contactBtn"); if (!b) return;
  b.onclick = () => pay({
    title: "Buka kontak calon murid", desc: `Nama & nomor WhatsApp <b>${esc(maskOwner(p.owner))}</b> untuk les ${esc(p.subject)} ${esc(p.level)} akan terbuka. CV-mu juga dikirim ke pencari.`,
    amount: PRICE.CHAT, successTitle: "Kontak terbuka", successText: "Perkenalkan dirimu lewat WhatsApp. Kontak ini juga tersimpan di menu Kontak.", successCta: "Lihat kontak",
    onSuccess: () => { S.contactedPosts.push(p.id); p.contacted++; addTx(`Buka kontak lowongan ${p.subject} ${p.level}`, -PRICE.CHAT); },
  });
};

// ---------- PROFILE / CV (tutor) ----------
function profileCompletion() {
  const p = S.profile;
  const checks = [p.name, p.phone, p.headline, p.edu, p.bio, p.achievements, p.subjects.length, p.levels.length, p.docs.length >= 2];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
function readCv(f) {
  const fd = new FormData(f);
  return { name: fd.get("name").trim(), phone: fd.get("phone").trim(), headline: fd.get("headline").trim(), subjects: fd.getAll("subjects"), levels: fd.getAll("levels"),
    curricula: fd.getAll("curricula"), area: fd.get("area"), rate: +fd.get("rate"), dur: +fd.get("dur"), exp: +fd.get("exp"), edu: fd.get("edu").trim(),
    bio: fd.get("bio").trim(), achievements: fd.get("achievements").trim() };
}
VIEWS.profile = () => {
  const p = S.profile;
  const preview = { id: "me", name: p.name || "Nama Kamu", area: p.area, headline: p.headline || "Headline singkat tentang caramu mengajar", edu: p.edu || "Pendidikan terakhir", exp: p.exp,
    rating: 5.0, reviews: 0, subjects: p.subjects.length ? p.subjects : ["Mapel"], rate: p.rate, dur: p.dur, verified: p.docs.length >= 2 };
  const subjOpts = [...new Set([...SUBJECTS, ...S.customSubjects, ...p.subjects])];
  const doc = (k, icon, t, s) => { const done = p.docs.includes(k); return `<button type="button" class="doc-up ${done ? "done" : ""}" data-doc="${k}" ${done ? "disabled" : ""}>
    <span class="mi">${ic(done ? "check" : icon)}</span><span class="grow"><b>${t}</b><small>${done ? "Terkirim — ditinjau 1×24 jam" : s}</small></span></button>`; };
  const req = `<b class="req" title="Wajib">*</b>`;
  return `<h1>CV Saya</h1><p class="sub">Ini yang dilihat pencari. Nama & kontakmu disamarkan sampai mereka membuka kontak.</p>
  ${cvReady() ? "" : `<div class="info" style="margin-top:12px">${ic("info")}<span><b>CV wajib diisi</b> untuk memakai mode tutor. Kolom bertanda <b class="req">*</b> harus lengkap. “Tentang caramu mengajar” boleh kosong.</span></div>`}
  <div class="section"><p class="small muted" style="margin-bottom:6px;font-weight:700">PRATINJAU DI HASIL PENCARIAN</p>
    ${tutorCard({ t: preview, reach: true, same: true, score: 90 }, true)}</div>
  <form id="cvForm" class="section" novalidate>
    <label class="field" data-f="name"><span class="lbl">Nama lengkap ${req}</span><input class="input" name="name" value="${esc(p.name)}" placeholder="Nama sesuai identitas"></label>
    <label class="field" data-f="phone"><span class="lbl">Nomor WhatsApp ${req}</span><input class="input" name="phone" inputmode="tel" value="${esc(p.phone)}" placeholder="08xx-xxxx-xxxx">
      <span class="hint">Terbuka untuk pencari yang membayar, dan dipakai saat kamu menghubungi calon murid.</span></label>
    <label class="field"><span class="lbl">Headline (opsional)</span><input class="input" name="headline" maxlength="60" value="${esc(p.headline)}" placeholder="cth. Bikin Matematika jadi masuk akal"></label>
    <div class="field" data-f="subjects"><span class="lbl">Mata pelajaran ${req}</span><div class="chips" id="subjChips">${subjOpts.map((s) => `<label class="pick"><input type="checkbox" name="subjects" value="${esc(s)}" ${p.subjects.includes(s) ? "checked" : ""}><span>${esc(s)}</span></label>`).join("")}
      <button type="button" class="pick-add" id="addSubj">${ic("plus")}Tambah</button></div></div>
    <div class="field" data-f="levels"><span class="lbl">Jenjang ${req}</span><div class="chips">${LEVELS.map((s) => `<label class="pick"><input type="checkbox" name="levels" value="${s}" ${p.levels.includes(s) ? "checked" : ""}><span>${s}</span></label>`).join("")}</div></div>
    <div class="field"><span class="lbl">Kurikulum yang dikuasai</span><div class="chips">${CURRICULA.map((s) => `<label class="pick"><input type="checkbox" name="curricula" value="${s}" ${p.curricula.includes(s) ? "checked" : ""}><span>${s}</span></label>`).join("")}</div></div>
    ${areaPicker("area", "Domisili (kecamatan)", p.area)}
    <label class="field" data-f="rate"><span class="lbl">Tarif (Rp) ${req}</span><input class="input" type="number" step="5000" min="25000" max="400000" name="rate" value="${p.rate}"></label>
    <div class="field"><span class="lbl">Tarif itu untuk durasi</span>${seg("dur", DURS, p.dur || 60)}<span class="hint">Pencari melihat tarifmu per ${durLabel(p.dur || 60)}.</span></div>
    <label class="field"><span class="lbl">Pengalaman mengajar (tahun)</span><input class="input" type="number" min="0" max="50" name="exp" value="${p.exp}"></label>
    <label class="field" data-f="edu"><span class="lbl">Pendidikan ${req}</span><input class="input" name="edu" value="${esc(p.edu)}" placeholder="cth. S1 Matematika — Universitas ..."></label>
    <label class="field"><span class="lbl">Tentang caramu mengajar (opsional)</span><textarea class="input" name="bio" placeholder="Jangan tulis nomor HP atau akun sosmed di sini.">${esc(p.bio)}</textarea></label>
    <label class="field"><span class="lbl">Prestasi & pengalaman</span><textarea class="input" name="achievements">${esc(p.achievements)}</textarea></label>
    <div class="field"><span class="lbl">Verifikasi</span>
      ${doc("id", "idcard", "Foto identitas (KTP/KTM)", "Hanya dilihat tim verifikasi, dihapus setelah dicek")}
      ${doc("skill", "doc", "Bukti keahlian", "Sertifikat kursus, sertifikat lomba, atau portofolio")}
      <p class="hint" style="margin-top:8px">Dokumen tidak pernah ditampilkan ke pencari. Pencari hanya melihat badge "Identitas terverifikasi".</p></div>
    <button class="btn">${cvReady() ? "Simpan CV" : "Simpan CV & mulai jadi tutor"}</button>
  </form>
  ${proCard()}`;
};
function addSubjectSheet(form) {
  openSheet(`<h2>Tambah mata pelajaran</h2>
    <p class="sub" style="margin-top:4px">Untuk mapel di luar daftar. Biaya sekali bayar <b>${rp(PRICE.ADD_SUBJECT)}</b> per mapel, tanpa masa berlaku.</p>
    <label class="field" data-f="nm" style="margin-top:14px"><span class="lbl">Nama mata pelajaran</span><input class="input" id="subjName" maxlength="40" placeholder="cth. Ekonomi, Gitar" autocomplete="off"></label>
    <button class="btn" id="subjGo">Lanjut bayar ${rp(PRICE.ADD_SUBJECT)}</button>`, (sh) => {
    $("#subjGo", sh).onclick = () => {
      const v = $("#subjName", sh).value.trim().replace(/\s+/g, " ");
      if (!showErrors(sh, [{ f: "nm", ok: v.length >= 2, msg: "Tulis nama mapel minimal 2 huruf." }])) return;
      pay({ title: `Tambah mapel “${v}”`, desc: "Mapel akan masuk ke daftar mata pelajaranmu.", amount: PRICE.ADD_SUBJECT,
        successTitle: "Mapel ditambahkan", successText: `“${esc(v)}” sudah ada di daftar mapelmu.`,
        onSuccess: () => {
          if (form && document.body.contains(form)) Object.assign(S.profile, readCv(form)); // jangan hilangkan isian yang belum disimpan
          if (!allSubjects().some((x) => x.toLowerCase() === v.toLowerCase())) S.customSubjects.push(v);
          const have = S.profile.subjects.find((x) => x.toLowerCase() === v.toLowerCase());
          if (!have) S.profile.subjects.push(v);
          addTx(`Tambah mapel ${v}`, -PRICE.ADD_SUBJECT);
        } });
    };
  });
}
VIEWS.profile.mount = () => {
  const f = $("#cvForm");
  f.addEventListener("input", (e) => clearErr(e.target.closest(".field.err")));
  f.addEventListener("change", (e) => clearErr(e.target.closest(".field.err")));
  $$("[data-doc]").forEach((b) => (b.onclick = () => { Object.assign(S.profile, readCv(f)); S.profile.docs.push(b.dataset.doc); save(); render(); toast("Dokumen terkirim untuk ditinjau."); }));
  $("#addSubj").onclick = () => addSubjectSheet(f);
  f.onsubmit = (e) => {
    e.preventDefault(); const v = readCv(f), digits = v.phone.replace(/\D/g, "");
    const ok = showErrors(f, [
      { f: "name", ok: v.name.length >= 3, msg: "Isi nama lengkapmu." },
      { f: "phone", ok: /^(0|62)8\d{7,12}$/.test(digits), msg: v.phone ? "Nomor WhatsApp harus diawali 08, 10–13 angka." : "Isi nomor WhatsApp supaya murid bisa menghubungimu." },
      { f: "subjects", ok: v.subjects.length > 0, msg: "Pilih minimal satu mata pelajaran." },
      { f: "levels", ok: v.levels.length > 0, msg: "Pilih minimal satu jenjang." },
      { f: "rate", ok: v.rate >= 25000 && v.rate <= 400000, msg: "Isi tarif antara Rp25.000 dan Rp400.000." },
      { f: "edu", ok: v.edu.length >= 3, msg: "Isi pendidikan terakhirmu." },
    ]);
    if (!ok) return;
    const first = !cvReady();
    Object.assign(S.profile, v, { cvDone: true });
    save(); render(); toast(first ? "CV tersimpan. Kamu siap jadi tutor." : "CV tersimpan");
    if (first && S.role === "tutor") location.hash = "#/";
  };
  bindPro();
};

// ---------- WALLET ----------
VIEWS.wallet = () => {
  const pk = [[50000, 0], [100000, 10000], [200000, 30000]];
  const pencari = S.role === "pencari";
  return `<h1>${pencari ? "Kuota & saldo" : "Saldo"}</h1>
  ${pencari ? `
  <div class="balance section"><span class="small" style="opacity:.8;font-weight:600">Kuota buka kontak</span><div class="amt">${S.credits} kontak</div>
    <span class="small" style="opacity:.8">Tidak ada masa berlaku · Saldo: ${rp(S.balance)}</span></div>
  <div class="section"><div class="section-head"><h2>Beli paket kontak</h2><span class="small muted">Makin banyak, makin hemat</span></div>
    <div class="pack-row">${PRICE.UNLOCK_PACKS.map((p, i) => `<button class="pack ${p.tag ? "hl" : ""}" data-pack="${i}">
      ${p.tag ? `<em class="ptag">${p.tag}</em>` : ""}<b class="pn">${p.n}</b><span class="pu">kontak</span>
      ${p.was ? `<s>${rp(p.was)}</s>` : ""}<strong>${rp(p.price)}</strong><small>${rp(p.price / p.n)}/kontak</small></button>`).join("")}</div>
  </div>` : `
  <div class="balance section"><span class="small" style="opacity:.8;font-weight:600">Saldo LesIn</span><div class="amt">${rp(S.balance)}</div>
    <span class="small" style="opacity:.8">≈ ${Math.floor(S.balance / PRICE.CHAT)} kali buka kontak murid</span></div>`}
  <div class="section"><div class="section-head"><h2>Top up saldo</h2><span class="small muted">Bonus untuk nominal besar</span></div>
    <div class="pack-row">${pk.map(([a, b]) => `<button class="pack" data-top="${a}" data-bonus="${b}">
      <span class="pu">Top up</span><strong class="pn2">${rp(a)}</strong>${b ? `<span class="chip ok">+ ${rp(b)}</span>` : `<small>tanpa bonus</small>`}</button>`).join("")}</div>
  </div>
  <div class="section stack">
    <a class="card tap link-row" href="#/harga"><span class="mi">${ic("tag")}</span><span class="grow"><b>Daftar harga</b><small>Kontak, boost, dan Tutor Pro</small></span>${ic("chevR")}</a>
    <a class="card tap link-row" href="#/riwayat"><span class="mi">${ic("list")}</span><span class="grow"><b>Riwayat transaksi</b><small>${S.tx.length ? `${S.tx.length} transaksi` : "Belum ada transaksi"}</small></span>${ic("chevR")}</a>
  </div>
  <button class="btn line section" id="logoutBtn2">Keluar dari akun</button>
  <button class="btn line" id="resetDemo" style="margin-top:8px">Reset data demo</button>`;
};
VIEWS.wallet.mount = () => {
  $$("[data-top]").forEach((b) => (b.onclick = () => {
    const a = +b.dataset.top, bonus = +b.dataset.bonus;
    pay({ title: "Top up saldo", desc: `Saldo bertambah ${rp(a + bonus)}${bonus ? " (termasuk bonus)" : ""}.`, amount: a, allowSaldo: false,
      successTitle: "Top up berhasil", successText: `Saldo bertambah ${rp(a + bonus)}.`, onSuccess: () => { S.balance += a + bonus; addTx("Top up saldo", a + bonus); } });
  }));
  $$("[data-pack]").forEach((b) => (b.onclick = () => buyPack(+b.dataset.pack)));
  $("#logoutBtn2").onclick = logout;
  $("#resetDemo").onclick = () => { if (confirm("Hapus semua data demo?")) { localStorage.removeItem(keyFor()); S = load(); location.hash = "#/"; render(); } };
};

VIEWS.harga = () => `<div class="row" style="margin-bottom:12px">${back("#/wallet")}<h1 class="grow" style="margin:0">Daftar harga</h1></div>
  <div class="card"><dl class="kv"><dt>Buka kontak tutor</dt><dd>${PRICE.UNLOCK_PACKS.map((p) => `${p.n} kontak — ${rp(p.price)}`).join("<br>")}</dd>
    <dt>Buka kontak murid</dt><dd>${rp(PRICE.CHAT)} / postingan</dd>
    <dt>Boost postingan</dt><dd>${[3, 7, 14].map((d) => `${d} hari — ${rp(PRICE.BOOST[d])}`).join("<br>")}</dd>
    <dt>Tutor Pro</dt><dd>${rp(PRICE.PRO)} / bulan</dd>
    <dt>Tambah mapel</dt><dd>${rp(PRICE.ADD_SUBJECT)} / mapel di luar daftar</dd></dl></div>`;
VIEWS.riwayat = () => `<div class="row" style="margin-bottom:12px">${back("#/wallet")}<h1 class="grow" style="margin:0">Riwayat transaksi</h1></div>
  <div class="card">${S.tx.length ? S.tx.map((x) => `<div class="tx"><span>${esc(x.label)}<br><span class="muted small">${new Date(x.t).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</span></span>
    <span class="${x.amount < 0 ? "neg" : x.amount > 0 ? "pos" : ""}">${x.amount === 0 ? "1 kuota" : (x.amount > 0 ? "+" : "−") + rp(Math.abs(x.amount))}</span></div>`).join("")
    : `<p class="small muted">Belum ada transaksi.</p>`}</div>`;

// ---------- AKUN: masuk / daftar ----------
function logout() {
  SESSION = ""; localStorage.removeItem(SES_KEY); S = load();
  location.hash = "#/"; render(); toast("Kamu sudah keluar.", "info");
}
function startSession(id) {
  SESSION = id; localStorage.setItem(SES_KEY, id); S = load();
}
const pwField = (name, label, hint = "") => `<label class="field" data-f="${name}"><span class="lbl">${label}</span>
  <span class="pw"><input class="input" type="password" name="${name}" autocomplete="${name === "pw" ? "current-password" : "new-password"}" placeholder="Minimal 6 karakter"><button type="button" class="pw-eye" data-eye aria-label="Lihat password">${ic("eye")}</button></span>${hint}</label>`;
const authHead = (m) => `<div class="auth-head"><img src="assets/mascot.svg" alt="" width="84" height="84">
  <h1>${m === "masuk" ? "Masuk ke LesIn" : "Buat akun LesIn"}</h1>
  <p class="sub">${m === "masuk" ? "Lanjutkan cari guru les atau kelola CV tutormu." : "Gratis. Akun baru dapat 1 kuota buka kontak tutor."}</p></div>
  <div class="auth-tabs" role="tablist"><a href="#/masuk" class="${m === "masuk" ? "on" : ""}">Masuk</a><a href="#/daftar" class="${m === "daftar" ? "on" : ""}">Daftar</a></div>`;
const bindEye = (f) => $$("[data-eye]", f).forEach((b) => (b.onclick = () => { const i = b.previousElementSibling; i.type = i.type === "password" ? "text" : "password"; b.classList.toggle("on", i.type === "text"); }));
const demoNote = `<p class="demo-note">Mode demo — akun disimpan di browser ini saja, belum ada server.</p>`;

VIEWS.gate = () => `<div class="auth-gate"><img src="assets/mascot.svg" alt="" width="96" height="96"><h2>Masuk dulu ya</h2>
  <p class="sub">Halaman ini khusus pengguna LesIn. Mencari tutor dan membaca CV tetap bisa tanpa akun.</p>
  <a class="btn" href="#/masuk">Masuk</a><a class="btn line" href="#/daftar">Daftar gratis</a></div>`;

VIEWS.masuk = () => SESSION ? (location.replace("#/"), "") : `${authHead("masuk")}
  <form id="authForm" class="section" novalidate>
    <label class="field" data-f="phone"><span class="lbl">Nomor WhatsApp</span><input class="input" name="phone" inputmode="tel" autocomplete="tel" placeholder="08xx-xxxx-xxxx"></label>
    ${pwField("pw", "Password")}
    <button class="btn" id="authGo">Masuk</button>
    <p class="small muted" style="text-align:center;margin-top:14px">Belum punya akun? <a class="link" href="#/daftar">Daftar gratis</a></p>
    ${demoNote}
  </form>`;
VIEWS.masuk.mount = () => {
  const f = $("#authForm"); if (!f) return; bindEye(f);
  f.addEventListener("input", (e) => clearErr(e.target.closest(".field.err")));
  f.onsubmit = async (e) => {
    e.preventDefault(); const fd = new FormData(f), phone = normPhone(fd.get("phone")), pw = fd.get("pw");
    if (!showErrors(f, [{ f: "phone", ok: validPhone(phone), msg: "Isi nomor WhatsApp yang diawali 08." }, { f: "pw", ok: pw.length > 0, msg: "Isi password." }])) return;
    const b = $("#authGo"); b.disabled = true;
    const acc = readAcc().find((a) => a.phone === phone);
    const ok = acc && (await hashPw(pw, acc.id)) === acc.hash;
    b.disabled = false;
    if (!ok) return void showErrors(f, [{ f: "pw", ok: false, msg: "Nomor atau password salah." }]);
    startSession(acc.id); const to = authNext; authNext = "#/";
    location.hash = to === "#/masuk" || to === "#/daftar" ? "#/" : to; render(); toast(`Halo, <b>${esc(acc.name.split(" ")[0])}</b>. Selamat datang kembali.`);
  };
};

VIEWS.daftar = () => SESSION ? (location.replace("#/"), "") : `${authHead("daftar")}
  <form id="authForm" class="section" novalidate>
    <label class="field" data-f="name"><span class="lbl">Nama lengkap</span><input class="input" name="name" autocomplete="name" placeholder="Nama kamu"></label>
    <label class="field" data-f="phone"><span class="lbl">Nomor WhatsApp</span><input class="input" name="phone" inputmode="tel" autocomplete="tel" placeholder="08xx-xxxx-xxxx">
      <span class="hint">Dipakai untuk masuk. Tidak ditampilkan ke siapa pun sebelum kamu mengizinkan.</span></label>
    ${pwField("pw", "Password")}
    <div class="field"><span class="lbl">Saya mau</span>${seg("role", [["pencari", "Cari guru les"], ["tutor", "Jadi tutor"]], "pencari")}
      <span class="hint">Bisa ganti kapan saja. Jadi tutor perlu mengisi CV.</span></div>
    <button class="btn" id="authGo">Buat akun</button>
    <p class="small muted" style="text-align:center;margin-top:14px">Sudah punya akun? <a class="link" href="#/masuk">Masuk</a></p>
    ${demoNote}
  </form>`;
VIEWS.daftar.mount = () => {
  const f = $("#authForm"); if (!f) return; bindEye(f);
  f.addEventListener("input", (e) => clearErr(e.target.closest(".field.err")));
  f.addEventListener("change", (e) => clearErr(e.target.closest(".field.err")));
  f.onsubmit = async (e) => {
    e.preventDefault(); const fd = new FormData(f), name = fd.get("name").trim().replace(/\s+/g, " "), phone = normPhone(fd.get("phone")), pw = fd.get("pw"), role = fd.get("role");
    const dup = readAcc().some((a) => a.phone === phone);
    if (!showErrors(f, [{ f: "name", ok: name.length >= 3, msg: "Isi nama lengkapmu." },
      { f: "phone", ok: validPhone(phone) && !dup, msg: dup ? "Nomor ini sudah terdaftar. Silakan masuk." : "Nomor WhatsApp harus diawali 08, 10–13 angka." },
      { f: "pw", ok: pw.length >= 6, msg: "Password minimal 6 karakter." }])) return;
    const b = $("#authGo"); b.disabled = true;
    const id = "u" + uid(), acc = { id, name, phone, hash: await hashPw(pw, id), created: now() };
    localStorage.setItem(ACC_KEY, JSON.stringify([...readAcc(), acc]));
    startSession(id);
    S.role = role === "tutor" ? "tutor" : "pencari"; S.lastOwner = name; S.lastPhone = phone;
    Object.assign(S.profile, { name, phone }); save();
    const to = authNext; authNext = "#/";
    if (S.role === "tutor") { location.hash = "#/profile"; render(); toast("Akun dibuat. Lengkapi <b>CV</b> untuk mulai jadi tutor.", "info", 5000); }
    else { location.hash = to === "#/masuk" || to === "#/daftar" ? "#/" : to; render(); toast(`Akun dibuat. Kamu punya <b>${S.credits} kuota</b> gratis.`); }
  };
};

// ---------- boot ----------
render();
