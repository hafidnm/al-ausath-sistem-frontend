"use client"

import { useEffect, useState } from "react"
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
import { AlertTriangle, Check } from "lucide-react"
import { santriService, type SantriItem } from "@/lib/services/santri.service"
import { semesterOptions, tahunAjaranOptions } from "../utils/constants"

interface NilaiAkhlakFormPayload {
  nomor_induk: string
  tahun_ajaran: string
  semester: number
  nilai_angka: number
  aspek?: string
  deskripsi?: string
}

interface NilaiAkhlakFormProps {
  initialData?: Partial<NilaiAkhlakFormPayload>
  onSubmit?: (data: NilaiAkhlakFormPayload) => Promise<void> | void
  onCancel?: () => void
}

const toErrorMessage = (error: any): string => {
  const message = error?.response?.data?.message
  const errors = error?.response?.data?.errors

  if (typeof message === "string" && message) return message

  if (errors && typeof errors === "object") {
    const firstField = Object.keys(errors)[0]
    const firstValue = errors[firstField]

    if (Array.isArray(firstValue) && firstValue.length > 0) {
      return String(firstValue[0])
    }

    if (typeof firstValue === "string") {
      return firstValue
    }
  }

  return "Gagal menyimpan nilai akhlak"
}

export function NilaiAkhlakForm({ initialData, onSubmit, onCancel }: NilaiAkhlakFormProps) {
  const [nomorInduk, setNomorInduk] = useState(initialData?.nomor_induk ?? "")
  const [selectedNama, setSelectedNama] = useState("")
  const [selectedSantriId, setSelectedSantriId] = useState<number | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const [santriResults, setSantriResults] = useState<SantriItem[]>([])
  const [isLoadingSantri, setIsLoadingSantri] = useState(false)
  const [santriSearchError, setSantriSearchError] = useState("")
  const [openSantriPopover, setOpenSantriPopover] = useState(false)
  const [tahunAjaran, setTahunAjaran] = useState(initialData?.tahun_ajaran ?? "")
  const [semester, setSemester] = useState(String(initialData?.semester ?? ""))
  const [nilaiAngka, setNilaiAngka] = useState(initialData?.nilai_angka ?? 80)
  const [aspek, setAspek] = useState(initialData?.aspek ?? "AKHLAK")
  const [deskripsi, setDeskripsi] = useState(initialData?.deskripsi ?? "")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const applySelectedSantri = (santri: SantriItem) => {
    setNomorInduk(santri.nomor_induk)
    setSelectedNama(santri.nama_lengkap ?? "")
    setSelectedSantriId(santri.id)
    setSearchInput("")
    setOpenSantriPopover(false)
    setError("")
  }

  useEffect(() => {
    if (!initialData) return

    setNomorInduk(initialData.nomor_induk ?? "")
    setSelectedNama("")
    setSelectedSantriId(null)
    setSearchInput("")
    setTahunAjaran(initialData.tahun_ajaran ?? "")
    setSemester(String(initialData.semester ?? ""))
    setNilaiAngka(initialData.nilai_angka ?? 80)
    setAspek(initialData.aspek ?? "AKHLAK")
    setDeskripsi(initialData.deskripsi ?? "")
  }, [initialData])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nomorInduk.trim() || !tahunAjaran || !semester) {
      setError("Nomor induk, tahun ajaran, dan semester wajib diisi")
      return
    }

    if (nilaiAngka < 0 || nilaiAngka > 100) {
      setError("Nilai angka harus di antara 0 sampai 100")
      return
    }

    try {
      setIsSubmitting(true)
      setError("")

      await onSubmit?.({
        nomor_induk: nomorInduk.trim(),
        tahun_ajaran: tahunAjaran,
        semester: Number(semester),
        nilai_angka: nilaiAngka,
        aspek: aspek || "AKHLAK",
        deskripsi: deskripsi.trim() || undefined,
      })
    } catch (err) {
      setError(toErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Input Nilai Akhlak</CardTitle>
        <CardDescription>Form sederhana nilai akhlak berbasis angka tanpa komponen turunan</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <Alert className="bg-destructive/10 border-destructive/30">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <AlertDescription className="text-destructive ml-2">{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nomor Induk</Label>
              <div className="relative">
                <Input
                  value={nomorInduk && !searchInput ? `${nomorInduk}${selectedNama ? " - " + selectedNama : ""}` : searchInput}
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
                    setNomorInduk("")
                    setSelectedNama("")
                    setSelectedSantriId(null)
                    setOpenSantriPopover(true)
                    setError("")
                  }}
                  onFocus={() => setOpenSantriPopover(true)}
                  onBlur={() => {
                    setTimeout(() => setOpenSantriPopover(false), 120)
                  }}
                  placeholder="Cari berdasarkan nomor induk atau nama..."
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
            </div>

            <div className="space-y-2">
              <Label>Tahun Ajaran</Label>
              <Select value={tahunAjaran} onValueChange={setTahunAjaran}>
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
              <Select value={semester} onValueChange={setSemester}>
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
              <Label>Nilai Angka</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={nilaiAngka}
                onChange={(e) => {
                  setNilaiAngka(Number(e.target.value))
                  setError("")
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Aspek</Label>
              <Input value={aspek} onChange={(e) => setAspek(e.target.value)} placeholder="AKHLAK" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Deskripsi (opsional)</Label>
            <Textarea
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Catatan singkat terkait nilai akhlak"
            />
          </div>

          <div className="flex gap-2 pt-4 border-t border-border/50">
            <div className="flex-1" />
            <Button type="button" variant="outline" className="bg-transparent" onClick={onCancel}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Nilai"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
