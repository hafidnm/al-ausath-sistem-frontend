import api, { getCsrfToken } from "../axios"

export type BackendAkunSantriStatus = "AKTIF" | "NONAKTIF"

export interface DataAkunSantriApiItem {
  id_akun_santri?: number
  id?: number
  nomor_induk?: string
  nama_akun?: string
  nama_lengkap?: string
  nama_unit?: string
  nama_kelas?: string
  tahun_ajaran?: string
  alamat_email?: string | null
  nomor_telepon?: string | null
  status?: BackendAkunSantriStatus | string | null
  last_login?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface DataAkunSantriListParams {
  q?: string
  kode_unit?: string
  kode_kelas?: string
  tahun_ajaran?: string
  status?: BackendAkunSantriStatus
  per_page?: number
  page?: number
}

export interface DataAkunSantriPayload {
  nomor_induk: string
  nama_akun?: string
  alamat_email?: string | null
  nomor_telepon?: string | null
  password?: string
  status?: BackendAkunSantriStatus | null
}

export interface DataAkunSantriSinkronPayload {
  kode_kelas?: string | null
  default_password?: string | null
  status?: BackendAkunSantriStatus | null
  nomor_induk?: string[] | null
}

export interface DataAkunSantriKelasTanpaAkunItem {
  id_kelas?: number
  kode_unit?: string
  kode_kelas?: string
  nama_kelas?: string
  tahun_ajaran?: string
  jumlah_santri_belum_akun?: number
}

export interface DataAkunSantriKelasTanpaAkunResponse {
  data: DataAkunSantriKelasTanpaAkunItem[]
}

export interface DataAkunSantriTanpaAkunItem {
  id_santri?: number
  nomor_induk?: string
  nama_lengkap_santri?: string
  kode_kelas?: string
  alamat_email?: string | null
  nomor_telepon?: string | null
}

export interface DataAkunSantriTanpaAkunResponse {
  data: DataAkunSantriTanpaAkunItem[]
}

export interface DataAkunSantriPaginationMeta {
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
  [key: string]: unknown
}

export interface DataAkunSantriListApiResponse extends DataAkunSantriPaginationMeta {
  data: DataAkunSantriApiItem[] | string
}

export interface DataAkunSantriMutationApiResponse {
  message: string
  data: DataAkunSantriApiItem | string
}

export interface DataAkunSantriShowApiResponse {
  data: DataAkunSantriApiItem | string
}

export interface DataAkunSantriDeleteApiResponse {
  message: string
}

const AKUN_SANTRI_BASE_PATH = "/akademik/akun-santri"

const extractList = (payload: unknown): DataAkunSantriApiItem[] => {
  const source = payload as { data?: unknown; items?: unknown }

  if (Array.isArray(source?.data)) return source.data as DataAkunSantriApiItem[]
  if (Array.isArray(payload)) return payload as DataAkunSantriApiItem[]
  if (Array.isArray(source?.items)) return source.items as DataAkunSantriApiItem[]

  return []
}

const extractItem = (payload: unknown): DataAkunSantriApiItem => {
  const source = payload as { data?: unknown }

  if (source?.data && typeof source.data === "object" && !Array.isArray(source.data)) {
    return source.data as DataAkunSantriApiItem
  }

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload as DataAkunSantriApiItem
  }

  return {}
}

const normalizePayload = (payload: DataAkunSantriPayload): DataAkunSantriPayload => ({
  nomor_induk: payload.nomor_induk.trim(),
  nama_akun: payload.nama_akun?.trim() || undefined,
  alamat_email: payload.alamat_email?.trim() || null,
  nomor_telepon: payload.nomor_telepon?.trim() || null,
  password: payload.password?.trim() || undefined,
  status: payload.status || "AKTIF",
})

