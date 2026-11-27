/** Daerah = kecamatan (L3) se-Jabodetabek, dikelompokkan per kota/kabupaten (L2). Nama kembar diberi keterangan kota. */
export const AREA_TREE: Readonly<Record<string, readonly string[]>> = {
  "Jakarta Pusat": ["Cempaka Putih", "Gambir", "Johar Baru", "Kemayoran", "Menteng", "Sawah Besar", "Senen", "Tanah Abang"],
  "Jakarta Utara": ["Cilincing", "Kelapa Gading", "Koja", "Pademangan", "Penjaringan", "Tanjung Priok"],
  "Jakarta Barat": ["Cengkareng", "Grogol Petamburan", "Kalideres", "Kebon Jeruk", "Kembangan", "Palmerah", "Taman Sari", "Tambora"],
  "Jakarta Selatan": ["Cilandak", "Jagakarsa", "Kebayoran Baru", "Kebayoran Lama", "Mampang Prapatan", "Pancoran", "Pasar Minggu", "Pesanggrahan", "Setiabudi", "Tebet"],
  "Jakarta Timur": ["Cakung", "Cipayung (Jakarta Timur)", "Ciracas", "Duren Sawit", "Jatinegara", "Kramat Jati", "Makasar", "Matraman", "Pasar Rebo", "Pulo Gadung"],
  "Kota Bogor": ["Bogor Barat", "Bogor Selatan", "Bogor Tengah", "Bogor Timur", "Bogor Utara", "Tanah Sareal"],
  "Kabupaten Bogor": ["Babakan Madang", "Bojonggede", "Caringin", "Cariu", "Ciampea", "Ciawi", "Cibinong", "Cibungbulang", "Cigombong", "Cigudeg", "Cijeruk", "Cileungsi", "Ciomas", "Cisarua", "Ciseeng", "Citeureup", "Dramaga", "Gunung Putri", "Gunung Sindur", "Jasinga", "Jonggol", "Kemang", "Klapanunggal", "Leuwiliang", "Leuwisadeng", "Megamendung", "Nanggung", "Pamijahan", "Parung", "Parung Panjang", "Rancabungur", "Rumpin", "Sukajaya", "Sukamakmur", "Sukaraja", "Tajurhalang", "Tamansari", "Tanjungsari", "Tenjo", "Tenjolaya"],
  "Kota Depok": ["Beji", "Bojongsari", "Cilodong", "Cimanggis", "Cinere", "Cipayung (Depok)", "Limo", "Pancoran Mas", "Sawangan", "Sukmajaya", "Tapos"],
  "Kota Tangerang": ["Batuceper", "Benda", "Cibodas", "Ciledug", "Cipondoh", "Jatiuwung", "Karang Tengah", "Karawaci", "Larangan", "Neglasari", "Periuk", "Pinang", "Tangerang"],
  "Tangerang Selatan": ["Ciputat", "Ciputat Timur", "Pamulang", "Pondok Aren", "Serpong", "Serpong Utara", "Setu (Tangerang Selatan)"],
  "Kabupaten Tangerang": ["Balaraja", "Cikupa", "Cisauk", "Cisoka", "Curug", "Gunung Kaler", "Jambe", "Jayanti", "Kelapa Dua", "Kemiri", "Kosambi", "Kresek", "Kronjo", "Legok", "Mauk", "Mekar Baru", "Pagedangan", "Pakuhaji", "Panongan", "Pasar Kemis", "Rajeg", "Sepatan", "Sepatan Timur", "Sindang Jaya", "Solear", "Sukadiri", "Sukamulya", "Teluknaga", "Tigaraksa"],
  "Kota Bekasi": ["Bantargebang", "Bekasi Barat", "Bekasi Selatan", "Bekasi Timur", "Bekasi Utara", "Jatiasih", "Jatisampurna", "Medan Satria", "Mustika Jaya", "Pondok Gede", "Pondok Melati", "Rawalumbu"],
  "Kabupaten Bekasi": ["Babelan", "Bojongmangu", "Cabangbungin", "Cibarusah", "Cibitung", "Cikarang Barat", "Cikarang Pusat", "Cikarang Selatan", "Cikarang Timur", "Cikarang Utara", "Karangbahagia", "Kedungwaringin", "Muara Gembong", "Pebayuran", "Serang Baru", "Setu (Kabupaten Bekasi)", "Sukakarya", "Sukatani", "Sukawangi", "Tambelang", "Tambun Selatan", "Tambun Utara", "Tarumajaya"],
};

/** Kota di luar Jabodetabek: belum dibuka (coming soon). */
export const COMING_SOON_CITIES: readonly string[] = ["Bandung", "Surabaya", "Yogyakarta", "Semarang", "Malang", "Medan", "Makassar", "Denpasar", "Palembang", "Balikpapan"];

const CITY_OF = new Map<string, string>(Object.entries(AREA_TREE).flatMap(([city, list]) => list.map((a) => [a, city] as const)));

export const isArea = (a: string): boolean => CITY_OF.has(a);
export const cityOf = (a: string): string | undefined => CITY_OF.get(a);
export const allAreas = (): string[] => [...CITY_OF.keys()];

/** Tanpa radius: 2 = satu kecamatan, 1 = satu kota/kabupaten, 0 = beda kota. */
export function areaLevel(a: string, b: string): 0 | 1 | 2 {
  if (a === b) return 2;
  const ca = CITY_OF.get(a);
  return ca && ca === CITY_OF.get(b) ? 1 : 0;
}
