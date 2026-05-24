import { useCallback, useEffect, useRef } from "react"
import { getCachedUser } from "@/lib/auth-cache"
import { useAsyncQuery } from "./shared/use-async-request"
import {
  dataJadwalPembelajaranService,
  type DataJadwalPembelajaranApiItem,
  type DataJadwalPembelajaranPaginationMeta,
} from "@/lib/services/jadwal-pembelajaran.service"

interface UseJadwalPembelajaranSantriParams {
  tahunAjaran?: string
  hari?: string
  status?: "AKTIF" | "NONAKTIF"
  q?: string
  perPage?: number
  page?: number
}

interface JadwalSantriResponse {
  data: DataJadwalPembelajaranApiItem[]
  meta: DataJadwalPembelajaranPaginationMeta
}

export function useJadwalPembelajaranSantri(params: UseJadwalPembelajaranSantriParams = {}) {
  const query = useCallback(async () => {
    const authData = await getCachedUser()
    const user = authData?.user

    if (!user?.nomor_induk) {
      throw new Error("Data santri tidak ditemukan. Silakan login kembali.")
    }

    const response = await dataJadwalPembelajaranService.getByNomorInduk(user.nomor_induk, {
      tahun_ajaran: params.tahunAjaran,
      hari: params.hari,
      status: params.status,
      q: params.q,
      per_page: params.perPage ?? 50,
      page: params.page,
    })

    return response
  }, [params.hari, params.page, params.perPage, params.q, params.status, params.tahunAjaran])

  const { data, loading, error, run } = useAsyncQuery<JadwalSantriResponse, []>(
    query,
    { data: [], meta: {} },
    {
      fallbackError: "Gagal memuat data jadwal pembelajaran",
      logLabel: "Error fetching jadwal pembelajaran santri:",
    },
  )

  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    if (isMountedRef.current) {
      run()
    }

    return () => {
      isMountedRef.current = false
    }
  }, [run])

  return { data: data.data, meta: data.meta, loading, error, refetch: run }
}
