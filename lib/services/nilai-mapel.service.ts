import api from "../axios"

export interface NilaiMapelTugasItem {
  nilai: number
  jenis: "PR" | "TUGAS_PENGGANTI" | "MODUL_KOMPETENSI"
}

export interface NilaiMapelUlanganItem {
  nilai: number
  soal_disusun_pengajar: boolean
  diawasi_pengajar: boolean
}

export interface NilaiMapelItem {
  id: number
  nomor_induk: string
  nama_santri?: string
  kode_mapel: string
  mapel?: string
  kode_kelas: string
  tahun_ajaran: string
  semester: number
  tugas: NilaiMapelTugasItem[]
  ulangan: NilaiMapelUlanganItem[]
  ujian_akhir: number
  nilai_rapor_tampil?: number
  flag_warna_rapor?: boolean
  status_kkm?: string
  keterangan?: string
  updatedAt?: string
}

export interface GetNilaiMapelParams {
  nomor_induk: string
  kode_mapel?: string
  kode_kelas?: string
  tahun_ajaran?: string
  semester?: string
  per_page?: string
}

export interface ShowNilaiMapelParams {
  nomor_induk: string
  tahun_ajaran?: string
  semester?: string
}

export interface UpsertNilaiMapelPayload {
  nomor_induk: string
  kode_mapel: string
  kode_kelas: string
  tahun_ajaran: string
  semester: number
  id_petugas_input?: number
  keterangan?: string
  tugas: NilaiMapelTugasItem[]
  ulangan: NilaiMapelUlanganItem[]
  ujian_akhir: number
}

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
      (typeof obj.nama === "string" && obj.nama)
      || (typeof obj.nama_mapel === "string" && obj.nama_mapel)
      || (typeof obj.nama_santri === "string" && obj.nama_santri)
      || (typeof obj.label === "string" && obj.label)
      || (typeof obj.value === "string" && obj.value)
      || undefined
    )
  }

  return undefined
}

const toBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value === 1
  if (typeof value === "string") {
    const lower = value.toLowerCase()
    return ["1", "true", "ya", "yes"].includes(lower)
  }
  return false
}

const extractList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

const normalizeTugasItem = (raw: any): NilaiMapelTugasItem => ({
  nilai: toNumber(raw?.nilai, 0),
  jenis: (toText(raw?.jenis) as NilaiMapelTugasItem["jenis"]) || "PR",
})

const normalizeUlanganItem = (raw: any): NilaiMapelUlanganItem => ({
  nilai: toNumber(raw?.nilai, 0),
  soal_disusun_pengajar: toBoolean(raw?.soal_disusun_pengajar),
  diawasi_pengajar: toBoolean(raw?.diawasi_pengajar),
})

const normalizeNilaiMapelItem = (raw: any): NilaiMapelItem => {
  const rawId = raw?.id ?? raw?.id_nilai ?? raw?.id_nilai_mapel ?? raw?.nilai_mapel_id

  const tugasRaw = Array.isArray(raw?.tugas) ? raw.tugas : []
  const ulanganRaw = Array.isArray(raw?.ulangan) ? raw.ulangan : []

  return {
    id: toNumber(rawId, -1),
    nomor_induk: toText(raw?.nomor_induk ?? raw?.santri?.nomor_induk) ?? "",
    nama_santri: toText(raw?.nama_santri ?? raw?.santri?.nama_lengkap ?? raw?.santri?.nama),
    kode_mapel: toText(raw?.kode_mapel ?? raw?.mapel?.kode_mapel) ?? "",
    mapel: toText(raw?.mapel?.nama_mapel ?? raw?.mapel ?? raw?.nama_mapel),
    kode_kelas: toText(raw?.kode_kelas ?? raw?.kelas?.kode_kelas) ?? "",
    tahun_ajaran: toText(raw?.tahun_ajaran) ?? "",
    semester: toNumber(raw?.semester, 0),
    tugas: tugasRaw.map(normalizeTugasItem),
    ulangan: ulanganRaw.map(normalizeUlanganItem),
    ujian_akhir: toNumber(raw?.ujian_akhir, 0),
    nilai_rapor_tampil: raw?.nilai_rapor_tampil != null ? toNumber(raw?.nilai_rapor_tampil, 0) : undefined,
    flag_warna_rapor: raw?.flag_warna_rapor != null ? toBoolean(raw?.flag_warna_rapor) : undefined,
    status_kkm: toText(raw?.status_kkm),
    keterangan: toText(raw?.keterangan),
    updatedAt: toText(raw?.updated_at ?? raw?.updatedAt),
  }
}

export const nilaiMapelService = {
  async getAll(params: GetNilaiMapelParams): Promise<NilaiMapelItem[]> {
    const response = await api.get("/akademik/nilai-mapel", { params })
    return extractList(response.data).map(normalizeNilaiMapelItem)
  },

  async getByKodeMapel(kodeMapel: string, params: ShowNilaiMapelParams): Promise<NilaiMapelItem> {
    const response = await api.get(`/akademik/nilai-mapel/${encodeURIComponent(kodeMapel)}`, { params })
    const raw = response.data?.data ?? response.data
    return normalizeNilaiMapelItem(raw)
  },

  async upsert(payload: UpsertNilaiMapelPayload): Promise<NilaiMapelItem> {
    const response = await api.post("/akademik/nilai-mapel", payload)
    const raw = response.data?.data ?? response.data
    return normalizeNilaiMapelItem(raw)
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/akademik/nilai-mapel/${id}`)
  },
}
