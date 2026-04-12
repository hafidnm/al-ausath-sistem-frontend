"use client"

import { useEffect, useMemo, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
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
import { AlertTriangle } from "lucide-react"
import api from "@/lib/axios"
import { semesterOptions, tahunAjaranOptions } from "../utils/constants"
import { isValidKkm } from "../utils/helpers"

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
  const [kodeMapel, setKodeMapel] = useState(initialData?.kode_mapel ?? "")
  const [tahunAjaran, setTahunAjaran] = useState(initialData?.tahun_ajaran ?? "")
  const [semester, setSemester] = useState(String(initialData?.semester ?? ""))
  const [nilaiKkm, setNilaiKkm] = useState(initialData?.nilai_kkm ?? 75)
  const [kodeUnit, setKodeUnit] = useState(initialData?.kode_unit?.toUpperCase() ?? "")
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
    const activeCode = kodeMapel.trim().toUpperCase()

    if (!activeCode) return mapelOptions
    if (mapelOptions.some((item) => item.kode_mapel === activeCode)) return mapelOptions

    return [
      {
        kode_mapel: activeCode,
        nama_mapel: "Mapel tersimpan (tidak ditemukan di daftar aktif)",
      },
      ...mapelOptions,
    ]
  }, [mapelOptions, kodeMapel])

  const availableUnitOptions = useMemo(() => {
    if (!selectedMapel?.kode_unit) return kodeUnitOptions
    return kodeUnitOptions.filter((unit) => unit === selectedMapel.kode_unit)
  }, [selectedMapel])

  useEffect(() => {
    if (!initialData) return

    setKodeMapel(initialData.kode_mapel)
    setTahunAjaran(initialData.tahun_ajaran)
    setSemester(String(initialData.semester))
    setNilaiKkm(initialData.nilai_kkm)
    setKodeUnit(initialData.kode_unit?.toUpperCase() ?? "")
    setKeterangan(initialData.keterangan ?? "")
  }, [initialData])

  useEffect(() => {
    if (!selectedMapel) return

    if (selectedMapel.kode_unit) {
      setKodeUnit(selectedMapel.kode_unit)
    }
  }, [selectedMapel])

  useEffect(() => {
    const fetchMapelOptions = async () => {
      try {
        setIsLoadingMapel(true)
        setMapelError("")

        const response = await api.get("/administrasi/mata-pelajaran", {
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

    if (!normalizedKodeMapel || !tahunAjaran || !semester) {
      setError("Field wajib belum lengkap")
      return
    }

    if (!isValidKkm(nilaiKkm)) {
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
        nilai_kkm: nilaiKkm,
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
                disabled={isLoadingMapel || displayedMapelOptions.length === 0}
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
              <Select value={tahunAjaran} onValueChange={(v) => { setTahunAjaran(v); setError("") }}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tahun ajaran" />
                </SelectTrigger>
                <SelectContent>
                  {tahunAjaranOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Semester</Label>
              <Select value={semester} onValueChange={(v) => { setSemester(v); setError("") }}>
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
                value={nilaiKkm}
                onChange={(e) => { setNilaiKkm(Number(e.target.value)); setError("") }}
              />
            </div>

            <div className="space-y-2">
              <Label>Kode Unit</Label>
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
              {selectedMapel?.kode_unit && (
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
