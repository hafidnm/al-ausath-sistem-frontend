import api, { getCsrfToken } from "../axios"

export type BackendStatus = "AKTIF" | "NONAKTIF"

export interface DataMataPelajaranApiItem {
  id_mapel?: number
  id?: number
  kode_mapel?: string
  nama_mapel?: string
  kode_unit?: string | null
  kelompok_mapel?: string | null
  urutan?: number | null
  keterangan?: string | null
  status?: BackendStatus | null
  created_at?: string | null
  updated_at?: string | null
}

export interface DataMataPelajaranListParams {
  q?: string
  status?: BackendStatus
  kode_unit?: string
  kelompok_mapel?: string
  per_page?: number
  page?: number
}

export interface DataMataPelajaranPayload {
  kode_mapel: string
  nama_mapel: string
  kode_unit?: string | null
  kelompok_mapel?: string | null
  urutan?: number | null
  keterangan?: string | null
  status?: BackendStatus | null
}

export interface DataMataPelajaranPaginationMeta {
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
  [key: string]: unknown
}

export interface DataMataPelajaranListApiResponse extends DataMataPelajaranPaginationMeta {
  data: DataMataPelajaranApiItem[] | string
}

export interface DataMataPelajaranMutationApiResponse {
  message: string
  data: DataMataPelajaranApiItem | string
}

export interface DataMataPelajaranShowApiResponse {
  data: DataMataPelajaranApiItem | string
}

export interface DataMataPelajaranDeleteApiResponse {
  message: string
}

export interface DataMataPelajaranImportErrorRow {
  line: number
  errors: string[]
}

export interface DataMataPelajaranImportSummary {
  inserted?: number
  updated?: number
  failed?: number
  error_rows?: DataMataPelajaranImportErrorRow[]
  affected_mapel?: DataMataPelajaranApiItem[]
  [key: string]: unknown
}

export interface DataMataPelajaranImportApiResponse {
  message: string
  data: DataMataPelajaranImportSummary
}

const MATA_PELAJARAN_BASE_PATH = "/akademik/mata-pelajaran"

const extractList = (payload: unknown): DataMataPelajaranApiItem[] => {
  const source = payload as { data?: unknown; items?: unknown }

  if (Array.isArray(source?.data)) return source.data as DataMataPelajaranApiItem[]
  if (Array.isArray(payload)) return payload as DataMataPelajaranApiItem[]
  if (Array.isArray(source?.items)) return source.items as DataMataPelajaranApiItem[]

  return []
}

const extractItem = (payload: unknown): DataMataPelajaranApiItem => {
  const source = payload as { data?: unknown }

  if (source?.data && typeof source.data === "object" && !Array.isArray(source.data)) {
    return source.data as DataMataPelajaranApiItem
  }

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload as DataMataPelajaranApiItem
  }

  return {}
}

const normalizePayload = (payload: DataMataPelajaranPayload): DataMataPelajaranPayload => ({
  kode_mapel: payload.kode_mapel.trim().toUpperCase(),
  nama_mapel: payload.nama_mapel.trim(),
  kode_unit: payload.kode_unit ? payload.kode_unit.trim().toUpperCase() : null,
  kelompok_mapel: payload.kelompok_mapel ? payload.kelompok_mapel.trim() : null,
  urutan: payload.urutan ? Number(payload.urutan) : null,
  keterangan: payload.keterangan?.trim() || null,
  status: payload.status || null,
})

export const dataMataPelajaranService = {
  async getAll(
    params?: DataMataPelajaranListParams,
  ): Promise<{ data: DataMataPelajaranApiItem[]; meta: DataMataPelajaranPaginationMeta }> {
    const response = await api.get<DataMataPelajaranListApiResponse>(MATA_PELAJARAN_BASE_PATH, { params })

    return {
      data: extractList(response.data),
      meta: response.data,
    }
  },

  async getById(id: number): Promise<DataMataPelajaranApiItem> {
    const response = await api.get<DataMataPelajaranShowApiResponse>(`${MATA_PELAJARAN_BASE_PATH}/${id}`)
    return extractItem(response.data)
  },

  async create(payload: DataMataPelajaranPayload): Promise<DataMataPelajaranApiItem> {
    await getCsrfToken()

    const response = await api.post<DataMataPelajaranMutationApiResponse>(
      MATA_PELAJARAN_BASE_PATH,
      normalizePayload(payload),
    )
    return extractItem(response.data)
  },

  async update(id: number, payload: Partial<DataMataPelajaranPayload>): Promise<DataMataPelajaranApiItem> {
    await getCsrfToken()

    const response = await api.put<DataMataPelajaranMutationApiResponse>(`${MATA_PELAJARAN_BASE_PATH}/${id}`, payload)
    return extractItem(response.data)
  },

  async remove(id: number): Promise<DataMataPelajaranDeleteApiResponse> {
    await getCsrfToken()

    const response = await api.delete<DataMataPelajaranDeleteApiResponse>(`${MATA_PELAJARAN_BASE_PATH}/${id}`)
    return response.data || { message: "Data mata pelajaran berhasil dihapus." }
  },

  async importFile(file: File): Promise<DataMataPelajaranImportApiResponse> {
    await getCsrfToken()

    const formData = new FormData()
    formData.append("file", file)

    const response = await api.post<DataMataPelajaranImportApiResponse>(`${MATA_PELAJARAN_BASE_PATH}/import`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    return response.data
  },

  async exportCsv(params?: Omit<DataMataPelajaranListParams, "per_page" | "page">): Promise<Blob> {
    const response = await api.get(`${MATA_PELAJARAN_BASE_PATH}/export`, {
      params,
      responseType: "blob",
    })

    return response.data
  },

  async downloadImportTemplate(): Promise<Blob> {
    const response = await api.get(`${MATA_PELAJARAN_BASE_PATH}/import-template`, {
      responseType: "blob",
    })

    return response.data
  },
}
