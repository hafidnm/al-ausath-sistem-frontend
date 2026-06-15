"use client"

import { Download, Eye, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookMarked } from "lucide-react"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"

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

interface SantriOption {
  nomor_induk: string
  nama_lengkap?: string
  kode_kelas?: string
}

interface RaporGenerateCardProps {
  catatanForm: CatatanFormState
  onCatatanFormChange: (updater: (current: CatatanFormState) => CatatanFormState) => void
  isSearchingSantri: boolean
  santriOptions: SantriOption[]
  onNomorIndukSearchChange: (value: string) => void
  onSantriOptionPick: (option: SantriOption) => void
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
  isSearchingSantri,
  santriOptions,
  onNomorIndukSearchChange,
  onSantriOptionPick,
  isGenerating,
  isReportReady,
  isPublishedReport,
  onGenerate,
  onPreviewPdf,
  onDownloadPdf,
}: RaporGenerateCardProps) {
  const { selectedTahunAjaran } = useTahunAjaran()
  const tahunAjaran = selectedTahunAjaran?.nama_tahun || catatanForm.tahun_ajaran

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Generate & Preview</CardTitle>
        <CardDescription>Gunakan panel ini untuk generate rapor dan membuka PDF</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Nomor induk</Label>
            <Input
              className="mt-2"
              value={catatanForm.nomor_induk}
              onChange={(event) => {
                const value = event.target.value
                onCatatanFormChange((current) => ({ ...current, nomor_induk: value }))
                onNomorIndukSearchChange(value)
              }}
              placeholder="Cari nama santri atau nomor induk"
            />

            {(isSearchingSantri || santriOptions.length > 0) && (
              <div className="mt-2 rounded-md border border-border bg-background">
                {isSearchingSantri && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">Mencari santri...</p>
                )}

                {!isSearchingSantri && santriOptions.length > 0 && (
                  <div className="max-h-44 overflow-y-auto">
                    {santriOptions.map((option) => (
                      <button
                        key={`${option.nomor_induk}-${option.kode_kelas || "kelas"}`}
                        type="button"
                        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-muted/50"
                        onClick={() => onSantriOptionPick(option)}
                      >
                        <span className="text-sm text-foreground">{option.nama_lengkap || "Tanpa nama"}</span>
                        <span className="text-xs text-muted-foreground">{option.nomor_induk}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <Label>Kode kelas</Label>
            <Input className="mt-2" value={catatanForm.kode_kelas} onChange={(event) => onCatatanFormChange((current) => ({ ...current, kode_kelas: event.target.value }))} />
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
          <Button onClick={onGenerate} disabled={isGenerating || isPublishedReport}>
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
