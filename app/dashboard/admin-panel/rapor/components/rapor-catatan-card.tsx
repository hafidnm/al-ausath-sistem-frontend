"use client"

import { Loader2, RefreshCw, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  keseharian_kelakuan: string
  keseharian_kerajinan: string
  keseharian_kedisiplinan: string
  keseharian_ketaatan: string
}

interface RaporCatatanCardProps {
  detail: RaporDetail | null
  selected: RaporItem | null
  catatanForm: CatatanFormState
  isReportReady: boolean
  isPublishedReport: boolean
  isSaving: boolean
  isSelecting: boolean
  onCatatanFormChange: (updater: (current: CatatanFormState) => CatatanFormState) => void
  onSaveCatatan: () => void
  onReloadDetail: () => void
  namaWaliSantri?: string | null
  namaWaliKelas?: string | null
}

export function RaporCatatanCard({
  detail,
  selected,
  catatanForm,
  isReportReady,
  isPublishedReport,
  isSaving,
  isSelecting,
  onCatatanFormChange,
  onSaveCatatan,
  onReloadDetail,
  namaWaliSantri,
  namaWaliKelas,
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

        {(namaWaliSantri || namaWaliKelas) && (
          <div className="grid gap-4 sm:grid-cols-2 rounded-lg border border-border/50 bg-muted/30 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Wali Santri</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {namaWaliSantri || <span className="text-muted-foreground italic">Tidak ada</span>}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Wali Kelas</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {namaWaliKelas || <span className="text-muted-foreground italic">Belum ditetapkan</span>}
              </p>
            </div>
          </div>
        )}

        <Separator />

        <div className="space-y-4">
          <div>
            <Label htmlFor="catatan-wali">Catatan wali</Label>
            <Textarea
              id="catatan-wali"
              className="mt-2 min-h-30"
              value={catatanForm.catatan_wali}
              onChange={(event) => onCatatanFormChange((current) => ({ ...current, catatan_wali: event.target.value }))}
              disabled={!isReportReady || isPublishedReport}
              placeholder={isReportReady ? "Tulis catatan pengembangan diri, akhlak, akademis, dan pesan wali kelas" : "Generate rapor dulu untuk mengisi catatan wali"}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-4">
            <div>
              <Label>Kebersihan</Label>
              <Select value={catatanForm.keseharian_kebersihan || undefined} onValueChange={(val) => onCatatanFormChange((current) => ({ ...current, keseharian_kebersihan: val }))} disabled={!isReportReady || isPublishedReport}>
                <SelectTrigger className="mt-2"><SelectValue placeholder="Pilih Nilai" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kerapian</Label>
              <Select value={catatanForm.keseharian_kerapian || undefined} onValueChange={(val) => onCatatanFormChange((current) => ({ ...current, keseharian_kerapian: val }))} disabled={!isReportReady || isPublishedReport}>
                <SelectTrigger className="mt-2"><SelectValue placeholder="Pilih Nilai" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Keterampilan</Label>
              <Select value={catatanForm.keseharian_keterampilan || undefined} onValueChange={(val) => onCatatanFormChange((current) => ({ ...current, keseharian_keterampilan: val }))} disabled={!isReportReady || isPublishedReport}>
                <SelectTrigger className="mt-2"><SelectValue placeholder="Pilih Nilai" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kelakuan</Label>
              <Select value={catatanForm.keseharian_kelakuan || undefined} onValueChange={(val) => onCatatanFormChange((current) => ({ ...current, keseharian_kelakuan: val }))} disabled={!isReportReady || isPublishedReport}>
                <SelectTrigger className="mt-2"><SelectValue placeholder="Pilih Nilai" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kerajinan</Label>
              <Select value={catatanForm.keseharian_kerajinan || undefined} onValueChange={(val) => onCatatanFormChange((current) => ({ ...current, keseharian_kerajinan: val }))} disabled={!isReportReady || isPublishedReport}>
                <SelectTrigger className="mt-2"><SelectValue placeholder="Pilih Nilai" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kedisiplinan</Label>
              <Select value={catatanForm.keseharian_kedisiplinan || undefined} onValueChange={(val) => onCatatanFormChange((current) => ({ ...current, keseharian_kedisiplinan: val }))} disabled={!isReportReady || isPublishedReport}>
                <SelectTrigger className="mt-2"><SelectValue placeholder="Pilih Nilai" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ketaatan</Label>
              <Select value={catatanForm.keseharian_ketaatan || undefined} onValueChange={(val) => onCatatanFormChange((current) => ({ ...current, keseharian_ketaatan: val }))} disabled={!isReportReady || isPublishedReport}>
                <SelectTrigger className="mt-2"><SelectValue placeholder="Pilih Nilai" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Semester aktif</Label>
            <Input className="mt-2" value={catatanForm.semester} disabled />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={onSaveCatatan} disabled={!isReportReady || isSaving || isPublishedReport}>
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

        {isReportReady && isPublishedReport && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
            Rapor sudah TERBIT. Catatan wali dan nilai keseharian dikunci dan tidak dapat diubah.
          </div>
        )}

        {detail?.nilai_mapel?.length ? (
          <div className="space-y-3">
            <Separator />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Preview Nilai Mapel</h3>
              <p className="text-xs text-muted-foreground">Detail lengkap nilai mapel untuk rapor yang dipilih</p>
            </div>
            <div className="max-h-96 overflow-auto rounded-lg border border-border/50">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 sticky top-0">
                    <TableHead className="whitespace-nowrap">Mapel</TableHead>
                    <TableHead className="text-center whitespace-nowrap">Harian</TableHead>
                    <TableHead className="text-center whitespace-nowrap">UTS</TableHead>
                    <TableHead className="text-center whitespace-nowrap">UAS</TableHead>
                    <TableHead className="text-center whitespace-nowrap">Akhir</TableHead>
                    <TableHead className="text-center whitespace-nowrap">Rapor</TableHead>
                    <TableHead className="text-center whitespace-nowrap">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.nilai_mapel.map((item, index) => (
                    <TableRow key={`${item.kode_mapel || "mapel"}-${index}`}>
                      <TableCell className="font-medium">{item.mapel || item.kode_mapel || "-"}</TableCell>
                      <TableCell className="text-center text-sm">{item.nilai_harian ?? "-"}</TableCell>
                      <TableCell className="text-center text-sm">{item.nilai_uts ?? "-"}</TableCell>
                      <TableCell className="text-center text-sm">{item.nilai_uas ?? "-"}</TableCell>
                      <TableCell className="text-center font-semibold">{item.nilai_akhir_mapel ?? item.nilai ?? "-"}</TableCell>
                      <TableCell className="text-center font-semibold text-blue-600">{item.nilai_rapor_tampil ?? item.nilai ?? "-"}</TableCell>
                      <TableCell className="text-center text-xs">
                        <span className={`inline-block rounded px-2 py-1 ${
                          item.status_ketuntasan === "TUNTAS" 
                            ? "bg-green-100 text-green-700" 
                            : item.status_ketuntasan === "TIDAK_TUNTAS"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {item.status_ketuntasan || "-"}
                        </span>
                      </TableCell>
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
