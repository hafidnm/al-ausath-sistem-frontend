"use client"

import { useEffect, useMemo, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, BookMarked, Building2 } from "lucide-react"
import api from "@/lib/axios"
import { semesterOptions } from "../utils/constants"
import { isValidKkm } from "../utils/helpers"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"
import { useUnit } from "@/contexts/unit-context"

const kodeUnitOptions = ["PAUD", "TK", "MI", "MTS", "MA"] as const

interface MapelOption {
  kode_mapel: string
  nama_mapel: string
  kode_unit?: string
}

const extractMapelList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.results)) return payload.results
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  return []
}

const toMapelOption = (raw: any): MapelOption | null => {
  if (!raw || typeof raw !== "object") return null

  const kode_mapel = String(raw.kode_mapel ?? "").trim().toUpperCase()
  const nama_mapel = String(raw.nama_mapel ?? raw.mapel ?? "").trim()
  const kode_unit = raw.kode_unit ? String(raw.kode_unit).trim().toUpperCase() : undefined

  if (!kode_mapel || !nama_mapel) return null

  return { kode_mapel, nama_mapel, kode_unit }
}

interface KkmFormPayload {
  kode_mapel: string
  tahun_ajaran: string
  semester: number
  nilai_kkm: number
  status_ketuntasan?: string
  kode_unit?: string
  keterangan?: string
}

interface KkmFormProps {
  isEdit?: boolean
  initialData?: KkmFormPayload
  submitError?: string
  onSubmit?: (data: KkmFormPayload) => Promise<void> | void
  onCancel?: () => void
}

