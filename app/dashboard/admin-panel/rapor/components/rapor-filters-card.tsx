"use client"

import { useEffect, useState } from "react"
import { Loader2, Search, BookMarked } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check } from "lucide-react"
import { santriService, type SantriItem } from "@/lib/services/santri.service"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"

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
  const [selectedSantriId, setSelectedSantriId] = useState<number | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const [santriResults, setSantriResults] = useState<SantriItem[]>([])
  const [isLoadingSantri, setIsLoadingSantri] = useState(false)
  const [santriSearchError, setSantriSearchError] = useState("")
  const [openSantriPopover, setOpenSantriPopover] = useState(false)

  const applySelectedSantri = (santri: SantriItem) => {
    const selectedValue = santri.nomor_induk.trim()
    onQueryChange(selectedValue)
    setSelectedSantriId(santri.id)
    setSearchInput("")
    setOpenSantriPopover(false)
    onSearch(selectedValue)
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
    const normalizedQuery = query.trim()
    if (!normalizedQuery) {
      setSelectedSantriId(null)
      setSearchInput("")
    }
  }, [query])

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Filter Pencarian</CardTitle>
        <CardDescription>Gunakan nama atau nomor induk untuk mencari data rapor yang sudah ada</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Label htmlFor="search-rapor">Cari nama / nomor induk</Label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search-rapor"
                value={searchInput || query}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return
                  event.preventDefault()

                  const keyword = searchInput.trim().toLowerCase()
                  if (!keyword) return

                  if (santriResults.length === 0) {
                    onQueryChange(searchInput.trim())
                    onSearch(searchInput.trim())
                    return
                  }

                  const exact = santriResults.find((item) => item.nomor_induk.trim().toLowerCase() === keyword)
                  applySelectedSantri(exact ?? santriResults[0])
                }}
                onChange={(event) => {
                  const value = event.target.value
                  setSearchInput(value)
                  setSelectedSantriId(null)
                  onQueryChange(value)
                  setOpenSantriPopover(true)
                }}
                onFocus={() => setOpenSantriPopover(true)}
                onBlur={() => setTimeout(() => setOpenSantriPopover(false), 120)}
                placeholder="Contoh: Ahmad Fauzi atau 2025001"
                className="pl-9"
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
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => applySelectedSantri(santri)}
                        >
                          <Check
                            className={`mt-0.5 h-4 w-4 ${
                              selectedSantriId === santri.id ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          <div className="flex-1">
                            <div className="font-medium">
                              {santri.nomor_induk} - {santri.nama_lengkap}
                            </div>
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
          </div>
          <div>
            <Label htmlFor="tahun-ajaran">Tahun Ajaran</Label>
            <div className="flex h-10 mt-2 items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm">
              <BookMarked className="w-4 h-4 text-primary shrink-0" />
              <span className="flex-1 truncate text-foreground">{selectedTahunAjaran?.nama_tahun || "Belum dipilih"}</span>
              <Badge variant="secondary" className="text-xs shrink-0">Dari Header</Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <Label>Kelas</Label>
            <Input className="mt-2" value={kodeKelas} onChange={(event) => onKodeKelasChange(event.target.value.trim() || "all")} placeholder="Kode kelas atau 'all' untuk semua" />
            <p className="text-xs text-muted-foreground mt-1">Ketik 'all' untuk menampilkan semua kelas</p>
          </div>
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

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onSearch(searchInput.trim() || query.trim())} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Cari
          </Button>
          <Button variant="outline" className="bg-transparent" onClick={onReset}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
