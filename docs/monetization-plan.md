# Rencana monetisasi dua sisi

Revisi 28 Nov 2026. Ringkasan ada di PRD bagian **6A**. Dokumen ini berisi rencana kerjanya: aturan, alasan, risiko, cara mengukur, dan jadwal.

## Model

| Sisi | Mendapat | Membayar |
|---|---|---|
| Pencari | Cari tutor, baca CV, kirim permintaan (maks. 10 tutor), Lesson hub. **Selalu gratis** | Membuka kontak tutor langsung: **7 hari gratis, maks. 10 kontak**, lalu paket 1 / 5 / 15 kontak = Rp8.000 / 30.000 / 75.000 |
| Tutor | CV, papan lowongan, Lesson hub | Lead Rp15.000 (paket 5 = Rp65.000, 10 = Rp125.000) atau Tutor Plan Rp99.000 untuk 8 lead |

Dua jalur menuju satu koneksi berbayar:

- **Langsung:** pencari memakai 1 kuota, nama asli dan WhatsApp tutor terbuka. Tutor tidak membayar.
- **Permintaan:** tutor memakai 1 lead, WhatsApp pencari terbuka dan identitas tutor terbuka untuk pencari. Pencari tidak membayar.

## Kenapa begini

- **Pencari yang butuh cepat** mau membayar untuk kepastian kontak. Satu murid bernilai Rp400 ribu sampai Rp1 juta per bulan, jadi Rp5.000–8.000 per kontak kecil.
- **Trial 7 hari / 10 kontak** cukup untuk membandingkan beberapa tutor, tapi terbatas supaya tidak jadi layanan gratis. Kuota trial hangus di hari ke-7. Kuota beli tidak hangus.
- **Permintaan tetap gratis** karena itulah yang mengisi pasar tutor (sumber pendapatan lead). Ini juga pengaman bagi pencari yang sensitif harga.
- **Paket pencari lebih murah dari lead tutor** (Rp5.000–8.000 vs Rp15.000): pencari membeli kontak yang pasti, tutor membeli prospek yang belum tentu jadi murid.

## Dampak pendapatan

Pendapatan pencari baru hanya tambahan bila jalur langsung menciptakan koneksi yang tidak akan terjadi tanpanya. Setiap buka kontak langsung juga bisa menggantikan permintaan yang tutor akan bayar.

`selisih bersih = pendapatan pencari − pendapatan lead tutor yang hilang`

| Skenario | Pendaftar | Bayar ≤60 hari | Rata-rata belanja | Pendapatan pencari | Lead tutor hilang | Bruto 6 bulan | Selisih |
|---|---|---|---|---|---|---|---|
| Konservatif | 250 | 8% | Rp30.000 | Rp0,60 jt | 25% × Rp6,0 jt = Rp1,50 jt | Rp5,10 jt | −Rp0,90 jt |
| Base | 400 | 15% | Rp39.000 | Rp2,34 jt | 10% × Rp12,5 jt = Rp1,25 jt | Rp13,59 jt | +Rp1,09 jt |
| Target | 500 | 20% | Rp45.000 | Rp4,50 jt | 10% × Rp15,0 jt = Rp1,50 jt | Rp18,00 jt | +Rp3,00 jt |

Semua angka adalah asumsi perencanaan. Pendapatan tutor dari PRD bagian 7. Ganti dengan data pilot secepatnya. Pelajaran utamanya: model ini menguntungkan hanya bila lead tutor yang hilang kecil, jadi **pangsa jalur langsung** adalah angka yang paling penting dipantau.

## Risiko dan pagar pengaman

| Risiko | Pengaman |
|---|---|
| Trial dipakai berulang dengan banyak nomor | Satu akun per nomor WhatsApp. **OTP WhatsApp wajib aktif sebelum iklan berbayar**. Trial dibatasi 10 kontak |
| Tutor merasa dihubungi gratis, lalu berhenti beli lead | Pantau pangsa jalur langsung. Opsi: kabari tutor saat kontaknya dibuka (belum dibangun) |
| Nomor tutor terbuka tanpa persetujuan (UU PDP) | Tambahkan persetujuan di onboarding tutor: nama dan WhatsApp bisa dibuka pencari yang memakai kuota. **Wajib sebelum peluncuran** |
| Nomor tutor tidak valid | Kuota dikembalikan. Selain itu buka kontak tidak bisa dibatalkan |
| Kuota dianggap uang elektronik | Kuota adalah kredit layanan, tidak bisa ditarik. Masuk pemeriksaan hukum PRD bagian 15 |
| Pencari hanya memakai jalur gratis | Wajar. Tinjau di bulan ke-4 bila yang membayar di bawah 5% |

