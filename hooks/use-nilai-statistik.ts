import { useCallback } from "react"
import {
  NilaiStatistikParams,
  RataRataPerKelasItem,
  BerprestasiParams,
  SantriBerprestasiItem,
  nilaiStatistikService,
} from "@/lib/services/nilai-statistik.service"
import { useAsyncQuery } from "@/hooks/shared/use-async-request"

export function useNilaiStatistikPerKelas() {
  const query = useCallback(async (params?: NilaiStatistikParams) => {
    const response = await nilaiStatistikService.getPerKelas(params)
    return response.data
  }, [])

  const { data, loading, error, run } = useAsyncQuery(query, [] as RataRataPerKelasItem[], {
    fallbackError: "Gagal memuat data rata-rata per kelas",
    logLabel: "Error fetching rata-rata per kelas:",
  })

  const fetchPerKelas = useCallback(
    async (params?: NilaiStatistikParams) => run(params),
    [run],
  )

  return { data, loading, error, fetchPerKelas }
}

export function useNilaiStatistikBerprestasi() {
  const query = useCallback(async (params?: BerprestasiParams) => {
    const response = await nilaiStatistikService.getBerprestasi(params)
    return response.data
  }, [])

  const { data, loading, error, run } = useAsyncQuery(query, [] as SantriBerprestasiItem[], {
    fallbackError: "Gagal memuat data santri berprestasi",
    logLabel: "Error fetching santri berprestasi:",
  })

  const fetchBerprestasi = useCallback(
    async (params?: BerprestasiParams) => run(params),
    [run],
  )

  return { data, loading, error, fetchBerprestasi }
}
