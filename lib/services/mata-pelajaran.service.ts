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

export interface MataPelajaranItem {
  id: number
  kode_mapel: string
  nama_mapel?: string
  kelompok_mapel?: string
  kode_unit?: string
  status?: string
  updatedAt?: string
}

export interface GetMataPelajaranParams {
  q?: string
  per_page?: string
  kode_unit?: string
  kelompok_mapel?: string
  status?: string
}

const MATA_PELAJARAN_BASE_PATH = "/akademik/mata-pelajaran"
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "")
const MAPEL_ENDPOINT = API_BASE_URL.endsWith("/api")
  ? "/akademik/mata-pelajaran"
  : "/api/akademik/mata-pelajaran"
const MAPEL_FALLBACK_ENDPOINT = MAPEL_ENDPOINT === "/akademik/mata-pelajaran"
  ? "/api/akademik/mata-pelajaran"
  : "/akademik/mata-pelajaran"

const toNumber = (value: unknown, fallback = 0): number => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const toText = (value: unknown): string | undefined => {
  if (value == null) return undefined
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>
    return (
      (typeof obj.nama_mapel === "string" && obj.nama_mapel)
      || (typeof obj.nama === "string" && obj.nama)
      || (typeof obj.kode_mapel === "string" && obj.kode_mapel)
      || (typeof obj.label === "string" && obj.label)
      || (typeof obj.value === "string" && obj.value)
      || undefined
    )
  }

  return undefined
}

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

const extractMapelList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

const normalizeMapelItem = (raw: any): MataPelajaranItem => ({
  id: toNumber(raw?.id ?? raw?.id_mapel ?? raw?.mapel_id, -1),
  kode_mapel: toText(raw?.kode_mapel) ?? "",
  nama_mapel: toText(raw?.nama_mapel ?? raw?.nama),
  kelompok_mapel: toText(raw?.kelompok_mapel ?? raw?.kelompok),
  kode_unit: toText(raw?.kode_unit ?? raw?.unit),
  status: toText(raw?.status),
  updatedAt: toText(raw?.updated_at ?? raw?.updatedAt),
})

export const mataPelajaranService = {
  async getAll(params?: GetMataPelajaranParams): Promise<MataPelajaranItem[]> {
    try {
      const response = await api.get(MAPEL_ENDPOINT, { params })
      return extractMapelList(response.data).map(normalizeMapelItem)
    } catch (error: any) {
      const status = error?.response?.status
      if (status !== 404) {
        throw error
      }

      const response = await api.get(MAPEL_FALLBACK_ENDPOINT, { params })
      return extractMapelList(response.data).map(normalizeMapelItem)
    }
  },

  async search(query: string, limit: number = 20): Promise<MataPelajaranItem[]> {
    try {
      const response = await api.get(MAPEL_ENDPOINT, {
        params: {
          q: query,
          per_page: String(limit),
          status: "AKTIF",
        },
      })
      return extractMapelList(response.data).map(normalizeMapelItem)
    } catch (error: any) {
      const status = error?.response?.status
      if (status !== 404) {
        throw error
      }

      const response = await api.get(MAPEL_FALLBACK_ENDPOINT, {
        params: {
          q: query,
          per_page: String(limit),
          status: "AKTIF",
        },
      })
      return extractMapelList(response.data).map(normalizeMapelItem)
    }
  },

  async getById(id: number): Promise<MataPelajaranItem> {
    const primaryEndpoint = `${MAPEL_ENDPOINT}/${id}`
    const fallbackEndpoint = `${MAPEL_FALLBACK_ENDPOINT}/${id}`

    try {
      const response = await api.get(primaryEndpoint)
      const raw = response.data?.data ?? response.data
      return normalizeMapelItem(raw)
    } catch (error: any) {
      const status = error?.response?.status
      if (status !== 404) {
        throw error
      }

      const response = await api.get(fallbackEndpoint)
      const raw = response.data?.data ?? response.data
      return normalizeMapelItem(raw)
    }
  },
}
