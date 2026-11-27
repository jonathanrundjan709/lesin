/** Pemformatan tampilan: rupiah, durasi, jam, waktu relatif, warna avatar, singkatan mapel. */
export const rp = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");

/** 60 -> "jam", 90 -> "90 menit", 120 -> "2 jam" (untuk "Rp100.000 / jam"). */
export const durLabel = (d) => (d === 60 ? "jam" : d === 90 ? "90 menit" : d === 120 ? "2 jam" : `${d} menit`);
export const DURATIONS = [[60, "1 jam"], [90, "1,5 jam"], [120, "2 jam"]];

export const DAYS_FULL = { Sen: "Senin", Sel: "Selasa", Rab: "Rabu", Kam: "Kamis", Jum: "Jumat", Sab: "Sabtu", Min: "Minggu" };

/** "16:00" -> "16.00" */
export const fmtTime = (t) => String(t).replace(":", ".");
export const addMin = (t, m) => {
  const [h, mi] = t.split(":").map(Number);
  const x = h * 60 + mi + m;
  return `${String(Math.floor(x / 60) % 24).padStart(2, "0")}.${String(x % 60).padStart(2, "0")}`;
};
/** [{day,time}] -> "Sen 16.00 · Kam 17.30" */
export const scheduleText = (slots) => slots.map((s) => `${s.day} ${fmtTime(s.time)}`).join(" · ");

export const agoText = (ms, now = Date.now()) => {
  const h = Math.floor((now - ms) / 3_600_000);
  return h < 1 ? "baru saja" : h < 24 ? `${h} jam lalu` : `${Math.floor(h / 24)} hari lalu`;
};
export const daysLeft = (expiresAt, now = Date.now()) => Math.max(0, Math.ceil((expiresAt - now) / 86_400_000));

const AV_COLORS = ["#5B4BFF", "#12A16B", "#E0662B", "#D9467A", "#0E8FB8", "#8B5CF6", "#B7791F", "#3A2CC7"];
export const avColor = (id) => AV_COLORS[[...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length];

const SUBJ_ABBR = { "Matematika": "MTK", "Fisika": "FIS", "Kimia": "KIM", "Biologi": "BIO", "Bahasa Inggris": "ENG", "Calistung": "ABC",
  "UTBK / SNBT": "UTBK", "Coding": "</>", "Piano": "PNO", "Akuntansi": "AKT", "Bahasa Mandarin": "中文" };
export const subjAbbr = (s) => SUBJ_ABBR[s] || s.replace(/[^A-Za-z ]/g, "").split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 3).toUpperCase() || "?";

export const initials = (name) => name.split(" ").slice(0, 2).map((w) => w[0]).join("");
export const waLink = (waNumber, text) => `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
/** "Rizky Pratama" -> "R•••• P••••••" (untuk pratinjau CV; server melakukan penyamaran sungguhan). */
export const maskName = (name) => name.split(/\s+/).filter(Boolean).map((w) => w[0] + "•".repeat(Math.max(3, w.length - 1))).join(" ");
