"use client"

import { Loader2, RefreshCw, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import type { RaporDetail, RaporItem } from "@/lib/services/rapor.service"
import { ReportStatusBadge } from "./report-status-badge"

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
}

interface RaporCatatanCardProps {
  detail: RaporDetail | null
  selected: RaporItem | null
  catatanForm: CatatanFormState
  isReportReady: boolean
  isSaving: boolean
  isSelecting: boolean
  onCatatanFormChange: (updater: (current: CatatanFormState) => CatatanFormState) => void
  onSaveCatatan: () => void
  onReloadDetail: () => void
}

export function RaporCatatanCard({
  detail,
  selected,
  catatanForm,
  isReportReady,
  isSaving,
  isSelecting,
  onCatatanFormChange,
  onSaveCatatan,
  onReloadDetail,
}: RaporCatatanCardProps) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Panel Catatan Wali</CardTitle>
        <CardDescription>Catatan wali, keseharian, dan status rapor aktif</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Santri</p>
            <p className="mt-1 font-medium text-foreground">{detail?.nama_santri || selected?.nama_santri || "Belum dipilih"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
            <div className="mt-1"><ReportStatusBadge status={detail?.status || selected?.status} /></div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <Label htmlFor="catatan-wali">Catatan wali</Label>
            <Textarea
              id="catatan-wali"
              className="mt-2 min-h-30"
              value={catatanForm.catatan_wali}
              onChange={(event) => onCatatanFormChange((current) => ({ ...current, catatan_wali: event.target.value }))}
              disabled={!isReportReady}
              placeholder={isReportReady ? "Tulis catatan pengembangan diri, akhlak, akademis, dan pesan wali kelas" : "Generate rapor dulu untuk mengisi catatan wali"}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Kebersihan</Label>
              <Input className="mt-2" value={catatanForm.keseharian_kebersihan} onChange={(event) => onCatatanFormChange((current) => ({ ...current, keseharian_kebersihan: event.target.value }))} disabled={!isReportReady} placeholder="A/B/C/D" />
            </div>
            <div>
              <Label>Kerapian</Label>
              <Input className="mt-2" value={catatanForm.keseharian_kerapian} onChange={(event) => onCatatanFormChange((current) => ({ ...current, keseharian_kerapian: event.target.value }))} disabled={!isReportReady} placeholder="A/B/C/D" />
            </div>
            <div>
              <Label>Keterampilan</Label>
              <Input className="mt-2" value={catatanForm.keseharian_keterampilan} onChange={(event) => onCatatanFormChange((current) => ({ ...current, keseharian_keterampilan: event.target.value }))} disabled={!isReportReady} placeholder="A/B/C/D" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>ID wali kelas</Label>
              <Input className="mt-2" value={catatanForm.id_wali_kelas} onChange={(event) => onCatatanFormChange((current) => ({ ...current, id_wali_kelas: event.target.value }))} disabled={!isReportReady} placeholder="Opsional" />
            </div>
            <div>
              <Label>Semester aktif</Label>
              <Input className="mt-2" value={catatanForm.semester} disabled />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={onSaveCatatan} disabled={!isReportReady || isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Simpan Catatan
          </Button>
          <Button variant="outline" className="bg-transparent" onClick={onReloadDetail} disabled={!selected || isSelecting}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Muat Ulang Detail
          </Button>
        </div>

        {!isReportReady && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700">
            Generate rapor dulu sebelum catatan wali bisa diinput.
          </div>
        )}

        {detail?.nilai_mapel?.length ? (
          <div className="space-y-3">
            <Separator />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Preview Nilai Mapel</h3>
              <p className="text-xs text-muted-foreground">Detail ringkas nilai mapel untuk rapor yang dipilih</p>
            </div>
            <div className="max-h-64 overflow-auto rounded-lg border border-border/50">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Mapel</TableHead>
                    <TableHead className="text-center">Nilai</TableHead>
                    <TableHead className="text-center">Predikat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.nilai_mapel.map((item, index) => (
                    <TableRow key={`${item.kode_mapel || "mapel"}-${index}`}>
                      <TableCell>{item.mapel || item.kode_mapel || "-"}</TableCell>
                      <TableCell className="text-center">{item.nilai ?? "-"}</TableCell>
                      <TableCell className="text-center">{item.predikat || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
