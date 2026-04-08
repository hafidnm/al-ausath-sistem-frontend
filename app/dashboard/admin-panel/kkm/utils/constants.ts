export const semesterOptions = [
  { label: "Semester 1", value: "1" },
  { label: "Semester 2", value: "2" },
]

export const mapelOptions = [
  { label: "Tahfidz Al-Quran", value: "THF-001" },
  { label: "Fiqih", value: "FQH-001" },
  { label: "Hadits", value: "HDS-001" },
  { label: "Bahasa Arab", value: "ARB-001" },
  { label: "Matematika", value: "MTK-001" },
]

export const unitOptions = [
  { label: "Global", value: "global" },
  { label: "MTs", value: "mts" },
  { label: "SMA", value: "sma" },
]

export const tahunAjaranOptions = [
  { label: "2025/2026", value: "2025/2026" },
  { label: "2026/2027", value: "2026/2027" },
]

export const sampleKkmData = [
  {
    id: 1,
    kode_mapel: "THF-001",
    mapel: "Tahfidz Al-Quran",
    tahun_ajaran: "2025/2026",
    semester: 1,
    nilai_kkm: 75,
    kode_unit: "mts",
    keterangan: "KKM umum semester ganjil",
    updatedAt: "2026-02-10",
  },
  {
    id: 2,
    kode_mapel: "FQH-001",
    mapel: "Fiqih",
    tahun_ajaran: "2025/2026",
    semester: 2,
    nilai_kkm: 78,
    kode_unit: "mts",
    keterangan: "Penyesuaian semester genap",
    updatedAt: "2026-02-11",
  },
] as const
