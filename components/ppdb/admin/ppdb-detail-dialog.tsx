"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileDown, ExternalLink } from "lucide-react"
import type { PpdbDetail } from "@/types/ppdb/admin"
import type { TesKonfigurasiJenjangKey, UpdateTestResultRequest } from "@/types/ppdb/admin"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TesConfigState {
  fiturSoalAktif: boolean
  soalTes: string
}

interface PpdbDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pendaftar: PpdbDetail | null
  isLoading: boolean
  selectedPendaftarJenjang: TesKonfigurasiJenjangKey | null
  tesConfig: TesConfigState | null
  isTesResultSaving: boolean
  onTesResultSave: (payload: UpdateTestResultRequest) => void | Promise<void>
  onUploadFile?: (jenisBerkas: string, file: File) => Promise<void>
}

const formatDateTime = (value: string) => {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Menunggu":
      return <Badge className="bg-chart-3/20 text-chart-4 border-0">Menunggu</Badge>
    case "Terverifikasi":
      return <Badge className="bg-accent/20 text-accent border-0">Terverifikasi</Badge>
    case "Diterima":
      return <Badge className="bg-primary/10 text-primary border-0">Diterima</Badge>
    case "Ditolak":
      return <Badge className="bg-destructive/10 text-destructive border-0">Ditolak</Badge>
    default:
      return <Badge variant="outline">Menunggu</Badge>
  }
}

const getDocumentUrl = (path: string | null | undefined): string | null => {
  if (!path || !path.trim()) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api\/?$/, '')
  return `${base}/storage/${path.replace(/^\//, '')}`
}

function DocLink({
  label,
  path,
  uploadType,
  onUpload,
}: {
  label: string
  path?: string | null
  uploadType?: string
  onUpload?: (jenisBerkas: string, file: File) => Promise<void>
}) {
  const url = getDocumentUrl(path)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !uploadType || !onUpload) return
    try {
      await onUpload(uploadType, file)
    } catch {
      // error handled upstream
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {url ? (
        <>
          <div className="flex gap-2">
            <a href={url} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              <ExternalLink className="w-3 h-3" />
              Preview
            </a>
            <a href={url} download target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline">
              <FileDown className="w-3 h-3" />
              Download
            </a>
          </div>
          {url.toLowerCase().includes('.pdf') ? (
            <iframe src={url} className="w-full h-40 rounded border border-border/50" title={label} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={label}
              className="max-h-32 rounded border border-border/50 object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
        </>
      ) : (
        <p className="text-xs text-muted-foreground italic">Belum diupload</p>
      )}
      {uploadType && onUpload && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => void handleFileChange(e)}
          />
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => fileInputRef.current?.click()}
          >
            {url ? "Ganti File" : "Upload File"}
          </Button>
        </>
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value || "-"}</p>
    </div>
  )
}

