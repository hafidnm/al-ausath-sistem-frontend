"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { AlertCircle, RotateCcw } from "lucide-react"
import { kelasService, type KelasItem } from "@/lib/services/kelas.service"
import { type BimbinganParams } from "@/lib/services/nilai-statistik.service"
import { useNilaiStatistikPerluBimbingan } from "@/hooks/use-nilai-statistik"
import { endpointInfos } from "../data/analitik-data"
import { EndpointInfoCard } from "./endpoint-info-card"

type BimbinganFilterState = {
  kode_kelas: string
  tahun_ajaran: string
  semester: string
  threshold: string
  limit: string
}

const DEFAULT_FILTERS: BimbinganFilterState = {
  kode_kelas: "all",
  tahun_ajaran: "",
  semester: "all",
  threshold: "65",
  limit: "50",
}

const buildRequestParams = (filters: BimbinganFilterState): BimbinganParams => ({
  kode_kelas: filters.kode_kelas === "all" ? undefined : filters.kode_kelas.trim() || undefined,
  tahun_ajaran: filters.tahun_ajaran.trim() || undefined,
  semester: filters.semester === "all" ? undefined : (Number(filters.semester) as 1 | 2),
  threshold: filters.threshold.trim() || undefined,
  limit: filters.limit.trim() || undefined,
})

export function SantriPerluBimbinganSection() {
  const info = endpointInfos[4]
  const { data, loading, error, fetchPerluBimbingan } = useNilaiStatistikPerluBimbingan()
  const [kelasOptions, setKelasOptions] = useState<KelasItem[]>([])
  const [kelasLoading, setKelasLoading] = useState(false)
  const [filters, setFilters] = useState<BimbinganFilterState>(DEFAULT_FILTERS)

  useEffect(() => {
    let isMounted = true

    const loadKelasOptions = async () => {
      setKelasLoading(true)

      try {
        const response = await kelasService.getAll({ per_page: "100" })

        if (isMounted) {
          setKelasOptions(response)
        }
      } catch (loadError) {
        console.error("Error fetching class options:", loadError)
        if (isMounted) {
          setKelasOptions([])
        }
      } finally {
        if (isMounted) {
          setKelasLoading(false)
        }
      }
    }

    loadKelasOptions()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    fetchPerluBimbingan(buildRequestParams(filters))
  }, [filters, fetchPerluBimbingan])

  const handleFilterChange = (key: keyof BimbinganFilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS)
  }

  const kelasSorted = [...kelasOptions].sort((left, right) => left.kode_kelas.localeCompare(right.kode_kelas))

  return (
    <div className="space-y-4">
      <EndpointInfoCard info={info} />

      <Card className="border-border/50 bg-muted/30">
        <CardHeader>
          <CardTitle className="text-sm">Filter Pencarian</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="kode_kelas" className="text-xs">
                Kode Kelas (Opsional)
              </Label>
              <Select value={filters.kode_kelas} onValueChange={(value) => handleFilterChange("kode_kelas", value)}>
                <SelectTrigger id="kode_kelas" className="h-8 text-xs">
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {kelasLoading ? (
                    <SelectItem value="loading" disabled>
                      Memuat daftar kelas...
                    </SelectItem>
                  ) : (
                    kelasSorted.map((kelas) => (
                      <SelectItem key={kelas.kode_kelas} value={kelas.kode_kelas}>
                        {kelas.kode_kelas}{kelas.nama_kelas ? ` - ${kelas.nama_kelas}` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tahun_ajaran" className="text-xs">
                Tahun Ajaran (Opsional)
              </Label>
              <Input
                id="tahun_ajaran"
                placeholder="2025/2026"
                value={filters.tahun_ajaran}
                onChange={(e) => handleFilterChange("tahun_ajaran", e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester" className="text-xs">
                Semester (Opsional)
              </Label>
              <Select value={filters.semester} onValueChange={(value) => handleFilterChange("semester", value)}>
                <SelectTrigger id="semester" className="h-8 text-xs">
                  <SelectValue placeholder="Pilih Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Semester</SelectItem>
                  <SelectItem value="1">Semester 1</SelectItem>
                  <SelectItem value="2">Semester 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold" className="text-xs">
                Threshold Max
              </Label>
              <Input
                id="threshold"
                type="number"
                min="0"
                max="100"
                placeholder="65"
                value={filters.threshold}
                onChange={(e) => handleFilterChange("threshold", e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit" className="text-xs">
                Limit
              </Label>
              <Input
                id="limit"
                type="number"
                min="1"
                max="500"
                placeholder="50"
                value={filters.limit}
                onChange={(e) => handleFilterChange("limit", e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleReset} variant="outline" size="sm" className="gap-2">
              <RotateCcw className="h-3 w-3" />
              Reset Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Daftar Santri Perlu Bimbingan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-6 w-6" />
              <span className="ml-2 text-sm text-muted-foreground">Memuat data...</span>
            </div>
          )}

          {error && !loading && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && data.length === 0 && !error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Tidak ada data santri perlu bimbingan tersedia</AlertDescription>
            </Alert>
          )}

          {!loading && data.length > 0 && (
            <>
              {data.map((row) => (
                <div key={row.nomor_induk} className="rounded-lg border border-border/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">Nomor Induk: {row.nomor_induk}</p>
                      <p className="text-xs text-muted-foreground">
                        Mapel perlu bimbingan: {row.mapel_perlu_bimbingan} · Belum tuntas: {row.mapel_belum_tuntas}
                      </p>
                    </div>
                    <Badge className="bg-destructive/10 text-destructive border-0">
                      Rata-rata {row.rata_rata.toFixed(2)}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {row.mapel_detail.map((nilai) => (
                      <Badge
                        key={`${row.nomor_induk}-${nilai.kode_mapel}`}
                        variant="outline"
                        className={
                          nilai.status_ketuntasan === "BELUM TUNTAS"
                            ? "border-destructive/40 text-destructive"
                            : "bg-transparent"
                        }
                      >
                        {nilai.kode_mapel}: {nilai.nilai_akhir}
                        {nilai.nilai_tampil !== undefined ? ` (tampil ${nilai.nilai_tampil})` : ""} · {nilai.status_ketuntasan} · {nilai.flag_warna}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
