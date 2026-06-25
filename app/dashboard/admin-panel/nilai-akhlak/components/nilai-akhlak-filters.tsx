"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
// Input component removed – selection now uses dropdown
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
  const [classSantris, setClassSantris] = useState<SantriItem[]>([])
  const [santriOptions, setSantriOptions] = useState<{value: string; label: string; nomor_induk: string}[]>([])
  const [santriMap, setSantriMap] = useState<Map<string, SantriItem>>(new Map())
  const [santriSearchError, setSantriSearchError] = useState("")
  const [openSantriPopover, setOpenSantriPopover] = useState(false);
  const [isLoadingSantri, setIsLoadingSantri] = useState(false)

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
          setSelectedSantriId(santri.id ?? null)
          setSearchInput("")
          setOpenSantriPopover(false)
        }

  useEffect(() => {
    if (kodeKelas === "all") {
      setClassSantris([])
      setSantriOptions([])
      setSantriMap(new Map())
      return
    }

    let cancelled = false
    const loadSantriByKelas = async () => {
      try {
        setIsLoadingSantri(true)
        setSantriSearchError("")
        santriService.getAll({ kode_kelas: kodeKelas, status: "AKTIF", per_page: "200" })
        .then(res => {
          if (!cancelled) {
            let results = res
            if (kodeUnitFromContext) {
               results = results.filter(r => !r.kode_unit || r.kode_unit.toUpperCase() === kodeUnitFromContext)
            }
            setClassSantris(results)
            const opts = results.map(s => ({
              value: s.id?.toString() ?? "",
              label: s.nama_lengkap ?? s.nomor_induk ?? "",
              nomor_induk: s.nomor_induk ?? ""
            }))
            setSantriOptions(opts)
            const map = new Map<string, SantriItem>()
            results.forEach(s => {
              if (s.id !== undefined) map.set(s.id.toString(), s)
            })
            setSantriMap(map)
          }
        })
      } catch {
        if (!cancelled) {
          setClassSantris([])
          setSantriSearchError("Gagal mengambil data santri dari server")
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSantri(false)
        }
      }
    }

    loadSantriByKelas()
    return () => {
      cancelled = true
    }
  }, [kodeKelas])

  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative w-full lg:min-w-72 lg:max-w-sm">
            {/* Santri select based on selected class */}
            <Select
              value={selectedSantriId?.toString() ?? ""}
              onValueChange={(val) => {
                if (val === "all") {
                  onNomorIndukChange("");
                  setSelectedSantriId(null);
                  return;
                }
                const santri = santriMap.get(val);
                if (santri) applySelectedSantri(santri);
              }}
              disabled={kodeKelas === "all"}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={kodeKelas === "all" ? "Pilih kelas dulu" : "Pilih Santri"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{kodeKelas === "all" ? "Pilih kelas dulu" : "Semua Santri"}</SelectItem>
                {santriOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                  {item.label} ({item.nomor_induk})
                </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select value={kodeKelas} onValueChange={(val) => {
            onKodeKelasChange(val);
            onNomorIndukChange("");
            setSelectedSantriId(null);
          }}>
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
