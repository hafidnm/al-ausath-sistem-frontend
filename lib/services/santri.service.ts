import api from "../axios"

export interface SantriItem {
  id: number
  nomor_induk: string
  nama_lengkap?: string
  kelas?: string
  jenjang?: string
  updatedAt?: string
}

export interface GetSantriParams {
  q?: string
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
      (typeof obj.nama_lengkap === "string" && obj.nama_lengkap)
      || (typeof obj.nama === "string" && obj.nama)
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

const normalizeSantriItem = (raw: any): SantriItem => ({
  id: toNumber(raw?.id, -1),
  nomor_induk: toText(raw?.nomor_induk ?? raw?.nis) ?? "",
  nama_lengkap: toText(raw?.nama_lengkap ?? raw?.nama),
  kelas: toText(raw?.kelas ?? raw?.kode_kelas),
  jenjang: toText(raw?.jenjang),
  updatedAt: toText(raw?.updated_at ?? raw?.updatedAt),
})

export const santriService = {
  async getAll(params?: GetSantriParams): Promise<SantriItem[]> {
    const response = await api.get("/administrasi/santri", { params })
    return extractList(response.data).map(normalizeSantriItem)
  },
}
