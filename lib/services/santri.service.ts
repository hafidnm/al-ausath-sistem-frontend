import api, { getCsrfToken } from "../axios"

export type BackendSantriStatus = "AKTIF" | "CUTI" | "LULUS" | "KELUAR"

export interface DataSantriApiItem {
  id_santri?: number
  id?: number
  nomor_induk?: string
  nama_lengkap_santri?: string
  kode_kelas?: string
  status?: string | null
  tahun_masuk?: number | null
  tahun_lulus?: number | null
  jenis_kelamin?: string | null
  tempat_lahir?: string | null
  tanggal_lahir?: string | null
  agama?: string | null
  berat_badan?: number | null
  tinggi_badan?: number | null
  gol_darah?: string | null
  provinsi?: string | null
  kota_kabupaten?: string | null
  kecamatan?: string | null
  kelurahan?: string | null
  alamat_tinggal?: string | null
  nomor_telepon?: string | null
  alamat_email?: string | null
  nama_ayah_kandung?: string | null
  nama_ibu_kandung?: string | null
  nama_wali?: string | null
  kelas?: {
    kode_kelas?: string
    nama_kelas?: string
    kode_unit?: string
    tahun_ajaran?: string
  } | null
  akun?: {
    id_akun_santri?: number
    nama_akun?: string
    status?: string
  } | null
}

export interface DataSantriListParams {
  q?: string
  status?: string
  kode_kelas?: string
  kode_unit?: string
  tahun_ajaran?: string
  per_page?: number
  page?: number
}

export interface DataSantriTrashListParams {
  q?: string
  status?: string
  kode_kelas?: string
  kode_unit?: string
  tahun_ajaran?: string
  deleted_from?: string
  deleted_to?: string
  per_page?: number
  page?: number
}

export interface SantriItem {
  id: number
  nomor_induk: string
  nama_lengkap?: string
  kelas?: string
  kode_kelas?: string
  kode_unit?: string
  jenjang?: string
  updatedAt?: string
}

export interface GetSantriParams {
  q?: string
  per_page?: string
  status?: string
  kode_kelas?: string
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "")
const SANTRI_ENDPOINT = API_BASE_URL.endsWith("/api")
  ? "/master/data-santri"
  : "/api/master/data-santri"
const SANTRI_FALLBACK_ENDPOINT = SANTRI_ENDPOINT === "/master/data-santri"
  ? "/api/master/data-santri"
  : "/master/data-santri"
const SANTRI_OPTIONS_ENDPOINT = API_BASE_URL.endsWith("/api")
  ? "/master/data-santri/options"
  : "/api/master/data-santri/options"
const SANTRI_OPTIONS_FALLBACK_ENDPOINT = SANTRI_OPTIONS_ENDPOINT === "/master/data-santri/options"
  ? "/api/master/data-santri/options"
  : "/master/data-santri/options"

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
      (typeof obj.nama_lengkap === "string" && obj.nama_lengkap)
      || (typeof obj.nama === "string" && obj.nama)
      || (typeof obj.label === "string" && obj.label)
      || (typeof obj.value === "string" && obj.value)
      || undefined
    )
  }

  return undefined
}

export interface DataSantriPayload {
  nomor_induk: string
  nama_lengkap_santri: string
  kode_kelas: string
  status?: string | null
  tahun_masuk?: number | null
  tahun_lulus?: number | null
  jenis_kelamin?: string | null
  tempat_lahir?: string | null
  tanggal_lahir?: string | null
  agama?: string | null
  berat_badan?: number | null
  tinggi_badan?: number | null
  gol_darah?: string | null
  provinsi?: string | null
  kota_kabupaten?: string | null
  kecamatan?: string | null
  kelurahan?: string | null
  alamat_tinggal?: string | null
  nomor_telepon?: string | null
  alamat_email?: string | null
  nama_ayah_kandung?: string | null
  nama_ibu_kandung?: string | null
  nama_wali?: string | null
}

export interface DataSantriBuatAkunPayload {
  nama_akun?: string
  password: string
  status?: "AKTIF" | "NONAKTIF"
}

export interface DataSantriPindahKelasPayload {
  ids: number[]
  kode_kelas: string
}

