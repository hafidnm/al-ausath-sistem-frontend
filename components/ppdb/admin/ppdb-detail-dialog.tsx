"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileDown, ExternalLink } from "lucide-react"
import type { PpdbDetail } from "@/lib/services/ppdb.service"
import type { TesKonfigurasiJenjangKey } from "@/lib/services/ppdb.service"

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
  isTesConfigLoading: boolean
  isTesConfigSaving: boolean
  onTesToggle: (jenjang: TesKonfigurasiJenjangKey, checked: boolean) => void
  onTesSoalChange: (jenjang: TesKonfigurasiJenjangKey, soal: string) => void
  onTesConfigSave: (jenjang: TesKonfigurasiJenjangKey) => void
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

function DocLink({ label, path }: { label: string; path?: string | null }) {
  const url = getDocumentUrl(path)
  if (!url) return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xs text-muted-foreground italic">Belum diupload</p>
    </div>
  )
  const isPdf = url.toLowerCase().includes('.pdf')
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex gap-2">
        <a href={url} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
          <ExternalLink className="w-3 h-3" />
          Preview
        </a>
        <a href={url} download
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline">
          <FileDown className="w-3 h-3" />
          Download
        </a>
      </div>
      {isPdf && (
        <iframe
          src={url}
          className="w-full h-40 rounded border border-border/50"
          title={label}
        />
      )}
      {!isPdf && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={label}
          className="max-h-32 rounded border border-border/50 object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
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
  isTesConfigLoading,
  isTesConfigSaving,
  onTesToggle,
  onTesSoalChange,
  onTesConfigSave,
}: PpdbDetailDialogProps) {
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
                  <DocLink label="Akta Kelahiran" path={pendaftar.fileAktaPath} />
                  <DocLink label="Kartu Keluarga (KK)" path={pendaftar.fileKkPath} />
                  <DocLink label="Surat Rekomendasi" path={pendaftar.fileSuratRekomendasiPath} />
                  <DocLink label="Surat Pernyataan" path={pendaftar.suratPernyataanFilePath} />
                </div>
              </div>

              {/* Konfigurasi Tes */}
              <div className="sm:col-span-2 rounded-lg border border-border/70 p-4 space-y-3 bg-muted/20">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Konfigurasi Tes</p>
                    <p className="text-xs text-muted-foreground">
                      Aktifkan fitur soal tes berdasarkan jenjang peserta ({selectedPendaftarJenjang || "-"}).
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={tesConfig?.fiturSoalAktif ?? false}
                      onCheckedChange={(checked) => {
                        if (!selectedPendaftarJenjang) return
                        onTesToggle(selectedPendaftarJenjang, checked)
                      }}
                      disabled={!selectedPendaftarJenjang || isTesConfigLoading || isTesConfigSaving}
                    />
                    <span className="text-sm text-muted-foreground">
                      {tesConfig?.fiturSoalAktif ? "On" : "Off"}
                    </span>
                  </div>
                </div>

                {tesConfig?.fiturSoalAktif ? (
                  <Textarea
                    value={tesConfig.soalTes}
                    onChange={(e) => {
                      if (!selectedPendaftarJenjang) return
                      onTesSoalChange(selectedPendaftarJenjang, e.target.value)
                    }}
                    placeholder="Tulis pertanyaan tes di sini"
                    disabled={!selectedPendaftarJenjang || isTesConfigLoading || isTesConfigSaving}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Saat off, pendaftar akan diarahkan ke halaman menunggu pengumuman.
                  </p>
                )}

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => selectedPendaftarJenjang && onTesConfigSave(selectedPendaftarJenjang)}
                    disabled={!selectedPendaftarJenjang || isTesConfigLoading || isTesConfigSaving}
                  >
                    {isTesConfigSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan Konfigurasi Tes"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">Data peserta tidak tersedia.</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
