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

export interface CancelSesiPayload {
  keterangan?: string
}

export interface AdminBukaSesiPayload {
  id_jadwal: number
  tanggal?: string
  id_petugas_hadir?: number
  status_kehadiran?: "HADIR" | "IZIN" | "SAKIT" | "ALFA"
  menit_terlambat?: number
  catat_absensi_pengajar?: boolean
  keterangan?: string
}

export interface AdminUpsertAbsensiPengajarPayload {
  id_petugas: number
  status_kehadiran: "HADIR" | "IZIN" | "SAKIT" | "ALFA"
  menit_terlambat?: number
  keterangan?: string
}

export interface AdminUpsertAbsensiSantriPayload {
  absensi: Array<{
    nomor_induk: string
    status_kehadiran: "HADIR" | "IZIN" | "SAKIT" | "ALFA"
    keterangan?: string
  }>
}

export interface LogAktivitasItem {
  id_log_aktivitas: number
  id_petugas: number
  jenis_aksi: string
  modul: string
  deskripsi: string
  ip_address?: string
  user_agent?: string
  created_at: string
  nama_admin?: string
}

export interface LogAuditItem {
  id_log: number
  tabel_terkait: string
  id_record: number
  field_diubah: string
  nilai_lama: string
  nilai_baru: string
  alasan_perubahan: string
  diubah_oleh: number
  diubah_pada: string
  ip_address?: string
  nama_admin?: string
}

export interface LogAktivitasResponse {
  status: string
  log_aktivitas: LogAktivitasItem[]
  log_audit: LogAuditItem[]
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

  async cancel(id: number, payload?: CancelSesiPayload) {
    const response = await api.post<{ data?: unknown }>(`${SESI_ABSENSI_BASE_PATH}/${id}/cancel`, payload)
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

  // --- Admin Endpoints ---

  async adminBukaSesi(payload: AdminBukaSesiPayload) {
    const response = await api.post<{ data?: SesiAbsensiApiItem }>(`${SESI_ABSENSI_BASE_PATH}/admin/buka-sesi`, payload)
    return response.data
  },

  async adminUpsertAbsensiPengajar(idSesi: number, payload: AdminUpsertAbsensiPengajarPayload) {
    const response = await api.put<{ data?: unknown }>(`${SESI_ABSENSI_BASE_PATH}/${idSesi}/admin/absensi-petugas`, payload)
    return response.data
  },

  async adminDeleteAbsensiPengajar(idSesi: number, idPetugas: number) {
    const response = await api.delete(`${SESI_ABSENSI_BASE_PATH}/${idSesi}/admin/absensi-petugas`, {
      data: { id_petugas: idPetugas }
    })
    return response.data
  },

  async adminUpsertAbsensiSantri(idSesi: number, payload: AdminUpsertAbsensiSantriPayload) {
    const response = await api.put<{ data?: unknown }>(`${SESI_ABSENSI_BASE_PATH}/${idSesi}/admin/absensi-santri`, payload)
    return response.data
  },

  async adminDeleteAbsensiSantri(idSesi: number, nomorInduk: string) {
    const response = await api.delete(`${SESI_ABSENSI_BASE_PATH}/${idSesi}/admin/absensi-santri`, {
      data: { nomor_induk: nomorInduk }
    })
    return response.data
  },

  async adminGetBelumDiabsen(params?: { tanggal?: string; kode_unit?: string; kode_kelas?: string; tahun_ajaran?: string }) {
    const response = await api.get<{ data: any[] }>(`${SESI_ABSENSI_BASE_PATH}/admin/belum-diabsen`, { params })
    return response.data.data
  },

  async adminGetLogAktivitas(params?: { tahun_ajaran?: string }) {
    const response = await api.get<LogAktivitasResponse>(`${SESI_ABSENSI_BASE_PATH}/admin/log-aktivitas`, { params })
    return response.data
  },

  /** Endpoint konsolidasi admin presensi-guru: ganti 5 request terpisah (petugas, jadwal, unit, kelas, tahun_ajaran) dengan 1 call. */
  async adminPresensiGuruInit(): Promise<{
    petugas: any[]
    jadwal: any[]
    unit: any[]
    kelas: any[]
    tahun_ajaran: any[]
  }> {
    const response = await api.get(`${SESI_ABSENSI_BASE_PATH}/admin/presensi-guru/init`)
    return response.data
  },

  /** Endpoint konsolidasi admin presensi-santri: ganti 3 request terpisah (unit, kelas, tahun_ajaran) dengan 1 call. */
  async adminPresensiSantriInit(): Promise<{
    unit: any[]
    kelas: any[]
    tahun_ajaran: any[]
  }> {
    const response = await api.get(`${SESI_ABSENSI_BASE_PATH}/admin/presensi-santri/init`)
    return response.data
  },

  /** Endpoint konsolidasi: ganti 4 request terpisah (jadwal, petugas, tahun_ajaran, sesi_hari_ini) dengan 1 call. */
  async guruPanelInit(params?: Record<string, string>): Promise<{
    jadwal: any[]
    petugas: any[]
    tahun_ajaran: any[]
    sesi_hari_ini: any[]
  }> {
    const response = await api.get(`${SESI_ABSENSI_BASE_PATH}/guru-panel/init`, { params })
    return response.data
  },

  // --- Export URL Helpers ---

  getExportSantriUrl(format: 'pdf' | 'excel', params?: Record<string, string>) {
    const query = new URLSearchParams({ format, ...params }).toString()
    return `${api.defaults.baseURL}${SESI_ABSENSI_BASE_PATH}/rekap/santri/export?${query}`
  },

  getExportKelasUrl(format: 'pdf' | 'excel', params?: Record<string, string>) {
    const query = new URLSearchParams({ format, ...params }).toString()
    return `${api.defaults.baseURL}${SESI_ABSENSI_BASE_PATH}/rekap/kelas/export?${query}`
  },

  getExportPetugasUrl(format: 'pdf' | 'excel', params?: Record<string, string>) {
    const query = new URLSearchParams({ format, ...params }).toString()
    return `${api.defaults.baseURL}${SESI_ABSENSI_BASE_PATH}/rekap/petugas/export?${query}`
  },
}
