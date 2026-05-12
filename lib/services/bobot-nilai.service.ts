import api, { getCsrfToken } from "../axios"

export interface BobotNilaiItem {
  id: number
  tahun_ajaran: string
  semester: number
  bobot_harian: number
  bobot_uts: number
  bobot_uas: number
  is_default?: boolean
  created_at?: string
  updated_at?: string
}

export interface BobotNilaiListParams {
  tahun_ajaran?: string
  semester?: string | number
  per_page?: string | number
  page?: string | number
}

export interface BobotNilaiPayload {
  tahun_ajaran: string
  semester: number
  bobot_harian: number
  bobot_uts: number
  bobot_uas: number
}

export type UpdateBobotNilaiPayload = Partial<BobotNilaiPayload>

type ApiRecord = Record<string, unknown>

const BASE_PATH = "/akademik/bobot"

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toText = (value: unknown): string | undefined => {
  if (value == null) return undefined
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)

  if (typeof value === "object") {
    const record = value as ApiRecord
    return (
      (typeof record.nama === "string" && record.nama)
      || (typeof record.label === "string" && record.label)
      || (typeof record.value === "string" && record.value)
      || (typeof record.tahun_ajaran === "string" && record.tahun_ajaran)
      || undefined
    )
  }

  return undefined
}

const toBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value !== 0
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (["1", "true", "yes", "y", "aktif", "default"].includes(normalized)) return true
    if (["0", "false", "no", "n", "nonaktif", "inactive"].includes(normalized)) return false
  }
  return undefined
}

const extractList = (payload: unknown): ApiRecord[] => {
  if (Array.isArray(payload)) return payload.filter((item): item is ApiRecord => !!item && typeof item === "object")
  if (!payload || typeof payload !== "object") return []

  const record = payload as ApiRecord
  if (Array.isArray(record.data)) return record.data.filter((item): item is ApiRecord => !!item && typeof item === "object")
  if (Array.isArray(record.items)) return record.items.filter((item): item is ApiRecord => !!item && typeof item === "object")
  if (Array.isArray(record.results)) return record.results.filter((item): item is ApiRecord => !!item && typeof item === "object")

  return []
}

const extractItem = (payload: unknown): ApiRecord => {
  if (!payload || typeof payload !== "object") return {}

  const record = payload as ApiRecord
  if (record.data && typeof record.data === "object" && !Array.isArray(record.data)) {
    return record.data as ApiRecord
  }

  return record
}

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === "object") {
    const candidate = error as {
      response?: { data?: { message?: string; error?: string } }
      message?: string
    }

    return candidate.response?.data?.message ?? candidate.response?.data?.error ?? candidate.message ?? fallback
  }

  return fallback
}

const normalizeBobot = (raw: ApiRecord): BobotNilaiItem => {
  const bobotHarian = toNumber(raw.bobot_harian ?? raw.bobot_tugas ?? raw.tugas ?? raw.harian, 0)
  const bobotUts = toNumber(raw.bobot_uts ?? raw.ulangan ?? raw.uts, 0)
  const bobotUas = toNumber(raw.bobot_uas ?? raw.ujian_akhir ?? raw.ujianAkhir ?? raw.uas, 0)

  return {
    id: toNumber(raw.id ?? raw.id_bobot ?? raw.bobot_id, -1),
    tahun_ajaran: toText(raw.tahun_ajaran ?? raw.tahunAjaran ?? raw.kode_tahun ?? raw.tahun) ?? "",
    semester: toNumber(raw.semester, 0),
    bobot_harian: bobotHarian,
    bobot_uts: bobotUts,
    bobot_uas: bobotUas,
    is_default:
      toBoolean(raw.is_default)
      ?? toBoolean(raw.default)
      ?? toBoolean(raw.aktif)
      ?? toBoolean(raw.status),
    created_at: toText(raw.created_at ?? raw.createdAt),
    updated_at: toText(raw.updated_at ?? raw.updatedAt),
  }
}

const normalizePayload = (payload: BobotNilaiPayload | UpdateBobotNilaiPayload) => {
  const result: Record<string, unknown> = {}

  if (payload.tahun_ajaran !== undefined) {
    result.tahun_ajaran = String(payload.tahun_ajaran).trim()
  }

  if (payload.semester !== undefined) {
    result.semester = toNumber(payload.semester, 0)
  }

  if (payload.bobot_harian !== undefined) {
    result.bobot_harian = toNumber(payload.bobot_harian, 0)
  }

  if (payload.bobot_uts !== undefined) {
    result.bobot_uts = toNumber(payload.bobot_uts, 0)
  }

  if (payload.bobot_uas !== undefined) {
    result.bobot_uas = toNumber(payload.bobot_uas, 0)
  }

  return result
}

export const bobotNilaiService = {
  async getAll(params?: BobotNilaiListParams): Promise<{ data: BobotNilaiItem[]; meta: Record<string, unknown> }> {
    try {
      const response = await api.get(BASE_PATH, { params })
      return {
        data: extractList(response.data).map(normalizeBobot),
        meta: response.data && typeof response.data === "object" ? (response.data as Record<string, unknown>) : {},
      }
    } catch (error) {
      throw new Error(extractErrorMessage(error, "Gagal memuat data bobot"))
    }
  },

  async getById(id: number): Promise<BobotNilaiItem> {
    try {
      const response = await api.get(`${BASE_PATH}/${id}`)
      return normalizeBobot(extractItem(response.data))
    } catch (error) {
      throw new Error(extractErrorMessage(error, "Gagal memuat detail bobot"))
    }
  },

  async create(payload: BobotNilaiPayload): Promise<BobotNilaiItem> {
    try {
      await getCsrfToken()

      const response = await api.post(BASE_PATH, normalizePayload(payload))
      return normalizeBobot(extractItem(response.data))
    } catch (error) {
      throw new Error(extractErrorMessage(error, "Gagal membuat bobot nilai"))
    }
  },

  async update(id: number, payload: UpdateBobotNilaiPayload): Promise<BobotNilaiItem> {
    try {
      await getCsrfToken()

      const response = await api.put(`${BASE_PATH}/${id}`, normalizePayload(payload))
      return normalizeBobot(extractItem(response.data))
    } catch (error) {
      throw new Error(extractErrorMessage(error, "Gagal memperbarui bobot nilai"))
    }
  },

  async remove(id: number): Promise<void> {
    try {
      await getCsrfToken()
      await api.delete(`${BASE_PATH}/${id}`)
    } catch (error) {
      throw new Error(extractErrorMessage(error, "Gagal menghapus bobot nilai"))
    }
  },

  async setDefault(payload: Pick<BobotNilaiPayload, "tahun_ajaran" | "semester">): Promise<BobotNilaiItem> {
    try {
      await getCsrfToken()

      const response = await api.post(`${BASE_PATH}/set-default`, normalizePayload(payload))
      return normalizeBobot(extractItem(response.data))
    } catch (error) {
      throw new Error(extractErrorMessage(error, "Gagal menyimpan bobot default"))
    }
  },
}