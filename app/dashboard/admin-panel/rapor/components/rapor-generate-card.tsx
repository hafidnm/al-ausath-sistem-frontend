"use client"

import { useEffect, useState, useMemo } from "react"
import { Download, Eye, Loader2, Sparkles, BookMarked } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"
import { useUnit } from "@/contexts/unit-context"
import { kelasService } from "@/lib/services/kelas.service"
import { santriService, type SantriItem } from "@/lib/services/santri.service"

interface CatatanFormState {
  nomor_induk: string
  kode_kelas: string
  tahun_ajaran: string
  semester: string
  catatan_wali: string
  id_wali_kelas: string
  keseharian_kebersihan: string
  keseharian_kerapian: string
  keseharian_keterampilan: string
  keseharian_kelakuan: string
  keseharian_kerajinan: string
  keseharian_kedisiplinan: string
  keseharian_ketaatan: string
}

interface RaporGenerateCardProps {
  catatanForm: CatatanFormState
  onCatatanFormChange: (updater: (current: CatatanFormState) => CatatanFormState) => void
  onSantriNameResolved: (nomorInduk: string, name: string) => void
  isGenerating: boolean
  isReportReady: boolean
  isPublishedReport: boolean
  onGenerate: () => void
  onPreviewPdf: () => void
  onDownloadPdf: () => void
}

export function RaporGenerateCard({
  catatanForm,
  onCatatanFormChange,
  onSantriNameResolved,
  isGenerating,
  isReportReady,
  isPublishedReport,
  onGenerate,
  onPreviewPdf,
  onDownloadPdf,
}: RaporGenerateCardProps) {
  const { selectedTahunAjaran } = useTahunAjaran()
  const { selectedUnit } = useUnit()
  const kodeUnitFromContext = selectedUnit?.kode_unit?.toUpperCase() ?? ""
  const tahunAjaran = selectedTahunAjaran?.nama_tahun || catatanForm.tahun_ajaran

  // Raw kelas options (all, unfiltered)
  const [rawKelasOptions, setRawKelasOptions] = useState<{ value: string; label: string; kode_unit?: string }[]>([])

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
    if (!catatanForm.kode_kelas) return
    const stillValid = displayedKelasOptions.some(k => k.value === catatanForm.kode_kelas)
    if (!stillValid) {
      onCatatanFormChange(curr => ({ ...curr, kode_kelas: "", nomor_induk: "" }))
    }
  }, [kodeUnitFromContext, displayedKelasOptions, catatanForm.kode_kelas, onCatatanFormChange])

  // When kelas changes, load santri for that kelas
  useEffect(() => {
    if (!catatanForm.kode_kelas) {
      setClassSantris([])
      return
    }

    let cancelled = false
    setIsLoadingSantri(true)

    santriService.getAll({ kode_kelas: catatanForm.kode_kelas, status: "AKTIF", per_page: "200" })
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
  }, [catatanForm.kode_kelas, kodeUnitFromContext])

  // When kelas changes, reset santri if no longer in list
  useEffect(() => {
    if (!catatanForm.kode_kelas && catatanForm.nomor_induk) {
      onCatatanFormChange(curr => ({ ...curr, nomor_induk: "" }))
    } else if (catatanForm.kode_kelas && classSantris.length > 0 && catatanForm.nomor_induk) {
      if (!classSantris.find(s => s.nomor_induk === catatanForm.nomor_induk)) {
        onCatatanFormChange(curr => ({ ...curr, nomor_induk: "" }))
      }
    }
  }, [catatanForm.kode_kelas, classSantris, catatanForm.nomor_induk, onCatatanFormChange])

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Generate & Preview</CardTitle>
        <CardDescription>Gunakan panel ini untuk generate rapor dan membuka PDF</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Kelas</Label>
            <Select 
              value={catatanForm.kode_kelas} 
              onValueChange={(val) => onCatatanFormChange((current) => ({ ...current, kode_kelas: val, nomor_induk: "" }))}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Pilih Kelas" />
              </SelectTrigger>
              <SelectContent>
                {displayedKelasOptions.map(k => (
                  <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Santri</Label>
            <Select
              value={catatanForm.nomor_induk || "none"}
              onValueChange={(val) => {
                const selected = val === "none" ? "" : val
                onCatatanFormChange((current) => ({ ...current, nomor_induk: selected }))
                
                // Set name map if available
                const santri = classSantris.find(s => s.nomor_induk === selected)
                if (santri && santri.nama_lengkap) {
                   onSantriNameResolved(santri.nomor_induk, santri.nama_lengkap)
                }
              }}
              disabled={!catatanForm.kode_kelas || isLoadingSantri}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder={
                  !catatanForm.kode_kelas ? "Pilih kelas dulu" :
                  isLoadingSantri ? "Memuat santri..." :
                  "Pilih Santri"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" disabled>
                  {!catatanForm.kode_kelas ? "Pilih kelas dulu" : "Pilih Santri"}
                </SelectItem>
                {classSantris.map(s => (
                  <SelectItem key={s.id} value={s.nomor_induk}>
                    {s.nomor_induk} - {s.nama_lengkap}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Tahun ajaran</Label>
            <div className="flex h-10 mt-2 items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm">
              <BookMarked className="w-4 h-4 text-primary shrink-0" />
              <span className="flex-1 truncate text-foreground">{tahunAjaran || "Belum dipilih"}</span>
              <Badge variant="secondary" className="text-xs shrink-0">Dari Header</Badge>
            </div>
          </div>
          <div>
            <Label>Semester</Label>
            <Select value={catatanForm.semester} onValueChange={(value) => onCatatanFormChange((current) => ({ ...current, semester: value }))}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={onGenerate} disabled={isGenerating || isPublishedReport || !catatanForm.nomor_induk}>
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {isPublishedReport ? "Rapor Sudah Terbit" : "Generate Rapor"}
          </Button>
          <Button variant="outline" className="bg-transparent" onClick={onPreviewPdf} disabled={!isReportReady}>
            <Eye className="mr-2 h-4 w-4" />
            Preview PDF
          </Button>
          <Button variant="outline" className="bg-transparent" onClick={onDownloadPdf} disabled={!isReportReady}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Catatan wali baru bisa diisi setelah rapor berhasil di-generate.
          {isPublishedReport ? " Rapor berstatus TERBIT tidak bisa di-generate ulang." : ""}
        </p>
      </CardContent>
    </Card>
  )
}
