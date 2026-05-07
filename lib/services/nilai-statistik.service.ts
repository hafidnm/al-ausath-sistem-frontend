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

export interface RataRataPerKelasItem {
  kode_kelas: string
  nama_kelas: string
  rata_rata: number
  jumlah_santri: number
}

export interface RataRataPerKelasResponse {
  data?: RataRataPerKelasItem[]
  filters?: {
    tahun_ajaran?: string | null
    semester?: number | null
    kode_mapel?: string | null
  }
}

export interface NilaiDetailItem {
  kode_mapel: string
  nilai_akhir: number
  nilai_tampil?: number
  status_ketuntasan: string
}

export interface SantriBerprestasiItem {
  nomor_induk: string
  rata_rata: number
  mapel_count: number
  nilai_detail: NilaiDetailItem[]
}

export interface BerprestasiParams extends NilaiStatistikParams {
  threshold?: number | string
  limit?: number | string
}

export interface BerprestasiResponse {
  data?: SantriBerprestasiItem[]
  count?: number
  filters?: {
    threshold?: number | null
    limit?: number | null
    kode_kelas?: string | null
    tahun_ajaran?: string | null
    semester?: number | null
  }
}

export interface BimbinganParams extends NilaiStatistikParams {
  threshold?: number | string
  limit?: number | string
}

export interface BimbinganDetailItem {
  kode_mapel: string
  nilai_akhir: number
  nilai_tampil?: number
  status_ketuntasan: string
  flag_warna: string
}

export interface SantriPerluBimbinganItem {
  nomor_induk: string
  rata_rata: number
  mapel_perlu_bimbingan: number
  mapel_belum_tuntas: number
  mapel_detail: BimbinganDetailItem[]
}

export interface BimbinganResponse {
  data?: SantriPerluBimbinganItem[]
  count?: number
  filters?: {
    threshold?: number | null
    limit?: number | null
    kode_kelas?: string | null
    tahun_ajaran?: string | null
    semester?: number | null
  }
}

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const clampNumber = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

const normalizeBerprestasiParams = (params?: BerprestasiParams): BerprestasiParams => {
  const normalized: BerprestasiParams = {}

  const kodeKelas = params?.kode_kelas?.trim()
  if (kodeKelas) {
    normalized.kode_kelas = kodeKelas
  }

  const tahunAjaran = params?.tahun_ajaran?.trim()
  if (tahunAjaran) {
    normalized.tahun_ajaran = tahunAjaran
  }

  if (params?.semester === 1 || params?.semester === 2) {
    normalized.semester = params.semester
  }

  if (params?.kode_mapel?.trim()) {
    normalized.kode_mapel = params.kode_mapel.trim()
  }

  const thresholdValue = params?.threshold
  if (thresholdValue !== undefined && thresholdValue !== null && String(thresholdValue).trim() !== "") {
    normalized.threshold = clampNumber(toNumber(thresholdValue, 85), 0, 100)
  }

  const limitValue = params?.limit
  if (limitValue !== undefined && limitValue !== null && String(limitValue).trim() !== "") {
    normalized.limit = clampNumber(toNumber(limitValue, 10), 1, 100)
  }

  return normalized
}

const normalizeBimbinganParams = (params?: BimbinganParams): BimbinganParams => {
  const normalized: BimbinganParams = {}

  const kodeKelas = params?.kode_kelas?.trim()
  if (kodeKelas) {
    normalized.kode_kelas = kodeKelas
  }

  const tahunAjaran = params?.tahun_ajaran?.trim()
  if (tahunAjaran) {
    normalized.tahun_ajaran = tahunAjaran
  }

  if (params?.semester === 1 || params?.semester === 2) {
    normalized.semester = params.semester
  }

  const thresholdValue = params?.threshold
  if (thresholdValue !== undefined && thresholdValue !== null && String(thresholdValue).trim() !== "") {
    normalized.threshold = clampNumber(toNumber(thresholdValue, 65), 0, 100)
  }

  const limitValue = params?.limit
  if (limitValue !== undefined && limitValue !== null && String(limitValue).trim() !== "") {
    normalized.limit = clampNumber(toNumber(limitValue, 50), 1, 500)
  }

  return normalized
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

  async getPerKelas(params?: NilaiStatistikParams): Promise<{
    data: RataRataPerKelasItem[]
    filters: RataRataPerKelasResponse["filters"]
  }> {
    const response = await api.get<RataRataPerKelasResponse>("/akademik/nilai-statistik/per-kelas", {
      params,
    })

    const items = (response.data?.data ?? []).map((item) => ({
      kode_kelas: item.kode_kelas ?? "",
      nama_kelas: item.nama_kelas ?? "",
      rata_rata: toNumber(item.rata_rata, 0),
      jumlah_santri: toNumber(item.jumlah_santri, 0),
    }))

    return {
      data: items,
      filters: response.data?.filters,
    }
  },

  async getBerprestasi(params?: BerprestasiParams): Promise<{
    data: SantriBerprestasiItem[]
    count: number
    filters: BerprestasiResponse["filters"]
  }> {
    const response = await api.get<BerprestasiResponse>("/akademik/nilai-statistik/berprestasi", {
      params: normalizeBerprestasiParams(params),
    })

    const items = (response.data?.data ?? []).map((item) => ({
      nomor_induk: item.nomor_induk ?? "",
      rata_rata: toNumber(item.rata_rata, 0),
      mapel_count: toNumber(item.mapel_count, 0),
      nilai_detail: (item.nilai_detail ?? []).map((detail) => ({
        kode_mapel: detail.kode_mapel ?? "",
        nilai_akhir: toNumber(detail.nilai_akhir, 0),
        nilai_tampil: detail.nilai_tampil ? toNumber(detail.nilai_tampil, 0) : undefined,
        status_ketuntasan: detail.status_ketuntasan ?? "",
      })),
    }))

    return {
      data: items,
      count: response.data?.count ?? 0,
      filters: response.data?.filters,
    }
  },

  async getPerluBimbingan(params?: BimbinganParams): Promise<{
    data: SantriPerluBimbinganItem[]
    count: number
    filters: BimbinganResponse["filters"]
  }> {
    const response = await api.get<BimbinganResponse>("/akademik/nilai-statistik/perlu-bimbingan", {
      params: normalizeBimbinganParams(params),
    })

    const items = (response.data?.data ?? []).map((item) => ({
      nomor_induk: item.nomor_induk ?? "",
      rata_rata: toNumber(item.rata_rata, 0),
      mapel_perlu_bimbingan: toNumber(item.mapel_perlu_bimbingan, 0),
      mapel_belum_tuntas: toNumber(item.mapel_belum_tuntas, 0),
      mapel_detail: (item.mapel_detail ?? []).map((detail) => ({
        kode_mapel: detail.kode_mapel ?? "",
        nilai_akhir: toNumber(detail.nilai_akhir, 0),
        nilai_tampil: detail.nilai_tampil !== undefined && detail.nilai_tampil !== null
          ? toNumber(detail.nilai_tampil, 0)
          : undefined,
        status_ketuntasan: detail.status_ketuntasan ?? "",
        flag_warna: detail.flag_warna ?? "",
      })),
    }))

    return {
      data: items,
      count: response.data?.count ?? 0,
      filters: response.data?.filters,
    }
  },
}
