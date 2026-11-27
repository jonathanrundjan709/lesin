import { api } from "./api.js";

/**
 * Keadaan sesi yang dipakai seluruh UI. Sumber kebenarannya server; ini hanya salinan untuk ditampilkan.
 * mode: "pencari" (cari guru) atau "tutor". Satu akun bisa keduanya.
 */
export const session = {
  /** Data referensi dari /api/meta (daerah, mapel, batas, harga, fitur). */
  meta: null,
  user: null,        // { id, name, phone, isAdmin } atau null (tamu)
  profile: null,     // CV tutor atau null
  docs: [],          // dokumen verifikasi yang sudah dikirim
  leads: null,       // { leads, planActive, planUntil, leadPrice } (hanya bila CV lengkap)
  contact: null,     // { credits, trialActive, trialEndsAt, trialLimit, contactPrice }: kuota buka kontak pencari
  mode: "pencari",
};

const modeKey = (id) => `lesin-mode:${id}`;
const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* penyimpanan tidak tersedia */ } };

/** CV tutor sudah lengkap (syarat memakai fitur tutor). */
export const cvReady = () => Boolean(session.profile?.completedAt);

export async function bootSession() {
  const [meta, me] = await Promise.all([api.meta(), api.auth.me()]);
  session.meta = meta;
  await applyUser(me.user);
}

/** Setel pengguna aktif (setelah masuk/daftar/keluar) dan muat CV serta saldo lead-nya. */
export async function applyUser(user) {
  session.user = user;
  session.profile = null; session.docs = []; session.leads = null; session.contact = null;
  if (!user) { session.mode = "pencari"; return; }
  session.mode = read(modeKey(user.id)) === "tutor" ? "tutor" : "pencari";
  await refreshProfile();
}

export async function refreshProfile() {
  if (!session.user) return;
  const p = await api.me.profile();
  session.profile = p.profile; session.docs = p.docs ?? [];
  session.user = { ...session.user, name: p.name };
  await Promise.all([refreshLeads(), refreshContact()]);
}

export async function refreshLeads() {
  session.leads = cvReady() ? (await api.me.leads()).status : null;
}

export async function refreshContact() {
  session.contact = session.user ? (await api.me.credits()).status : null;
}

/** Perbarui saldo kedua sisi (lead tutor dan kuota kontak pencari), mis. setelah pembayaran. */
export const refreshCredits = () => Promise.all([refreshLeads(), refreshContact()]);

export function setMode(mode) {
  session.mode = mode;
  if (session.user) write(modeKey(session.user.id), mode);
}
