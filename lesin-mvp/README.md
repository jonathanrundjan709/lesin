# Lesin — MVP marketplace tutor ↔ murid

Web app mobile-first LesIn (font Plus Jakarta Sans, aksen ungu, maskot burung hantu). Dibuat dengan HTML/CSS/JS biasa, tanpa backend.
Semua data disimpan di `localStorage`, dan pembayarannya masih **simulasi**.

## Cara menjalankan
```bash
cd lesin-app && python3 -m http.server 5181
```
Buka http://localhost:5181 lalu aktifkan tampilan HP di DevTools. Kalau mau, bisa juga dibuka langsung di HP lewat IP laptop.

## Alur yang sudah ada
**Pencari (orang tua/murid)**
- Cari tutor berdasarkan daerah, mapel, jenjang, kurikulum, mode (ke rumah/online), budget, dan gender. Jumlah tutor yang cocok tampil langsung.
- Daerah: Jabodetabek di atas, kota lain di bawah. Hasil pencarian punya skor kecocokan, tombol Filter menunjukkan jumlah filter aktif, dan kembali dari hasil mereset filter. Hasil juga dan bisa diurutkan (paling cocok / terdekat / termurah / rating).
- CV tutor bisa dibaca gratis. **Nama, foto, dan WA disamarkan**. Buka kontak pakai **kuota**: paket 1 kontak Rp8.000, 5 kontak Rp30.000, 15 kontak Rp75.000 (1 kuota gratis untuk akun baru).
- Picker buatan sendiri (bukan dropdown bawaan HP) untuk daerah, mapel, jenjang, kurikulum — bisa tambah daerah/mapel sendiri.
- Posting kebutuhan les (gratis) + Boost 3/7/14 hari (Rp15rb/29rb/49rb).
- Tanpa chat in-app: setelah kontak terbuka, lanjut ke WhatsApp (pesan pembuka terisi otomatis). Menu Kontak berisi semua kontak yang sudah dibuka + tombol tulis ulasan.

**Tutor**
- Lowongan les (postingan pencari) dengan filter "Untukku" sesuai mapel di CV.
- Buka WhatsApp 1 postingan = **Rp10.000**, dan CV tutor otomatis terkirim ke pencari.
- Editor CV dengan pratinjau tampilan tersamar, persentase kelengkapan, dan verifikasi identitas + bukti keahlian (mock, tidak memakai ijazah).
- Tutor Pro Rp49.000/bulan.

**Kuota & saldo**: satu halaman berisi sisa kuota, paket kontak, dan top up saldo. Semua pembayaran masih simulasi.

*Versi bergaya iOS disimpan di folder `_backup-ios/`.*

## Tambahan dari brief awal (saran monetisasi & kepercayaan)
1. **1 kuota kontak gratis** untuk akun baru, supaya pengguna merasakan nilainya dulu.
2. **Top up saldo tutor dengan bonus** (100rb → +10rb, 200rb → +30rb), supaya transaksi kecil tidak boros fee payment gateway.
3. **Ulasan** hanya dari pencari yang sudah membuka kontak tutor.
4. **Tutor yang menghubungi postinganmu otomatis terbuka gratis** untuk pencari, karena tutor sudah membayar.
5. **Sorot postingan** dan **Tutor Pro** sebagai sumber pendapatan tambahan.
6. **Badge identitas terverifikasi** untuk keamanan, karena tutor datang ke rumah.

## Ke produksi (langkah berikutnya)
- Backend + DB (mis. Supabase/Firebase): users, tutors, posts, unlocks, chats, transactions.
- **Nama/kontak asli disembunyikan di server**, bukan cuma di UI. API baru mengirim data kontak setelah unlock terbayar.
- Payment gateway Indonesia (Midtrans/Xendit) untuk QRIS/e-wallet/VA, plus webhook untuk menambah saldo.
- Login OTP via WhatsApp/SMS. Chat realtime. Lokasi pakai kelurahan/kecamatan atau geocoding.
- Moderasi: blokir nomor HP/link di bio dan chat sebelum unlock (anti-bypass).

## Opsi tampilan untuk dicoba (lewat URL)
- Tempat ganti mode: `/?sw=1` (segmented di beranda), `/?sw=2` (ikon di pojok kanan atas, default), `/?sw=3` (kartu di bawah beranda).
- Teks hero: `/?copy=A` (default), `B`, `C`, `D`.
Pilihan tersimpan di browser.
