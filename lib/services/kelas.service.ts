import api, { getCsrfToken } from "../axios"

export type BackendKelasStatus = "AKTIF" | "NONAKTIF"

export interface DataKelasApiItem {
  id_kelas?: number
  id?: number
  kode_unit?: string
  kode_kelas?: string
  nama_kelas?: string
  nama_jurusan?: string | null
  tahun_ajaran?: string
  status?: BackendKelasStatus | null
  status_ppdb?: BackendKelasStatus | null
  deleted_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  jumlah_santri?: number
  jumlah_santri_aktif?: number
  jumlah_santri_lulus?: number
  jumlah_santri_keluar?: number
  unit?: {
    kode_unit?: string
    nama_unit?: string
  } | null
  tahun_ajaran_relasi?: {
    kode_tahun?: string
    nama_tahun?: string
  } | null
  tahunAjaranRelasi?: {
    kode_tahun?: string
    nama_tahun?: string
  } | null
}

export interface DataKelasListParams {
  q?: string
  kode_unit?: string
  tahun_ajaran?: string
  status?: BackendKelasStatus
  status_ppdb?: BackendKelasStatus
  per_page?: number
  page?: number
}

export interface DataKelasTrashListParams {
  q?: string
  kode_unit?: string
  tahun_ajaran?: string
  deleted_from?: string
  deleted_to?: string
  per_page?: number
  page?: number
}

export interface DataKelasPayload {
  kode_unit: string
  kode_kelas: string
  nama_kelas: string
  nama_jurusan?: string | null
  tahun_ajaran: string
  status?: BackendKelasStatus | null
  status_ppdb?: BackendKelasStatus | null
}

export interface DataKelasPaginationMeta {
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
  summary_global?: DataKelasSummaryGlobal
  [key: string]: unknown
}

export interface DataKelasSummaryGlobal {
  total_kelas?: number
  total_santri?: number
  total_santri_aktif?: number
  total_santri_lulus?: number
  total_santri_keluar?: number
}

export interface DataKelasListApiResponse extends DataKelasPaginationMeta {
  data: DataKelasApiItem[] | string
}

export interface DataKelasMutationApiResponse {
  message: string
  data: DataKelasApiItem | string
}

export interface DataKelasShowApiResponse {
  data: DataKelasApiItem | string
}

export interface DataKelasDeleteApiResponse {
  message: string
}

export interface DataKelasDependencySummary {
  data_santri?: number
  data_kelas_mapel?: number
  data_nilai_siswa?: number
  data_raport?: number
  ppdb_pendaftar?: number
  total?: number
  [key: string]: unknown
}

export interface DataKelasDependencySummaryApiResponse {
  message?: string
  data:
    | DataKelasDependencySummary
    | {
        id_kelas?: number
        kode_kelas?: string
        is_deleted?: boolean
        dependencies?: DataKelasDependencySummary
        can_force_delete?: boolean
      }
}

export interface DataKelasImportErrorRow {
  line: number
  errors: string[]
}

export interface DataKelasImportSummary {
  inserted?: number
  updated?: number
  failed?: number
  error_rows?: DataKelasImportErrorRow[]
  affected_kelas?: DataKelasApiItem[]
  [key: string]: unknown
}

export interface DataKelasImportApiResponse {
  message: string
  data: DataKelasImportSummary
}

const KELAS_BASE_PATH = "/akademik/kelas"

const extractList = (payload: unknown): DataKelasApiItem[] => {
  const source = payload as { data?: unknown; items?: unknown }

  if (Array.isArray(source?.data)) return source.data as DataKelasApiItem[]
  if (Array.isArray(payload)) return payload as DataKelasApiItem[]
  if (Array.isArray(source?.items)) return source.items as DataKelasApiItem[]

  return []
}

const extractItem = (payload: unknown): DataKelasApiItem => {
  const source = payload as { data?: unknown }

  if (source?.data && typeof source.data === "object" && !Array.isArray(source.data)) {
    return source.data as DataKelasApiItem
  }

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload as DataKelasApiItem
  }

  return {}
}

