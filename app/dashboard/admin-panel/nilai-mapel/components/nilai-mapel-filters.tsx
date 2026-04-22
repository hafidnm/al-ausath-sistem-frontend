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
import { semesterOptions, tahunAjaranOptions } from "../utils/constants"

interface NilaiMapelFiltersProps {
  nomorInduk: string
  onNomorIndukChange: (value: string) => void
  kodeMapel: string
  onKodeMapelChange: (value: string) => void
  kodeKelas: string
  onKodeKelasChange: (value: string) => void
  tahunAjaran: string
  onTahunAjaranChange: (value: string) => void
  semester: string
  onSemesterChange: (value: string) => void
  perPage: string
  onPerPageChange: (value: string) => void
  onApply?: () => void
}

export function NilaiMapelFilters({
  nomorInduk,
  onNomorIndukChange,
  kodeMapel,
  onKodeMapelChange,
  kodeKelas,
  onKodeKelasChange,
  tahunAjaran,
  onTahunAjaranChange,
  semester,
  onSemesterChange,
  perPage,
  onPerPageChange,
  onApply,
}: NilaiMapelFiltersProps) {
  const [selectedNama, setSelectedNama] = useState("")
  const [selectedSantriId, setSelectedSantriId] = useState<number | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const [santriResults, setSantriResults] = useState<SantriItem[]>([])
  const [isLoadingSantri, setIsLoadingSantri] = useState(false)
  const [santriSearchError, setSantriSearchError] = useState("")
  const [openSantriPopover, setOpenSantriPopover] = useState(false)

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
        const results = await santriService.search(searchInput.trim())
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="relative">
            <Input
              value={nomorInduk && !searchInput ? `${nomorInduk}${selectedNama ? " - " + selectedNama : ""}` : searchInput}
              placeholder="Nomor induk (wajib)"
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

          <Input
            value={kodeMapel}
            onChange={(e) => onKodeMapelChange(e.target.value)}
            placeholder="Filter kode mapel"
          />

          <Input
            value={kodeKelas}
            onChange={(e) => onKodeKelasChange(e.target.value)}
            placeholder="Filter kode kelas"
          />

          <Select value={tahunAjaran} onValueChange={onTahunAjaranChange}>
            <SelectTrigger>
              <SelectValue placeholder="Tahun Ajaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tahun</SelectItem>
              {tahunAjaranOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={semester} onValueChange={onSemesterChange}>
            <SelectTrigger>
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
            <SelectTrigger>
              <SelectValue placeholder="Per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>

          <div className="xl:col-span-2 flex justify-end">
            <Button onClick={onApply}>Tampilkan Data</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
