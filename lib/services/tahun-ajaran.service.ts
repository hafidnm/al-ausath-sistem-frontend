import api, { getCsrfToken } from "../axios"

export type BackendYearStatus = "AKTIF" | "NONAKTIF"

export interface TahunAjaranApiItem {
  id_tahun_ajaran?: number
  id?: number
  kode_tahun?: string
  nama_tahun?: string
  keterangan?: string | null
  status?: BackendYearStatus
  is_deleted?: boolean | null
  created_at?: string | null
  updated_at?: string | null
  deleted_at?: string | null
  jumlah_kelas?: number
  jumlah_santri?: number
}

export interface TahunAjaranListParams {
  q?: string
  status?: BackendYearStatus
  per_page?: number
  page?: number
}

export interface TahunAjaranPayload {
  kode_tahun: string
  nama_tahun: string
  keterangan?: string | null
  status?: BackendYearStatus
}

export interface TahunAjaranPaginationMeta {
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
  [key: string]: unknown
}

export interface TahunAjaranListApiResponse extends TahunAjaranPaginationMeta {
  data: TahunAjaranApiItem[] | string
}

export interface TahunAjaranMutationApiResponse {
  message: string
  data: TahunAjaranApiItem | string
}

export interface TahunAjaranShowApiResponse {
  data: TahunAjaranApiItem | string
}

export interface TahunAjaranDeleteApiResponse {
  message: string
}

export interface TahunAjaranImportErrorRow {
  line: number
  errors: string[]
}

export interface TahunAjaranImportSummary {
  inserted: number
  updated: number
  failed: number
  error_rows: TahunAjaranImportErrorRow[]
  affected_tahun_ajaran?: TahunAjaranApiItem[]
}

export interface TahunAjaranImportApiResponse {
  message: string
  data: TahunAjaranImportSummary
}

const TAHUN_AJARAN_BASE_PATH = "/akademik/tahun-ajaran"

const extractList = (payload: unknown): TahunAjaranApiItem[] => {
  const source = payload as { data?: unknown; items?: unknown }

  if (Array.isArray(source?.data)) return source.data as TahunAjaranApiItem[]
  if (Array.isArray(payload)) return payload as TahunAjaranApiItem[]
  if (Array.isArray(source?.items)) return source.items as TahunAjaranApiItem[]

  return []
}

const extractItem = (payload: unknown): TahunAjaranApiItem => {
  const source = payload as { data?: unknown }

  if (source?.data && typeof source.data === "object" && !Array.isArray(source.data)) {
    return source.data as TahunAjaranApiItem
  }

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload as TahunAjaranApiItem
  }

  return {}
}

const normalizePayload = (payload: TahunAjaranPayload): TahunAjaranPayload => ({
  kode_tahun: payload.kode_tahun.trim().toUpperCase(),
  nama_tahun: payload.nama_tahun.trim(),
  keterangan: payload.keterangan?.trim() || null,
  status: payload.status,
})

export const tahunAjaranService = {
  async getAll(
    params?: TahunAjaranListParams,
  ): Promise<{ data: TahunAjaranApiItem[]; meta: TahunAjaranPaginationMeta }> {
    const response = await api.get<TahunAjaranListApiResponse>(TAHUN_AJARAN_BASE_PATH, { params })

    return {
      data: extractList(response.data),
      meta: response.data,
    }
  },

  async getById(id: number): Promise<TahunAjaranApiItem> {
    const response = await api.get<TahunAjaranShowApiResponse>(`${TAHUN_AJARAN_BASE_PATH}/${id}`)
    return extractItem(response.data)
  },

  async create(payload: TahunAjaranPayload): Promise<TahunAjaranApiItem> {
    await getCsrfToken()

    const response = await api.post<TahunAjaranMutationApiResponse>(
      TAHUN_AJARAN_BASE_PATH,
      normalizePayload(payload),
    )

    return extractItem(response.data)
  },

  async update(id: number, payload: Partial<TahunAjaranPayload>): Promise<TahunAjaranApiItem> {
    await getCsrfToken()

    const response = await api.put<TahunAjaranMutationApiResponse>(`${TAHUN_AJARAN_BASE_PATH}/${id}`, payload)
    return extractItem(response.data)
  },

  async remove(id: number): Promise<TahunAjaranDeleteApiResponse> {
    await getCsrfToken()

    const response = await api.delete<TahunAjaranDeleteApiResponse>(`${TAHUN_AJARAN_BASE_PATH}/${id}`)
    return response.data || { message: "Data tahun ajaran berhasil dihapus." }
  },

  async importCsv(file: File): Promise<TahunAjaranImportApiResponse> {
    await getCsrfToken()

    const formData = new FormData()
    formData.append("file", file)

    const response = await api.post<TahunAjaranImportApiResponse>(`${TAHUN_AJARAN_BASE_PATH}/import`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    return response.data
  },

  async exportCsv(params?: Omit<TahunAjaranListParams, "per_page" | "page">): Promise<Blob> {
    const response = await api.get(`${TAHUN_AJARAN_BASE_PATH}/export`, {
      params,
      responseType: "blob",
    })

    return response.data
  },

  async downloadImportTemplate(): Promise<Blob> {
    const response = await api.get(`${TAHUN_AJARAN_BASE_PATH}/import-template`, {
      responseType: "blob",
    })

    return response.data
  },
}