## Metrik dan aturan (usulan)

| Metrik | Target bulan 3 | Bertindak bila |
|---|---|---|
| Aktivasi trial (≥1 buka kontak dalam 7 hari) | ≥60% | <40% |
| Daftar → bayar dalam 60 hari | ≥10% | <5% di bulan 4 |
| Pangsa koneksi lewat jalur langsung | ≤40% | >60% |
| Lead dibeli per permintaan | ≥3 | <2 |
| Tutor hasil buka langsung yang membalas ≤24 jam | ≥85% | <70% |

Peristiwa yang sudah tercatat di tabel `events`: `search`, `cv_view`, `contact_unlock`, `lead_unlock`, `order_created`, `purchase`, `request_created`, `tutor_registered`. Kecualikan akun contoh (`id LIKE 'seed-%'`).

Contoh query (Supabase → SQL editor). Ganti tanggal awal pilot:

```sql
-- Aktivasi trial: pendaftar yang membuka >=1 kontak dalam 7 hari
SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE EXISTS (
  SELECT 1 FROM contact_unlocks c WHERE c.seeker_id = u.id AND c.created_at <= u.created_at + 7 * 86400000)) / COUNT(*), 1) AS aktivasi_pct
FROM users u WHERE u.id NOT LIKE 'seed-%' AND u.created_at >= EXTRACT(EPOCH FROM DATE '2027-01-11') * 1000;

-- Daftar -> bayar paket kontak dalam 60 hari
SELECT ROUND(100.0 * COUNT(DISTINCT o.buyer_id) / NULLIF((SELECT COUNT(*) FROM users WHERE id NOT LIKE 'seed-%'), 0), 1) AS bayar_pct
FROM orders o JOIN users u ON u.id = o.buyer_id
WHERE o.status = 'paid' AND o.product LIKE 'contact%' AND o.created_at <= u.created_at + 60 * 86400000;

-- Pangsa jalur langsung vs jalur permintaan
SELECT (SELECT COUNT(*) FROM contact_unlocks) AS langsung, (SELECT COUNT(*) FROM unlocks) AS lewat_permintaan;
```

## Jadwal

Tanggal mengikuti peta jalan PRD (peluncuran sekitar 11 Jan 2027).

| Periode | Kerja | Keluar |
|---|---|---|
| Sekarang | Kode siap di staging: trial, kuota kontak, paket, buka kontak, banner, halaman `/kuota`, migrasi aman | Bisa dicoba di staging |
| Sampai 10 Jan | OTP WhatsApp. Persetujuan tutor (UU PDP). Halaman syarat dan kebijakan kuota. Adapter gateway QRIS untuk paket pencari. Dasbor sederhana dari query di atas | **Gate 1:** pembayaran QRIS sungguhan untuk paket pencari dan lead tutor |
| 11 Jan – 28 Feb | Pilot 2 kecamatan. Tidak ada perubahan harga. Kumpulkan data | **Bulan 3:** baca semua metrik di atas |
| Mar – Apr | Eksperimen berurutan, satu per satu: harga satuan Rp8.000 vs Rp10.000, lalu trial 7 vs 14 hari, lalu 10 vs 5 kontak | Bulan 4: aturan berhenti diperluas (bayar <5% atau jalur langsung >60% = rancang ulang) |
| Mei | Putuskan harga akhir dan apakah model dua sisi dipertahankan | Bulan 6: lanjut, ubah, atau berhenti |

## Keputusan yang masih terbuka

1. Trial per nomor WhatsApp atau per perangkat?
2. Beri tahu tutor bila kontaknya dibuka pencari (pemberitahuan gratis)?
3. Setelah trial, apakah kirim permintaan tetap tanpa batas? Sekarang ya.
4. Uji harga dan trial seperti di jadwal, atau tetap?
