import api from "../axios"

export interface KelasItem {
  id: number
  kode_kelas: string
  nama_kelas?: string
  tahun_ajaran?: string
}

export interface GetKelasParams {
  q?: string
  per_page?: string
  kode_unit?: string
  tahun_ajaran?: string
  status?: string
  status_ppdb?: string
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
      || (typeof obj.nama_kelas === "string" && obj.nama_kelas)
      || (typeof obj.kode_kelas === "string" && obj.kode_kelas)
      || (typeof obj.tahun_ajaran === "string" && obj.tahun_ajaran)
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

const normalizeKelasItem = (raw: any): KelasItem => ({
  id: toNumber(raw?.id ?? raw?.id_kelas ?? raw?.kelas_id, -1),
  kode_kelas: toText(raw?.kode_kelas ?? raw?.kelas?.kode_kelas) ?? "",
  nama_kelas: toText(raw?.nama_kelas ?? raw?.kelas?.nama_kelas ?? raw?.nama),
  tahun_ajaran: toText(
    raw?.tahun_ajaran
    ?? raw?.tahunAjaranRelasi?.tahun_ajaran
    ?? raw?.tahun_ajaran_relasi?.tahun_ajaran,
  ),
})

export const kelasService = {
  async getAll(params?: GetKelasParams): Promise<KelasItem[]> {
    const response = await api.get("/akademik/kelas", {
      params: {
        ...params,
        per_page: params?.per_page ?? "100",
      },
    })

    return extractList(response.data)
      .map(normalizeKelasItem)
      .filter((item) => item.kode_kelas)
  },
}
