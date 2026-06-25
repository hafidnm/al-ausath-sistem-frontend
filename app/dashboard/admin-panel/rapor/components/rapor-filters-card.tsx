"use client"

import { useEffect, useState, useMemo } from "react"
import { Loader2, Search, BookMarked } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { santriService, type SantriItem } from "@/lib/services/santri.service"
import { kelasService } from "@/lib/services/kelas.service"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"
import { useUnit } from "@/contexts/unit-context"

interface RaporFiltersCardProps {
  query: string
  onQueryChange: (value: string) => void
  kodeKelas: string
  onKodeKelasChange: (value: string) => void
  semester: string
  onSemesterChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
  perPage: string
  onPerPageChange: (value: string) => void
  isLoading: boolean
  onSearch: (value?: string) => void
  onReset: () => void
}

export function RaporFiltersCard({
  query,
  onQueryChange,
  kodeKelas,
  onKodeKelasChange,
  semester,
  onSemesterChange,
  status,
  onStatusChange,
  perPage,
  onPerPageChange,
  isLoading,
  onSearch,
  onReset,
}: RaporFiltersCardProps) {
  const { selectedTahunAjaran } = useTahunAjaran()
  const { selectedUnit } = useUnit()
  const kodeUnitFromContext = selectedUnit?.kode_unit?.toUpperCase() ?? ""

  // Raw kelas options (all, unfiltered)
  const [rawKelasOptions, setRawKelasOptions] = useState<{ value: string; label: string; kode_unit?: string; jenjang?: string }[]>([])

  // Santri for selected kelas
  const [classSantris, setClassSantris] = useState<SantriItem[]>([])
  const [isLoadingSantri, setIsLoadingSantri] = useState(false)

  // Load all kelas on mount
  useEffect(() => {
    kelasService.getAll({ status: "AKTIF", per_page: "200" })
      .then(res => setRawKelasOptions(res.map(k => ({
        value: k.kode_kelas ?? "",
        label: k.nama_kelas ?? k.kode_kelas ?? "",
        kode_unit: k.kode_unit,
        jenjang: k.jenjang,
      }))))
      .catch(console.error)
  }, [])

  // Filter kelas by unit from header
  const displayedKelasOptions = useMemo(() => {
    let filtered = rawKelasOptions
    if (kodeUnitFromContext) {
      filtered = filtered.filter(item =>
        !item.kode_unit || item.kode_unit.toUpperCase() === kodeUnitFromContext
      )
    }
    return filtered
  }, [rawKelasOptions, kodeUnitFromContext])

  // When unit changes, reset kelas and santri selections if no longer valid
  useEffect(() => {
    if (!kodeUnitFromContext) return
    if (kodeKelas === "all") return
    const stillValid = displayedKelasOptions.some(k => k.value === kodeKelas)
    if (!stillValid) {
      onKodeKelasChange("all")
      onQueryChange("")
    }
  }, [kodeUnitFromContext, displayedKelasOptions, kodeKelas, onKodeKelasChange, onQueryChange])

  // When kelas changes, load santri for that kelas
  useEffect(() => {
    if (!kodeKelas || kodeKelas === "all") {
      setClassSantris([])
      return
    }

    let cancelled = false
    setIsLoadingSantri(true)

    santriService.getAll({ kode_kelas: kodeKelas, status: "AKTIF", per_page: "200" })
      .then(res => {
        if (!cancelled) {
          let results = res
          if (kodeUnitFromContext) {
            results = results.filter(r => !r.kode_unit || r.kode_unit.toUpperCase() === kodeUnitFromContext)
          }
          setClassSantris(results)
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setIsLoadingSantri(false)
      })

    return () => { cancelled = true }
  }, [kodeKelas, kodeUnitFromContext])

  // When kelas changes, reset santri if no longer in list
  useEffect(() => {
    if (kodeKelas === "all" && query) {
      onQueryChange("")
    } else if (kodeKelas !== "all" && classSantris.length > 0 && query) {
      if (!classSantris.find(s => s.nomor_induk === query)) {
        onQueryChange("")
      }
    }
  }, [kodeKelas, classSantris, query, onQueryChange])

  const handleSearch = () => {
    onSearch(query.trim() || undefined)
  }

  const handleReset = () => {
    onKodeKelasChange("all")
    onQueryChange("")
    setClassSantris([])
    onReset()
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Filter Pencarian</CardTitle>
        <CardDescription>Pilih kelas lalu santri untuk mencari data rapor</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Row 1: Tahun Ajaran (from header) */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="tahun-ajaran">Tahun Ajaran</Label>
            <div className="flex h-10 mt-2 items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm">
              <BookMarked className="w-4 h-4 text-primary shrink-0" />
              <span className="flex-1 truncate text-foreground">{selectedTahunAjaran?.nama_tahun || "Belum dipilih"}</span>
              <Badge variant="secondary" className="text-xs shrink-0">Dari Header</Badge>
            </div>
          </div>
          <div>
            <Label>Unit</Label>
            <div className="flex h-10 mt-2 items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm">
              <span className="flex-1 truncate text-foreground">{selectedUnit?.nama_unit || "Semua Unit"}</span>
              <Badge variant="secondary" className="text-xs shrink-0">Dari Header</Badge>
            </div>
          </div>
        </div>

        {/* Row 2: Kelas & Santri (cascading) */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Kelas</Label>
            <Select value={kodeKelas} onValueChange={onKodeKelasChange}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Pilih Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {displayedKelasOptions.map(k => (
                  <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Santri</Label>
            <Select
              value={query || "none"}
              onValueChange={(val) => {
                const selected = val === "none" ? "" : val
                onQueryChange(selected)
              }}
              disabled={kodeKelas === "all" || isLoadingSantri}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder={
                  kodeKelas === "all" ? "Pilih kelas dulu" :
                  isLoadingSantri ? "Memuat santri..." :
                  "Pilih Santri"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" disabled>
                  {kodeKelas === "all" ? "Pilih kelas dulu" : "Pilih Santri"}
                </SelectItem>
                {classSantris.map(s => (
                  <SelectItem key={s.id} value={s.nomor_induk}>
                    {s.nomor_induk} - {s.nama_lengkap}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 3: Semester, Status, Per Halaman */}
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>Semester</Label>
            <Select value={semester} onValueChange={onSemesterChange}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={onStatusChange}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="DRAFT">DRAFT</SelectItem>
                <SelectItem value="TERBIT">TERBIT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Per halaman</Label>
            <Select value={perPage} onValueChange={onPerPageChange}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Per halaman" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Cari
          </Button>
          <Button variant="outline" className="bg-transparent" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
