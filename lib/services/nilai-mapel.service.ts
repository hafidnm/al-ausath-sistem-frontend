import api from "../axios"
import { mataPelajaranService } from "./mata-pelajaran.service"
import { santriService } from "./santri.service"

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
  flag_warna_rapor_raw?: string
  status_ketuntasan?: string
  status_kkm?: string
  nilai_kkm?: number
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

export interface GetKelasIndexParams {
  kode_kelas: string
  kode_mapel: string
  tahun_ajaran: string
  semester: number
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

export interface BulkUpsertNilaiMapelItem {
  nomor_induk: string
  keterangan?: string
  tugas: NilaiMapelTugasItem[]
  ulangan: NilaiMapelUlanganItem[]
  ujian_akhir: number
}

export interface BulkUpsertNilaiMapelPayload {
  kode_mapel: string
  kode_kelas: string
  tahun_ajaran: string
  semester: number
  id_petugas_input?: number
  items: BulkUpsertNilaiMapelItem[]
}

export interface BulkUpsertNilaiMapelResult {
  message: string
  saved_count: number
  errors: { nomor_induk: string; error: string }[]
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

const normalizeRaporFlag = (value: unknown): { isRed?: boolean; raw?: string } => {
  if (value == null) return {}

  if (typeof value === "boolean" || typeof value === "number") {
    return { isRed: toBoolean(value), raw: toText(value) }
  }

  if (typeof value === "string") {
    const lower = value.trim().toLowerCase()

    if (lower.includes("merah")) {
      return { isRed: true, raw: value }
    }

    if (lower.includes("hitam")) {
      return { isRed: false, raw: value }
    }

    if (["1", "true", "ya", "yes"].includes(lower)) {
      return { isRed: true, raw: value }
    }

    if (["0", "false", "tidak", "no"].includes(lower)) {
      return { isRed: false, raw: value }
    }

    return { isRed: false, raw: value }
  }

  return { isRed: toBoolean(value), raw: toText(value) }
}

const extractList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

const sanitizeKey = (value: unknown): string => toText(value)?.trim().toLowerCase() ?? ""

const santriNameCache = new Map<string, string>()
const mapelNameCache = new Map<string, string>()

const resolveSantriName = async (nomorInduk: string): Promise<string | undefined> => {
  const key = sanitizeKey(nomorInduk)
  if (!key) return undefined

  const cached = santriNameCache.get(key)
  if (cached) return cached

  const results = await santriService.search(nomorInduk, 10)
  const exact = results.find((item) => sanitizeKey(item.nomor_induk) === key)
  const name = exact?.nama_lengkap ?? results[0]?.nama_lengkap

  if (name) {
    santriNameCache.set(key, name)
  }

  return name
}

const resolveMapelName = async (kodeMapel: string): Promise<string | undefined> => {
  const key = sanitizeKey(kodeMapel)
  if (!key) return undefined

  const cached = mapelNameCache.get(key)
  if (cached) return cached

  const results = await mataPelajaranService.search(kodeMapel, 10)
  const exact = results.find((item) => sanitizeKey(item.kode_mapel) === key)
  const name = exact?.nama_mapel ?? results[0]?.nama_mapel

  if (name) {
    mapelNameCache.set(key, name)
  }

  return name
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
  const raporFlag = normalizeRaporFlag(raw?.flag_warna_rapor)

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
    ujian_akhir: toNumber(raw?.ujian_akhir ?? raw?.nilai_uas ?? raw?.nilai_ujian_akhir, 0),
    nilai_rapor_tampil: raw?.nilai_rapor_tampil != null ? toNumber(raw?.nilai_rapor_tampil, 0) : undefined,
    flag_warna_rapor: raporFlag.isRed,
    flag_warna_rapor_raw: raporFlag.raw,
    status_ketuntasan: toText(raw?.status_ketuntasan ?? raw?.status_kkm ?? raw?.perhitungan?.kkm?.status),
    status_kkm: toText(raw?.status_kkm ?? raw?.status_ketuntasan),
    nilai_kkm: raw?.nilai_kkm != null ? toNumber(raw?.nilai_kkm, 0) : toNumber(raw?.perhitungan?.kkm?.nilai_kkm, 0) || undefined,
    keterangan: toText(raw?.keterangan),
    updatedAt: toText(raw?.updated_at ?? raw?.updatedAt),
  }
}

const enrichNilaiMapelItem = async (item: NilaiMapelItem): Promise<NilaiMapelItem> => {
  const [namaSantri, namaMapel] = await Promise.all([
    item.nama_santri ? Promise.resolve(item.nama_santri) : resolveSantriName(item.nomor_induk),
    item.mapel ? Promise.resolve(item.mapel) : resolveMapelName(item.kode_mapel),
  ])

  return {
    ...item,
    nama_santri: namaSantri ?? item.nama_santri,
    mapel: namaMapel ?? item.mapel,
  }
}

export const nilaiMapelService = {
  async getAll(params: GetNilaiMapelParams): Promise<NilaiMapelItem[]> {
    const response = await api.get("/akademik/nilai-mapel", { params })
    const items = extractList(response.data).map(normalizeNilaiMapelItem)
    return Promise.all(items.map(enrichNilaiMapelItem))
  },

  async getKelasIndex(params: GetKelasIndexParams): Promise<any[]> {
    const response = await api.get('/akademik/nilai-mapel/kelas', { params })
    return response.data.data
  },

  async getByKodeMapel(kodeMapel: string, params: ShowNilaiMapelParams): Promise<NilaiMapelItem> {
    const response = await api.get(`/akademik/nilai-mapel/${encodeURIComponent(kodeMapel)}`, { params })
    const raw = response.data?.data ?? response.data
    return enrichNilaiMapelItem(normalizeNilaiMapelItem(raw))
  },

  async upsert(payload: UpsertNilaiMapelPayload): Promise<NilaiMapelItem> {
    const response = await api.post("/akademik/nilai-mapel", payload)
    const rawData = response.data?.data ?? response.data
    const raw = {
      ...(rawData && typeof rawData === "object" ? rawData : {}),
      perhitungan: response.data?.perhitungan ?? rawData?.perhitungan,
    }
    return enrichNilaiMapelItem(normalizeNilaiMapelItem(raw))
  },

  async update(id: number, payload: UpsertNilaiMapelPayload): Promise<NilaiMapelItem> {
    const response = await api.put(`/akademik/nilai-mapel/${id}`, payload)
    const rawData = response.data?.data ?? response.data
    const raw = {
      ...(rawData && typeof rawData === "object" ? rawData : {}),
      perhitungan: response.data?.perhitungan ?? rawData?.perhitungan,
    }
    return enrichNilaiMapelItem(normalizeNilaiMapelItem(raw))
  },

  async bulkUpsert(payload: BulkUpsertNilaiMapelPayload): Promise<BulkUpsertNilaiMapelResult> {
    const response = await api.post("/akademik/nilai-mapel/bulk", payload)
    return response.data as BulkUpsertNilaiMapelResult
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/akademik/nilai-mapel/${id}`)
  },
}
