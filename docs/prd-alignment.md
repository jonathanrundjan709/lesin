# Keselarasan PRD dan implementasi

> **Revisi 28 Nov 2026: kedua sisi membayar.** Model "orang tua gratis" di bawah diganti oleh PRD bagian 6A: pencari mendapat trial 7 hari / 10 kontak lalu membeli paket kontak. Baris 1, 2, 3 dan 20 dibaca bersama [`monetization-plan.md`](monetization-plan.md). Selebihnya tidak berubah.

Sumber: PRD "Lesin — Tutor Marketplace" (rev. 27 Nov 2026). Aturan prioritas di PRD: bagian 5, 6, 7, 12, 13, 14 adalah model terbaru dan mengalahkan bagian 2, 3, 4, 9, 10, 11 yang masih model lama.

**Aturan rekonsiliasi.** Selisih tampilan atau alur: ikut UI yang sudah live. Selisih harga atau logika bisnis: ikut PRD.

## 1. Selisih yang diselesaikan

| # | Area | UI live sebelumnya | PRD (menang bila harga/logika) | Hasil sekarang |
|---|---|---|---|---|
| 1 | Siapa yang membayar | Orang tua beli kuota kontak (Rp8.000 / 30.000 / 75.000), 1 kuota gratis | Awalnya orang tua gratis (§6). **Direvisi 28 Nov (§6A): kedua sisi membayar** | **PRD 6A.** Pencari: trial 7 hari dengan maks. 10 buka kontak, lalu paket 1 / 5 / 15 kontak = Rp8.000 / 30.000 / 75.000. Kirim permintaan tetap gratis |
| 2 | Cara pencari terhubung ke tutor | Tombol "Buka kontak tutor" memakai kuota | Dua jalur: buka langsung (pencari membayar) atau permintaan (tutor membayar lead). Identitas tutor terbuka di kedua jalur | **Dua jalur didukung.** CV tutor punya "Buka kontak · 1 kuota" dan "Kirim permintaan gratis". Jumlah tutor per permintaan naik dari 3 ke 10 |
| 3 | Harga lead tutor | Rp10.000 per lowongan | Rp15.000 per lead (§6) | **PRD.** Rp15.000 |
| 4 | Paket tutor | Top-up saldo Rp50/100/200rb dengan bonus | Paket 1/5/10 lead = Rp15.000 / 65.000 / 125.000. Top-up saldo dan bonus dihapus dari pilot (§6) | **PRD.** Tiga kartu ke samping dengan harga coret (coret = jumlah lead × Rp15.000: Rp75.000 dan Rp150.000). Layout kartu tetap gaya live |
| 5 | Langganan tutor | "Tutor Pro" Rp49.000/bulan | "Tutor Plan" Rp99.000/bulan: 8 lead, prioritas pencarian, badge Pro. Lead Plan hangus akhir bulan (§6) | **PRD.** Paywall tetap sama gaya, isi dan harga ikut PRD |
| 6 | Saldo tutor | Rupiah | Lead sebagai ledger, saldo = jumlah pergerakan, lead beli tidak hangus (§6, §8) | **PRD.** Saldo adalah jumlah lead dari ledger, bukan rupiah |
| 7 | Boost postingan orang tua | Rp15.000 / 29.000 / 49.000 | Orang tua tidak membayar. Boost ditunda ke P1/P2 (§6, Lampiran) | **PRD.** Boost dimatikan lewat `FEATURES.requestBoost = false`. Kartunya tetap ada di kode untuk dinyalakan nanti |
| 8 | Batas respons | Tidak ada batas | Maks. 10 tutor per permintaan, permintaan aktif 14 hari (§5) | **PRD.** Ditegakkan server |
| 9 | Founding Tutor | Tidak ada | 2 lead gratis untuk tutor pertama (§5). Anggaran PRD §10 menyebut 200 tutor pertama | **PRD.** 200 tutor pertama mendapat 2 lead saat CV pertama lengkap |
| 10 | Kontak tutor di pencarian | Disamarkan di UI | Nama, foto, WhatsApp tidak dikirim API sampai tutor merespons (§5, §8) | **PRD.** Penyamaran dilakukan di server. Payload tidak memuat nama asli maupun nomor (ada tes) |
| 11 | Pembayaran | Simulasi di browser | Status berubah hanya dari webhook bertanda tangan. Idempoten. Nominal dicocokkan. Order kedaluwarsa 30 menit (§8, §9) | **PRD.** Ditegakkan server dan dites |
| 12 | Lesson hub | Tidak ada | P0: jadwal mingguan, pengingat WhatsApp, catatan sesi tutor (§5) | **Ditambahkan** di UI gaya live (`/les`) |
| 13 | Laporan, verifikasi, admin | Verifikasi hanya tombol tiruan | P0: tombol laporkan, verifikasi manual, konsol admin (§2, §8) | **Ditambahkan** (laporan, antrean verifikasi, `/admin`). Unggah berkas menyusul |
| 14 | Filter info kontak di teks bebas | Tidak ada | P0 (§2, §8) | **PRD.** Nomor, tautan, dan @akun dibuang dari CV, catatan, dan permintaan |
| 15 | Budget dan durasi | Tidak ada di PRD | PRD hanya menyebut `budget` | **UI live.** Budget maks Rp400.000 dengan durasi 60/90/120 menit. Tarif dinormalkan per jam |
| 16 | Radius jarak | Dihapus di UI (feedback 11) | `radius_km` dengan PostGIS (§8) | **UI live.** Kecocokan memakai kecamatan (L3) dan kota/kabupaten. Tanpa PostGIS |
| 17 | Daerah | Kecamatan L3 Jabodetabek, kota lain "Segera hadir" | Kota di luar Jabodetabek di luar lingkup (§2) | **Selaras.** 183 kecamatan, satu sumber kebenaran di `src/domain/areas.ts` |
| 18 | Masuk | Nomor WhatsApp + password | WhatsApp OTP (§8) | **UI live.** Password (scrypt) dulu. OTP menunggu pilihan penyedia WhatsApp (PRD §15) |
| 19 | Ulasan | Setelah kontak terbuka | P1: setelah 4 sesi (§5). §11: hanya dari pencari yang kontaknya terbuka | **UI live + §11.** Hanya dari pencari yang tutornya sudah merespons. Aturan "4 sesi" menyusul bersama pelacakan sesi |
| 20 | Tambah mapel berbayar (permintaan feedback #10) | Paywall Rp10.000 | Tidak ada di PRD | **Belum ditagih.** Alur "Tambah" tetap ada tanpa biaya. Perlu keputusan harga sebelum dijadikan produk |
| 21 | Tamu membuka CV tutor | CV bisa dibaca tamu | PRD: CV tersamar, nama dan kontak tidak dikirim (§5, §8). Tidak melarang tamu | **Permintaan produk (staging).** Tamu hanya melihat daftar hasil (tersamar). Membuka CV, memilih tutor, dan mengirim permintaan butuh akun. Dikunci di server (`GET /api/tutors/:id` mengembalikan 401) dan paywall "Masuk dulu yuk" di UI |

## 2. Cakupan PRD per tier

| Item PRD | Tier | Status |
|---|---|---|
| Pencarian + filter + skor + CV tersamar | P0 | Selesai (server) |
| Permintaan gratis ke ≤3 tutor, aktif 14 hari | P0 | Selesai. Boleh juga tanpa tutor pilihan (terbuka untuk papan lowongan, sesuai UI live) |
| Papan lowongan + buka lead (maks. 10 tutor) | P0 | Selesai. Operasi atomik dengan kunci baris |
| Paket lead, Tutor Plan, QRIS, webhook | P0 | Selesai dengan **gateway simulasi**. Adapter Xendit/Midtrans tinggal mengimplementasikan port `PaymentGateway` |
| Founding Tutor | P0 | Selesai |
| Handoff WhatsApp | P0 | Selesai (tautan `wa.me` dengan pesan awal) |
| Lesson hub: jadwal, pengingat, catatan sesi | P0 | Selesai. Pengingat lewat port `Notifier` (log). Penyedia WhatsApp belum dipilih |
| Laporan, verifikasi manual, konsol admin | P0 | Selesai minimal. KTP/KTM hanya status tinjauan, belum unggah berkas (R2) |
| Filter kontak di teks bebas | P0 | Selesai |
| Event funnel | P0 | Peristiwa tercatat (`events`). Dasbor belum ada |
| OTP WhatsApp | P0 | **Belum.** Memakai password |
| Admin 2FA, rate limit, backup harian, PostGIS | P0 teknis | **Belum** |
| Ulasan setelah 4 sesi, payment log, prompt musim ujian | P1 | Belum |
| Boost orang tua, profile highlight, e-wallet | P2 | Belum |

## 3. Keputusan yang perlu dikonfirmasi

1. **Harga coret.** Dihitung dari jumlah lead × Rp15.000. Ubah di `src/domain/pricing.ts` bila mau angka lain.
2. **Founding Tutor 200 orang.** Angka dari §10 (model lama) karena §5 hanya menyebut "tutor pertama".
3. **Tambah mapel berbayar.** Tidak ada di PRD, jadi belum ditagih.
4. **Tutor tanpa tutor pilihan.** PRD mensyaratkan 1–3 tutor, UI live punya posting terbuka. Keduanya didukung.
5. **Admin pertama.** Dibuat dari `ADMIN_PHONE` dan `ADMIN_PASSWORD`. Belum ada 2FA.
