"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { endpointInfos } from "../data/analitik-data"
import { EndpointInfoCard } from "./endpoint-info-card"
import { StatistikKeseluruhanFilters } from "./statistik-keseluruhan-filters"
import { nilaiStatistikService, type NilaiStatistikData, type NilaiStatistikParams } from "@/lib/services/nilai-statistik.service"
import { kelasService } from "@/lib/services/kelas.service"
import { mataPelajaranService } from "@/lib/services/mata-pelajaran.service"
import { tahunAjaranService } from "@/lib/services/tahun-ajaran.service"

type FilterOption = {
  value: string
  label: string
}

const initialStats: NilaiStatistikData = {
  rata_rata: 0,
  nilai_tertinggi: 0,
  nilai_terendah: 0,
  jumlah_santri: 0,
  total_nilai: 0,
}

export function StatistikKeseluruhanSection() {
  const info = endpointInfos[0]

  const [kodeKelas, setKodeKelas] = useState("")
  const [kodeMapel, setKodeMapel] = useState("")
  const [tahunAjaran, setTahunAjaran] = useState("")
  const [semester, setSemester] = useState("all")

  const [stats, setStats] = useState<NilaiStatistikData>(initialStats)
  const [activeFilters, setActiveFilters] = useState<{
    kode_kelas?: string | null
    kode_mapel?: string | null
    tahun_ajaran?: string | null
    semester?: number | null
  }>({})
  const [kelasOptions, setKelasOptions] = useState<FilterOption[]>([])
  const [mapelOptions, setMapelOptions] = useState<FilterOption[]>([])
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState<FilterOption[]>([])
  const [isLoadingFilterOptions, setIsLoadingFilterOptions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const buildParams = useCallback((): NilaiStatistikParams => {
    const params: NilaiStatistikParams = {}

    if (kodeKelas.trim()) params.kode_kelas = kodeKelas.trim()
    if (kodeMapel.trim()) params.kode_mapel = kodeMapel.trim()
    if (tahunAjaran.trim()) params.tahun_ajaran = tahunAjaran.trim()
    if (semester === "1" || semester === "2") params.semester = Number(semester) as 1 | 2

    return params
  }, [kodeKelas, kodeMapel, semester, tahunAjaran])

  const fetchStatistik = useCallback(async () => {
    try {
      setIsLoading(true)
      setError("")

      const response = await nilaiStatistikService.getKeseluruhan(buildParams())
      setStats(response.data)
      setActiveFilters(response.filters ?? {})
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal memuat statistik keseluruhan")
      setStats(initialStats)
      setActiveFilters({})
    } finally {
      setIsLoading(false)
    }
  }, [buildParams])

  const fetchFilterOptions = useCallback(async () => {
    try {
      setIsLoadingFilterOptions(true)

      const [kelasRows, mapelRows, tahunRows] = await Promise.all([
        kelasService.getAll({ per_page: "300", status: "AKTIF" }),
        mataPelajaranService.getAll({ per_page: "300", status: "AKTIF" }),
        tahunAjaranService.getAll({ per_page: 100, status: "AKTIF" }),
      ])

      const kelas = kelasRows
        .filter((item) => item.kode_kelas)
        .map((item) => ({
          value: item.kode_kelas,
          label: item.nama_kelas ? `${item.kode_kelas} - ${item.nama_kelas}` : item.kode_kelas,
        }))

      const mapel = mapelRows
        .filter((item) => item.kode_mapel)
        .map((item) => ({
          value: item.kode_mapel,
          label: item.nama_mapel ? `${item.kode_mapel} - ${item.nama_mapel}` : item.kode_mapel,
        }))

      const tahun = tahunRows.data
        .map((item) => item.nama_tahun || item.kode_tahun)
        .filter((item): item is string => Boolean(item))
        .map((item) => ({ value: item, label: item }))

      setKelasOptions(Array.from(new Map(kelas.map((item) => [item.value, item])).values()))
      setMapelOptions(Array.from(new Map(mapel.map((item) => [item.value, item])).values()))
      setTahunAjaranOptions(Array.from(new Map(tahun.map((item) => [item.value, item])).values()))
    } catch {
      // Keep empty options when lookup endpoints fail.
      setKelasOptions([])
      setMapelOptions([])
      setTahunAjaranOptions([])
    } finally {
      setIsLoadingFilterOptions(false)
    }
  }, [])

  useEffect(() => {
    void Promise.all([fetchFilterOptions(), fetchStatistik()])
  }, [fetchFilterOptions, fetchStatistik])

  const handleReset = () => {
    setKodeKelas("")
    setKodeMapel("")
    setTahunAjaran("")
    setSemester("all")
  }

  useEffect(() => {
    if (!kodeKelas && !kodeMapel && !tahunAjaran && semester === "all") {
      void fetchStatistik()
    }
  }, [fetchStatistik, kodeKelas, kodeMapel, semester, tahunAjaran])

  const statCards = useMemo(
    () => [
      { label: "Rata-rata", value: stats.rata_rata.toFixed(2) },
      { label: "Nilai Tertinggi", value: stats.nilai_tertinggi },
      { label: "Nilai Terendah", value: stats.nilai_terendah },
      { label: "Jumlah Santri", value: stats.jumlah_santri },
      { label: "Total Record Nilai", value: stats.total_nilai },
    ],
    [stats],
  )

  const filterChips = [
    activeFilters.kode_kelas ? `kode_kelas=${activeFilters.kode_kelas}` : null,
    activeFilters.kode_mapel ? `kode_mapel=${activeFilters.kode_mapel}` : null,
    activeFilters.tahun_ajaran ? `tahun_ajaran=${activeFilters.tahun_ajaran}` : null,
    activeFilters.semester ? `semester=${activeFilters.semester}` : null,
  ].filter(Boolean)

  return (
    <div className="space-y-4">
      <EndpointInfoCard info={info} />

      <StatistikKeseluruhanFilters
        kodeKelas={kodeKelas}
        kodeMapel={kodeMapel}
        tahunAjaran={tahunAjaran}
        semester={semester}
        kelasOptions={kelasOptions}
        mapelOptions={mapelOptions}
        tahunAjaranOptions={tahunAjaranOptions}
        isLoading={isLoading}
        isLoadingOptions={isLoadingFilterOptions}
        onKodeKelasChange={setKodeKelas}
        onKodeMapelChange={setKodeMapel}
        onTahunAjaranChange={setTahunAjaran}
        onSemesterChange={setSemester}
        onApply={() => void fetchStatistik()}
        onReset={handleReset}
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        {filterChips.length > 0 ? (
          filterChips.map((chip) => (
            <Badge key={chip} variant="outline" className="bg-transparent">
              {chip}
            </Badge>
          ))
        ) : (
          <Badge variant="outline" className="bg-transparent">
            Tanpa filter (global)
          </Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {statCards.map((item) => (
          <Card key={item.label} className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
