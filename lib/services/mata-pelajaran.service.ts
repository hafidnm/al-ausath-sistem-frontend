import api from "../axios"

export interface MataPelajaranItem {
  id: number
  kode_mapel: string
  nama_mapel?: string
  kelompok_mapel?: string
  kode_unit?: string
  status?: string
  updatedAt?: string
}

export interface GetMataPelajaranParams {
  q?: string
  per_page?: string
  kode_unit?: string
  kelompok_mapel?: string
  status?: string
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "")
const MAPEL_ENDPOINT = API_BASE_URL.endsWith("/api")
  ? "/administrasi/mata-pelajaran"
  : "/api/administrasi/mata-pelajaran"
const MAPEL_FALLBACK_ENDPOINT = MAPEL_ENDPOINT === "/administrasi/mata-pelajaran"
  ? "/api/administrasi/mata-pelajaran"
  : "/administrasi/mata-pelajaran"

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
      (typeof obj.nama_mapel === "string" && obj.nama_mapel)
      || (typeof obj.nama === "string" && obj.nama)
      || (typeof obj.kode_mapel === "string" && obj.kode_mapel)
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

const normalizeMapelItem = (raw: any): MataPelajaranItem => ({
  id: toNumber(raw?.id ?? raw?.id_mapel ?? raw?.mapel_id, -1),
  kode_mapel: toText(raw?.kode_mapel) ?? "",
  nama_mapel: toText(raw?.nama_mapel ?? raw?.nama),
  kelompok_mapel: toText(raw?.kelompok_mapel ?? raw?.kelompok),
  kode_unit: toText(raw?.kode_unit ?? raw?.unit),
  status: toText(raw?.status),
  updatedAt: toText(raw?.updated_at ?? raw?.updatedAt),
})

export const mataPelajaranService = {
  async getAll(params?: GetMataPelajaranParams): Promise<MataPelajaranItem[]> {
    try {
      const response = await api.get(MAPEL_ENDPOINT, { params })
      return extractList(response.data).map(normalizeMapelItem)
    } catch (error: any) {
      const status = error?.response?.status
      if (status !== 404) {
        throw error
      }

      const response = await api.get(MAPEL_FALLBACK_ENDPOINT, { params })
      return extractList(response.data).map(normalizeMapelItem)
    }
  },

  async search(query: string, limit: number = 20): Promise<MataPelajaranItem[]> {
    try {
      const response = await api.get(MAPEL_ENDPOINT, {
        params: {
          q: query,
          per_page: String(limit),
          status: "AKTIF",
        },
      })
      return extractList(response.data).map(normalizeMapelItem)
    } catch (error: any) {
      const status = error?.response?.status
      if (status !== 404) {
        throw error
      }

      const response = await api.get(MAPEL_FALLBACK_ENDPOINT, {
        params: {
          q: query,
          per_page: String(limit),
          status: "AKTIF",
        },
      })
      return extractList(response.data).map(normalizeMapelItem)
    }
  },

  async getById(id: number): Promise<MataPelajaranItem> {
    const primaryEndpoint = `${MAPEL_ENDPOINT}/${id}`
    const fallbackEndpoint = `${MAPEL_FALLBACK_ENDPOINT}/${id}`

    try {
      const response = await api.get(primaryEndpoint)
      const raw = response.data?.data ?? response.data
      return normalizeMapelItem(raw)
    } catch (error: any) {
      const status = error?.response?.status
      if (status !== 404) {
        throw error
      }

      const response = await api.get(fallbackEndpoint)
      const raw = response.data?.data ?? response.data
      return normalizeMapelItem(raw)
    }
  },
}
