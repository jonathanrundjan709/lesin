// ====== Data contoh (mock) untuk MVP Lesin ======
// Di versi produksi, ini diganti API + database.

const PRICE = {
  // Pencari membeli kuota buka kontak dalam paket (lebih murah per kontak = lebih banyak user)
  UNLOCK_PACKS: [
    { n: 1, price: 8000, name: "Satu tutor", use: "Sudah yakin dengan satu tutor" },
    { n: 5, price: 30000, name: "Bandingkan", use: "Hubungi beberapa tutor, pilih yang paling cocok", tag: "Populer" },
    { n: 15, price: 75000, name: "Keluarga", use: "Untuk beberapa anak atau beberapa mapel" },
  ],
  TOPUP: [{ amt: 50000, bonus: 0 }, { amt: 100000, bonus: 10000 }, { amt: 200000, bonus: 30000 }], // saldo tutor
  CHAT: 10000,        // tutor menghubungi 1 postingan
  BOOST: { 3: 15000, 7: 29000, 14: 49000 }, // boost postingan pencari per durasi (hari)
  PRO: 49000,         // (saran) Tutor Pro / bulan
};

// Koordinat kira-kira (lat, lng) per daerah — dipakai untuk hitung jarak.
const AREAS = {
  "Kebayoran Baru": [-6.243, 106.799],
  "Kemang": [-6.261, 106.813],
  "Pondok Indah": [-6.265, 106.784],
  "Tebet": [-6.226, 106.858],
  "Menteng": [-6.196, 106.832],
  "Rawamangun": [-6.196, 106.889],
  "Kelapa Gading": [-6.158, 106.905],
  "Cempaka Putih": [-6.181, 106.868],
  "Grogol": [-6.167, 106.790],
  "Pluit": [-6.117, 106.791],
  "Cengkareng": [-6.150, 106.735],
  "Bintaro": [-6.272, 106.737],
  "BSD Serpong": [-6.301, 106.652],
  "Depok Margonda": [-6.373, 106.832],
  "Cibubur": [-6.367, 106.893],
  "Bekasi Barat": [-6.237, 106.990],
};

// Kota di luar Jabodetabek (belum ada tutor tatap muka; tampil di bawah daftar Jabodetabek)
const OTHER_CITIES = ["Bandung", "Surabaya", "Yogyakarta", "Semarang", "Malang", "Medan", "Makassar", "Denpasar", "Palembang", "Balikpapan"];

const SUBJECTS = ["Matematika", "Fisika", "Kimia", "Biologi", "Bahasa Inggris",
  "Calistung", "UTBK / SNBT", "Coding", "Piano", "Akuntansi", "Bahasa Mandarin"];

const LEVELS = ["TK", "SD", "SMP", "SMA", "Kuliah", "Umum"];

const CURRICULA = ["Merdeka", "K13", "Cambridge", "IGCSE", "IB", "Nasional Plus"];

const DAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const TUTORS = [
  { id: "t1", name: "Rizky Pratama", gender: "L", age: 24, area: "Tebet", radius: 8, offline: true, online: true,
    subjects: ["Matematika", "Fisika", "UTBK / SNBT"], levels: ["SMP", "SMA"], rate: 120000,
    edu: "S1 Teknik Fisika — ITB (IPK 3,71)", exp: 4,
    headline: "Bikin Matematika & Fisika jadi masuk akal",
    bio: "Fokus ke pemahaman konsep, bukan hafalan rumus. Biasa pegang murid yang sebelumnya takut matematika sampai bisa dapat nilai 85+. Tiap sesi ada ringkasan & PR singkat.",
    achievements: ["Medali perak OSN Fisika tingkat provinsi", "120+ murid lolos PTN favorit"],
    rating: 4.9, reviews: 87, students: 140, verified: true, response: "± 15 menit", avail: ["Sen", "Rab", "Jum", "Sab"], phone: "0812-8890-1123" },
  { id: "t2", name: "Siti Nurhaliza", gender: "P", age: 29, area: "Kebayoran Baru", radius: 6, offline: true, online: false,
    subjects: ["Calistung", "Matematika"], levels: ["TK", "SD"], rate: 90000,
    edu: "S1 PGSD — Universitas Negeri Jakarta", exp: 7,
    headline: "Guru SD sabar untuk anak usia 4–12 tahun",
    bio: "Mengajar dengan metode bermain sambil belajar. Berpengalaman mendampingi anak yang butuh perhatian ekstra dalam membaca dan berhitung.",
    achievements: ["Guru SD swasta 5 tahun", "Sertifikat metode Montessori"],
    rating: 4.8, reviews: 112, students: 95, verified: true, response: "± 30 menit", avail: ["Sen", "Sel", "Rab", "Kam"], phone: "0813-1122-4455" },
  { id: "t3", name: "Kevin Wijaya", gender: "L", age: 22, area: "Kelapa Gading", radius: 5, offline: true, online: true,
    subjects: ["Bahasa Inggris", "Bahasa Mandarin"], levels: ["SD", "SMP", "SMA", "Umum"], rate: 150000,
    edu: "S1 Sastra Inggris — Universitas Indonesia", exp: 3,
    headline: "IELTS 8.0 · Conversation & grammar",
    bio: "Kelas interaktif dengan banyak latihan speaking. Bisa bantu persiapan IELTS/TOEFL dan HSK dasar.",
    achievements: ["IELTS 8.0", "HSK 4"],
    rating: 4.7, reviews: 54, students: 60, verified: true, response: "± 1 jam", avail: ["Sel", "Kam", "Sab", "Min"], phone: "0817-6655-2233" },
  { id: "t4", name: "Dewi Lestari", gender: "P", age: 26, area: "Depok Margonda", radius: 7, offline: true, online: true,
    subjects: ["Kimia", "Biologi"], levels: ["SMP", "SMA", "Kuliah"], rate: 110000,
    edu: "S1 Farmasi — Universitas Indonesia", exp: 4,
    headline: "Kimia & Biologi pakai mind-map, gampang diingat",
    bio: "Menyusun catatan visual untuk tiap bab. Cocok untuk persiapan ulangan harian, PAS, maupun UTBK saintek.",
    achievements: ["Asisten lab Kimia Organik", "Juara 2 LKTI nasional"],
    rating: 4.9, reviews: 66, students: 80, verified: true, response: "± 20 menit", avail: ["Rab", "Jum", "Sab"], phone: "0821-3344-7788" },
  { id: "t5", name: "Andre Saputra", gender: "L", age: 31, area: "BSD Serpong", radius: 10, offline: true, online: true,
    subjects: ["Coding", "Matematika"], levels: ["SMP", "SMA", "Umum"], rate: 200000,
    edu: "S1 Informatika — Binus University", exp: 8,
    headline: "Software engineer — ngajar Python, Scratch & web",
    bio: "Mengajar anak dan remaja bikin game dan website sendiri. Kurikulum berbasis proyek, tiap bulan ada karya yang bisa dipamerkan.",
    achievements: ["Senior engineer di startup fintech", "Mentor bootcamp coding"],
    rating: 5.0, reviews: 38, students: 45, verified: true, response: "± 2 jam", avail: ["Sab", "Min"], phone: "0811-9090-3030" },
  { id: "t6", name: "Maria Angelina", gender: "P", age: 34, area: "Pluit", radius: 6, offline: true, online: false,
    subjects: ["Piano"], levels: ["TK", "SD", "SMP", "SMA", "Umum"], rate: 250000,
    edu: "S1 Musik — Institut Kesenian Jakarta · ABRSM Grade 8", exp: 12,
    headline: "Les piano klasik & pop ke rumah",
    bio: "Persiapan ujian ABRSM/Trinity atau sekadar hobi. Materi disesuaikan lagu favorit murid.",
    achievements: ["ABRSM Grade 8 Distinction", "Pengiring paduan suara"],
    rating: 4.9, reviews: 73, students: 110, verified: true, response: "± 1 jam", avail: ["Sel", "Kam", "Sab"], phone: "0815-7788-9900" },
  { id: "t7", name: "Fajar Nugroho", gender: "L", age: 23, area: "Rawamangun", radius: 8, offline: true, online: true,
    subjects: ["Matematika", "Akuntansi", "UTBK / SNBT"], levels: ["SMP", "SMA"], rate: 100000,
    edu: "S1 Pendidikan Matematika — UNJ", exp: 3,
    headline: "Spesialis UTBK TPS & Penalaran Matematika",
    bio: "Punya bank soal UTBK 5 tahun terakhir lengkap dengan trik cepat. Ada try-out bulanan untuk murid.",
    achievements: ["Skor UTBK 750+", "Pengajar bimbel nasional 2 tahun"],
    rating: 4.8, reviews: 49, students: 70, verified: true, response: "± 10 menit", avail: ["Sen", "Sel", "Rab", "Kam", "Jum"], phone: "0838-1212-5656" },
  { id: "t8", name: "Nabila Putri", gender: "P", age: 21, area: "Menteng", radius: 5, offline: true, online: true,
    subjects: ["Bahasa Inggris", "Calistung"], levels: ["TK", "SD", "SMP"], rate: 80000,
    edu: "Mahasiswi S1 Psikologi — Universitas Indonesia (sem. 6)", exp: 2,
    headline: "Kakak les ramah untuk SD & SMP",
    bio: "Membantu PR harian, persiapan ulangan, dan membangun kebiasaan belajar yang menyenangkan.",
    achievements: ["Volunteer mengajar di rumah belajar"],
    rating: 4.6, reviews: 21, students: 25, verified: false, response: "± 30 menit", avail: ["Sen", "Rab", "Jum"], phone: "0857-2323-8989" },
  { id: "t9", name: "Bayu Hidayat", gender: "L", age: 28, area: "Bekasi Barat", radius: 9, offline: true, online: true,
    subjects: ["Fisika", "Matematika", "Kimia"], levels: ["SMA", "Kuliah"], rate: 130000,
    edu: "S2 Fisika — Universitas Indonesia", exp: 6,
    headline: "IPA SMA & Fisika Dasar kuliah",
    bio: "Menjelaskan dari intuisi sampai ke rumus. Banyak membantu mahasiswa tingkat 1 yang mengulang Fisika Dasar.",
    achievements: ["Asisten dosen Fisika Dasar", "Publikasi jurnal internasional"],
    rating: 4.7, reviews: 40, students: 58, verified: true, response: "± 1 jam", avail: ["Sel", "Kam", "Sab"], phone: "0819-4545-1212" },
  { id: "t10", name: "Clara Tanuwijaya", gender: "P", age: 27, area: "Grogol", radius: 6, offline: true, online: true,
    subjects: ["Bahasa Mandarin", "Matematika"], levels: ["SD", "SMP"], rate: 140000,
    edu: "S1 Sastra China — Universitas Bina Nusantara", exp: 5,
    headline: "Mandarin anak dengan lagu & flashcard",
    bio: "Pengajar Mandarin untuk sekolah nasional plus. Fokus ke pelafalan dan percakapan sehari-hari.",
    achievements: ["HSK 6", "Guru Mandarin sekolah 3 tahun"],
    rating: 4.8, reviews: 33, students: 40, verified: true, response: "± 45 menit", avail: ["Rab", "Jum", "Sab"], phone: "0878-6767-3434" },
  { id: "t11", name: "Hendra Gunawan", gender: "L", age: 40, area: "Pondok Indah", radius: 7, offline: true, online: false,
    subjects: ["Matematika", "Fisika"], levels: ["SMP", "SMA"], rate: 180000,
    edu: "S1 Matematika — ITB", exp: 15,
    headline: "15 tahun mengajar kurikulum nasional & IB",
    bio: "Berpengalaman dengan kurikulum Merdeka, Cambridge (IGCSE) dan IB. Laporan perkembangan bulanan untuk orang tua.",
    achievements: ["Guru sekolah internasional 8 tahun", "Pembina olimpiade matematika"],
    rating: 4.9, reviews: 128, students: 200, verified: true, response: "± 3 jam", avail: ["Sen", "Sel", "Kam", "Sab"], phone: "0812-1010-7070" },
  { id: "t12", name: "Putri Ayu", gender: "P", age: 25, area: "Cibubur", radius: 8, offline: true, online: true,
    subjects: ["Biologi", "Kimia", "Calistung"], levels: ["SD", "SMP", "SMA"], rate: 95000,
    edu: "S1 Biologi — IPB University", exp: 3,
    headline: "IPA SD–SMA, sabar & sistematis",
    bio: "Membuat jadwal belajar mingguan dan rangkuman tiap bab. Bisa mengajar beberapa saudara sekaligus.",
    achievements: ["Lulusan cum laude"],
    rating: 4.7, reviews: 29, students: 35, verified: true, response: "± 30 menit", avail: ["Sen", "Rab", "Jum", "Min"], phone: "0822-9898-1414" },
  { id: "t13", name: "Yoga Permana", gender: "L", age: 24, area: "Bintaro", radius: 7, offline: true, online: true,
    subjects: ["Bahasa Inggris", "UTBK / SNBT", "Matematika"], levels: ["SMP", "SMA"], rate: 115000,
    edu: "S1 Hubungan Internasional — UGM", exp: 3,
    headline: "English & UTBK Literasi, nilai naik terukur",
    bio: "Setiap murid dapat diagnostic test di awal dan target skor yang jelas.",
    achievements: ["TOEFL iBT 110", "Delegasi Model UN"],
    rating: 4.8, reviews: 44, students: 52, verified: true, response: "± 20 menit", avail: ["Sel", "Kam", "Sab", "Min"], phone: "0813-5656-0101" },
  { id: "t14", name: "Lina Marlina", gender: "P", age: 36, area: "Cempaka Putih", radius: 6, offline: true, online: false,
    subjects: ["Akuntansi", "Matematika"], levels: ["SMA", "Kuliah"], rate: 125000,
    edu: "S1 Akuntansi — Universitas Trisakti · Brevet A&B", exp: 10,
    headline: "Akuntansi SMA/SMK & Pengantar Akuntansi kuliah",
    bio: "Latihan soal jurnal sampai laporan keuangan dengan contoh kasus nyata.",
    achievements: ["Mantan auditor KAP", "Dosen tamu"],
    rating: 4.6, reviews: 18, students: 30, verified: false, response: "± 2 jam", avail: ["Rab", "Sab"], phone: "0856-3434-9090" },
  { id: "t15", name: "Dimas Ardiansyah", gender: "L", age: 26, area: "Cengkareng", radius: 8, offline: true, online: true,
    subjects: ["Matematika", "Calistung"], levels: ["SD", "SMP"], rate: 85000,
    edu: "S1 Pendidikan Guru — UHAMKA", exp: 4,
    headline: "Matematika SD–SMP dengan media visual",
    bio: "Memakai alat peraga dan game supaya anak tidak bosan. Bisa datang ke rumah sore hari.",
    achievements: ["Guru honorer SD 3 tahun"],
    rating: 4.7, reviews: 36, students: 48, verified: true, response: "± 1 jam", avail: ["Sen", "Sel", "Rab", "Kam", "Jum"], phone: "0895-1717-2828" },
  { id: "t16", name: "Sarah Hutapea", gender: "P", age: 30, area: "Kemang", radius: 6, offline: true, online: true,
    subjects: ["Bahasa Inggris", "Piano"], levels: ["TK", "SD", "Umum"], rate: 170000,
    edu: "S1 Pendidikan Bahasa Inggris — Universitas Atma Jaya", exp: 8,
    headline: "English for kids + piano dasar",
    bio: "Kelas phonics, storytelling dan lagu. Juga mengajar piano dasar untuk anak.",
    achievements: ["Cambridge TKT certified"],
    rating: 4.9, reviews: 61, students: 75, verified: true, response: "± 30 menit", avail: ["Sen", "Rab", "Sab"], phone: "0811-2424-6363" },
];

