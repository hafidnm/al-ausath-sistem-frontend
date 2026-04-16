import api from "../axios"

export interface RaporItem {
  id: number
  nomor_induk: string
  nama_santri?: string
  kode_kelas: string
  tahun_ajaran: string
  semester: number
  status?: string
  nilai_rata?: number
  ranking?: number
  catatan_wali?: string | null
  id_wali_kelas?: number | null
}

export interface RaporDetail extends RaporItem {
  nilai_mapel?: Array<{
    id_nilai?: number
    kode_mapel?: string
    mapel?: string
    nilai_harian?: number | string
    nilai_uts?: number | string
    nilai_uas?: number | string
    nilai_akhir_mapel?: number | string
    nilai_rapor_tampil?: number | string
    nilai?: number
    predikat?: string
    flag_warna_rapor?: string
    status_ketuntasan?: string
    status_kkm?: string
  }>
  nilai_akhlak?: Array<{
    aspek?: string
    nilai_angka?: number
    deskripsi?: string
  }>
  keseharian_kebersihan?: string | null
  keseharian_kerapian?: string | null
  keseharian_keterampilan?: string | null
}

export interface GetRaporParams {
  q?: string
  nama?: string
  status?: string
  nomor_induk?: string
  kode_kelas?: string
  tahun_ajaran?: string
  semester?: string
  include_nilai_mapel?: boolean
  per_page?: string
}

export interface GetRaporCatatanParams {
  nomor_induk: string
  tahun_ajaran: string
  semester: number
}

export interface GenerateRaporPayload extends GetRaporCatatanParams {}

export interface UpsertCatatanWaliPayload extends GetRaporCatatanParams {
  kode_kelas: string
  catatan_wali: string
  id_wali_kelas?: number
  keseharian_kebersihan?: string
  keseharian_kerapian?: string
  keseharian_keterampilan?: string
}

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toText = (value: unknown): string | undefined => {
  if (value == null) return undefined
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>
    return (
      (typeof obj.nama === "string" && obj.nama)
      || (typeof obj.nama_lengkap_santri === "string" && obj.nama_lengkap_santri)
      || (typeof obj.nama_lengkap === "string" && obj.nama_lengkap)
      || (typeof obj.nama_santri === "string" && obj.nama_santri)
      || (typeof obj.label === "string" && obj.label)
      || (typeof obj.value === "string" && obj.value)
      || undefined
    )
  }

  return undefined
}

const extractList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

const normalizeRaporItem = (raw: any): RaporItem => ({
  id: toNumber(raw?.id ?? raw?.id_rapor ?? raw?.rapor_id, -1),
  nomor_induk: toText(raw?.nomor_induk ?? raw?.santri?.nomor_induk ?? raw?.data_santri?.nomor_induk ?? raw?.nis) ?? "",
  nama_santri: toText(
    raw?.nama_santri
    ?? raw?.nama_lengkap_santri
    ?? raw?.nama
    ?? raw?.nama_lengkap
    ?? raw?.santri_nama
    ?? raw?.nama_siswa
    ?? raw?.siswa_nama
    ?? raw?.santri?.nama_lengkap_santri
    ?? raw?.santri?.nama_lengkap
    ?? raw?.santri?.nama
    ?? raw?.data_santri?.nama_lengkap_santri
    ?? raw?.data_santri?.nama_lengkap
    ?? raw?.data_santri?.nama
    ?? raw?.santri
    ?? raw?.siswa
  ),
  kode_kelas: toText(raw?.kode_kelas ?? raw?.kelas?.kode_kelas) ?? "",
  tahun_ajaran: toText(raw?.tahun_ajaran) ?? "",
  semester: toNumber(raw?.semester, 0),
  status: toText(raw?.status) ?? "DRAFT",
  nilai_rata:
    raw?.nilai_rata != null
      ? toNumber(raw?.nilai_rata, 0)
      : raw?.rata_rata != null
        ? toNumber(raw?.rata_rata, 0)
        : raw?.nilai_rata_rata != null
          ? toNumber(raw?.nilai_rata_rata, 0)
          : raw?.average != null
            ? toNumber(raw?.average, 0)
            : raw?.avg != null
              ? toNumber(raw?.avg, 0)
              : undefined,
  ranking: raw?.ranking != null ? toNumber(raw?.ranking, 0) : undefined,
  catatan_wali: raw?.catatan_wali != null ? toText(raw?.catatan_wali) ?? null : undefined,
  id_wali_kelas: raw?.id_wali_kelas != null ? toNumber(raw?.id_wali_kelas, 0) : undefined,
})

