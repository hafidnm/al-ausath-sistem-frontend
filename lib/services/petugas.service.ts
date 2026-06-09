import api, { getCsrfToken } from "../axios"

export type BackendPetugasStatus = "AKTIF" | "NONAKTIF"

export interface DataPetugasApiItem {
  id_petugas?: number
  id?: number
  nomor_induk?: string | null
  nama_lengkap?: string
  peran_akun?: string[]
  alamat_email?: string
  nomor_telepon?: string | null
  status?: BackendPetugasStatus
  last_login?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface DataPetugasListParams {
  q?: string
  status?: BackendPetugasStatus
  peran_akun?: string
  per_page?: number
  page?: number
}

export interface DataPetugasPayload {
  nomor_induk?: string | null
  nama_lengkap: string
  peran_akun: string[]
  alamat_email: string
  nomor_telepon?: string | null
  password?: string
  status?: BackendPetugasStatus
}

export interface DataPetugasPaginationMeta {
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
  [key: string]: unknown
}

export interface DataPetugasListApiResponse extends DataPetugasPaginationMeta {
  data: DataPetugasApiItem[] | string
}

export interface DataPetugasMutationApiResponse {
  message: string
  data: DataPetugasApiItem | string
}

export interface DataPetugasShowApiResponse {
  data: DataPetugasApiItem | string
}

export interface DataPetugasDeleteApiResponse {
  message: string
}

export interface DataPetugasImportErrorRow {
  line: number
  errors: string[]
}

export interface DataPetugasImportSummary {
  inserted?: number
  updated?: number
  failed?: number
  error_rows?: DataPetugasImportErrorRow[]
  [key: string]: unknown
}

export interface DataPetugasImportApiResponse {
  message: string
  data: DataPetugasImportSummary
}

const PETUGAS_BASE_PATH = "/akademik/petugas"

const extractList = (payload: unknown): DataPetugasApiItem[] => {
  const source = payload as { data?: unknown; items?: unknown }

  if (Array.isArray(source?.data)) return source.data as DataPetugasApiItem[]
  if (Array.isArray(payload)) return payload as DataPetugasApiItem[]
  if (Array.isArray(source?.items)) return source.items as DataPetugasApiItem[]

  return []
}

const extractItem = (payload: unknown): DataPetugasApiItem => {
  const source = payload as { data?: unknown }

  if (source?.data && typeof source.data === "object" && !Array.isArray(source.data)) {
    return source.data as DataPetugasApiItem
  }

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload as DataPetugasApiItem
  }

  return {}
}

const normalizePayload = (payload: DataPetugasPayload): DataPetugasPayload => ({
  nomor_induk: payload.nomor_induk?.trim() || null,
  nama_lengkap: payload.nama_lengkap.trim(),
  // Flatten nested arrays defensively: [["Petugas Admin"]] => ["Petugas Admin"]
  peran_akun: (Array.isArray(payload.peran_akun) ? payload.peran_akun.flat() as string[] : [payload.peran_akun]).filter(Boolean),
  alamat_email: payload.alamat_email.trim(),
  nomor_telepon: payload.nomor_telepon?.trim() || null,
  password: payload.password,
  status: payload.status,
})

export const dataPetugasService = {
  async getAll(
    params?: DataPetugasListParams,
  ): Promise<{ data: DataPetugasApiItem[]; meta: DataPetugasPaginationMeta }> {
    const response = await api.get<DataPetugasListApiResponse>(PETUGAS_BASE_PATH, { params })

    return {
      data: extractList(response.data),
      meta: response.data,
    }
  },

  async getById(id: number): Promise<DataPetugasApiItem> {
    const response = await api.get<DataPetugasShowApiResponse>(`${PETUGAS_BASE_PATH}/${id}`)
    return extractItem(response.data)
  },

  async create(payload: DataPetugasPayload): Promise<DataPetugasApiItem> {
    await getCsrfToken()

    const response = await api.post<DataPetugasMutationApiResponse>(PETUGAS_BASE_PATH, normalizePayload(payload))
    return extractItem(response.data)
  },

  async update(id: number, payload: Partial<DataPetugasPayload>): Promise<DataPetugasApiItem> {
    await getCsrfToken()

    const response = await api.put<DataPetugasMutationApiResponse>(`${PETUGAS_BASE_PATH}/${id}`, payload)
    return extractItem(response.data)
  },

  async remove(id: number): Promise<DataPetugasDeleteApiResponse> {
    await getCsrfToken()

    const response = await api.delete<DataPetugasDeleteApiResponse>(`${PETUGAS_BASE_PATH}/${id}`)
    return response.data || { message: "Data petugas berhasil dihapus." }
  },

  async getPeranAkunOptions(): Promise<string[]> {
    const response = await api.get<{ data?: string[] }>(`${PETUGAS_BASE_PATH}/peran-akun-options`)
    return Array.isArray(response.data?.data) ? response.data.data : []
  },

  async importFile(file: File): Promise<DataPetugasImportApiResponse> {
    await getCsrfToken()

    const formData = new FormData()
    formData.append("file", file)

    const response = await api.post<DataPetugasImportApiResponse>(`${PETUGAS_BASE_PATH}/import`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    return response.data
  },

  async exportExcel(params?: Omit<DataPetugasListParams, "per_page" | "page">): Promise<Blob> {
    const response = await api.get(`${PETUGAS_BASE_PATH}/export`, {
      params,
      responseType: "blob",
    })

    return response.data
  },

  async downloadImportTemplate(): Promise<Blob> {
    const response = await api.get(`${PETUGAS_BASE_PATH}/import-template`, {
      responseType: "blob",
    })

    return response.data
  },
}