// Postingan kebutuhan les dari pencari (dilihat tutor di "Lowongan")
const SEED_POSTS = [
  { id: "p1", owner: "Ibu Ratna", area: "Tebet", subject: "Matematika", level: "SMP", student: "Anak kelas 8, nilai ulangan turun",
    days: ["Sen", "Kam"], time: "16.00–17.30", budget: 120000, mode: "offline", notes: "Lebih suka tutor yang sabar dan bisa kasih laporan ke orang tua.", hoursAgo: 2, contacted: 1 },
  { id: "p2", owner: "Bapak Hendro", area: "Kelapa Gading", subject: "Bahasa Inggris", level: "SD", student: "Kelas 4, persiapan pindah sekolah internasional",
    days: ["Sel", "Jum"], time: "15.00–16.30", budget: 150000, mode: "offline", notes: "", hoursAgo: 5, contacted: 3 },
  { id: "p3", owner: "Nadia (siswa)", area: "Depok Margonda", subject: "UTBK / SNBT", level: "SMA", student: "Kelas 12, target FK UI",
    days: ["Sab", "Min"], time: "09.00–11.00", budget: 175000, mode: "online", notes: "Fokus Penalaran Matematika dan Literasi.", hoursAgo: 8, contacted: 4 },
  { id: "p4", owner: "Ibu Yuli", area: "Bintaro", subject: "Calistung", level: "TK", student: "TK B, 5 tahun, belum lancar membaca",
    days: ["Sen", "Rab", "Jum"], time: "10.00–11.00", budget: 90000, mode: "offline", notes: "Tutor perempuan diutamakan.", hoursAgo: 12, contacted: 0 },
  { id: "p5", owner: "Bapak Agus", area: "Rawamangun", subject: "Fisika", level: "SMA", student: "Kelas 11 IPA",
    days: ["Rab", "Sab"], time: "19.00–20.30", budget: 130000, mode: "offline", notes: "", hoursAgo: 20, contacted: 2 },
  { id: "p6", owner: "Ibu Melinda", area: "BSD Serpong", subject: "Coding", level: "SD", student: "Kelas 5, suka main Minecraft",
    days: ["Sab"], time: "13.00–14.30", budget: 200000, mode: "offline", notes: "Ingin anak bisa bikin game sederhana.", hoursAgo: 26, contacted: 1 },
  { id: "p7", owner: "Kak Rendi (mahasiswa)", area: "Menteng", subject: "Akuntansi", level: "Kuliah", student: "Semester 2, Pengantar Akuntansi",
    days: ["Kam"], time: "18.00–20.00", budget: 125000, mode: "online", notes: "UAS 3 minggu lagi.", hoursAgo: 30, contacted: 0 },
  { id: "p8", owner: "Ibu Kartika", area: "Cibubur", subject: "Kimia", level: "SMA", student: "Kelas 10",
    days: ["Sel", "Kam"], time: "16.30–18.00", budget: 100000, mode: "offline", notes: "", hoursAgo: 40, contacted: 1 },
];

