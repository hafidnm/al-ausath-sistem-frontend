import { NilaiMapelTugasItem, NilaiMapelUlanganItem } from "@/lib/services/nilai-mapel.service"

export const average = (values: number[]): number => {
  const valid = values.filter((value) => Number.isFinite(value))
  if (valid.length === 0) return 0
  return valid.reduce((acc, cur) => acc + cur, 0) / valid.length
}

export const calculateRaporRaw = (
  tugas: NilaiMapelTugasItem[],
  ulangan: NilaiMapelUlanganItem[],
  ujianAkhir: number,
  bobot = { tugas: 20, ulangan: 30, ujian: 50 },
): number => {
  const avgTugas = average(tugas.map((item) => item.nilai))
  const avgUlangan = average(ulangan.map((item) => item.nilai))

  return (
    (avgTugas * bobot.tugas) / 100
    + (avgUlangan * bobot.ulangan) / 100
    + (ujianAkhir * bobot.ujian) / 100
  )
}

export const normalizeRaporDisplay = (raw: number): { nilai: number; isRed: boolean } => {
  // Aturan pembulatan: 1-4 turun, 5-9 naik
  const rounded = Math.round(raw)

  // Nilai 100 ditampilkan menjadi 98
  if (rounded >= 100) {
    return { nilai: 98, isRed: false }
  }

  // Nilai di bawah 50 ditampilkan 50 dengan indikator merah
  if (rounded < 50) {
    return { nilai: 50, isRed: true }
  }

  // Nilai 50 asli tetap 50 tanpa merah
  if (rounded === 50) {
    return { nilai: 50, isRed: false }
  }

  return { nilai: rounded, isRed: false }
}

export const statusKkm = (nilai: number, kkm = 75): string => {
  return nilai >= kkm ? "TUNTAS" : "BELUM_TUNTAS"
}
