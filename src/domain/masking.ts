/** Hapus info kontak dari teks bebas (nomor telepon, tautan, @akun) supaya transaksi tetap lewat LesIn. */
export function sanitizeText(s: string): string {
  return s.replace(/(\+?\d[\d\s().-]{7,}\d)|(https?:\/\/\S+)|(www\.\S+)|(@\w{3,})/gi, "[disembunyikan]");
}

/** "Rizky Pratama" -> "R••••• P••••••" (huruf pertama saja, sama seperti desain). */
export const maskName = (name: string): string =>
  name.split(/\s+/).filter(Boolean).map((w) => w[0] + "•".repeat(Math.max(3, w.length - 1))).join(" ");

export const initialsOf = (name: string): string =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

/** "Ibu Ratna" -> "Ibu R•••" untuk pemilik permintaan sebelum kontaknya dibuka. */
export const maskOwner = (name: string): string => {
  const [first, ...rest] = name.split(/\s+/).filter(Boolean);
  return [first, ...rest.map((w) => (w.startsWith("(") ? w : w[0] + "•••"))].join(" ");
};

/** Nomor lokal 08xx -> format wa.me tanpa plus. */
export const toWaNumber = (phone: string): string => "62" + phone.replace(/\D/g, "").replace(/^0/, "");
/** Seperti toWaNumber, tetapi null untuk akun yang belum mengisi nomor. */
export const waOrNull = (phone: string | null): string | null => (phone ? toWaNumber(phone) : null);