const normalizePayload = (payload: DataKelasPayload): DataKelasPayload => ({
  kode_unit: payload.kode_unit.trim().toUpperCase(),
  kode_kelas: payload.kode_kelas.trim().toUpperCase(),
  nama_kelas: payload.nama_kelas.trim(),
  nama_jurusan: payload.nama_jurusan?.trim() || null,
  tahun_ajaran: payload.tahun_ajaran.trim(),
  status: payload.status || null,
  status_ppdb: payload.status_ppdb || null,
})

export const dataKelasService = {
  async getAll(
    params?: DataKelasListParams,
  ): Promise<{ data: DataKelasApiItem[]; meta: DataKelasPaginationMeta }> {
    const response = await api.get<DataKelasListApiResponse>(KELAS_BASE_PATH, { params })

    return {
      data: extractList(response.data),
      meta: response.data,
    }
  },

  async getById(id: number): Promise<DataKelasApiItem> {
    const response = await api.get<DataKelasShowApiResponse>(`${KELAS_BASE_PATH}/${id}`)
    return extractItem(response.data)
  },

  async create(payload: DataKelasPayload): Promise<DataKelasApiItem> {
    await getCsrfToken()

    const response = await api.post<DataKelasMutationApiResponse>(KELAS_BASE_PATH, normalizePayload(payload))
    return extractItem(response.data)
  },

  async update(id: number, payload: Partial<DataKelasPayload>): Promise<DataKelasApiItem> {
    await getCsrfToken()

    const response = await api.put<DataKelasMutationApiResponse>(`${KELAS_BASE_PATH}/${id}`, payload)
    return extractItem(response.data)
  },

  async remove(id: number): Promise<DataKelasDeleteApiResponse> {
    await getCsrfToken()

    const response = await api.delete<DataKelasDeleteApiResponse>(`${KELAS_BASE_PATH}/${id}`)
    return response.data || { message: "Data kelas dipindahkan ke trash." }
  },

  async getTrash(
    params?: DataKelasTrashListParams,
  ): Promise<{ data: DataKelasApiItem[]; meta: DataKelasPaginationMeta }> {
    const response = await api.get<DataKelasListApiResponse>(`${KELAS_BASE_PATH}/trash`, { params })

    return {
      data: extractList(response.data),
      meta: response.data,
    }
  },

  async restore(id: number): Promise<DataKelasMutationApiResponse> {
    await getCsrfToken()

    const response = await api.post<DataKelasMutationApiResponse>(`${KELAS_BASE_PATH}/${id}/restore`)
    return response.data
  },

  async forceDelete(id: number): Promise<DataKelasDeleteApiResponse> {
    await getCsrfToken()

    const response = await api.delete<DataKelasDeleteApiResponse>(`${KELAS_BASE_PATH}/${id}/force`)
    return response.data || { message: "Data kelas berhasil dihapus permanen." }
  },

  async getDependencySummary(id: number): Promise<DataKelasDependencySummary> {
    const response = await api.get<DataKelasDependencySummaryApiResponse>(`${KELAS_BASE_PATH}/${id}/dependency-summary`)

    const payload = response.data?.data as {
      dependencies?: DataKelasDependencySummary
    } & DataKelasDependencySummary

    if (payload?.dependencies && typeof payload.dependencies === "object") {
      return payload.dependencies
    }

    return payload || {}
  },

  async importFile(file: File): Promise<DataKelasImportApiResponse> {
    await getCsrfToken()

    const formData = new FormData()
    formData.append("file", file)

    const response = await api.post<DataKelasImportApiResponse>(`${KELAS_BASE_PATH}/import`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    return response.data
  },

  async exportExcel(params?: Omit<DataKelasListParams, "per_page" | "page">): Promise<Blob> {
    const response = await api.get(`${KELAS_BASE_PATH}/export`, {
      params,
      responseType: "blob",
    })

    return response.data
  },

  async downloadImportTemplate(): Promise<Blob> {
    const response = await api.get(`${KELAS_BASE_PATH}/import-template`, {
      responseType: "blob",
    })

    return response.data
  },
}
