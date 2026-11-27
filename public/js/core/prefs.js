/** Preferensi tampilan dan draf pencarian yang tersimpan di browser (bukan data akun). */
const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* abaikan */ } };

/**
 * Opsi tampilan yang bisa dicoba lewat URL: ?sw=1|2|3 (tempat ganti mode) dan ?copy=A|B|C|D (teks hero).
 * Pilihan terakhir diingat di browser.
 */
export const ui = (() => {
  const saved = read("lesin-ui") || {};
  const q = new URLSearchParams(location.search);
  for (const k of ["sw", "copy"]) if (q.get(k)) saved[k] = q.get(k);
  write("lesin-ui", saved);
  return {
    sw: ["1", "2", "3"].includes(saved.sw) ? saved.sw : "2",
    copy: ["A", "B", "C", "D"].includes(String(saved.copy).toUpperCase()) ? String(saved.copy).toUpperCase() : "A",
  };
})();

export const HERO_COPY = {
  A: ["Cari guru les", "Temukan guru les yang pas untuk anakmu.", "Baca CV tutor dulu, gratis. Kirim permintaan tanpa biaya, tutor yang menghubungimu."],
  B: ["Les di rumah", "Les di rumah, tanpa ribet.", "Pilih tutor terverifikasi di sekitarmu, lalu lanjut chat lewat WhatsApp."],
  C: ["Cari guru les", "Cari guru les yang cocok, bukan asal dekat.", "Lihat CV lengkap dan rating dulu. Gratis untuk orang tua dan murid."],
  D: ["Guru les terpercaya", "Guru les terpercaya, dekat dari rumah.", "Semua CV bisa dibaca gratis. Kamu tidak pernah bayar, tutor yang membayar untuk menghubungimu."],
};

export const DEFAULT_SEARCH = { area: "Tebet", subject: "Matematika", level: "", curriculum: "", mode: "any", budget: 150000, durationMin: 90, gender: "any", sort: "match" };

export const searchPrefs = {
  get() { return { ...DEFAULT_SEARCH, ...(read("lesin-search") || {}) }; },
  set(v) { write("lesin-search", v); },
  reset(keep = {}) { const v = { ...DEFAULT_SEARCH, ...keep }; write("lesin-search", v); return v; },
};

/** Jumlah filter tambahan yang aktif (di luar daerah dan mapel). */
export const activeFilters = (s) =>
  [s.level, s.curriculum, s.mode !== "any", s.budget !== DEFAULT_SEARCH.budget || s.durationMin !== DEFAULT_SEARCH.durationMin, s.gender !== "any"].filter(Boolean).length;

/** Tutor yang dipilih untuk dikirimi permintaan (maksimal ditentukan server). Disimpan selama tab terbuka. */
export const selection = {
  list() { try { return JSON.parse(sessionStorage.getItem("lesin-selection") || "[]"); } catch { return []; } },
  save(v) { try { sessionStorage.setItem("lesin-selection", JSON.stringify(v)); } catch { /* abaikan */ } },
  has(id) { return this.list().some((t) => t.id === id); },
  /** Mengembalikan false bila sudah mencapai batas. */
  toggle(tutor, max) {
    const l = this.list();
    const i = l.findIndex((t) => t.id === tutor.id);
    if (i >= 0) l.splice(i, 1);
    else if (l.length >= max) return false;
    else l.push({ id: tutor.id, label: tutor.name, area: tutor.area, headline: tutor.headline });
    this.save(l);
    return true;
  },
  remove(id) { this.save(this.list().filter((t) => t.id !== id)); },
  clear() { this.save([]); },
};