const normalizePartialPayload = (payload: Partial<DataAkunSantriPayload>): Partial<DataAkunSantriPayload> => {
  const normalized = { ...payload }

  if (typeof normalized.nomor_induk === "string") normalized.nomor_induk = normalized.nomor_induk.trim()
  if (typeof normalized.nama_akun === "string") normalized.nama_akun = normalized.nama_akun.trim()
  if (typeof normalized.alamat_email === "string") normalized.alamat_email = normalized.alamat_email.trim() || null
  if (typeof normalized.nomor_telepon === "string") normalized.nomor_telepon = normalized.nomor_telepon.trim() || null
  if (typeof normalized.password === "string") normalized.password = normalized.password.trim()

  return normalized
}

export const dataAkunSantriService = {
  async getAll(
    params?: DataAkunSantriListParams,
  ): Promise<{ data: DataAkunSantriApiItem[]; meta: DataAkunSantriPaginationMeta }> {
    const response = await api.get<DataAkunSantriListApiResponse>(AKUN_SANTRI_BASE_PATH, { params })

    return {
      data: extractList(response.data),
      meta: response.data,
    }
  },

  async create(payload: DataAkunSantriPayload): Promise<DataAkunSantriApiItem> {
    await getCsrfToken()

    const response = await api.post<DataAkunSantriMutationApiResponse>(AKUN_SANTRI_BASE_PATH, normalizePayload(payload))
    return extractItem(response.data)
  },

  async getById(id: number): Promise<DataAkunSantriApiItem> {
    const response = await api.get<DataAkunSantriShowApiResponse>(`${AKUN_SANTRI_BASE_PATH}/${id}`)
    return extractItem(response.data)
  },

  async update(id: number, payload: Partial<DataAkunSantriPayload>): Promise<DataAkunSantriApiItem> {
    await getCsrfToken()

    const response = await api.put<DataAkunSantriMutationApiResponse>(`${AKUN_SANTRI_BASE_PATH}/${id}`, normalizePartialPayload(payload))
    return extractItem(response.data)
  },

  async remove(id: number): Promise<DataAkunSantriDeleteApiResponse> {
    await getCsrfToken()

    const response = await api.delete<DataAkunSantriDeleteApiResponse>(`${AKUN_SANTRI_BASE_PATH}/${id}`)
    return response.data || { message: "Data akun santri berhasil dihapus." }
  },

  async sinkronMassal(): Promise<{ message: string; data?: unknown }> {
    await getCsrfToken()

    const response = await api.post<{ message: string; data?: unknown }>(`${AKUN_SANTRI_BASE_PATH}/sinkron`)
    return response.data
  },

  async sinkronMassalWithPayload(payload?: DataAkunSantriSinkronPayload): Promise<{ message: string; data?: unknown }> {
    await getCsrfToken()

    const body: DataAkunSantriSinkronPayload = {
      kode_kelas: payload?.kode_kelas || null,
      default_password: payload?.default_password?.trim() || null,
      status: payload?.status || null,
      nomor_induk: payload?.nomor_induk && payload.nomor_induk.length > 0 ? payload.nomor_induk : null,
    }

    const response = await api.post<{ message: string; data?: unknown }>(`${AKUN_SANTRI_BASE_PATH}/sinkron`, body)
    return response.data
  },

  async getKelasTanpaAkun(): Promise<DataAkunSantriKelasTanpaAkunItem[]> {
    const response = await api.get<DataAkunSantriKelasTanpaAkunResponse>(`${AKUN_SANTRI_BASE_PATH}/kelas-tanpa-akun`)
    return Array.isArray(response.data?.data) ? response.data.data : []
  },

  async getSantriTanpaAkunByKelas(kodeKelas: string): Promise<DataAkunSantriTanpaAkunItem[]> {
    const response = await api.get<DataAkunSantriTanpaAkunResponse>(`${AKUN_SANTRI_BASE_PATH}/santri-tanpa-akun`, {
      params: { kode_kelas: kodeKelas },
    })
    return Array.isArray(response.data?.data) ? response.data.data : []
  },

  async exportExcel(params?: Omit<DataAkunSantriListParams, "per_page" | "page">): Promise<Blob> {
    const response = await api.get(`${AKUN_SANTRI_BASE_PATH}/export`, {
      params,
      responseType: "blob",
    })

    return response.data
  },
}
