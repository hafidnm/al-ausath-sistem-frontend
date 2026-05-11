export type FilterItem = {
  name: string
  defaultValue?: string
  description: string
}

export type EndpointInfo = {
  key: string
  title: string
  endpoint: string
  purpose: string
  filters: FilterItem[]
}

export const endpointInfos: EndpointInfo[] = [
  {
    key: "statistik-keseluruhan",
    title: "Statistik Nilai Santri (Keseluruhan)",
    endpoint: "GET /api/akademik/nilai-statistik/",
    purpose: "Menampilkan gambaran umum performa nilai santri (min, max, avg, count).",
    filters: [
      { name: "kode_kelas", description: "Filter statistik per kelas." },
      { name: "kode_mapel", description: "Filter statistik per mata pelajaran." },
      { name: "tahun_ajaran", description: "Filter statistik per tahun ajaran." },
      { name: "semester", description: "Filter statistik per semester (1 atau 2)." },
    ],
  },
  {
    key: "rata-rata-per-kelas",
    title: "Rata-rata Nilai per Kelas",
    endpoint: "GET /api/akademik/nilai-statistik/per-kelas",
    purpose: "Melihat performa tiap kelas untuk bar chart atau tabel perbandingan.",
    filters: [
      { name: "tahun_ajaran", description: "Filter data per tahun ajaran." },
      { name: "semester", description: "Filter data per semester (1 atau 2)." },
      { name: "kode_mapel", description: "Filter performa kelas untuk mapel spesifik." },
    ],
  },
  {
    key: "trend-per-semester",
    title: "Grafik Perkembangan Nilai (Trend per Semester)",
    endpoint: "GET /api/akademik/nilai-statistik/trend",
    purpose: "Tracking perkembangan akademik per semester, cocok untuk line chart.",
    filters: [
      { name: "nomor_induk", description: "Trend untuk santri tertentu." },
      { name: "kode_kelas", description: "Trend untuk kelas tertentu." },
      { name: "kode_mapel", description: "Trend untuk mapel tertentu." },
      { name: "tahun_ajaran", description: "Trend pada tahun ajaran tertentu." },
    ],
  },
  {
    key: "santri-berprestasi",
    title: "Identifikasi Santri Berprestasi",
    endpoint: "GET /api/akademik/nilai-statistik/berprestasi",
    purpose: "Mengidentifikasi santri dengan performa tinggi (top performers).",
    filters: [
      { name: "kode_kelas", description: "Filter berprestasi per kelas." },
      { name: "tahun_ajaran", description: "Filter per tahun ajaran." },
      { name: "semester", description: "Filter per semester (1 atau 2)." },
      { name: "threshold", defaultValue: "85", description: "Nilai minimum untuk dianggap berprestasi." },
      { name: "limit", defaultValue: "10", description: "Jumlah top performers (maksimal 100)." },
    ],
  },
  {
    key: "santri-perlu-bimbingan",
    title: "Identifikasi Santri Perlu Bimbingan",
    endpoint: "GET /api/akademik/nilai-statistik/perlu-bimbingan",
    purpose: "Mengidentifikasi santri yang memerlukan perhatian khusus (nilai rendah atau belum tuntas).",
    filters: [
      { name: "kode_kelas", description: "Filter perlu bimbingan per kelas." },
      { name: "tahun_ajaran", description: "Filter per tahun ajaran." },
      { name: "semester", description: "Filter per semester (1 atau 2)." },
      { name: "threshold", defaultValue: "65", description: "Nilai maksimum untuk dianggap perlu bimbingan." },
      { name: "limit", defaultValue: "50", description: "Jumlah data yang ditampilkan (maksimal 500)." },
    ],
  },
]

export const statistikKeseluruhanSample = {
  rata_rata: 75.5,
  nilai_tertinggi: 98,
  nilai_terendah: 45,
  jumlah_santri: 32,
  total_nilai: 256,
}

export const rataRataPerKelasSample = [
  { kode_kelas: "9-PA", nama_kelas: "Kelas 9 PAI", rata_rata: 78.25, jumlah_santri: 28 },
  { kode_kelas: "9-PB", nama_kelas: "Kelas 9 Humaniora", rata_rata: 75.8, jumlah_santri: 30 },
  { kode_kelas: "10-PA", nama_kelas: "Kelas 10 PAI", rata_rata: 76.5, jumlah_santri: 27 },
]

export const trendPerSemesterSample = [
  { semester: 1, rata_rata: 74.5, tertinggi: 95, terendah: 50, jumlah_santri: 32 },
  { semester: 2, rata_rata: 76.25, tertinggi: 98, terendah: 48, jumlah_santri: 30 },
]

export const santriBerprestasiSample = [
  {
    nomor_induk: "001",
    rata_rata: 88.75,
    mapel_count: 8,
    nilai_detail: [
      { kode_mapel: "MAPEL-001", nilai_akhir: 90, status_ketuntasan: "TUNTAS" },
      { kode_mapel: "MAPEL-002", nilai_akhir: 87, status_ketuntasan: "TUNTAS" },
      { kode_mapel: "MAPEL-003", nilai_akhir: 92, status_ketuntasan: "TUNTAS" },
    ],
  },
  {
    nomor_induk: "003",
    rata_rata: 86.5,
    mapel_count: 8,
    nilai_detail: [
      { kode_mapel: "MAPEL-001", nilai_akhir: 88, status_ketuntasan: "TUNTAS" },
      { kode_mapel: "MAPEL-002", nilai_akhir: 85, status_ketuntasan: "TUNTAS" },
    ],
  },
]

export const santriPerluBimbinganSample = [
  {
    nomor_induk: "015",
    rata_rata: 58.5,
    mapel_perlu_bimbingan: 5,
    mapel_belum_tuntas: 3,
    mapel_detail: [
      { kode_mapel: "MAPEL-002", nilai_akhir: 45, status_ketuntasan: "BELUM TUNTAS", flag_warna: "MERAH" },
      { kode_mapel: "MAPEL-005", nilai_akhir: 52, status_ketuntasan: "BELUM TUNTAS", flag_warna: "HITAM" },
      { kode_mapel: "MAPEL-003", nilai_akhir: 60, status_ketuntasan: "TUNTAS", flag_warna: "HITAM" },
    ],
  },
  {
    nomor_induk: "018",
    rata_rata: 62.3,
    mapel_perlu_bimbingan: 6,
    mapel_belum_tuntas: 2,
    mapel_detail: [
      { kode_mapel: "MAPEL-001", nilai_akhir: 55, status_ketuntasan: "BELUM TUNTAS", flag_warna: "HITAM" },
      { kode_mapel: "MAPEL-004", nilai_akhir: 58, status_ketuntasan: "BELUM TUNTAS", flag_warna: "HITAM" },
    ],
  },
]
