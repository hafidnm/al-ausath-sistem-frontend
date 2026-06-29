import api, { getCsrfToken } from "../axios"

export type BackendStatus = "AKTIF" | "NONAKTIF"

export interface DataKelasMapelApiItem {
  id_kelas_mapel?: number
  id?: number
  kode_kelas?: string
  nama_kelas?: string
  kode_mapel?: string
  nama_mapel?: string
  id_petugas?: number | null
  kode_unit?: string
  tahun_ajaran?: string
  semester?: number | string
  buku_acuan?: string | null
  status?: BackendStatus | null
  created_at?: string | null
  updated_at?: string | null
  kelas?: {
    kode_kelas?: string
    nama_kelas?: string
    kode_unit?: string
  } | null
  mapel?: {
    kode_mapel?: string
    nama_mapel?: string
  } | null
  mata_pelajaran?: {
    kode_mapel?: string
    nama_mapel?: string
  } | null
  mataPelajaran?: {
    kode_mapel?: string
    nama_mapel?: string
  } | null
  petugas?: {
    id_petugas?: number
    nama_lengkap?: string
  } | null
}

export interface DataKelasMapelListParams {
  q?: string
  kode_kelas?: string
  kode_mapel?: string
  kode_unit?: string
  id_petugas?: number
  tahun_ajaran?: string
  semester?: number
  include_wali?: boolean
  status?: BackendStatus
  per_page?: number
  page?: number
}

export interface DataKelasMapelPayload {
  kode_kelas: string
  kode_mapel: string
  id_petugas?: number | null
  tahun_ajaran: string
  semester: number
  buku_acuan?: string | null
  status?: BackendStatus | null
}

export interface DataKelasMapelPaginationMeta {
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
  [key: string]: unknown
}

export interface DataKelasMapelListApiResponse extends DataKelasMapelPaginationMeta {
  data: DataKelasMapelApiItem[] | string
}

export interface DataKelasMapelMutationApiResponse {
  message: string
  data: DataKelasMapelApiItem | string
}

export interface DataKelasMapelShowApiResponse {
  data: DataKelasMapelApiItem | string
}

export interface DataKelasMapelDeleteApiResponse {
  message: string
}

export interface DataKelasMapelImportErrorRow {
  line: number
  errors: string[]
}

export interface DataKelasMapelImportSummary {
  inserted?: number
  updated?: number
  failed?: number
  error_rows?: DataKelasMapelImportErrorRow[]
  affected_kelas_mapel?: DataKelasMapelApiItem[]
  [key: string]: unknown
}

export interface DataKelasMapelImportApiResponse {
  message: string
  data: DataKelasMapelImportSummary
}

const KELAS_MAPEL_BASE_PATH = "/akademik/kelas-mapel"

const extractList = (payload: unknown): DataKelasMapelApiItem[] => {
  const source = payload as { data?: unknown; items?: unknown }

  if (Array.isArray(source?.data)) return source.data as DataKelasMapelApiItem[]
  if (Array.isArray(payload)) return payload as DataKelasMapelApiItem[]
  if (Array.isArray(source?.items)) return source.items as DataKelasMapelApiItem[]

  return []
}

const extractItem = (payload: unknown): DataKelasMapelApiItem => {
  const source = payload as { data?: unknown }

  if (source?.data && typeof source.data === "object" && !Array.isArray(source.data)) {
    return source.data as DataKelasMapelApiItem
  }

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload as DataKelasMapelApiItem
  }

  return {}
}

const normalizePayload = (payload: DataKelasMapelPayload): DataKelasMapelPayload => ({
  kode_kelas: payload.kode_kelas.trim().toUpperCase(),
  kode_mapel: payload.kode_mapel.trim().toUpperCase(),
  id_petugas: payload.id_petugas ?? null,
  tahun_ajaran: payload.tahun_ajaran.trim(),
  semester: Number(payload.semester) || 1,
  buku_acuan: payload.buku_acuan?.trim() || null,
  status: payload.status || null,
})

export const dataKelasMapelService = {
  async getAll(
    params?: DataKelasMapelListParams,
  ): Promise<{ data: DataKelasMapelApiItem[]; meta: DataKelasMapelPaginationMeta }> {
    const response = await api.get<DataKelasMapelListApiResponse>(KELAS_MAPEL_BASE_PATH, { params })

    return {
      data: extractList(response.data),
      meta: response.data,
    }
  },

  async getById(id: number): Promise<DataKelasMapelApiItem> {
    const response = await api.get<DataKelasMapelShowApiResponse>(`${KELAS_MAPEL_BASE_PATH}/${id}`)
    return extractItem(response.data)
  },

  async create(payload: DataKelasMapelPayload): Promise<DataKelasMapelApiItem> {
    await getCsrfToken()

    const response = await api.post<DataKelasMapelMutationApiResponse>(KELAS_MAPEL_BASE_PATH, normalizePayload(payload))
    return extractItem(response.data)
  },

  async update(id: number, payload: Partial<DataKelasMapelPayload>): Promise<DataKelasMapelApiItem> {
    await getCsrfToken()

    const response = await api.put<DataKelasMapelMutationApiResponse>(`${KELAS_MAPEL_BASE_PATH}/${id}`, payload)
    return extractItem(response.data)
  },

  async remove(id: number): Promise<DataKelasMapelDeleteApiResponse> {
    await getCsrfToken()

    const response = await api.delete<DataKelasMapelDeleteApiResponse>(`${KELAS_MAPEL_BASE_PATH}/${id}`)
    return response.data || { message: "Data kelas mapel berhasil dihapus." }
  },

  async importFile(file: File): Promise<DataKelasMapelImportApiResponse> {
    await getCsrfToken()

    const formData = new FormData()
    formData.append("file", file)

    const response = await api.post<DataKelasMapelImportApiResponse>(`${KELAS_MAPEL_BASE_PATH}/import`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    return response.data
  },

  async exportCsv(params?: Omit<DataKelasMapelListParams, "per_page" | "page">): Promise<Blob> {
    const response = await api.get(`${KELAS_MAPEL_BASE_PATH}/export`, {
      params,
      responseType: "blob",
    })

    return response.data
  },

  async downloadImportTemplate(): Promise<Blob> {
    const response = await api.get(`${KELAS_MAPEL_BASE_PATH}/import-template`, {
      responseType: "blob",
    })

    return response.data
  },
}
