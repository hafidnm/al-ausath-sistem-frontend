import api from "../axios"

export interface NilaiAkhlakItem {
  id: number
  nomor_induk: string
  nama_santri?: string
  tahun_ajaran: string
  semester: number
  nilai_angka: number
  aspek?: string
  deskripsi?: string
  updatedAt?: string
}

export interface GetNilaiAkhlakParams {
  tahun_ajaran?: string
  semester?: string
  aspek?: string
  per_page?: string
}

export interface UpsertNilaiAkhlakPayload {
  nomor_induk: string
  tahun_ajaran: string
  semester: number
  nilai_angka: number
  aspek?: string
  deskripsi?: string
  id_petugas_input?: number
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

const normalizeNilaiAkhlakItem = (raw: any): NilaiAkhlakItem => {
  const rawId =
    raw?.id
    ?? raw?.id_nilai_akhlak
    ?? raw?.nilai_akhlak_id
    ?? raw?.id_akhlak
    ?? raw?.id_nilai_karakter
    ?? raw?.nilai_akhlak?.nilai_akhlak_id
    ?? raw?.nilai_akhlak?.id_akhlak
    ?? raw?.nilai_akhlak?.id
    ?? raw?.nilai_akhlak?.id_nilai_akhlak

  return {
    id: toNumber(rawId, -1),
    nomor_induk: toText(raw?.nomor_induk ?? raw?.santri?.nomor_induk) ?? "",
    nama_santri: toText(raw?.nama_santri ?? raw?.santri?.nama_lengkap ?? raw?.santri?.nama),
    tahun_ajaran: toText(raw?.tahun_ajaran) ?? "",
    semester: toNumber(raw?.semester, 0),
    nilai_angka: toNumber(raw?.nilai_angka ?? raw?.nilai, 0),
    aspek: toText(raw?.aspek),
    deskripsi: toText(raw?.deskripsi),
    updatedAt: toText(raw?.updated_at ?? raw?.updatedAt),
  }
}

export const nilaiAkhlakService = {
  async getAll(params: GetNilaiAkhlakParams): Promise<NilaiAkhlakItem[]> {
    const response = await api.get("/akademik/nilai-akhlak", { params })
    return extractList(response.data).map(normalizeNilaiAkhlakItem)
  },

  async getAllBar(params?: Omit<GetNilaiAkhlakParams, "nomor_induk">): Promise<NilaiAkhlakItem[]> {
    const response = await api.get("/akademik/nilai-akhlak/bar", { params })
    return extractList(response.data).map(normalizeNilaiAkhlakItem)
  },

  async upsert(payload: UpsertNilaiAkhlakPayload): Promise<NilaiAkhlakItem> {
    const response = await api.post("/akademik/nilai-akhlak", {
      nomor_induk: payload.nomor_induk,
      tahun_ajaran: payload.tahun_ajaran,
      semester: payload.semester,
      nilai_angka: payload.nilai_angka,
      aspek: payload.aspek || "AKHLAK",
      deskripsi: payload.deskripsi,
      id_petugas_input: payload.id_petugas_input,
    })

    return normalizeNilaiAkhlakItem(response.data?.data ?? response.data)
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/akademik/nilai-akhlak/${id}`)
  },
}
