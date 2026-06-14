import api, { getCsrfToken } from "../axios"

export type BackendStatus = "AKTIF" | "NONAKTIF"

export interface DataJadwalPembelajaranApiItem {
  kelas_mapel: any
  id_jadwal_pembelajaran?: number
  id?: number
  id_jadwal?: number
  id_kelas_mapel?: number
  kode_kelas?: string
  nama_kelas?: string
  kode_mapel?: string
  nama_mapel?: string
  id_petugas?: number | null
  tahun_ajaran?: string
  semester?: number | string
  hari?: string
  jam_mulai?: string
  jam_selesai?: string
  ruangan?: string | null
  ruang?: string | null
  keterangan?: string | null
  status?: BackendStatus | null
  created_at?: string | null
  updated_at?: string | null
  kelasMapel?: {
    id_kelas_mapel?: number
    kode_kelas?: string
    nama_kelas?: string
    kode_mapel?: string
    nama_mapel?: string
    petugas?: {
      id_petugas?: number
      nama_lengkap?: string
    } | null
    kelas?: {
      kode_kelas?: string
      nama_kelas?: string
    } | null
    mataPelajaran?: {
      kode_mapel?: string
      nama_mapel?: string
    } | null
    mata_pelajaran?: {
      kode_mapel?: string
      nama_mapel?: string
    } | null
  } | null
  kelas?: {
    kode_kelas?: string
    nama_kelas?: string
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

export interface DataJadwalPembelajaranListParams {
  q?: string
  kode_unit?: string
  kode_kelas?: string
  kode_mapel?: string
  id_kelas_mapel?: number
  id_petugas?: number
  tahun_ajaran?: string
  semester?: number
  hari?: string
  status?: BackendStatus
  per_page?: number
  page?: number
}

export interface DataJadwalPembelajaranPayload {
  id_kelas_mapel: number
  id_petugas?: number | null
  tahun_ajaran: string
  semester: number
  hari: string
  jam_mulai: string
  jam_selesai: string
  ruangan?: string | null
  keterangan?: string | null
  status?: BackendStatus | null
}

export interface DataJadwalPembelajaranPaginationMeta {
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
  [key: string]: unknown
}

export interface DataJadwalPembelajaranListApiResponse extends DataJadwalPembelajaranPaginationMeta {
  data: DataJadwalPembelajaranApiItem[] | string
}

export interface DataJadwalPembelajaranMutationApiResponse {
  message: string
  data: DataJadwalPembelajaranApiItem | string
}

export interface DataJadwalPembelajaranShowApiResponse {
  data: DataJadwalPembelajaranApiItem | string
}

export interface DataJadwalPembelajaranDeleteApiResponse {
  message: string
}

export interface DataJadwalPembelajaranImportErrorRow {
  line: number
  errors: string[]
}

export interface DataJadwalPembelajaranImportSummary {
  inserted?: number
  updated?: number
  failed?: number
  error_rows?: DataJadwalPembelajaranImportErrorRow[]
  affected_jadwal_pembelajaran?: DataJadwalPembelajaranApiItem[]
  [key: string]: unknown
}

export interface DataJadwalPembelajaranImportApiResponse {
  message: string
  data: DataJadwalPembelajaranImportSummary
}

const JADWAL_PEMBELAJARAN_BASE_PATH = "/akademik/jadwal-pembelajaran"

const extractList = (payload: unknown): DataJadwalPembelajaranApiItem[] => {
  const source = payload as { data?: unknown; items?: unknown }

  if (Array.isArray(source?.data)) return source.data as DataJadwalPembelajaranApiItem[]
  if (Array.isArray(payload)) return payload as DataJadwalPembelajaranApiItem[]
  if (Array.isArray(source?.items)) return source.items as DataJadwalPembelajaranApiItem[]

  return []
}

const extractItem = (payload: unknown): DataJadwalPembelajaranApiItem => {
  const source = payload as { data?: unknown }

  if (source?.data && typeof source.data === "object" && !Array.isArray(source.data)) {
    return source.data as DataJadwalPembelajaranApiItem
  }

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload as DataJadwalPembelajaranApiItem
  }

  return {}
}

const normalizePayload = (payload: DataJadwalPembelajaranPayload): DataJadwalPembelajaranPayload => ({
  id_kelas_mapel: Number(payload.id_kelas_mapel),
  id_petugas: payload.id_petugas ?? null,
  tahun_ajaran: payload.tahun_ajaran.trim(),
  semester: Number(payload.semester) || 1,
  hari: payload.hari.trim(),
  jam_mulai: payload.jam_mulai.trim(),
  jam_selesai: payload.jam_selesai.trim(),
  ruangan: payload.ruangan?.trim() || null,
  keterangan: payload.keterangan?.trim() || null,
  status: payload.status || null,
})

export const dataJadwalPembelajaranService = {
  async getAll(
    params?: DataJadwalPembelajaranListParams,
  ): Promise<{ data: DataJadwalPembelajaranApiItem[]; meta: DataJadwalPembelajaranPaginationMeta }> {
    const response = await api.get<DataJadwalPembelajaranListApiResponse>(JADWAL_PEMBELAJARAN_BASE_PATH, { params })

    return {
      data: extractList(response.data),
      meta: response.data,
    }
  },

  async getByNomorInduk(
    nomorInduk: string,
    params?: Omit<DataJadwalPembelajaranListParams, "id_kelas_mapel" | "id_petugas">,
  ): Promise<{ data: DataJadwalPembelajaranApiItem[]; meta: DataJadwalPembelajaranPaginationMeta }> {
    const response = await api.get<DataJadwalPembelajaranListApiResponse>(JADWAL_PEMBELAJARAN_BASE_PATH, {
      params: {
        ...params,
        nomor_induk: nomorInduk,
      },
    })

    return {
      data: extractList(response.data),
      meta: response.data,
    }
  },

  async getById(id: number): Promise<DataJadwalPembelajaranApiItem> {
    const response = await api.get<DataJadwalPembelajaranShowApiResponse>(`${JADWAL_PEMBELAJARAN_BASE_PATH}/${id}`)
    return extractItem(response.data)
  },

  async create(payload: DataJadwalPembelajaranPayload): Promise<DataJadwalPembelajaranApiItem> {
    await getCsrfToken()

    const response = await api.post<DataJadwalPembelajaranMutationApiResponse>(
      JADWAL_PEMBELAJARAN_BASE_PATH,
      normalizePayload(payload),
    )

    return extractItem(response.data)
  },

  async update(id: number, payload: Partial<DataJadwalPembelajaranPayload>): Promise<DataJadwalPembelajaranApiItem> {
    await getCsrfToken()

    const response = await api.put<DataJadwalPembelajaranMutationApiResponse>(`${JADWAL_PEMBELAJARAN_BASE_PATH}/${id}`, payload)
    return extractItem(response.data)
  },

  async remove(id: number): Promise<DataJadwalPembelajaranDeleteApiResponse> {
    await getCsrfToken()

    const response = await api.delete<DataJadwalPembelajaranDeleteApiResponse>(`${JADWAL_PEMBELAJARAN_BASE_PATH}/${id}`)
    return response.data || { message: "Data jadwal pembelajaran berhasil dihapus." }
  },

  async importFile(file: File): Promise<DataJadwalPembelajaranImportApiResponse> {
    await getCsrfToken()

    const formData = new FormData()
    formData.append("file", file)

    const response = await api.post<DataJadwalPembelajaranImportApiResponse>(`${JADWAL_PEMBELAJARAN_BASE_PATH}/import`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    return response.data
  },

  async exportCsv(params?: Omit<DataJadwalPembelajaranListParams, "per_page" | "page">): Promise<Blob> {
    const response = await api.get(`${JADWAL_PEMBELAJARAN_BASE_PATH}/export`, {
      params,
      responseType: "blob",
    })

    return response.data
  },

  async downloadImportTemplate(): Promise<Blob> {
    const response = await api.get(`${JADWAL_PEMBELAJARAN_BASE_PATH}/import-template`, {
      responseType: "blob",
    })

    return response.data
  },
}
