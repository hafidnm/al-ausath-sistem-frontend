"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, ArrowLeft, FileDown, ExternalLink, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { usePpdbDetail, useUpdatePpdbTestResult } from "@/hooks/ppdb/admin"
import { ppdbAdminApi } from "@/lib/ppdb/admin-api"
import type { PpdbDetail } from "@/types/ppdb/admin"

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

const formatDateTime = (value: string) => {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

const formatDate = (value: string) => {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
  })
}

export default function PpdbDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const idParam = Array.isArray(params.id) ? params.id[0] : params.id
  
  const [pendaftar, setPendaftar] = useState<PpdbDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { updateTestResult, loading: testResultLoading } = useUpdatePpdbTestResult()
  const [testForm, setTestForm] = useState({
    nilai: "",
    statusTes: "",
    catatanTes: "",
  })

  const fetchDetail = useCallback(async () => {
    if (!idParam) return
    
    setLoading(true)
    setError(null)
    
    try {
      const res = await ppdbAdminApi.getDetail(idParam)
      setPendaftar(res as PpdbDetail)
      setTestForm({
        nilai: res.nilaiTes !== undefined ? String(res.nilaiTes) : "",
        statusTes: res.statusTes || "",
        catatanTes: res.catatanTes || "",
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat detail pendaftar'
      setError(msg)
      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [idParam, toast])

  useEffect(() => {
    void fetchDetail()
  }, [fetchDetail])

  const handleSaveTestResult = async () => {
    if (!pendaftar) return
    try {
      await updateTestResult(pendaftar.id, {
        nilai: testForm.nilai ? Number(testForm.nilai) : undefined,
        statusTes: testForm.statusTes,
        catatan: testForm.catatanTes,
      })
      toast({ title: 'Tersimpan', description: 'Hasil tes berhasil disimpan' })
      void fetchDetail()
    } catch (err) {
      toast({
        title: 'Gagal',
        description: err instanceof Error ? err.message : 'Gagal menyimpan hasil tes',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="inline-flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat detail pendaftar...
        </span>
      </div>
    )
  }

  if (error || !pendaftar) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/dashboard/ppdb">
            <Button variant="outline" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Daftar PPDB
            </Button>
          </Link>
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error || 'Pendaftar tidak ditemukan'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <Link href="/dashboard/ppdb">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">{pendaftar.name || '-'}</h1>
            <p className="text-muted-foreground">
              No. Pendaftaran: {pendaftar.noPendaftaran || '-'}
            </p>
          </div>
          <div className="space-y-2">
            <div>Status Verifikasi</div>
            {getStatusBadge(pendaftar.status || 'Menunggu')}
          </div>
        </div>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data Dasar Pendaftar</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Nama Calon Santri</p>
                <p className="font-medium">{pendaftar.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">NIK</p>
                <p className="font-medium">{pendaftar.nikCalonSantri || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tempat/Tanggal Lahir</p>
                <p className="font-medium">{pendaftar.tempatLahir || '-'} / {formatDate(pendaftar.tanggalLahir || '')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jenis Kelamin</p>
                <p className="font-medium">{pendaftar.jenisKelamin || '-'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Program Pendaftaran</p>
                <p className="font-medium">{pendaftar.jenjang || pendaftar.programPendaftaran || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Asal Sekolah</p>
                <p className="font-medium">{pendaftar.asalSekolah || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Waktu Pendaftaran</p>
                <p className="font-medium">{formatDateTime(pendaftar.waktuPendaftaran || pendaftar.tanggalDaftar || '')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">No. Pendaftaran Final</p>
                <p className="font-medium">{pendaftar.noPendaftaranFinal || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parent Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data Orang Tua</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Nama Ayah</p>
                <p className="font-medium">{pendaftar.namaAyah || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Penghasilan Ayah</p>
                <p className="font-medium">{pendaftar.penghasilanAyah || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">No HP Ayah</p>
                <p className="font-medium">{pendaftar.noHpCalon || '-'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Nama Ibu</p>
                <p className="font-medium">{pendaftar.namaIbu || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">No HP Ibu</p>
                <p className="font-medium">{pendaftar.noHpIbu || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address & Medical */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Tambahan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Alamat Lengkap</p>
              <p className="font-medium">{pendaftar.alamatLengkap || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Riwayat Penyakit</p>
              <p className="font-medium">{pendaftar.riwayatPenyakit || '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Document Assets Gallery */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Berkas Dokumen</CardTitle>
            <CardDescription>
              Dokumen yang telah diunggah oleh pendaftar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: 'Akta Kelahiran', url: pendaftar.fileAktaPath, type: 'akta' },
                { label: 'Kartu Keluarga (KK)', url: pendaftar.fileKkPath, type: 'kk' },
                { label: 'Rekomendasi Ustadz', url: pendaftar.fileSuratRekomendasiPath, type: 'rekomendasi' },
                { label: 'Surat Pernyataan', url: pendaftar.suratPernyataanFilePath, type: 'surat_pernyataan' },
              ].map((doc) => {
                const documentUrl = getDocumentUrl(doc.url)
                return (
                  <div key={doc.type} className="border border-border rounded-lg p-4 space-y-3">
                    <p className="font-medium text-sm">{doc.label}</p>
                    {documentUrl ? (
                      <>
                        <div className="flex gap-2">
                          <a 
                            href={documentUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Preview
                          </a>
                          <a 
                            href={documentUrl} 
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
                          >
                            <FileDown className="w-3 h-3" />
                            Download
                          </a>
                        </div>
                        {documentUrl.toLowerCase().includes('.pdf') ? (
                          <iframe 
                            src={documentUrl} 
                            className="w-full h-48 rounded border border-border/50" 
                            title={doc.label}
                          />
                        ) : (
                          <img 
                            src={documentUrl} 
                            alt={doc.label}
                            className="max-h-40 rounded border border-border/50 object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Belum diupload</p>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Koreksi & Hasil Tes</CardTitle>
            <CardDescription>Berikan penilaian hasil tes calon santri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {pendaftar.soalJawab ? (
              <div className="space-y-2">
                <Label>Jawaban Santri</Label>
                <div className="p-4 bg-muted/30 border border-border rounded-md text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {pendaftar.soalJawab}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Santri belum mengirimkan jawaban tes.</p>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nilai Tes (Angka)</Label>
                <Input 
                  type="number"
                  placeholder="0 - 100" 
                  value={testForm.nilai}
                  onChange={(e) => setTestForm({...testForm, nilai: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Status Kelulusan Tes</Label>
                <Input 
                  placeholder="Lulus / Tidak Lulus" 
                  value={testForm.statusTes}
                  onChange={(e) => setTestForm({...testForm, statusTes: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Catatan Admin (Opsional)</Label>
              <Textarea 
                placeholder="Tambahkan catatan koreksi..." 
                value={testForm.catatanTes}
                onChange={(e) => setTestForm({...testForm, catatanTes: e.target.value})}
              />
            </div>

            <Button onClick={handleSaveTestResult} disabled={testResultLoading}>
              {testResultLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Simpan Hasil Tes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