export interface DataSantriPaginationMeta {
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
  [key: string]: unknown
}

export interface DataSantriListApiResponse extends DataSantriPaginationMeta {
  data: DataSantriApiItem[] | string
}

export interface DataSantriMutationApiResponse {
  message: string
  data: DataSantriApiItem | string
}

export interface DataSantriShowApiResponse {
  data: DataSantriApiItem | string
}

export interface DataSantriDeleteApiResponse {
  message: string
}

export interface DataSantriDependencySummary {
  absensi_santri?: number
  data_akun_santri?: number
  pembayaran_spp?: number
  administrasi_bebas?: number
  spp_setting?: number
  total?: number
  [key: string]: unknown
}

export interface DataSantriDependencySummaryApiResponse {
  message?: string
  data:
    | DataSantriDependencySummary
    | {
        id_santri?: number
        nomor_induk?: string
        is_deleted?: boolean
        dependencies?: DataSantriDependencySummary
        can_force_delete?: boolean
      }
}

export interface DataSantriImportErrorRow {
  line: number
  errors: string[]
}

export interface DataSantriImportSummary {
  inserted?: number
  updated?: number
  failed?: number
  error_rows?: DataSantriImportErrorRow[]
  [key: string]: unknown
}

export interface DataSantriImportApiResponse {
  message: string
  data: DataSantriImportSummary
}

export interface DataSantriOptionsParams {
  q?: string
  limit?: number
}

export interface DataSantriOptionItem {
  id_santri?: number
  nomor_induk?: string
  nama_lengkap_santri?: string
  kode_kelas?: string
}

const SANTRI_BASE_PATH = "/akademik/santri"
const SANTRI_OPTIONS_PATH = "/master/data-santri/options"

const extractList = (payload: unknown): DataSantriApiItem[] => {
  const source = payload as { data?: unknown; items?: unknown }

  if (Array.isArray(source?.data)) return source.data as DataSantriApiItem[]
  if (Array.isArray(payload)) return payload as DataSantriApiItem[]
  if (Array.isArray(source?.items)) return source.items as DataSantriApiItem[]

  return []
}

const extractItem = (payload: unknown): DataSantriApiItem => {
  const source = payload as { data?: unknown }

  if (source?.data && typeof source.data === "object" && !Array.isArray(source.data)) {
    return source.data as DataSantriApiItem
  }

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload as DataSantriApiItem
  }

  return {}
}

