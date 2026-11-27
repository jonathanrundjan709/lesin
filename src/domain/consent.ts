/**
 * Persetujuan tutor atas pembukaan nama dan WhatsApp (UU PDP). Naikkan CONSENT_VERSION bila isinya berubah
 * supaya persetujuan lama bisa diminta ulang. Versi dan waktu persetujuan disimpan per tutor sebagai bukti.
 */
export const CONSENT_VERSION = "2026-11-28";
export const CONSENT_POINTS: readonly string[] = [
  "Nama lengkap dan nomor WhatsApp saya boleh ditampilkan kepada pencari yang membuka kontak saya dengan kuota mereka.",
  "Nama lengkap dan nomor WhatsApp saya juga terbuka bagi pencari yang permintaannya saya buka dengan lead.",
  "Data ini hanya dipakai untuk menghubungkan saya dengan calon murid. Foto KTP/KTM saya tidak pernah ditampilkan kepada siapa pun.",
  "Saya bisa mencabut persetujuan kapan saja di halaman CV. Kontak yang sudah terbuka tidak bisa ditarik kembali.",
];
