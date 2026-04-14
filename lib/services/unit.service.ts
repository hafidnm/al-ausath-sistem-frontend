import api, { getCsrfToken } from "../axios"

export type BackendStatus = "AKTIF" | "NONAKTIF"

export interface DataUnitApiItem {
  id_unit?: number
  id?: number
  kode_unit?: string
  nama_unit?: string
  nomor_urut?: number
  keterangan?: string | null
  status?: BackendStatus
  status_ppdb?: BackendStatus
  created_at?: string
  updated_at?: string
  kelas_count?: number
  jumlah_kelas?: number
  santri_count?: number
  jumlah_santri?: number
}

export interface DataUnitListParams {
  q?: string
  status?: BackendStatus
  status_ppdb?: BackendStatus
  per_page?: number
  page?: number
}

export interface DataUnitPayload {
  kode_unit: string
  nama_unit: string
  nomor_urut?: number | null
  keterangan?: string | null
  status?: BackendStatus
  status_ppdb?: BackendStatus
}

export interface DataUnitPaginationMeta {
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
  [key: string]: unknown
}

export interface DataUnitListApiResponse extends DataUnitPaginationMeta {
  data: DataUnitApiItem[]
}

export interface DataUnitMutationApiResponse {
  message: string
  data: DataUnitApiItem
}

export interface DataUnitDeleteApiResponse {
  message: string
}

export interface DataUnitImportErrorRow {
  line: number
  errors: string[]
}

export interface DataUnitImportSummary {
  inserted: number
  updated: number
  failed: number
  error_rows: DataUnitImportErrorRow[]
  affected_units?: DataUnitApiItem[]
}

export interface DataUnitImportApiResponse {
  message: string
  data: DataUnitImportSummary
}

export interface DataUnitShowApiResponse {
  data: DataUnitApiItem | string
}

const UNIT_BASE_PATH = "/akademik/unit"

const extractList = (payload: any): DataUnitApiItem[] => {
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  return []
}

const extractItem = (payload: any): DataUnitApiItem => {
  if (payload?.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    return payload.data
  }

  if (payload?.data && (typeof payload.data === "string" || typeof payload.data === "number")) {
    return {}
  }

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload
  }

  return {}
}

const normalizePayload = (payload: DataUnitPayload): DataUnitPayload => ({
  kode_unit: payload.kode_unit.trim().toUpperCase(),
  nama_unit: payload.nama_unit.trim(),
  nomor_urut: payload.nomor_urut ?? null,
  keterangan: payload.keterangan?.trim() || null,
  status: payload.status,
  status_ppdb: payload.status_ppdb,
})

export const dataUnitService = {
  async getAll(params?: DataUnitListParams): Promise<{ data: DataUnitApiItem[]; meta: DataUnitPaginationMeta }> {
    const response = await api.get<DataUnitListApiResponse>(UNIT_BASE_PATH, { params })
    return {
      data: extractList(response.data),
      meta: response.data,
    }
  },

  async getById(id: number): Promise<DataUnitApiItem> {
    const response = await api.get<DataUnitShowApiResponse>(`${UNIT_BASE_PATH}/${id}`)
    return extractItem(response.data)
  },

  async create(payload: DataUnitPayload): Promise<DataUnitApiItem> {
    await getCsrfToken()

    const response = await api.post<DataUnitMutationApiResponse>(UNIT_BASE_PATH, normalizePayload(payload))
    return extractItem(response.data)
  },

  async update(id: number, payload: Partial<DataUnitPayload>): Promise<DataUnitApiItem> {
    await getCsrfToken()

    const response = await api.put<DataUnitMutationApiResponse>(`${UNIT_BASE_PATH}/${id}`, payload)
    return extractItem(response.data)
  },

  async remove(id: number): Promise<DataUnitDeleteApiResponse> {
    await getCsrfToken()

    const response = await api.delete<DataUnitDeleteApiResponse>(`${UNIT_BASE_PATH}/${id}`)
    return response.data || { message: "Data unit berhasil dihapus." }
  },

  async importFile(file: File): Promise<DataUnitImportApiResponse> {
    await getCsrfToken()

    const formData = new FormData()
    formData.append("file", file)

    const response = await api.post<DataUnitImportApiResponse>(`${UNIT_BASE_PATH}/import`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data
  },

  async exportExcel(params?: Omit<DataUnitListParams, "per_page" | "page">): Promise<Blob> {
    const response = await api.get(`${UNIT_BASE_PATH}/export`, {
      params,
      responseType: "blob",
    })
    return response.data
  },

  // Backward compatibility alias
  async exportCsv(params?: Omit<DataUnitListParams, "per_page" | "page">): Promise<Blob> {
    return this.exportExcel(params)
  },
}