// Kurikulum yang dikuasai tiap tutor
const CURR_MAP = {
  t1: ["Merdeka", "K13"], t2: ["Merdeka", "Nasional Plus"], t3: ["Merdeka", "Cambridge", "IGCSE"], t4: ["Merdeka", "K13"],
  t5: ["Merdeka", "Cambridge", "IGCSE", "IB"], t6: ["Merdeka", "Cambridge"], t7: ["Merdeka", "K13"], t8: ["Merdeka"],
  t9: ["Merdeka", "K13"], t10: ["Nasional Plus", "Cambridge"], t11: ["Merdeka", "Cambridge", "IGCSE", "IB"], t12: ["Merdeka"],
  t13: ["Merdeka", "Cambridge"], t14: ["Merdeka", "K13"], t15: ["Merdeka"], t16: ["Nasional Plus", "Cambridge", "IGCSE"],
};
TUTORS.forEach((t) => { t.curricula = CURR_MAP[t.id] || ["Merdeka"]; });

// Nomor WA pencari (contoh) — hanya terbuka untuk tutor yang membayar
const POST_PHONES = { p1: "0812-3300-4411", p2: "0813-7788-2200", p3: "0857-1122-9090", p4: "0821-5566-7788",
  p5: "0819-2233-4455", p6: "0811-8899-6677", p7: "0838-4545-6767", p8: "0878-1212-3434" };
