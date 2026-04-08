// Overview stats
export const overviewStats = {
  santriHadir: 1150,
  santriTidakHadir: 97,
  totalSantri: 1247,
  guruHadir: 45,
  guruTidakHadir: 3,
  totalGuru: 48,
  pendingValidasi: 12,
  validasiHariIni: 28,
}

// Pending santri attendance for validation
export const pendingSantriPresensi = [
  { id: 1, tanggal: "30 Jan 2026", guru: "Ustadz Ahmad", mapel: "Tahfidz Al-Quran", kelas: "9A", jenjang: "SMP", hadir: 26, sakit: 1, izin: 1, alpha: 0, waktuInput: "07:45", status: "pending" },
  { id: 2, tanggal: "30 Jan 2026", guru: "Ustadzah Fatimah", mapel: "Fiqih", kelas: "9A", jenjang: "SMP", hadir: 25, sakit: 2, izin: 1, alpha: 0, waktuInput: "09:30", status: "pending" },
  { id: 3, tanggal: "30 Jan 2026", guru: "Ustadz Ibrahim", mapel: "Bahasa Arab", kelas: "8A", jenjang: "SMP", hadir: 30, sakit: 1, izin: 0, alpha: 1, waktuInput: "10:15", status: "pending" },
  { id: 4, tanggal: "30 Jan 2026", guru: "Ustadz Umar", mapel: "Hadits", kelas: "7A", jenjang: "SMP", hadir: 29, sakit: 0, izin: 2, alpha: 0, waktuInput: "11:00", status: "pending" },
  { id: 5, tanggal: "29 Jan 2026", guru: "Pak Budi", mapel: "Matematika", kelas: "12A", jenjang: "SMA", hadir: 32, sakit: 0, izin: 0, alpha: 0, waktuInput: "08:00", status: "pending" },
]

// Pending guru attendance for validation
export const pendingGuruPresensi = [
  { id: 1, tanggal: "30 Jan 2026", nip: "198501012010011001", guru: "Ustadz Ahmad Hidayat", mapel: "Tahfidz Al-Quran", kelas: "9A", jenjang: "SMP", status: "hadir", jamMasuk: "06:45", jamKeluar: "-", validasi: "pending" },
  { id: 2, tanggal: "30 Jan 2026", nip: "198601022010012002", guru: "Ustadzah Fatimah", mapel: "Fiqih", kelas: "9A", jenjang: "SMP", status: "hadir", jamMasuk: "07:00", jamKeluar: "-", validasi: "pending" },
  { id: 3, tanggal: "30 Jan 2026", nip: "198701032010011003", guru: "Ustadz Ibrahim", mapel: "Bahasa Arab", kelas: "8A", jenjang: "SMP", status: "tidak_hadir", jamMasuk: "-", jamKeluar: "-", validasi: "pending", alasan: "Sakit" },
]

// Validation history
export const validationHistory = [
  { id: 1, tanggal: "29 Jan 2026", tipe: "santri", guru: "Ustadz Ahmad", mapel: "Tahfidz Al-Quran", kelas: "9A", status: "approved", admin: "Admin", waktu: "12:30" },
  { id: 2, tanggal: "29 Jan 2026", tipe: "santri", guru: "Ustadzah Fatimah", mapel: "Fiqih", kelas: "8B", status: "approved", admin: "Admin", waktu: "13:15" },
  { id: 3, tanggal: "28 Jan 2026", tipe: "guru", guru: "Ustadz Umar", mapel: "Hadits", kelas: "7A", status: "rejected", admin: "Admin", waktu: "14:00", catatan: "Data tidak lengkap" },
  { id: 4, tanggal: "28 Jan 2026", tipe: "santri", guru: "Pak Budi", mapel: "Matematika", kelas: "12A", status: "approved", admin: "Admin", waktu: "11:45" },
]

// Sample student list
export const sampleStudentList = [
  { no: 1, name: "Ahmad Fauzi", status: "hadir" },
  { no: 2, name: "Siti Aisyah", status: "hadir" },
  { no: 3, name: "Muhammad Rizki", status: "sakit" },
]
