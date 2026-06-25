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
import { mataPelajaranService } from "@/lib/services/mata-pelajaran.service"
import { useMemo } from "react"

interface NilaiMapelFiltersProps {
  nomorInduk: string
  onNomorIndukChange: (value: string) => void
  kodeMapel: string
  onKodeMapelChange: (value: string) => void
  kodeKelas: string
  onKodeKelasChange: (value: string) => void
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
  semester,
  onSemesterChange,
  perPage,
  onPerPageChange,
  onApply,
}: NilaiMapelFiltersProps) {
  const [classSantris, setClassSantris] = useState<SantriItem[]>([])
  const [isLoadingSantri, setIsLoadingSantri] = useState(false)

  const [rawKelasOptions, setRawKelasOptions] = useState<{value: string, label: string, kode_unit?: string}[]>([])
  const [rawMapelOptions, setRawMapelOptions] = useState<{value: string, label: string, kode_unit?: string}[]>([])

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

    mataPelajaranService.getAll({ status: "AKTIF", per_page: "200" })
      .then(res => {
        setRawMapelOptions(res.map(m => ({
          value: m.kode_mapel ?? "",
          label: `${m.kode_mapel} - ${m.nama_mapel}`,
          kode_unit: m.kode_unit ?? undefined
        })))
      })
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

  const displayedMapelOptions = useMemo(() => {
    let filtered = rawMapelOptions
    if (kodeUnitFromContext) {
      filtered = filtered.filter(item => 
        !item.kode_unit || item.kode_unit.toUpperCase() === kodeUnitFromContext
      )
    }
    return filtered
  }, [rawMapelOptions, kodeUnitFromContext])

  useEffect(() => {
    if (kodeKelas && kodeKelas !== "all") {
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
        .catch(err => console.error(err))
        .finally(() => {
          if (!cancelled) setIsLoadingSantri(false)
        })

      return () => { cancelled = true }
    } else {
      setClassSantris([])
    }
  }, [kodeKelas, kodeUnitFromContext])

  useEffect(() => {
    if (kodeKelas === "all" && nomorInduk) {
      onNomorIndukChange("")
    } else if (kodeKelas !== "all" && classSantris.length > 0 && nomorInduk) {
      if (!classSantris.find(s => s.nomor_induk === nomorInduk)) {
        onNomorIndukChange("")
      }
    }
  }, [kodeKelas, classSantris, nomorInduk, onNomorIndukChange])

  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <Select value={kodeKelas} onValueChange={onKodeKelasChange}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelas</SelectItem>
              {displayedKelasOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={nomorInduk || "none"} 
            onValueChange={(val) => onNomorIndukChange(val === "none" ? "" : val)}
            disabled={kodeKelas === "all" || isLoadingSantri}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                kodeKelas === "all" ? "Pilih kelas dulu" : 
                isLoadingSantri ? "Memuat siswa..." : 
                "Pilih Siswa"
              } />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" disabled>
                {kodeKelas === "all" ? "Pilih kelas dulu" : "Pilih Siswa"}
              </SelectItem>
              {classSantris.map((item) => (
                <SelectItem key={item.id} value={item.nomor_induk}>
                  {item.nomor_induk} - {item.nama_lengkap}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={kodeMapel} onValueChange={onKodeMapelChange}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Mapel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Mapel</SelectItem>
              {displayedMapelOptions.map((item) => (
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
        </div>
        
        <div className="flex justify-end mt-4">
          <Button onClick={onApply}>Tampilkan Data</Button>
        </div>
      </CardContent>
    </Card>
  )
}
