# Design system LesIn

Token ada di `public/css/base.css` (`:root`). Tidak ada warna mentah di komponen: pakai variabel.

| Token | Nilai | Dipakai untuk |
|---|---|---|
| `--pri` / `--pri-d` / `--pri-l` | #5B4BFF / #4334E0 / #EEECFF | Aksi utama, pilihan, navigasi |
| `--acc` / `--acc-l` | #FFB020 / #FFF4DC | Hal yang berbayar untuk tutor (lead, Tutor Plan), sorotan |
| `--ok` / `--ok-l` | #12A16B / #E3F7EE | Sukses, gratis, kecocokan |
| `--bad` | #E5484D | Galat |
| `--ink` / `--ink-2` / `--ink-3` | #17162B / #4A4866 / #8A88A3 | Teks utama, sekunder, tersier |
| `--bg` / `--card` / `--line` | #F6F5FB / #FFFFFF / #ECEAF4 | Latar, kartu, garis |

**Aturan semantik:** ungu = gratis / navigasi / pilihan. Kuning (amber) = tutor menghabiskan lead atau uang.

**Tipografi:** Plus Jakarta Sans. Hierarki bertingkat: judul halaman 24, judul bagian 17, nama tutor 15, isi 12–13, detail 11.

**Ikon:** SVG garis (gaya Lucide), tanpa emoji. Mapel memakai tile singkatan berwarna (`MTK`, `FIS`).

**Maskot dan logo:** `public/assets/logo.svg` (L + topi toga) dan `public/assets/mascot.svg` (burung hantu bertoga). Dipakai di topbar, hero, halaman kosong, paywall, dan favicon.

**Aturan:** target sentuh ≥ 44 px; fokus terlihat; umpan balik hover 150 ms; hormati reduced motion; pesan galat di bawah kolom (bukan popup); notifikasi di kanan atas di bawah topbar.

**Berkas CSS:** `base.css` (token, reset, shell, topbar, nav, tombol, chip, form), `components.css` (kartu, sheet, picker, toast, jadwal per hari, paywall, QRIS), `pages.css` (beranda, paket lead, masuk/daftar).