const trimValue = (value?: string | null): string | null => {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const normalizePayload = (payload: DataSantriPayload): DataSantriPayload => ({
  nomor_induk: payload.nomor_induk.trim(),
  nama_lengkap_santri: payload.nama_lengkap_santri.trim(),
  kode_kelas: payload.kode_kelas.trim().toUpperCase(),
  status: trimValue(payload.status),
  tahun_masuk: payload.tahun_masuk ?? null,
  tahun_lulus: payload.tahun_lulus ?? null,
  jenis_kelamin: trimValue(payload.jenis_kelamin),
  tempat_lahir: trimValue(payload.tempat_lahir),
  tanggal_lahir: trimValue(payload.tanggal_lahir),
  agama: trimValue(payload.agama),
  berat_badan: payload.berat_badan ?? null,
  tinggi_badan: payload.tinggi_badan ?? null,
  gol_darah: trimValue(payload.gol_darah),
  provinsi: trimValue(payload.provinsi),
  kota_kabupaten: trimValue(payload.kota_kabupaten),
  kecamatan: trimValue(payload.kecamatan),
  kelurahan: trimValue(payload.kelurahan),
  alamat_tinggal: trimValue(payload.alamat_tinggal),
  nomor_telepon: trimValue(payload.nomor_telepon),
  alamat_email: trimValue(payload.alamat_email),
  nama_ayah_kandung: trimValue(payload.nama_ayah_kandung),
  nama_ibu_kandung: trimValue(payload.nama_ibu_kandung),
  nama_wali: trimValue(payload.nama_wali),
})

const normalizePartialPayload = (payload: Partial<DataSantriPayload>): Partial<DataSantriPayload> => {
  const normalized = { ...payload }

  if (typeof normalized.nomor_induk === "string") normalized.nomor_induk = normalized.nomor_induk.trim()
  if (typeof normalized.nama_lengkap_santri === "string") {
    normalized.nama_lengkap_santri = normalized.nama_lengkap_santri.trim()
  }
  if (typeof normalized.kode_kelas === "string") normalized.kode_kelas = normalized.kode_kelas.trim().toUpperCase()
  if (typeof normalized.status === "string") normalized.status = trimValue(normalized.status)

  return normalized
}

export const dataSantriService = {
  async getAll(
    params?: DataSantriListParams,
  ): Promise<{ data: DataSantriApiItem[]; meta: DataSantriPaginationMeta }> {
    const response = await api.get<DataSantriListApiResponse>(SANTRI_BASE_PATH, { params })

    return {
      data: extractList(response.data),
      meta: response.data,
    }
  },

  async getById(id: number): Promise<DataSantriApiItem> {
    const response = await api.get<DataSantriShowApiResponse>(`${SANTRI_BASE_PATH}/${id}`)
    return extractItem(response.data)
  },

  async create(payload: DataSantriPayload): Promise<DataSantriApiItem> {
    await getCsrfToken()

    const response = await api.post<DataSantriMutationApiResponse>(SANTRI_BASE_PATH, normalizePayload(payload))
    return extractItem(response.data)
  },

  async update(id: number, payload: Partial<DataSantriPayload>): Promise<DataSantriApiItem> {
    await getCsrfToken()

    const response = await api.put<DataSantriMutationApiResponse>(`${SANTRI_BASE_PATH}/${id}`, normalizePartialPayload(payload))
    return extractItem(response.data)
  },

  async remove(id: number): Promise<DataSantriDeleteApiResponse> {
    await getCsrfToken()

    const response = await api.delete<DataSantriDeleteApiResponse>(`${SANTRI_BASE_PATH}/${id}`)
    return response.data || { message: "Data santri berhasil dihapus." }
  },

  async getTrash(
    params?: DataSantriTrashListParams,
  ): Promise<{ data: DataSantriApiItem[]; meta: DataSantriPaginationMeta }> {
    const response = await api.get<DataSantriListApiResponse>(`${SANTRI_BASE_PATH}/trash`, { params })

    return {
      data: extractList(response.data),
      meta: response.data,
    }
  },

  async restore(id: number): Promise<DataSantriMutationApiResponse> {
    await getCsrfToken()

    const response = await api.post<DataSantriMutationApiResponse>(`${SANTRI_BASE_PATH}/${id}/restore`)
    return response.data
  },

  async forceDelete(id: number): Promise<DataSantriDeleteApiResponse> {
    await getCsrfToken()

    const response = await api.delete<DataSantriDeleteApiResponse>(`${SANTRI_BASE_PATH}/${id}/force`)
    return response.data || { message: "Data santri berhasil dihapus permanen." }
  },

  async getDependencySummary(id: number): Promise<DataSantriDependencySummary> {
    const response = await api.get<DataSantriDependencySummaryApiResponse>(`${SANTRI_BASE_PATH}/${id}/dependency-summary`)

    const payload = response.data?.data as {
      dependencies?: DataSantriDependencySummary
    } & DataSantriDependencySummary

    if (payload?.dependencies && typeof payload.dependencies === "object") {
      return payload.dependencies
    }

    return payload || {}
  },

  async createAccount(id: number, payload: DataSantriBuatAkunPayload): Promise<DataSantriMutationApiResponse> {
    await getCsrfToken()

    const response = await api.post<DataSantriMutationApiResponse>(`${SANTRI_BASE_PATH}/${id}/buat-akun`, payload)
    return response.data
  },

  async pindahKelas(payload: DataSantriPindahKelasPayload): Promise<{ message: string; data: unknown }> {
    await getCsrfToken()

    const response = await api.post<{ message: string; data: unknown }>(`${SANTRI_BASE_PATH}/pindah-kelas`, payload)
    return response.data
  },

  async bulkLulus(ids: number[], tahun_lulus: number): Promise<{ message: string; data: { total_terupdate: number; tahun_lulus: number } }> {
    await getCsrfToken()
    const response = await api.post(`${SANTRI_BASE_PATH}/bulk-lulus`, { ids, tahun_lulus })
    return response.data
  },

  async batalLulus(ids: number[]): Promise<{ message: string; data: { total_terupdate: number } }> {
    await getCsrfToken()
    const response = await api.post(`${SANTRI_BASE_PATH}/batal-lulus`, { ids })
    return response.data
  },

  async getOptions(params?: DataSantriOptionsParams): Promise<DataSantriOptionItem[]> {
    const response = await api.get<DataSantriOptionItem[]>(SANTRI_OPTIONS_PATH, { params })
    return Array.isArray(response.data) ? response.data : []
  },

  async importFile(file: File): Promise<DataSantriImportApiResponse> {
    await getCsrfToken()

    const formData = new FormData()
    formData.append("file", file)

    const response = await api.post<DataSantriImportApiResponse>(`${SANTRI_BASE_PATH}/import`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    return response.data
  },

  async exportExcel(params?: Omit<DataSantriListParams, "per_page" | "page">): Promise<Blob> {
    const response = await api.get(`${SANTRI_BASE_PATH}/export`, {
      params,
      responseType: "blob",
    })

    return response.data
  },

  async downloadImportTemplate(): Promise<Blob> {
    const response = await api.get(`${SANTRI_BASE_PATH}/import-template`, {
      responseType: "blob",
    })

    return response.data
  },
}

const extractSantriList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

const normalizeSantriItem = (raw: any): SantriItem => ({
  id: toNumber(raw?.id ?? raw?.id_santri ?? raw?.santri_id, -1),
  nomor_induk: toText(raw?.nomor_induk ?? raw?.nis) ?? "",
  nama_lengkap: toText(raw?.nama_lengkap_santri ?? raw?.nama_lengkap ?? raw?.nama),
  kelas: toText(raw?.kelas?.kode_kelas ?? raw?.kelas ?? raw?.kode_kelas),
  kode_kelas: toText(raw?.kode_kelas ?? raw?.kelas?.kode_kelas ?? raw?.kelas),
  kode_unit: toText(raw?.kode_unit ?? raw?.kelas?.kode_unit ?? raw?.unit?.kode_unit),
  jenjang: toText(raw?.jenjang),
  updatedAt: toText(raw?.updated_at ?? raw?.updatedAt),
})

export const santriService = {
  async getAll(params?: GetSantriParams): Promise<SantriItem[]> {
    try {
      const response = await api.get(SANTRI_ENDPOINT, { params })
      return extractSantriList(response.data).map(normalizeSantriItem)
    } catch (error: any) {
      const status = error?.response?.status
      if (status !== 404) {
        throw error
      }

      const response = await api.get(SANTRI_FALLBACK_ENDPOINT, { params })
      return extractSantriList(response.data).map(normalizeSantriItem)
    }
  },

  async search(query: string, limit: number = 10): Promise<SantriItem[]> {
    try {
      const response = await api.get(SANTRI_OPTIONS_ENDPOINT, {
        params: {
          q: query,
          limit,
        },
      })
      return extractSantriList(response.data).map(normalizeSantriItem)
    } catch (error: any) {
      const status = error?.response?.status
      if (status !== 404) {
        throw error
      }

      const response = await api.get(SANTRI_OPTIONS_FALLBACK_ENDPOINT, {
        params: {
          q: query,
          limit,
        },
      })
      return extractSantriList(response.data).map(normalizeSantriItem)
    }
  },

  async getById(id: number): Promise<SantriItem> {
    const primaryEndpoint = `${SANTRI_ENDPOINT}/${id}`
    const fallbackEndpoint = `${SANTRI_FALLBACK_ENDPOINT}/${id}`

    try {
      const response = await api.get(primaryEndpoint)
      const raw = response.data?.data ?? response.data
      return normalizeSantriItem(raw)
    } catch (error: any) {
      const status = error?.response?.status
      if (status !== 404) {
        throw error
      }

      const response = await api.get(fallbackEndpoint)
      const raw = response.data?.data ?? response.data
      return normalizeSantriItem(raw)
    }
  },
}