const POST_CURR = { p2: "Cambridge", p6: "Nasional Plus" };
SEED_POSTS.forEach((p) => { p.phone = POST_PHONES[p.id]; p.curr = POST_CURR[p.id] || "Merdeka"; });

// Contoh ulasan (hanya dari pencari yang sudah membuka kontak)
const REVIEWS = {
  t1: [{ name: "Ibu R.", stars: 5, text: "Anak saya jadi berani tanya. Nilai ulangan naik dari 60-an ke 85.", when: "2 minggu lalu" },
       { name: "Bapak D.", stars: 5, text: "Tepat waktu dan selalu kasih ringkasan materi.", when: "1 bulan lalu" }],
  t2: [{ name: "Ibu M.", stars: 5, text: "Sabar sekali, anak TK saya sekarang sudah lancar membaca.", when: "3 minggu lalu" }],
  t3: [{ name: "Ibu S.", stars: 4, text: "Speaking anak saya membaik. Kadang jadwal perlu digeser.", when: "1 bulan lalu" }],
  t4: [{ name: "Nadia", stars: 5, text: "Mind-map Kimia-nya membantu banget buat UTBK.", when: "2 minggu lalu" }],
  t5: [{ name: "Ibu L.", stars: 5, text: "Anak saya sudah bisa bikin game sendiri di bulan kedua.", when: "1 minggu lalu" }],
  t7: [{ name: "Rafi", stars: 5, text: "Trik UTBK-nya kepakai pas try-out.", when: "3 hari lalu" }],
  t11: [{ name: "Bapak H.", stars: 5, text: "Paham kurikulum IB, laporan bulanan rapi.", when: "1 bulan lalu" }],
};
