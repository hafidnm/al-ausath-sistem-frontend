"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BookMarked } from "lucide-react"
import { semesterOptions } from "../utils/constants"
import { dataKelasMapelService } from "@/lib/services/kelas-mapel.service"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"
import { useUnit } from "@/contexts/unit-context"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"

interface KkmFiltersProps {
  query: string
  onQueryChange: (value: string) => void
  semester: string
  onSemesterChange: (value: string) => void
  perPage: string
  onPerPageChange: (value: string) => void
  kodeKelas: string
  onKodeKelasChange: (value: string) => void
  onValidMapelsChange?: (mapels: string[]) => void
}

export function KkmFilters({
  query,
  onQueryChange,
  semester,
  onSemesterChange,
  perPage,
  onPerPageChange,
  kodeKelas,
  onKodeKelasChange,
  onValidMapelsChange,
}: KkmFiltersProps) {
  const { selectedTahunAjaran, selectedKodeTahun } = useTahunAjaran()
  const { selectedUnit } = useUnit()
  const kodeUnitFromContext = selectedUnit?.kode_unit ?? ""

  const [rawKelasOptions, setRawKelasOptions] = useState<{ value: string; label: string; kode_unit?: string }[]>([])
  const [rawMapelOptions, setRawMapelOptions] = useState<{ value: string; label: string; kode_unit?: string }[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)

  // Load options from data_kelas_mapel
  useEffect(() => {
    if (!selectedKodeTahun) return

    let cancelled = false
    setIsLoadingOptions(true)

    dataKelasMapelService.getAll({
      kode_unit: kodeUnitFromContext || undefined,
      tahun_ajaran: selectedKodeTahun,
      status: "AKTIF",
      per_page: "200",
    })
      .then(res => {
        if (!cancelled) {
          const kelasMap = new Map<string, { value: string; label: string; kode_unit?: string }>()
          const mapelMap = new Map<string, { value: string; label: string; kode_unit?: string }>()

          for (const item of res.data || []) {
            const kodeKelas = item.kode_kelas ?? item.kelas?.kode_kelas
            const namaKelas = item.nama_kelas ?? item.kelas?.nama_kelas ?? kodeKelas
            const kodeMapel = item.kode_mapel ?? item.mapel?.kode_mapel ?? item.mata_pelajaran?.kode_mapel ?? item.mataPelajaran?.kode_mapel
            const namaMapel = item.nama_mapel ?? item.mapel?.nama_mapel ?? item.mata_pelajaran?.nama_mapel ?? item.mataPelajaran?.nama_mapel ?? kodeMapel
            const unit = item.kode_unit ?? item.kelas?.kode_unit ?? undefined

            if (kodeKelas && !kelasMap.has(kodeKelas)) {
              kelasMap.set(kodeKelas, { value: kodeKelas, label: namaKelas ?? kodeKelas, kode_unit: unit })
            }

            if (kodeMapel && !mapelMap.has(kodeMapel)) {
              mapelMap.set(kodeMapel, { value: kodeMapel, label: namaMapel ?? kodeMapel, kode_unit: unit })
            }
          }

          setRawKelasOptions(Array.from(kelasMap.values()))
          setRawMapelOptions(Array.from(mapelMap.values()))
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setIsLoadingOptions(false)
      })

    return () => { cancelled = true }
  }, [kodeUnitFromContext, selectedKodeTahun])

  const mapelOptions = rawMapelOptions

  // Inform parent of valid mapels if kodeKelas is selected
  useEffect(() => {
    if (onValidMapelsChange) {
      if (kodeKelas && kodeKelas !== "all") {
        // Find all mapels that are actually assigned to this class
        dataKelasMapelService.getAll({
          kode_kelas: kodeKelas,
          tahun_ajaran: selectedKodeTahun,
          per_page: "200"
        }).then(res => {
          const mapelsForClass = Array.from(new Set(res.data.map(m => m.kode_mapel).filter(Boolean) as string[]))
          onValidMapelsChange(mapelsForClass)
        })
      } else {
        onValidMapelsChange([])
      }
    }
  }, [kodeKelas, selectedKodeTahun, onValidMapelsChange])

  // Reset selected mapel when unit changes and current selection is no longer valid
  useEffect(() => {
    if (query && mapelOptions.length > 0) {
      if (!mapelOptions.find(m => m.value === query)) {
        onQueryChange("")
      }
    }
  }, [mapelOptions, query, onQueryChange])

  // Reset selected mapel if class changes
  useEffect(() => {
    if (kodeKelas !== "all") {
       onQueryChange("")
    }
  }, [kodeKelas, onQueryChange])

  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        {/* Header info */}
        <div className="grid gap-4 md:grid-cols-2 mb-4">
          <div>
            <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm">
              <BookMarked className="w-4 h-4 text-primary shrink-0" />
              <span className="flex-1 truncate text-foreground">{selectedTahunAjaran?.nama_tahun || "Belum dipilih"}</span>
              <Badge variant="secondary" className="text-xs shrink-0">Dari Header</Badge>
            </div>
          </div>
          <div>
            <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm">
              <span className="flex-1 truncate text-foreground">{selectedUnit?.nama_unit || "Semua Unit"}</span>
              <Badge variant="secondary" className="text-xs shrink-0">Dari Header</Badge>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid gap-3 lg:grid-cols-4">
          <Select
            value={kodeKelas || "all"}
            onValueChange={(val) => onKodeKelasChange(val === "all" ? "" : val)}
            disabled={isLoadingOptions}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={isLoadingOptions ? "Memuat kelas..." : "Semua Kelas"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelas</SelectItem>
              {rawKelasOptions.map(k => (
                <SelectItem key={k.value} value={k.value}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Mapel dropdown */}
          <Select
            value={query || "all"}
            onValueChange={(val) => onQueryChange(val === "all" ? "" : val)}
            disabled={isLoadingOptions || (kodeKelas && kodeKelas !== "all")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={
                kodeKelas && kodeKelas !== "all" ? "Tampil Berdasarkan Kelas" :
                isLoadingOptions ? "Memuat mapel..." : "Semua Mapel"
              } />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Mapel</SelectItem>
              {mapelOptions.map(m => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={semester} onValueChange={onSemesterChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Semester</SelectItem>
              {semesterOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={perPage} onValueChange={onPerPageChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 Baris</SelectItem>
              <SelectItem value="20">20 Baris</SelectItem>
              <SelectItem value="50">50 Baris</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