const normalizeRaporDetail = (raw: any): RaporDetail => {
  const rapor = normalizeRaporItem(raw)
  return {
    ...rapor,
    nilai_mapel: Array.isArray(raw?.nilai_mapel)
      ? raw.nilai_mapel.map((item: any) => ({
          id_nilai: item?.id_nilai != null ? toNumber(item?.id_nilai, 0) : undefined,
          kode_mapel: toText(item?.kode_mapel),
          mapel: toText(item?.mapel ?? item?.nama_mapel),
          nilai_harian: item?.nilai_harian != null ? toNumber(item?.nilai_harian, 0) : undefined,
          nilai_uts: item?.nilai_uts != null ? toNumber(item?.nilai_uts, 0) : undefined,
          nilai_uas: item?.nilai_uas != null ? toNumber(item?.nilai_uas, 0) : undefined,
          nilai_akhir_mapel: item?.nilai_akhir_mapel != null ? toNumber(item?.nilai_akhir_mapel, 0) : undefined,
          nilai_rapor_tampil: item?.nilai_rapor_tampil != null ? toNumber(item?.nilai_rapor_tampil, 0) : undefined,
          nilai: item?.nilai != null ? toNumber(item?.nilai, 0) : (item?.nilai_akhir_mapel != null ? toNumber(item?.nilai_akhir_mapel, 0) : undefined),
          predikat: toText(item?.predikat),
          flag_warna_rapor: toText(item?.flag_warna_rapor),
          status_ketuntasan: toText(item?.status_ketuntasan),
          status_kkm: toText(item?.status_kkm ?? item?.status_ketuntasan),
        }))
      : undefined,
    nilai_akhlak: Array.isArray(raw?.nilai_akhlak)
      ? raw.nilai_akhlak.map((item: any) => ({
          aspek: toText(item?.aspek),
          nilai_angka: item?.nilai_angka != null ? toNumber(item?.nilai_angka, 0) : undefined,
          deskripsi: toText(item?.deskripsi),
        }))
      : undefined,
    keseharian_kebersihan: raw?.keseharian_kebersihan != null ? toText(raw?.keseharian_kebersihan) ?? null : null,
    keseharian_kerapian: raw?.keseharian_kerapian != null ? toText(raw?.keseharian_kerapian) ?? null : null,
    keseharian_keterampilan: raw?.keseharian_keterampilan != null ? toText(raw?.keseharian_keterampilan) ?? null : null,
  }
}

export const raporService = {
  async getAll(params?: GetRaporParams): Promise<RaporItem[]> {
    const response = await api.get("/akademik/raport", {
      params: {
        ...params,
        include_nilai_mapel:
          params?.include_nilai_mapel === undefined
            ? undefined
            : params.include_nilai_mapel
              ? 1
              : 0,
      },
    })
    return extractList(response.data).map(normalizeRaporItem)
  },

  async getShow(params: GetRaporCatatanParams): Promise<RaporDetail> {
    const response = await api.get("/akademik/raport/show", { params })
    return normalizeRaporDetail(response.data?.data ?? response.data)
  },

  async getCatatanWali(params: GetRaporCatatanParams): Promise<{
    catatan_wali?: string | null
    id_wali_kelas?: number | null
    keseharian_kebersihan?: string | null
    keseharian_kerapian?: string | null
    keseharian_keterampilan?: string | null
  }> {
    const response = await api.get("/akademik/raport/catatan-wali", { params })
    const data = response.data?.data ?? response.data ?? {}

    return {
      catatan_wali: data?.catatan_wali != null ? toText(data.catatan_wali) ?? null : null,
      id_wali_kelas: data?.id_wali_kelas != null ? toNumber(data.id_wali_kelas, 0) : null,
      keseharian_kebersihan: data?.keseharian_kebersihan != null ? toText(data.keseharian_kebersihan) ?? null : null,
      keseharian_kerapian: data?.keseharian_kerapian != null ? toText(data.keseharian_kerapian) ?? null : null,
      keseharian_keterampilan: data?.keseharian_keterampilan != null ? toText(data.keseharian_keterampilan) ?? null : null,
    }
  },

  async generate(payload: GenerateRaporPayload): Promise<RaporItem> {
    const response = await api.post("/akademik/raport/generate", payload)
    return normalizeRaporItem(response.data?.data ?? response.data)
  },

  async upsertCatatanWali(payload: UpsertCatatanWaliPayload): Promise<RaporDetail> {
    const response = await api.post("/akademik/raport/catatan-wali", payload)
    return normalizeRaporDetail(response.data?.data ?? response.data)
  },

  async downloadPdf(params: GetRaporCatatanParams): Promise<Blob> {
    const response = await api.get("/akademik/raport/pdf", {
      params,
      responseType: "blob",
    })

    return response.data
  },
}