# LesIn

Marketplace tutor privat. **Kedua sisi membayar:** pencari mendapat **trial 7 hari (maks. 10 buka kontak)** lalu membeli paket kontak (Rp8.000 / 30.000 / 75.000), sedangkan tutor membayar **Rp15.000 per lead** (atau Tutor Plan Rp99.000/bulan untuk 8 lead). Kirim permintaan selalu gratis. Tanpa komisi atas biaya les.

Semua keputusan produk ada di PRD. Rencana monetisasi dua sisi di [`docs/monetization-plan.md`](docs/monetization-plan.md). Selisih PRD dan implementasi dicatat di [`docs/prd-alignment.md`](docs/prd-alignment.md). Struktur kode dan alasan desainnya di [`docs/architecture.md`](docs/architecture.md).

## Menjalankan

Butuh Node 20+.

```bash
npm install
npm run dev        # http://localhost:3000 (mode demo, data di memori, ada 16 tutor contoh)
```

```bash
npm test           # domain + aplikasi pada adapter memory dan Postgres (PGlite); isi TEST_DATABASE_URL untuk menambah PostgreSQL sungguhan
npm run typecheck
npm run build
```

Mode demo mengisi data contoh dan memakai penyimpanan memori. Data hilang saat server restart.

### Dengan PostgreSQL

```bash
docker compose up -d db
cp .env.example .env.local     # isi DATABASE_URL seperti di contoh
npm run dev
```

Tabel dibuat otomatis saat start. Data contoh dimasukkan hanya bila database masih kosong (matikan dengan `SEED_DEMO_DATA=false`).

## Deploy di Vercel

1. Import repo, biarkan preset **Next.js**.
2. Sambungkan database: **Storage → Supabase** (atau Neon). Integrasinya mengisi `POSTGRES_URL` otomatis. Aplikasi memakai `DATABASE_URL`, atau `POSTGRES_URL` bila yang pertama kosong. Pakai URL **pooler** (port 6543) untuk serverless.
3. (Disarankan) isi `SESSION_SECRET` dan `PAYMENT_WEBHOOK_SECRET` dengan string acak panjang. Bila kosong, keduanya diturunkan dari URL database.
4. Opsional: `ADMIN_PHONE` dan `ADMIN_PASSWORD` untuk akun admin pertama, `CRON_SECRET` agar cron harian jalan.
5. **Redeploy** (variabel baru hanya berlaku untuk deployment baru).

Tabel dibuat otomatis saat start dan **RLS diaktifkan di semua tabel**. Supabase membuka skema `public` lewat REST API publik, jadi tanpa RLS data pengguna bisa terbaca. Backend memakai role pemilik tabel yang melewati RLS, jadi tidak terpengaruh. Jangan menambah kebijakan RLS untuk `anon` atau `authenticated`.

Tanpa database, Vercel memakai memori per instance dan akun bisa hilang antar permintaan. Aplikasi menampilkan banner "Mode demo" saat itu terjadi.

## Variabel lingkungan

| Nama | Fungsi |
|---|---|
| `DATABASE_URL` atau `POSTGRES_URL` | PostgreSQL (Supabase/Neon/lokal). Kosong = mode demo (memori) |
| `SESSION_SECRET` | Tanda tangan cookie sesi |
| `PAYMENT_WEBHOOK_SECRET` | Tanda tangan webhook pembayaran |
| `ALLOW_PAYMENT_SIMULATION` | `false` mematikan tombol bayar demo (saat gateway sungguhan dipasang) |
| `SEED_DEMO_DATA` | `false` = jangan isi data contoh |
| `ADMIN_PHONE`, `ADMIN_PASSWORD` | Membuat akun admin |
| `CRON_SECRET` | Melindungi `GET /api/cron` |

## Uji coba tampilan lewat URL

- Tempat ganti mode: `/?sw=1` (segmented di beranda), `/?sw=2` (ikon di topbar, default), `/?sw=3` (kartu di bawah beranda).
- Teks hero: `/?copy=A` (default), `B`, `C`, `D`.

Pilihan diingat di browser.