export function KkmForm({ isEdit = false, initialData, submitError, onSubmit, onCancel }: KkmFormProps) {
  const { selectedTahunAjaran } = useTahunAjaran()
  const { selectedUnit } = useUnit()

  // Ambil tahun ajaran dan kode unit dari header context
  const tahunAjaran = initialData?.tahun_ajaran ?? selectedTahunAjaran?.nama_tahun ?? ""
  const kodeUnitFromContext = selectedUnit?.kode_unit?.toUpperCase() ?? ""

  const [kodeMapel, setKodeMapel] = useState(initialData?.kode_mapel ?? "")
  const [semester, setSemester] = useState(String(initialData?.semester ?? ""))
  const [statusKetuntasan, setStatusKetuntasan] = useState(initialData?.status_ketuntasan ?? "")
  const [nilaiKkm, setNilaiKkm] = useState(initialData?.nilai_kkm != null ? String(initialData.nilai_kkm) : "")
  const [kodeUnit, setKodeUnit] = useState(initialData?.kode_unit?.toUpperCase() ?? kodeUnitFromContext)
  const [keterangan, setKeterangan] = useState(initialData?.keterangan ?? "")
  const [mapelOptions, setMapelOptions] = useState<MapelOption[]>([])
  const [isLoadingMapel, setIsLoadingMapel] = useState(true)
  const [mapelError, setMapelError] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedMapel = useMemo(() => {
    const activeCode = kodeMapel.trim().toUpperCase()
    return mapelOptions.find((item) => item.kode_mapel === activeCode)
  }, [mapelOptions, kodeMapel])

  const displayedMapelOptions = useMemo(() => {
    let filtered = mapelOptions

    // Jika ada unit yang dipilih di header, filter mapel agar hanya menampilkan mapel untuk unit tersebut
    // atau mapel yang berlaku umum (tidak memiliki kode_unit spesifik)
    if (kodeUnitFromContext) {
      filtered = filtered.filter((item) => {
        return !item.kode_unit || item.kode_unit.toUpperCase() === kodeUnitFromContext
      })
    }

    const activeCode = kodeMapel.trim().toUpperCase()

    if (!activeCode) return filtered
    if (filtered.some((item) => item.kode_mapel === activeCode)) return filtered

    return [
      {
        kode_mapel: activeCode,
        nama_mapel: "Mapel tersimpan (tidak ditemukan di daftar aktif)",
      },
      ...filtered,
    ]
  }, [mapelOptions, kodeMapel, kodeUnitFromContext])

  const availableUnitOptions = useMemo(() => {
    if (!selectedMapel?.kode_unit) return kodeUnitOptions
    return kodeUnitOptions.filter((unit) => unit === selectedMapel.kode_unit)
  }, [selectedMapel])

  useEffect(() => {
    if (!initialData) return

    setKodeMapel(initialData.kode_mapel)
    setSemester(String(initialData.semester))
    setNilaiKkm(initialData.nilai_kkm != null ? String(initialData.nilai_kkm) : "")
    setStatusKetuntasan(initialData.status_ketuntasan ?? "")  
    setKodeUnit(initialData.kode_unit?.toUpperCase() ?? kodeUnitFromContext)
    setKeterangan(initialData.keterangan ?? "")
  }, [initialData, kodeUnitFromContext])

  // Sync kodeUnit jika context unit berubah dan tidak ada initialData
  useEffect(() => {
    if (!initialData && kodeUnitFromContext) {
      setKodeUnit(kodeUnitFromContext)
    }
  }, [kodeUnitFromContext, initialData])

  useEffect(() => {
    if (!selectedMapel) return

    if (selectedMapel.kode_unit) {
      setKodeUnit(selectedMapel.kode_unit)
    }
  }, [selectedMapel])

  const parsedNilaiKkm = useMemo(() => Number(nilaiKkm), [nilaiKkm])

  useEffect(() => {
    const fetchMapelOptions = async () => {
      try {
        setIsLoadingMapel(true)
        setMapelError("")

        const response = await api.get("/akademik/mata-pelajaran", {
          params: {
            per_page: 200,
          },
        })

        const rows = extractMapelList(response.data)
        const normalized = rows
          .map(toMapelOption)
          .filter((item): item is MapelOption => item !== null)
          .sort((a, b) => a.kode_mapel.localeCompare(b.kode_mapel))

        setMapelOptions(normalized)
      } catch {
        setMapelError("Gagal memuat daftar mata pelajaran")
      } finally {
        setIsLoadingMapel(false)
      }
    }

    fetchMapelOptions()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const normalizedKodeMapel = kodeMapel.trim().toUpperCase()
    const normalizedUnit = kodeUnit.trim().toUpperCase()

    if (!normalizedKodeMapel || !tahunAjaran || !semester || !statusKetuntasan || !nilaiKkm) {
      setError("Field wajib belum lengkap")
      return
    }

    if (!isValidKkm(parsedNilaiKkm)) {
      setError("Nilai KKM harus di antara 0 sampai 100")
      return
    }

    try {
      setIsSubmitting(true)
      setError("")

      await onSubmit?.({
        kode_mapel: normalizedKodeMapel,
        tahun_ajaran: tahunAjaran,
        semester: Number(semester),
        nilai_kkm: parsedNilaiKkm,
        status_ketuntasan: statusKetuntasan?.trim() || undefined,
        kode_unit: normalizedUnit || undefined,
        keterangan,
      })
    } catch {
      // Error API ditangani oleh parent melalui submitError.
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">{isEdit ? "Edit KKM" : "Tambah KKM"}</CardTitle>
        <CardDescription>Isi data KKM mapel sesuai semester dan tahun ajaran</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <Alert className="bg-destructive/10 border-destructive/30">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <AlertDescription className="text-destructive ml-2">{error}</AlertDescription>
            </Alert>
          )}

          {!error && submitError && (
            <Alert className="bg-destructive/10 border-destructive/30">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <AlertDescription className="text-destructive ml-2">{submitError}</AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kode Mapel</Label>
              <Select
                value={kodeMapel}
                onValueChange={(v) => { setKodeMapel(v); setError("") }}
                disabled={isEdit || isLoadingMapel || displayedMapelOptions.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingMapel ? "Memuat mata pelajaran..." : "Pilih mata pelajaran"} />
                </SelectTrigger>
                <SelectContent>
                  {displayedMapelOptions.map((item) => (
                    <SelectItem key={item.kode_mapel} value={item.kode_mapel}>
                      {item.kode_mapel} - {item.nama_mapel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {mapelError && <p className="text-sm text-destructive">{mapelError}</p>}
            </div>

            <div className="space-y-2">
              <Label>Tahun Ajaran</Label>
              <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm">
                <BookMarked className="w-4 h-4 text-primary shrink-0" />
                <span className="flex-1 truncate text-foreground">{tahunAjaran || "Belum dipilih"}</span>
                <Badge variant="secondary" className="text-xs shrink-0">Dari Header</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Diambil dari pilihan Tahun Ajaran di header.</p>
            </div>

            <div className="space-y-2">
              <Label>Semester</Label>
              <Select value={semester} onValueChange={(v) => { setSemester(v); setError("") }} disabled={isEdit}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesterOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nilai KKM</Label>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="0"
                value={nilaiKkm}
                onChange={(e) => { setNilaiKkm(e.target.value); setError("") }}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Status Ketuntasan <span className="text-muted-foreground font-normal">(opsional)</span></Label>
              <div className="flex flex-wrap gap-4">
                {["menguasai", "ahli", "menerapkan"].map((opt) => (
                  <label key={opt} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="status_ketuntasan"
                      value={opt}
                      checked={statusKetuntasan === opt}
                      onChange={() => setStatusKetuntasan(opt)}
                    />
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </label>
                ))}
                {statusKetuntasan && (  
                  <button type="button" onClick={() => setStatusKetuntasan("")} className="text-xs text-muted-foreground underline">
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kode Unit</Label>
              {selectedUnit ? (
                <>
                  <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm">
                    <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="flex-1 truncate text-foreground">{kodeUnit || selectedUnit.nama_unit}</span>
                    <Badge variant="secondary" className="text-xs shrink-0">Dari Header</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Diambil dari pilihan Unit di header.</p>
                </>
              ) : (
                <Select
                  value={kodeUnit}
                  onValueChange={(v) => { setKodeUnit(v); setError("") }}
                  disabled={selectedMapel?.kode_unit ? true : false}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedMapel?.kode_unit ? `Unit khusus: ${selectedMapel.kode_unit}` : "Pilih kode unit"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUnitOptions.map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedMapel?.kode_unit && !selectedUnit && (
                <p className="text-xs text-muted-foreground">Mapel ini khusus untuk unit {selectedMapel.kode_unit}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Keterangan (opsional)</Label>
            <Textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Catatan tambahan"
            />
          </div>

          <div className="flex gap-2 pt-4 border-t border-border/50">
            <div className="flex-1" />
            <Button type="button" variant="outline" className="bg-transparent" onClick={onCancel}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>{isEdit ? "Simpan Perubahan" : "Simpan KKM"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
