"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Check } from "lucide-react"
import { santriService, type SantriItem } from "@/lib/services/santri.service"
import { semesterOptions } from "../utils/constants"
import { useUnit } from "@/contexts/unit-context"
import { kelasService } from "@/lib/services/kelas.service"
import { useMemo } from "react"

interface NilaiAkhlakFiltersProps {
  kodeKelas: string
  onKodeKelasChange: (value: string) => void
  nomorInduk: string
  onNomorIndukChange: (value: string) => void
  semester: string
  onSemesterChange: (value: string) => void
  aspek: string
  onAspekChange: (value: string) => void
  perPage: string
  onPerPageChange: (value: string) => void
  onApply?: () => void
}

export function NilaiAkhlakFilters({
  kodeKelas,
  onKodeKelasChange,
  nomorInduk,
  onNomorIndukChange,
  semester,
  onSemesterChange,
  aspek,
  onAspekChange,
  perPage,
  onPerPageChange,
  onApply,
}: NilaiAkhlakFiltersProps) {
  const [selectedNama, setSelectedNama] = useState("")
  const [selectedSantriId, setSelectedSantriId] = useState<number | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const [santriResults, setSantriResults] = useState<SantriItem[]>([])
  const [isLoadingSantri, setIsLoadingSantri] = useState(false)
  const [santriSearchError, setSantriSearchError] = useState("")
  const [openSantriPopover, setOpenSantriPopover] = useState(false)

  const [rawKelasOptions, setRawKelasOptions] = useState<{value: string, label: string, kode_unit?: string}[]>([])

  const { selectedUnit } = useUnit()
  const kodeUnitFromContext = selectedUnit?.kode_unit?.toUpperCase() ?? ""

  useEffect(() => {
    kelasService.getAll({ status: "AKTIF", per_page: "200" })
      .then(res => setRawKelasOptions(res.map(k => ({ 
        value: k.kode_kelas ?? "", 
        label: k.nama_kelas ?? k.kode_kelas ?? "",
        kode_unit: k.kode_unit
      }))))
      .catch(console.error)
  }, [])

  const displayedKelasOptions = useMemo(() => {
    let filtered = rawKelasOptions
    if (kodeUnitFromContext) {
      filtered = filtered.filter(item => 
        !item.kode_unit || item.kode_unit.toUpperCase() === kodeUnitFromContext
      )
    }
    return filtered
  }, [rawKelasOptions, kodeUnitFromContext])

  const applySelectedSantri = (santri: SantriItem) => {
    onNomorIndukChange(santri.nomor_induk)
    setSelectedNama(santri.nama_lengkap ?? "")
    setSelectedSantriId(santri.id)
    setSearchInput("")
    setOpenSantriPopover(false)
  }

  useEffect(() => {
    if (!searchInput.trim()) {
      setSantriResults([])
      setSantriSearchError("")
      return
    }

    let cancelled = false

    const searchSantri = async () => {
      try {
        setIsLoadingSantri(true)
        setSantriSearchError("")
        let results = await santriService.search(searchInput.trim())
        
        if (kodeUnitFromContext) {
          results = results.filter(r => !r.kode_unit || r.kode_unit.toUpperCase() === kodeUnitFromContext)
        }

        if (!cancelled) {
          setSantriResults(results)
        }
      } catch {
        if (!cancelled) {
          setSantriResults([])
          setSantriSearchError("Gagal mengambil data santri dari server")
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSantri(false)
        }
      }
    }

    const timer = setTimeout(searchSantri, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [searchInput])

  useEffect(() => {
    const query = searchInput.trim().toLowerCase()
    if (!query || selectedSantriId) return

    const exact = santriResults.find((item) => item.nomor_induk.trim().toLowerCase() === query)
    if (exact) {
      applySelectedSantri(exact)
    }
  }, [santriResults, searchInput, selectedSantriId])

  useEffect(() => {
    if (nomorInduk) return
    setSelectedNama("")
    setSelectedSantriId(null)
    setSearchInput("")
  }, [nomorInduk])

  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative w-full lg:min-w-72 lg:max-w-sm">
            <Input
              value={nomorInduk && !searchInput ? `${nomorInduk}${selectedNama ? " - " + selectedNama : ""}` : searchInput}
              placeholder="Filter santri (nomor induk / nama)..."
              onKeyDown={(e) => {
                if (e.key !== "Enter") return
                e.preventDefault()

                const query = searchInput.trim().toLowerCase()
                if (!query || santriResults.length === 0) return

                const exact = santriResults.find((item) => item.nomor_induk.trim().toLowerCase() === query)
                applySelectedSantri(exact ?? santriResults[0])
              }}
              onChange={(e) => {
                const value = e.target.value
                setSearchInput(value)
                onNomorIndukChange("")
                setSelectedNama("")
                setSelectedSantriId(null)
                setOpenSantriPopover(true)
              }}
              onFocus={() => setOpenSantriPopover(true)}
              onBlur={() => setTimeout(() => setOpenSantriPopover(false), 120)}
            />

            {openSantriPopover && (searchInput.trim() || isLoadingSantri || santriResults.length > 0) && (
              <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover p-1 shadow-md">
                {isLoadingSantri && (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">Mencari santri...</div>
                )}

                {!isLoadingSantri && santriSearchError && (
                  <div className="px-2 py-4 text-center text-sm text-destructive">{santriSearchError}</div>
                )}

                {!isLoadingSantri && !santriSearchError && santriResults.length === 0 && searchInput.trim() && (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">Tidak ada santri ditemukan</div>
                )}

                {!isLoadingSantri && santriResults.length > 0 && (
                  <div className="max-h-60 overflow-auto">
                    {santriResults.map((santri) => (
                      <button
                        key={santri.id}
                        type="button"
                        className="flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left hover:bg-accent"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applySelectedSantri(santri)}
                      >
                        <Check
                          className={`mt-0.5 h-4 w-4 ${
                            nomorInduk === santri.nomor_induk ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{santri.nomor_induk} - {santri.nama_lengkap}</div>
                          {(santri.kode_kelas ?? santri.kelas) && (
                            <div className="text-xs text-muted-foreground">{santri.kode_kelas ?? santri.kelas}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Select value={kodeKelas} onValueChange={onKodeKelasChange}>
            <SelectTrigger className="w-full lg:w-40">
              <SelectValue placeholder="Semua Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelas</SelectItem>
              {displayedKelasOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={semester} onValueChange={onSemesterChange}>
            <SelectTrigger className="w-full lg:w-36">
              <SelectValue placeholder="Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semester</SelectItem>
              {semesterOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={aspek} onValueChange={onAspekChange}>
            <SelectTrigger className="w-full lg:w-40">
              <SelectValue placeholder="Aspek" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Aspek</SelectItem>
              <SelectItem value="AKHLAK">AKHLAK</SelectItem>
            </SelectContent>
          </Select>

          <Select value={perPage} onValueChange={onPerPageChange}>
            <SelectTrigger className="w-full lg:w-28">
              <SelectValue placeholder="Per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={onApply} className="lg:ml-auto">Tampilkan</Button>
        </div>
      </CardContent>
    </Card>
  )
}
