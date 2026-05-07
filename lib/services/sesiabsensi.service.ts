import api from "../axios"

export interface SesiAbsensiApiItem {
  id?: number
  id_sesi_absensi?: number
  id_sesi?: number
  mapel?: string
  nama_mapel?: string
  mata_pelajaran?: string
  kelas?: string
  nama_kelas?: string
  kode_kelas?: string
  jenjang?: string
  hari?: string
  jam?: string
  jam_mulai?: string
  jam_selesai?: string
  jumlah_siswa?: number
  total_siswa?: number
  total_santri?: number
  id_jadwal?: number
  id_petugas_hadir?: number
  id_petugas_pengganti?: number | null
  tanggal?: string
  waktu_mulai?: string
  waktu_selesai?: string
  status_sesi?: string
  keterangan?: string
  is_validated?: boolean
  validated_by?: number | null
  validated_at?: string | null
  created_at?: string
  updated_at?: string
  jadwal?: Record<string, unknown>
  petugas_hadir?: Record<string, unknown>
  petugas_pengganti?: Record<string, unknown>
  absensi_pengajar?: Record<string, unknown>[]
  absensi_santri?: Record<string, unknown>[]
}

export interface SesiAbsensiListResponse {
  data?: SesiAbsensiApiItem[] | unknown
  items?: SesiAbsensiApiItem[] | unknown
}

export interface SesiAbsensiPaginatedResponse {
  data?: SesiAbsensiApiItem[]
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
}

export interface MulaiSesiPayload {
  id_jadwal: number
  tanggal?: string
  status_kehadiran: "HADIR" | "IZIN" | "SAKIT"
  keterangan?: string
}

export interface SetPenggantiPayload {
  id_petugas_pengganti: number
  status_kehadiran?: "IZIN" | "SAKIT"
  keterangan?: string
}

export interface InputAbsensiSantriPayload {
  absensi: Array<{
    nomor_induk: string
    status_kehadiran: "HADIR" | "IZIN" | "SAKIT" | "ALFA"
    keterangan?: string
  }>
}

export interface SelesaiSesiPayload {
  status_sesi?: "SELESAI" | "BATAL"
  keterangan?: string
}

const SESI_ABSENSI_BASE_PATH = "/akademik/sesi-absensi"

const extractList = (payload: unknown): SesiAbsensiApiItem[] => {
  const source = payload as { data?: unknown; items?: unknown }

  if (Array.isArray(source?.data)) return source.data as SesiAbsensiApiItem[]
  if (Array.isArray(source?.items)) return source.items as SesiAbsensiApiItem[]
  if (Array.isArray(payload)) return payload as SesiAbsensiApiItem[]

  return []
}

export const sesiAbsensiService = {
  async getAll(params?: Record<string, string | number | boolean>) {
    const response = await api.get<SesiAbsensiPaginatedResponse | SesiAbsensiListResponse>(SESI_ABSENSI_BASE_PATH, { params })
    return extractList(response.data)
  },

  async getById(id: number) {
    const response = await api.get<{ data?: SesiAbsensiApiItem }>(`${SESI_ABSENSI_BASE_PATH}/${id}`)
    return response.data?.data
  },

  async getAktif(params: { id_jadwal: number; tanggal: string }) {
    const response = await api.get<{ data?: SesiAbsensiApiItem }>(`${SESI_ABSENSI_BASE_PATH}/aktif`, { params })
    return response.data?.data
  },

  async mulai(payload: MulaiSesiPayload) {
    const response = await api.post<{ data?: SesiAbsensiApiItem }>(`${SESI_ABSENSI_BASE_PATH}/mulai`, payload)
    return response.data
  },

  async setPengganti(id: number, payload: SetPenggantiPayload) {
    const response = await api.post<{ data?: SesiAbsensiApiItem }>(`${SESI_ABSENSI_BASE_PATH}/${id}/set-pengganti`, payload)
    return response.data
  },

  async getDaftarSantri(id: number) {
    const response = await api.get<{ data?: unknown }>(`${SESI_ABSENSI_BASE_PATH}/${id}/santri`)
    return response.data?.data
  },

  async inputAbsensiSantri(id: number, payload: InputAbsensiSantriPayload) {
    const response = await api.post<{ data?: unknown }>(`${SESI_ABSENSI_BASE_PATH}/${id}/absensi-santri`, payload)
    return response.data
  },

  async selesai(id: number, payload?: SelesaiSesiPayload) {
    const response = await api.post<{ data?: unknown }>(`${SESI_ABSENSI_BASE_PATH}/${id}/selesai`, payload)
    return response.data
  },

  async rekapSantri(params?: Record<string, string | number | boolean>) {
    const response = await api.get(`${SESI_ABSENSI_BASE_PATH}/rekap/santri`, { params })
    return response.data
  },

  async rekapKelas(params?: Record<string, string | number | boolean>) {
    const response = await api.get(`${SESI_ABSENSI_BASE_PATH}/rekap/kelas`, { params })
    return response.data
  },

  async rekapPetugas(params?: Record<string, string | number | boolean>) {
    const response = await api.get(`${SESI_ABSENSI_BASE_PATH}/rekap/petugas`, { params })
    return response.data
  },
}
