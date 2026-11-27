# Arsitektur

Satu repo, satu aplikasi Next.js: **API** (`src/app/api`) dan **UI statis** (`public/`) yang disajikan di `/`. Data di PostgreSQL (mode demo memakai memori).

```
public/                       UI (HTML + modul ES, tanpa framework dan tanpa build)
  index.html  favicon.svg  assets/ (logo, maskot)
  css/        base.css  components.css  pages.css
  js/
    main.js  routes.js  chrome.js     titik masuk, tabel rute, topbar + navigasi
    core/        dom  format  icons  api  session  prefs  router  toast  sheet  forms
    components/  picker  tutor-card  request-card  contact  payment  plan-sheet  sheets  mode-switch  mono
    views/       home search tutor-detail post requests board lessons profile wallet auth admin

src/
  domain/          aturan bisnis murni (tanpa I/O, tanpa framework)
    types  errors  catalog  pricing  areas  leads  masking  matching  views
  application/     use case. Hanya bergantung pada domain + port
    ports.ts       antarmuka: repositori, UnitOfWork, Clock, PasswordHasher, PaymentGateway, Notifier, ...
    validation.ts  skema zod untuk masukan
    meta.ts        data referensi untuk UI
    services/      auth tutor request lead billing lesson review trust jobs  (+ index.ts = perakitan)
  infrastructure/  adapter konkret untuk port
    persistence/   memory/ (tes + demo)  postgres/ (skema, repositori, unit of work)
    security/      scrypt, sesi HMAC, tanda tangan webhook
    payment/       gateway QRIS simulasi
    notifications/ notifier konsol
    seed/          data demo
    container.ts   composition root: env -> adapter -> service
  app/api/         controller tipis (HTTP <-> service). Tanpa logika bisnis
tests/             domain, aplikasi (dijalankan di memory DAN Postgres/PGlite), support/
docs/              PRD alignment, arsitektur, riset dan desain
```

## Prinsip SOLID di kode ini

- **Single responsibility.** Satu service per kapabilitas (`LeadService` hanya saldo dan buka lead, `BillingService` hanya order dan webhook). Satu view per halaman di frontend. Controller hanya menerjemahkan HTTP.
- **Open/closed.** Gateway pembayaran, penyimpanan, notifikasi, dan hasher diganti dengan menambah adapter, bukan mengubah service. Fitur ditunda lewat `FEATURES`.
- **Liskov.** `MemoryUnitOfWork` dan `PostgresUnitOfWork` memenuhi kontrak yang sama. Tes aplikasi dijalankan pada keduanya dan harus lulus identik.
- **Interface segregation.** Port kecil per agregat (`LedgerRepo`, `OrderRepo`, ...), bukan satu repositori raksasa.
- **Dependency inversion.** `domain` dan `application` tidak mengimpor `infrastructure`, `next`, atau `pg`. Hanya `container.ts` dan tes yang merakit adapter.

Aturan impor: `domain` ← `application` ← `infrastructure`/`app`. Panah tidak boleh dibalik.

## Aturan keamanan yang ditegakkan server (PRD §8)

1. Nama asli, foto, dan WhatsApp tutor tidak ada di payload sampai tutor membuka permintaan si pencari (`toTutorView` di `domain/views.ts`).
2. Order menjadi lunas hanya dari webhook dengan tanda tangan HMAC valid, nominal cocok, dan event belum pernah diproses.
3. Saldo lead tidak punya kolom. Saldo dihitung dari `ledger_entries` (hanya ditambah, tidak diubah). Lead Plan dipakai lebih dulu dan hangus akhir bulan.
4. Membuka permintaan atomik: kunci baris tutor dan permintaan, cek batas 10 tutor dan saldo, potong lead, catat unlock dalam satu transaksi.
5. Info kontak dibuang dari teks bebas. Sesi memakai cookie `HttpOnly` + `SameSite=Lax`, ditambah pemeriksaan `Origin`.

## Model data

Skema ada di `src/infrastructure/persistence/postgres/schema.ts` dan dijalankan otomatis saat start (idempoten).
`users`, `tutor_profiles`, `requests`, `unlocks` (unik per tutor+permintaan), `ledger_entries`, `orders` (unik per tutor+kunci idempotensi), `webhook_events`, `lessons`, `session_notes`, `reviews`, `reports`, `verification_docs`, `events`.

## API

Semua di bawah `/api`. Galat berbentuk `{ error, code }` dengan kode HTTP yang sesuai.

| Area | Endpoint |
|---|---|
| Referensi | `GET /meta`, `GET /health` |
| Akun | `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Tutor | `GET /tutors`, `GET /tutors/:id`, `GET/POST /tutors/:id/reviews`, `POST /tutors/:id/report` |
| CV saya | `GET/PUT /me/profile`, `GET /me/leads`, `POST /me/verification` |
| Permintaan | `POST /requests`, `GET /requests/mine`, `GET /requests/board`, `GET /requests/:id`, `POST /requests/:id/unlock` |
| Pembayaran | `GET /billing/products`, `POST /orders`, `GET /orders/:id`, `POST /orders/:id/simulate-payment` (demo), `POST /webhooks/payment` |
| Lesson hub | `GET/POST /lessons`, `POST /lessons/:id/notes` |
| Admin | `GET /admin/queue`, `POST /admin/verifications/:id`, `POST /admin/reports/:id` |
| Terjadwal | `GET /cron` (Bearer `CRON_SECRET`): order kedaluwarsa + pengingat sesi |

## Menambah gateway pembayaran sungguhan

1. Implementasikan `PaymentGateway.createCharge(order)` (buat tagihan QRIS di gateway).
2. Arahkan webhook gateway ke `POST /api/webhooks/payment` dengan header `x-signature` (HMAC-SHA256 dari body mentah memakai `PAYMENT_WEBHOOK_SECRET`). Sesuaikan penanda tangan bila gateway memakai skema lain lewat port `WebhookSigner`.
3. Pasang adapter di `container.ts` dan set `ALLOW_PAYMENT_SIMULATION=false`.
