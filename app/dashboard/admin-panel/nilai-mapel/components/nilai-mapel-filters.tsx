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
import { Check, Loader2 } from "lucide-react"
import { santriService, type SantriItem } from "@/lib/services/santri.service"
import { semesterOptions } from "../utils/constants"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"
import { useUnit } from "@/contexts/unit-context"
import { dataKelasMapelService } from "@/lib/services/kelas-mapel.service"
import { getCachedUser } from "@/lib/auth-cache"
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

const normalizeRoleValue = (value: unknown): string[] => {
  if (value == null) return []
  if (Array.isArray(value)) {
    return value.flat(Infinity).filter(Boolean).map(String).map((v) => v.trim().toLowerCase())
  }
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          return parsed.flat(Infinity).filter(Boolean).map(String).map((v) => v.trim().toLowerCase())
        }
      } catch {
        // ignore
      }
    }
    return [trimmed.toLowerCase()]
  }
  return [String(value).trim().toLowerCase()]
}

const hasRole = (me: any, targetRole: string): boolean => {
  const roles = normalizeRoleValue(me?.user?.peran_akun ?? me?.peran_akun)
  return roles.includes(targetRole.toLowerCase())
}

const extractPetugasInputId = (me: any): number | undefined => {
  const candidates = [
    me?.user?.id_petugas,
    me?.user?.petugas?.id_petugas,
    me?.user?.petugas_id,
    me?.user?.idDataPetugas,
    me?.user?.data_petugas?.id,
    me?.id_petugas,
    me?.petugas?.id_petugas,
    me?.petugas_id,
    me?.idDataPetugas,
    me?.data_petugas?.id,
    me?.user?.id,
    me?.id,
  ]
  for (const candidate of candidates) {
    const id = Number(candidate)
    if (Number.isFinite(id) && id > 0) return id
  }
  return undefined
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
  const { selectedTahunAjaran, selectedKodeTahun } = useTahunAjaran()
  const [classSantris, setClassSantris] = useState<SantriItem[]>([])
  const [isLoadingSantri, setIsLoadingSantri] = useState(false)
  const [isOptionsLoading, setIsOptionsLoading] = useState(false)

  const [rawKelasOptions, setRawKelasOptions] = useState<{value: string, label: string, kode_unit?: string}[]>([])
  const [rawMapelOptions, setRawMapelOptions] = useState<{value: string, label: string, kode_unit?: string}[]>([])

  const { selectedUnit } = useUnit()
  const kodeUnitFromContext = selectedUnit?.kode_unit?.toUpperCase() ?? ""
  const tahunAjaranFromContext = selectedTahunAjaran?.nama_tahun ?? ""

  useEffect(() => {
    const fetchOptions = async () => {
      setIsOptionsLoading(true)

      const me = await getCachedUser()
      const petugasId = extractPetugasInputId(me)
      const isAdmin = hasRole(me, "Petugas Admin")

      const params: any = {
        per_page: 200,
        include_wali: true,
      }

      if (!tahunAjaranFromContext) {
        setRawKelasOptions([])
        setRawMapelOptions([])
        setIsOptionsLoading(false)
        return
      }

      if (kodeUnitFromContext) {
        params.kode_unit = kodeUnitFromContext
      }
      params.tahun_ajaran = selectedKodeTahun // dataKelasMapelService butuh kode_tahun (2026/2027)

      if (semester !== "all") {
        params.semester = Number(semester)
      }

      if (!isAdmin) {
        if (!petugasId) {
          setRawKelasOptions([])
          setRawMapelOptions([])
          setIsOptionsLoading(false)
          return
        }
        params.id_petugas = petugasId
      }

      try {
        const { data } = await dataKelasMapelService.getAll(params)

        const kelasMap = new Map<string, { value: string; label: string; kode_unit?: string }>()
        const mapelMap = new Map<string, { value: string; label: string; kode_unit?: string }>()

        for (const item of data) {
          const kodeKelas = item.kode_kelas ?? item.kelas?.kode_kelas
          const namaKelas = item.nama_kelas ?? item.kelas?.nama_kelas ?? kodeKelas
          const kodeMapel = item.kode_mapel ?? item.mapel?.kode_mapel ?? item.mata_pelajaran?.kode_mapel ?? item.mataPelajaran?.kode_mapel
          const namaMapel = item.nama_mapel ?? item.mapel?.nama_mapel ?? item.mata_pelajaran?.nama_mapel ?? item.mataPelajaran?.nama_mapel ?? kodeMapel
          const kodeUnit = item.kode_unit ?? item.kelas?.kode_unit ?? undefined

          if (kodeKelas && !kelasMap.has(kodeKelas)) {
            kelasMap.set(kodeKelas, {
              value: kodeKelas,
              label: namaKelas ?? kodeKelas,
              kode_unit: kodeUnit,
            })
          }

          if (kodeMapel && !mapelMap.has(kodeMapel)) {
            mapelMap.set(kodeMapel, {
              value: kodeMapel,
              label: namaMapel ?? kodeMapel,
              kode_unit: kodeUnit,
            })
          }
        }

        setRawKelasOptions(Array.from(kelasMap.values()))
        setRawMapelOptions(Array.from(mapelMap.values()))
      } catch (error) {
        console.error(error)
        setRawKelasOptions([])
        setRawMapelOptions([])
      } finally {
        setIsOptionsLoading(false)
      }
    }

    fetchOptions()
  }, [kodeUnitFromContext, tahunAjaranFromContext, semester])

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

  useEffect(() => {
    if (kodeKelas && kodeKelas !== "all" && !displayedKelasOptions.some((item) => item.value === kodeKelas)) {
      onKodeKelasChange("all")
    }

    if (kodeMapel && kodeMapel !== "all" && !displayedMapelOptions.some((item) => item.value === kodeMapel)) {
      onKodeMapelChange("all")
    }
  }, [displayedKelasOptions, displayedMapelOptions, kodeKelas, kodeMapel, onKodeKelasChange, onKodeMapelChange])

  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <Select value={kodeKelas} onValueChange={onKodeKelasChange}>
            <SelectTrigger>
              <div className="flex items-center justify-between gap-2">
                <SelectValue placeholder={isOptionsLoading ? "Memuat kelas..." : "Semua Kelas"} />
                {isOptionsLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
              </div>
            </SelectTrigger>
            <SelectContent>
              {isOptionsLoading ? (
                <SelectItem value="loading-kelas" disabled>
                  Memuat kelas...
                </SelectItem>
              ) : (
                <>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {displayedKelasOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </>
              )}
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
              <div className="flex items-center justify-between gap-2">
                <SelectValue placeholder={isOptionsLoading ? "Memuat mapel..." : "Semua Mapel"} />
                {isOptionsLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
              </div>
            </SelectTrigger>
            <SelectContent>
              {isOptionsLoading ? (
                <SelectItem value="loading-mapel" disabled>
                  Memuat mapel...
                </SelectItem>
              ) : (
                <>
                  <SelectItem value="all">Semua Mapel</SelectItem>
                  {displayedMapelOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </>
              )}
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
