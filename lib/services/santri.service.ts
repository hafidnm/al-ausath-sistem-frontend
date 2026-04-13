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
  status?: string
  kode_kelas?: string
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "")
const SANTRI_ENDPOINT = API_BASE_URL.endsWith("/api")
  ? "/master/data-santri"
  : "/api/master/data-santri"
const SANTRI_FALLBACK_ENDPOINT = SANTRI_ENDPOINT === "/master/data-santri"
  ? "/api/master/data-santri"
  : "/master/data-santri"
const SANTRI_OPTIONS_ENDPOINT = API_BASE_URL.endsWith("/api")
  ? "/master/data-santri/options"
  : "/api/master/data-santri/options"
const SANTRI_OPTIONS_FALLBACK_ENDPOINT = SANTRI_OPTIONS_ENDPOINT === "/master/data-santri/options"
  ? "/api/master/data-santri/options"
  : "/master/data-santri/options"

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
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

const normalizeSantriItem = (raw: any): SantriItem => ({
  id: toNumber(raw?.id ?? raw?.id_santri ?? raw?.santri_id, -1),
  nomor_induk: toText(raw?.nomor_induk ?? raw?.nis) ?? "",
  nama_lengkap: toText(raw?.nama_lengkap_santri ?? raw?.nama_lengkap ?? raw?.nama),
  kelas: toText(raw?.kelas?.kode_kelas ?? raw?.kelas ?? raw?.kode_kelas),
  jenjang: toText(raw?.jenjang),
  updatedAt: toText(raw?.updated_at ?? raw?.updatedAt),
})

export const santriService = {
  async getAll(params?: GetSantriParams): Promise<SantriItem[]> {
    try {
      const response = await api.get(SANTRI_ENDPOINT, { params })
      return extractList(response.data).map(normalizeSantriItem)
    } catch (error: any) {
      const status = error?.response?.status
      if (status !== 404) {
        throw error
      }

      const response = await api.get(SANTRI_FALLBACK_ENDPOINT, { params })
      return extractList(response.data).map(normalizeSantriItem)
    }
  },

  async search(query: string, limit: number = 10): Promise<SantriItem[]> {
    try {
      const response = await api.get(SANTRI_OPTIONS_ENDPOINT, {
        params: {
          q: query,
          limit,
        },
      })
      return extractList(response.data).map(normalizeSantriItem)
    } catch (error: any) {
      const status = error?.response?.status
      if (status !== 404) {
        throw error
      }

      const response = await api.get(SANTRI_OPTIONS_FALLBACK_ENDPOINT, {
        params: {
          q: query,
          limit,
        },
      })
      return extractList(response.data).map(normalizeSantriItem)
    }
  },

  async getById(id: number): Promise<SantriItem> {
    const primaryEndpoint = `${SANTRI_ENDPOINT}/${id}`
    const fallbackEndpoint = `${SANTRI_FALLBACK_ENDPOINT}/${id}`

    try {
      const response = await api.get(primaryEndpoint)
      const raw = response.data?.data ?? response.data
      return normalizeSantriItem(raw)
    } catch (error: any) {
      const status = error?.response?.status
      if (status !== 404) {
        throw error
      }

      const response = await api.get(fallbackEndpoint)
      const raw = response.data?.data ?? response.data
      return normalizeSantriItem(raw)
    }
  },
}
