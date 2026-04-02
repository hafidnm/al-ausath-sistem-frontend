import api from "../axios"

export interface KonversiItem {
  id: number
  nilai_min: number
  nilai_max: number
  nilai_huruf: string
  predikat: string
  kode_unit?: string
  unit_nama?: string
  keterangan?: string
  is_active?: boolean
  updatedAt?: string
}

export interface GetKonversiParams {
  q?: string
  kode_unit?: string
  per_page?: string
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
      || (typeof obj.label === "string" && obj.label)
      || (typeof obj.value === "string" && obj.value)
      || undefined
    )
  }

  return undefined
}

const toBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value === 1
  if (typeof value === "string") {
    const lower = value.toLowerCase()
    if (["1", "true", "aktif", "active"].includes(lower)) return true
    if (["0", "false", "nonaktif", "inactive"].includes(lower)) return false
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

const normalizeKonversiItem = (raw: any): KonversiItem => {
  const rawId = raw?.id ?? raw?.id_konversi

  return {
    id: toNumber(rawId, -1),
    nilai_min: toNumber(raw?.nilai_min ?? raw?.min_nilai, 0),
    nilai_max: toNumber(raw?.nilai_max ?? raw?.max_nilai, 0),
    nilai_huruf: toText(raw?.nilai_huruf ?? raw?.huruf_nilai ?? raw?.huruf) ?? "",
    predikat: toText(raw?.predikat ?? raw?.deskripsi ?? raw?.keterangan_predikat) ?? "",
    kode_unit: toText(raw?.kode_unit ?? raw?.unit?.kode_unit),
    unit_nama: toText(raw?.unit?.nama_unit ?? raw?.nama_unit),
    keterangan: toText(raw?.keterangan),
    is_active: toBoolean(raw?.is_active ?? raw?.aktif ?? raw?.status_aktif),
    updatedAt: toText(raw?.updated_at ?? raw?.updatedAt),
  }
}

const sanitizePayload = (payload: Omit<KonversiItem, "id" | "updatedAt" | "unit_nama">) => {
  const cleaned: Record<string, unknown> = {
    nilai_min: payload.nilai_min,
    nilai_max: payload.nilai_max,
    nilai_huruf: payload.nilai_huruf,
    predikat: payload.predikat,
  }

  if (payload.kode_unit) cleaned.kode_unit = payload.kode_unit
  if (payload.keterangan) cleaned.keterangan = payload.keterangan
  if (typeof payload.is_active === "boolean") cleaned.is_active = payload.is_active

  return cleaned
}

export const konversiService = {
  async getAll(params?: GetKonversiParams): Promise<KonversiItem[]> {
    const response = await api.get("/akademik/konversi-nilai", { params })
    const rows = extractList(response.data)
    return rows.map(normalizeKonversiItem)
  },

  async getById(id: number): Promise<KonversiItem> {
    const response = await api.get(`/akademik/konversi-nilai/${id}`)
    const raw = response.data?.data ?? response.data
    return normalizeKonversiItem(raw)
  },

  async create(payload: Omit<KonversiItem, "id" | "updatedAt" | "unit_nama">): Promise<KonversiItem> {
    const response = await api.post("/akademik/konversi-nilai", sanitizePayload(payload))
    const raw = response.data?.data ?? response.data
    return normalizeKonversiItem(raw)
  },

  async update(id: number, payload: Omit<KonversiItem, "id" | "updatedAt" | "unit_nama">): Promise<KonversiItem> {
    const response = await api.put(`/akademik/konversi-nilai/${id}`, sanitizePayload(payload))
    const raw = response.data?.data ?? response.data
    return normalizeKonversiItem(raw)
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/akademik/konversi-nilai/${id}`)
  },
}