export function PpdbDetailDialog({
  open,
  onOpenChange,
  pendaftar,
  isLoading,
  selectedPendaftarJenjang,
  tesConfig,
  isTesResultSaving,
  onTesResultSave,
  onUploadFile,
}: PpdbDetailDialogProps) {
  const [nilaiTesInput, setNilaiTesInput] = useState("")
  const [statusTesInput, setStatusTesInput] = useState("")
  const [catatanTesInput, setCatatanTesInput] = useState("")

  useEffect(() => {
    if (!pendaftar) {
      setNilaiTesInput("")
      setStatusTesInput("")
      setCatatanTesInput("")
      return
    }

    setNilaiTesInput(
      pendaftar.nilaiTes !== undefined && pendaftar.nilaiTes !== null
        ? String(pendaftar.nilaiTes)
        : "",
    )
    setStatusTesInput(pendaftar.statusTes || "")
    setCatatanTesInput(pendaftar.catatanTes || "")
  }, [pendaftar])

  const handleSaveKoreksiTes = () => {
    const trimmedNilai = nilaiTesInput.trim()
    const normalizedNilai =
      trimmedNilai.length === 0 ? undefined : Number(trimmedNilai.replace(',', '.'))

    if (normalizedNilai !== undefined && Number.isNaN(normalizedNilai)) {
      alert("Nilai tes harus berupa angka yang valid")
      return
    }

    onTesResultSave({
      nilai: normalizedNilai,
      statusTes: statusTesInput || undefined,
      catatan: catatanTesInput.trim() || undefined,
      metodeTes: 'manual',
      soalTes: tesConfig?.soalTes || undefined,
    })
  }

  const shouldShowTesCorrection = Boolean(tesConfig?.fiturSoalAktif)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Peserta PPDB</DialogTitle>
          <DialogDescription>Informasi lengkap data pendaftar</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Memuat detail peserta...
          </div>
        ) : pendaftar ? (
          <div className="grid gap-4 py-2">
            {/* Header Status */}
            <div className="rounded-lg border border-border/70 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">No Pendaftaran</p>
                  <p className="font-semibold text-foreground">{pendaftar.noPendaftaran}</p>
                </div>
                {getStatusBadge(pendaftar.status)}
              </div>
            </div>

            {/* Info Calon */}
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <DetailRow label="Nama Calon Murid" value={pendaftar.name} />
              <DetailRow label="Program Pendaftaran" value={pendaftar.programPendaftaran} />
              <DetailRow label="Jenis Kelamin" value={pendaftar.jenisKelamin} />
              <DetailRow
                label="Tempat, Tanggal Lahir"
                value={`${pendaftar.tempatLahir || "-"}, ${pendaftar.tanggalLahir || "-"}`}
              />
              <DetailRow label="NIK Calon Santri" value={pendaftar.nikCalonSantri} />
              <DetailRow label="Asal Sekolah/Kota" value={pendaftar.asalSekolah} />
              <DetailRow
                label="Waktu Pendaftaran"
                value={formatDateTime(pendaftar.waktuPendaftaran || pendaftar.tanggalDaftar || "")}
              />
              <DetailRow label="Riwayat Penyakit" value={pendaftar.riwayatPenyakit} />
              <div className="space-y-1 sm:col-span-2">
                <p className="text-muted-foreground">Alamat Lengkap</p>
                <p className="font-medium text-foreground">{pendaftar.alamatLengkap || "-"}</p>
              </div>
              <DetailRow label="Nama Ayah" value={pendaftar.namaAyah} />
              <DetailRow label="Penghasilan Ayah" value={pendaftar.penghasilanAyah} />
              <DetailRow label="No HP Calon" value={pendaftar.noHpCalon} />
              <DetailRow label="Nama Ibu" value={pendaftar.namaIbu} />
              <DetailRow label="No HP Ibu" value={pendaftar.noHpIbu} />
              <DetailRow label="Email" value={pendaftar.email} />

              {/* Dokumen */}
              <div className="sm:col-span-2 space-y-3">
                <p className="text-sm font-medium text-foreground">Dokumen Berkas</p>
                <div className="grid sm:grid-cols-2 gap-4">
                    <DocLink label="Akta Kelahiran" path={pendaftar.fileAktaPath} uploadType="akta" onUpload={onUploadFile} />
                    <DocLink label="Kartu Keluarga (KK)" path={pendaftar.fileKkPath} uploadType="kk" onUpload={onUploadFile} />
                    <DocLink label="Surat Rekomendasi" path={pendaftar.fileSuratRekomendasiPath} uploadType="rekomendasi" onUpload={onUploadFile} />
                    <DocLink label="Surat Pernyataan" path={pendaftar.suratPernyataanFilePath} uploadType="surat_pernyataan" onUpload={onUploadFile} />
                </div>
              </div>

              {shouldShowTesCorrection ? (
                <div className="sm:col-span-2 rounded-lg border border-border/70 p-4 space-y-4 bg-muted/20">
                  <div>
                    <p className="text-sm font-medium text-foreground">Koreksi Jawaban Tes</p>
                    <p className="text-xs text-muted-foreground">
                      Jawaban santri jenjang {selectedPendaftarJenjang || "-"} ditampilkan karena Konfigurasi Soal sedang ON.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Soal Tes</p>
                    <Textarea value={tesConfig?.soalTes || "-"} readOnly className="min-h-[80px] bg-background" />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Jawaban Santri</p>
                    <Textarea
                      value={pendaftar.soalJawab || "Belum ada jawaban dari santri."}
                      readOnly
                      className="min-h-[120px] bg-background"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Nilai Tes</p>
                      <Input
                        value={nilaiTesInput}
                        onChange={(e) => setNilaiTesInput(e.target.value)}
                        placeholder="Contoh: 80"
                        inputMode="decimal"
                        disabled={isTesResultSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Status Tes</p>
                      <Select
                        value={statusTesInput || "pending"}
                        onValueChange={(value) => setStatusTesInput(value === "pending" ? "" : value)}
                        disabled={isTesResultSaving}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status tes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Belum ditentukan</SelectItem>
                          <SelectItem value="lulus">Lulus</SelectItem>
                          <SelectItem value="tidak_lulus">Tidak Lulus</SelectItem>
                          <SelectItem value="cadangan">Cadangan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Catatan Koreksi</p>
                    <Textarea
                      value={catatanTesInput}
                      onChange={(e) => setCatatanTesInput(e.target.value)}
                      placeholder="Tambahkan catatan koreksi untuk panitia"
                      disabled={isTesResultSaving}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSaveKoreksiTes}
                      disabled={isTesResultSaving}
                    >
                      {isTesResultSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        "Simpan Koreksi Tes"
                      )}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">Data peserta tidak tersedia.</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
