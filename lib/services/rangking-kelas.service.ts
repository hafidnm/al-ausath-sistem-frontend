import api from "../axios"

export interface GenerateRangkingKelasPayload {
  kode_kelas: string
  tahun_ajaran: string
  semester: number
}

export interface RangkingKelasRow {
  peringkat_kelas: number
  total_siswa_kelas: number
  nomor_induk: string
  nama_lengkap_santri: string
  rata_rata: number
  jumlah_nilai: number
}

export interface GenerateRangkingKelasResponse {
  kode_kelas: string
  tahun_ajaran: string
  semester: number
  total_siswa: number
  generated_at?: string
  ranking: RangkingKelasRow[]
}

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toText = (value: unknown): string => {
  if (value == null) return ""
  return String(value)
}

const normalizeRow = (raw: any): RangkingKelasRow => ({
  peringkat_kelas: toNumber(raw?.peringkat_kelas, 0),
  total_siswa_kelas: toNumber(raw?.total_siswa_kelas, 0),
  nomor_induk: toText(raw?.nomor_induk),
  nama_lengkap_santri: toText(raw?.nama_lengkap_santri ?? raw?.nama_santri ?? raw?.nama_lengkap),
  rata_rata: toNumber(raw?.rata_rata, 0),
  jumlah_nilai: toNumber(raw?.jumlah_nilai, 0),
})

export const rangkingKelasService = {
  async generate(payload: GenerateRangkingKelasPayload): Promise<GenerateRangkingKelasResponse> {
    const response = await api.post("/akademik/rangking-kelas/generate", payload)
    const data = response.data?.data ?? response.data ?? {}

    const ranking = Array.isArray(data?.ranking) ? data.ranking.map(normalizeRow) : []

    return {
      kode_kelas: toText(data?.kode_kelas || payload.kode_kelas),
      tahun_ajaran: toText(data?.tahun_ajaran || payload.tahun_ajaran),
      semester: toNumber(data?.semester, payload.semester),
      total_siswa: toNumber(data?.total_siswa, ranking.length),
      generated_at: data?.generated_at ? toText(data.generated_at) : undefined,
      ranking,
    }
  },
}
