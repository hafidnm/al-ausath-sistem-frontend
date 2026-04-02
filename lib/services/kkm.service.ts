import api from "../axios"

export interface KkmItem {
  id: number
  kode_mapel: string
  mapel?: string
  tahun_ajaran: string
  semester: number
  nilai_kkm: number
  kode_unit?: string
  keterangan?: string
  updatedAt?: string
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
      || (typeof obj.label === "string" && obj.label)
      || (typeof obj.value === "string" && obj.value)
      || undefined
    )
  }

  return undefined
}

const normalizeMapel = (raw: any): string | undefined => {
  const candidate = raw?.mapel ?? raw?.mata_pelajaran ?? raw?.nama_mapel

  if (typeof candidate === "string") return candidate

  if (candidate && typeof candidate === "object") {
    return (
      candidate.nama_mapel
      || candidate.nama
      || candidate.mapel
      || candidate.kode_mapel
      || undefined
    )
  }

  return undefined
}

export interface GetKkmParams {
  q?: string
  kode_mapel?: string
  tahun_ajaran?: string
  semester?: string
  kode_unit?: string
  per_page?: string
}

const normalizeKkmItem = (raw: any): KkmItem => {
  const rawId = raw?.id ?? raw?.id_kkm ?? raw?.idKkm

  return {
    id: toNumber(rawId, -1),
    kode_mapel: toText(raw.kode_mapel) ?? "",
    mapel: normalizeMapel(raw),
    tahun_ajaran: toText(raw.tahun_ajaran) ?? "",
    semester: toNumber(raw.semester, 0),
    nilai_kkm: toNumber(raw.nilai_kkm, 0),
    kode_unit: toText(raw.kode_unit),
    keterangan: toText(raw.keterangan),
    updatedAt: toText(raw.updated_at) ?? toText(raw.updatedAt),
  }
}

const extractList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

export const kkmService = {
  async getAll(params?: GetKkmParams): Promise<KkmItem[]> {
    const response = await api.get("/akademik/kkm-mapel", { params })
    const rows = extractList(response.data)
    return rows.map(normalizeKkmItem)
  },

  async getById(id: number): Promise<KkmItem> {
    const response = await api.get(`/akademik/kkm-mapel/${id}`)
    const raw = response.data?.data ?? response.data
    return normalizeKkmItem(raw)
  },

  async create(payload: Omit<KkmItem, "id" | "mapel" | "updatedAt">): Promise<KkmItem> {
    const response = await api.post("/akademik/kkm-mapel", payload)
    const raw = response.data?.data ?? response.data
    return normalizeKkmItem(raw)
  },

  async update(id: number, payload: Omit<KkmItem, "id" | "mapel" | "updatedAt">): Promise<KkmItem> {
    const response = await api.put(`/akademik/kkm-mapel/${id}`, payload)
    const raw = response.data?.data ?? response.data
    return normalizeKkmItem(raw)
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/akademik/kkm-mapel/${id}`)
  },
}
