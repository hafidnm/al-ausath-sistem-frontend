import api from "@/lib/axios"

export interface NilaiStatistikParams {
  kode_kelas?: string
  kode_mapel?: string
  tahun_ajaran?: string
  semester?: 1 | 2
}

export interface NilaiStatistikData {
  rata_rata: number
  nilai_tertinggi: number
  nilai_terendah: number
  jumlah_santri: number
  total_nilai: number
}

export interface NilaiStatistikResponse {
  data?: {
    rata_rata?: number | string
    nilai_tertinggi?: number | string
    nilai_terendah?: number | string
    jumlah_santri?: number | string
    total_nilai?: number | string
  }
  filters?: {
    kode_kelas?: string | null
    kode_mapel?: string | null
    tahun_ajaran?: string | null
    semester?: number | null
  }
}

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizeData = (raw: NilaiStatistikResponse["data"]): NilaiStatistikData => ({
  rata_rata: toNumber(raw?.rata_rata, 0),
  nilai_tertinggi: toNumber(raw?.nilai_tertinggi, 0),
  nilai_terendah: toNumber(raw?.nilai_terendah, 0),
  jumlah_santri: toNumber(raw?.jumlah_santri, 0),
  total_nilai: toNumber(raw?.total_nilai, 0),
})

export const nilaiStatistikService = {
  async getKeseluruhan(params?: NilaiStatistikParams): Promise<{
    data: NilaiStatistikData
    filters: NilaiStatistikResponse["filters"]
  }> {
    const response = await api.get<NilaiStatistikResponse>("/akademik/nilai-statistik/", {
      params,
    })

    return {
      data: normalizeData(response.data?.data),
      filters: response.data?.filters,
    }
  },
}
