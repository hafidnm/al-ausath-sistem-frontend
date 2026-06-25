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
import { mataPelajaranService } from "@/lib/services/mata-pelajaran.service"
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
}

export function KkmFilters({
  query,
  onQueryChange,
  semester,
  onSemesterChange,
  perPage,
  onPerPageChange,
}: KkmFiltersProps) {
  const { selectedTahunAjaran } = useTahunAjaran()
  const { selectedUnit } = useUnit()
  const kodeUnitFromContext = selectedUnit?.kode_unit ?? ""

  const [mapelOptions, setMapelOptions] = useState<{ kode_mapel: string; nama_mapel: string }[]>([])
  const [isLoadingMapel, setIsLoadingMapel] = useState(false)

  // Load mapel filtered by unit from header
  useEffect(() => {
    let cancelled = false
    setIsLoadingMapel(true)

    mataPelajaranService.getAll({
      kode_unit: kodeUnitFromContext || undefined,
      status: "AKTIF",
      per_page: 200,
    })
      .then(rows => {
        if (!cancelled) {
          setMapelOptions(rows.map(m => ({
            kode_mapel: m.kode_mapel ?? "",
            nama_mapel: m.nama_mapel ?? m.kode_mapel ?? "",
          })).filter(m => m.kode_mapel))
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setIsLoadingMapel(false)
      })

    return () => { cancelled = true }
  }, [kodeUnitFromContext])

  // Reset selected mapel when unit changes and current selection is no longer valid
  useEffect(() => {
    if (query && mapelOptions.length > 0) {
      if (!mapelOptions.find(m => m.kode_mapel === query)) {
        onQueryChange("")
      }
    }
  }, [mapelOptions, query, onQueryChange])

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
        <div className="grid gap-3 lg:grid-cols-3">
          {/* Mapel dropdown — filtered by unit from header */}
          <Select
            value={query || "all"}
            onValueChange={(val) => onQueryChange(val === "all" ? "" : val)}
            disabled={isLoadingMapel}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={isLoadingMapel ? "Memuat mapel..." : "Pilih Mapel"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Mapel</SelectItem>
              {mapelOptions.map(m => (
                <SelectItem key={m.kode_mapel} value={m.kode_mapel}>
                  {m.nama_mapel} ({m.kode_mapel})
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
