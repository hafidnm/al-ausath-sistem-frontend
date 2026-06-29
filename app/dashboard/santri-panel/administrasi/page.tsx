"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCachedUser } from "@/lib/auth-cache"
import { useTagihanDetail } from "@/hooks/use-pembayaran"
import type { StatusPembayaran } from "@/lib/services/pembayaran.service"
import { AlertCircle, Megaphone, Receipt, Wallet, ArrowLeft, CreditCard, UploadCloud, CheckCircle2, Loader2, Info, Download, Percent, Landmark } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/axios"

interface RekeningBank {
  id_rekening: number
  nama_rekening: string
  nama_pemilik: string
  nomor_rekening: string
  nama_bank: string
  cabang_bank: string | null
  peruntukan: string | null
  status: string
}

const toText = (value: unknown): string => {
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return ""
}

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)

const statusLabelMap: Record<StatusPembayaran, string> = {
  menunggu_pembayaran: "Menunggu Pembayaran",
  menunggu_konfirmasi: "Menunggu Verifikasi",
  lunas: "Lunas",
  dibatalkan: "Dibatalkan",
}

const statusBadgeClassMap: Record<StatusPembayaran, string> = {
  menunggu_pembayaran: "bg-rose-500/15 text-rose-600 border-0 text-xs font-semibold",
  menunggu_konfirmasi: "bg-amber-500/15 text-amber-600 border-0 text-xs font-semibold animate-pulse",
  lunas: "bg-emerald-500/15 text-emerald-600 border-0 text-xs font-semibold",
  dibatalkan: "bg-slate-500/15 text-slate-600 border-0 text-xs font-semibold",
}

const ppdbAcceptedStatusRegex = /diterima|lulus|accepted|aktif/i

function isPpdbAcceptedStatus(status?: string | null) {
  return Boolean(status && ppdbAcceptedStatusRegex.test(status))
}

type InvoiceDetailRow = {
  id_pembayaran: number
  nomor_invoice: string
  periode_tagihan: string | null
  rincian_tagihan: string | null
  jenis_tagihan: string
  jumlah_tagihan: number
  jumlah_dibayar: number
  jumlah_tunggakan: number
  status: string
  status_key: StatusPembayaran
  status_label: string
  waktu_invoice: string | null
  kwitansi_tersedia: boolean
  kwitansi_url: string | null
  jumlah_minimum_dp?: number // Tambahan untuk DP 50%
  bulan?: string | null // Untuk tracking bulan SPP
}

type PaymentOption = 'lunas' | 'dp'

type SppSettingSummary = {
  id_setting: number
  nama_setting: string
  periode: string | null
  jenjang: string | null
  kode_kelas: string | null
  jumlah: number
  aktif: boolean
}

export default function SantriAdministrasiPage() {
  const { toast } = useToast()
  const { data: detailData, loading: loadingDetail, fetchTagihanDetail } = useTagihanDetail()
  
  const [nomorInduk, setNomorInduk] = useState("")
  const [rekeningList, setRekeningList] = useState<RekeningBank[]>([])
  const [selectedRekeningId, setSelectedRekeningId] = useState("")

  // Payment upload states
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetailRow | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [metode, setMetode] = useState("Transfer Bank")
  const [paymentOption, setPaymentOption] = useState<PaymentOption>("lunas")
  const [catatan, setCatatan] = useState("")
  const [downloadingKwitansiId, setDownloadingKwitansiId] = useState<number | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [santriId, setSantriId] = useState<number | null>(null)

  useEffect(() => {
    const loadAuth = async () => {
      const authData = await getCachedUser()
      const nis = toText(authData?.user?.nomor_induk).trim()
      const sid = authData?.user?.id_santri ?? authData?.santri?.id_santri ?? null
      setNomorInduk(nis)
      if (sid) {
        const numericSid = Number(sid)
        setSantriId(numericSid)
        void fetchTagihanDetail(String(numericSid))
      }
    }
    void loadAuth()

    // Load rekening bank aktif
    api.get("/administrasi/rekening?status=AKTIF")
      .then((res) => {
        const list = res.data?.data ?? []
        setRekeningList(list)
        if (list.length > 0) {
          setSelectedRekeningId(String(list[0].id_rekening))
        }
      })
      .catch(() => {/* silently fail - rekening not critical */})
  }, [fetchTagihanDetail])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handlePayClick = (invoice: InvoiceDetailRow) => {
    setSelectedInvoice(invoice)
    setFile(null)
    setPreviewUrl(null)
    setMetode("Transfer Bank")
    setPaymentOption("lunas")
    setCatatan("")
    setPayDialogOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (selected.size > 5 * 1024 * 1024) {
      toast({
        title: "File terlalu besar",
        description: "Ukuran maksimal file adalah 5MB",
        variant: "destructive",
      })
      return
    }

    setFile(selected)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(selected))
  }

  const handleUpload = async () => {
    if (!file || !selectedInvoice) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("bukti_bayar", file)
      formData.append("metode_bayar", metode)
      formData.append("payment_option", paymentOption)
      if (metode === "Transfer Bank" && selectedRekeningId) {
        formData.append("id_rekening", selectedRekeningId)
      }
      const finalCatatan = paymentOption === "dp"
        ? `DP 50%${catatan ? ` - ${catatan}` : ""}`
        : `Lunas${catatan ? ` - ${catatan}` : ""}`

      if (finalCatatan) {
        formData.append("catatan_bayar", finalCatatan)
      }

      await api.post(`/administrasi/pembayaran/${selectedInvoice.id_pembayaran}/upload-bukti`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      toast({
        title: "Berhasil",
        description: "Bukti pembayaran berhasil diunggah. Menunggu konfirmasi admin.",
      })

      setPayDialogOpen(false)
      setFile(null)
      setPreviewUrl(null)
      
      // Re-fetch bills
      if (santriId) {
        await fetchTagihanDetail(String(santriId))
      }
    } catch (error: any) {
      toast({
        title: "Gagal mengunggah",
        description: error.response?.data?.message || "Terjadi kesalahan saat mengunggah bukti pembayaran",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDownloadKwitansi = async (id: number) => {
    setDownloadingKwitansiId(id)
    try {
      const response = await api.get(`/administrasi/spp/pembayaran/${id}/kwitansi`, {
        responseType: "blob",
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `Kwitansi-SPP-${id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Kwitansi Terunduh",
        description: "File kwitansi resmi berhasil disimpan.",
      })
    } catch (error) {
      toast({
        title: "Gagal Mengunduh",
        description: "Kwitansi belum tersedia atau gagal diunduh.",
        variant: "destructive",
      })
    } finally {
      setDownloadingKwitansiId(null)
    }
  }

  const invoices = detailData?.invoice || []
  const ppdbSelection = detailData?.ppdb_selection ?? null
  const linkedSppSettings = detailData?.spp_settings ?? []
  const dpMinimum = selectedInvoice?.jumlah_minimum_dp ?? Math.ceil((selectedInvoice?.jumlah_tunggakan ?? 0) * 0.5)
  const jumlahBayarSaatIni = selectedInvoice ? (paymentOption === "dp" ? dpMinimum : selectedInvoice.jumlah_tunggakan) : 0

  const belumLunas = useMemo(
    () => invoices.filter((item) => item.status_key !== "lunas"),
    [invoices]
  )

  const sudahLunas = useMemo(
    () => invoices.filter((item) => item.status_key === "lunas"),
    [invoices]
  )

  const ppdbInvoices = useMemo(
    () => invoices.filter((item) => (item.jenis_tagihan ?? "").toUpperCase().includes("PPDB")),
    [invoices]
  )

  const summary = useMemo(() => {
    return invoices.reduce(
      (acc, item) => {
        if (item.status_key === "dibatalkan") return acc
        acc.totalTagihan += item.jumlah_tagihan
        acc.totalDibayar += item.jumlah_dibayar
        acc.totalTunggakan += item.jumlah_tunggakan
        return acc
      },
      {
        totalTagihan: 0,
        totalDibayar: 0,
        totalTunggakan: 0,
      }
    )
  }, [invoices])

  const isPpdbProfile = detailData?.profil?.sumber === 'ppdb'
  const isPpdbAccepted = isPpdbAcceptedStatus(detailData?.profil?.status)
  const hasPpdbBilling = isPpdbProfile || ppdbInvoices.length > 0
  const belumLunasEmptyMessage = hasPpdbBilling && !isPpdbAccepted
    ? 'Tagihan PPDB akan muncul setelah pendaftaran Anda diterima. Silakan periksa status PPDB di dashboard PPDB.'
    : 'Alhamdulillah! Tidak ada tagihan yang belum lunas.'

  const isLoading = loadingDetail || !detailData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
            Administrasi Santri
          </h1>
          <p className="text-sm text-muted-foreground">
            Pantau tagihan bulanan, unggah bukti transfer, dan unduh kwitansi resmi pesantren.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="shadow-sm">
            <Link href="/dashboard/santri-panel">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Dashboard
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
            <Link href="/dashboard/pengumuman">Info Pembayaran</Link>
          </Button>
        </div>
      </div>

      {/* Profil Info Card - Tampilkan jika ada data anak guru atau dari PPDB */}
      {detailData?.profil && (detailData.profil.isAnakGuru || hasPpdbBilling) && (
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-5 w-5 text-emerald-600" />
              Informasi Profil Santri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Nama Lengkap</p>
                <p className="font-medium">{detailData.profil.nama_lengkap}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">NIS/Nomor Induk</p>
                <p className="font-medium font-mono">{detailData.profil.nomor_induk}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Unit/Jenjang</p>
                <p className="font-medium">{detailData.profil.nama_unit}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Kelas</p>
                <p className="font-medium">{detailData.profil.kelas_sekarang || '-'}</p>
              </div>
            </div>
            
            {detailData.profil.isAnakGuru && (
              <div className="mt-3 rounded-lg border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-3 flex gap-2.5">
                <div className="shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Percent className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-100">Status Anak Guru</p>
                  <p className="text-xs text-amber-800 dark:text-amber-200 mt-0.5">
                    Mendapatkan diskon 50% untuk tagihan Uang Pangkal PPDB sesuai kebijakan pesantren.
                  </p>
                </div>
              </div>
            )}
            
            {hasPpdbBilling && (
              <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 p-3 text-xs text-blue-800 dark:text-blue-200">
                <p className="font-semibold flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  Data dari PPDB
                </p>
                <p className="mt-1">
                  Infaq PPDB berbeda dengan tagihan SPP reguler. Pilihan infaq yang Anda isi saat pendaftaran
                  akan muncul sebagai tagihan di halaman <strong>Administrasi</strong> setelah pendaftaran benar-benar
                  diterima oleh pesantren.
                </p>
              </div>
            )}

            {ppdbInvoices.length > 0 && (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900">
                <p className="font-semibold flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5" />
                  Tagihan PPDB / Infaq Tercatat
                </p>
                <p className="mt-1 text-emerald-800">
                  Ada {ppdbInvoices.length} tagihan PPDB/infaq yang sudah masuk ke akun santri ini dan tampil di daftar tagihan di bawah.
                </p>
              </div>
            )}

            {(ppdbSelection || linkedSppSettings.length > 0) && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 space-y-3">
                <p className="font-semibold flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5" />
                  Ringkasan Pilihan Tagihan
                </p>
                {ppdbSelection && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Pilihan Uang Gedung</p>
                      <p className="font-medium">
                        {ppdbSelection.pilihan_uang_gedung === 1
                          ? 'Pilihan A'
                          : ppdbSelection.pilihan_uang_gedung === 2
                            ? 'Pilihan B'
                            : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Pilihan Infaq Bulanan</p>
                      <p className="font-medium">
                        {ppdbSelection.pilihan_infaq_bulanan === 1
                          ? 'Pilihan A'
                          : ppdbSelection.pilihan_infaq_bulanan === 2
                            ? 'Pilihan B'
                            : '-'}
                      </p>
                    </div>
                  </div>
                )}

                {linkedSppSettings.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="rounded border bg-white p-2">
                      <p className="text-slate-500 uppercase tracking-wide text-[10px]">Tarif SPP Terkait</p>
                      <p className="font-semibold text-xs">{linkedSppSettings.length} jenis tagihan</p>
                    </div>
                    
                    {linkedSppSettings.slice(0, 3).map((setting) => (
                      <div key={setting.id_setting} className="rounded border bg-white px-3 py-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-900">{setting.nama_setting}</p>
                          <p className="text-[10px] text-slate-500">
                            {setting.jenjang || '-'} {setting.kode_kelas ? `• ${setting.kode_kelas}` : ''}
                          </p>
                        </div>
                        <p className="font-semibold text-slate-700">{formatCurrency(setting.jumlah)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/50 bg-gradient-to-br from-white to-slate-50/50 shadow-md transition-all hover:shadow-lg dark:from-slate-900 dark:to-slate-900/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Seluruh Tagihan
            </CardDescription>
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
              {formatCurrency(summary.totalTagihan)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Receipt className="h-4 w-4 text-primary" />
              Akumulasi tagihan aktif Anda
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-white to-emerald-50/20 shadow-md transition-all hover:shadow-lg dark:from-slate-900 dark:to-emerald-950/10">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sudah Dibayar (Lunas)
            </CardDescription>
            <CardTitle className="text-2xl font-bold tracking-tight text-emerald-600">
              {formatCurrency(summary.totalDibayar)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Wallet className="h-4 w-4 text-emerald-500" />
              Pembayaran terverifikasi petugas
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-white to-rose-50/20 shadow-md transition-all hover:shadow-lg dark:from-slate-900 dark:to-rose-950/10">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-rose-700/70 dark:text-rose-400">
              Sisa Tunggakan
            </CardDescription>
            <CardTitle className="text-2xl font-bold tracking-tight text-rose-600">
              {formatCurrency(summary.totalTunggakan)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-4 w-4 text-rose-500" />
              Silakan lunasi tagihan Anda
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tagihan Card with Tabs */}
      <Card className="border-border/50 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Detail Tagihan & Riwayat Transaksi</CardTitle>
          <CardDescription>
            Detail perincian SPP bulanan dan tagihan pendidikan Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="belum-lunas" className="space-y-4">
            <TabsList className="bg-muted/60 p-1 border">
              <TabsTrigger value="belum-lunas" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Belum Lunas ({belumLunas.length})
              </TabsTrigger>
              <TabsTrigger value="sudah-lunas" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Sudah Lunas ({sudahLunas.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="belum-lunas" className="space-y-4">
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead>No. Invoice</TableHead>
                      <TableHead>Tagihan / Periode</TableHead>
                      <TableHead className="text-right">Jumlah Tagihan</TableHead>
                      <TableHead className="text-right">Sisa Tunggakan</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center w-36">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            <span>Memuat data tagihan...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : belumLunas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12 text-center text-muted-foreground text-sm">
                          {belumLunasEmptyMessage}
                        </TableCell>
                      </TableRow>
                    ) : (
                      belumLunas.map((row, idx) => (
                        <TableRow key={row.id_pembayaran} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="text-center text-sm font-medium text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="font-mono text-xs">{row.nomor_invoice}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-semibold text-sm text-foreground">{row.rincian_tagihan || "Tagihan SPP"}</p>
                              <p className="text-xs text-muted-foreground">Tahun Ajaran: {row.periode_tagihan || "-"}</p>
                              {row.bukti_bayar_url && (
                                <p className="text-xs text-emerald-700 mt-1">
                                  Bukti: <a href={row.bukti_bayar_url} target="_blank" rel="noreferrer" className="underline">Lihat</a>
                                </p>
                              )}
                              {row.catatan_bayar && (
                                <p className="text-xs text-muted-foreground mt-1">Catatan: {row.catatan_bayar}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm font-semibold">{formatCurrency(row.jumlah_tagihan)}</TableCell>
                          <TableCell className="text-right text-sm font-semibold text-rose-600">{formatCurrency(row.jumlah_tunggakan)}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={statusBadgeClassMap[row.status_key]}>{statusLabelMap[row.status_key]}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              onClick={() => handlePayClick(row)}
                              size="sm"
                              variant="default"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-8 shadow-sm flex items-center justify-center gap-1 mx-auto"
                            >
                              <UploadCloud className="w-3.5 h-3.5" />
                              {row.status_key === "menunggu_konfirmasi" ? "Upload Ulang" : "Bayar Sekarang"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="sudah-lunas" className="space-y-4">
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead>No. Invoice</TableHead>
                      <TableHead>Tagihan / Periode</TableHead>
                      <TableHead className="text-right">Jumlah Tagihan</TableHead>
                      <TableHead className="text-right">Dibayar</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center w-36">Kwitansi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            <span>Memuat data tagihan...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : sudahLunas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12 text-center text-muted-foreground text-sm">
                          Belum ada riwayat pembayaran yang lunas.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sudahLunas.map((row, idx) => (
                        <TableRow key={row.id_pembayaran} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="text-center text-sm font-medium text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="font-mono text-xs">{row.nomor_invoice}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-semibold text-sm text-foreground">{row.rincian_tagihan || "Tagihan SPP"}</p>
                              <p className="text-xs text-muted-foreground">Tahun Ajaran: {row.periode_tagihan || "-"}</p>
                              {row.bukti_bayar_url && (
                                <p className="text-xs text-emerald-700 mt-1">
                                  Bukti: <a href={row.bukti_bayar_url} target="_blank" rel="noreferrer" className="underline">Lihat</a>
                                </p>
                              )}
                              {row.catatan_bayar && (
                                <p className="text-xs text-muted-foreground mt-1">Catatan: {row.catatan_bayar}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm font-semibold">{formatCurrency(row.jumlah_tagihan)}</TableCell>
                          <TableCell className="text-right text-sm font-semibold text-emerald-600">{formatCurrency(row.jumlah_dibayar)}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={statusBadgeClassMap[row.status_key]}>{statusLabelMap[row.status_key]}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              onClick={() => handleDownloadKwitansi(row.id_pembayaran)}
                              disabled={downloadingKwitansiId === row.id_pembayaran}
                              size="sm"
                              variant="outline"
                              className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 font-medium text-xs h-8 shadow-sm flex items-center justify-center gap-1 mx-auto"
                            >
                              {downloadingKwitansiId === row.id_pembayaran ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                              Kwitansi
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-border/50 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-900/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-5 w-5 text-primary shrink-0" />
            Butuh Bantuan Verifikasi Pembayaran?
          </CardTitle>
          <CardDescription>
            Setelah mengunggah bukti pembayaran, petugas keuangan pesantren akan memverifikasi transfer Anda. Jika dalam 1x24 jam status belum berubah menjadi <strong>Lunas</strong>, silakan kunjungi kantor administrasi pesantren atau hubungi WhatsApp Admin melalui link di bawah ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Button asChild variant="outline" size="sm" className="shadow-sm">
            <Link href="/dashboard/pengumuman">
              <Megaphone className="mr-2 h-4 w-4 text-emerald-600 animate-bounce" />
              Lihat Cara Pembayaran & Rekening
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Payment Proof Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Upload Bukti Transfer
            </DialogTitle>
            <DialogDescription>
              Unggah bukti pembayaran untuk invoice <strong>{selectedInvoice?.nomor_invoice}</strong> ({selectedInvoice?.rincian_tagihan})
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {selectedInvoice?.status_key === "menunggu_konfirmasi" && (
              <div className="rounded border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-3 text-xs text-amber-800 dark:text-amber-300 flex gap-2">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Menunggu Verifikasi Admin</p>
                  <p>Anda sudah pernah mengunggah bukti bayar sebelumnya. Jika ingin merevisi atau mengunggah ulang bukti bayar baru, silakan lakukan di bawah ini.</p>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label className="text-xs text-muted-foreground uppercase font-bold">Opsi Pembayaran</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentOption("lunas")}
                  className={`rounded-lg border px-3 py-2 text-sm text-left transition ${
                    paymentOption === "lunas"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <p className="font-semibold">Bayar Lunas</p>
                  <p className="text-xs">Bayar sisa tagihan penuh</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentOption("dp")}
                  className={`rounded-lg border px-3 py-2 text-sm text-left transition ${
                    paymentOption === "dp"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <p className="font-semibold">Bayar DP</p>
                  <p className="text-xs">Minimal {formatCurrency(dpMinimum)}</p>
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-xs text-muted-foreground uppercase font-bold">Jumlah yang akan dibayarkan</Label>
              <div className="text-2xl font-extrabold text-foreground bg-muted p-3 rounded-lg border border-border flex items-center justify-between">
                <span>{formatCurrency(jumlahBayarSaatIni)}</span>
                <Badge variant="outline" className="text-xs font-mono uppercase bg-background">
                  {selectedInvoice?.jenis_tagihan}
                </Badge>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              {paymentOption === "dp" ? (
                <p>
                  Pilih DP bila Anda ingin membayar sebagian terlebih dahulu. Transfer minimal {formatCurrency(dpMinimum)} dan lampirkan bukti pembayaran.
                </p>
              ) : (
                <p>
                  Bayar lunas untuk menutup seluruh sisa tagihan sekaligus. Sistem akan mencatat bukti transfer dan menunggu verifikasi admin.
                </p>
              )}
            </div>

            {/* Rekening Bank Tujuan Transfer */}
            {rekeningList.length > 0 && metode === "Transfer Bank" && (
              <div className="grid gap-2">
                <Label className="text-xs text-muted-foreground uppercase font-bold flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5" />
                  Rekening Tujuan Transfer (Pilih salah satu)
                </Label>
                <div className="space-y-2">
                  {rekeningList.map((rek) => {
                    const isSelected = selectedRekeningId === String(rek.id_rekening)
                    return (
                      <div
                        key={rek.id_rekening}
                        onClick={() => setSelectedRekeningId(String(rek.id_rekening))}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm cursor-pointer transition-all ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-500"
                            : "border-border bg-muted/30 hover:bg-muted/50"
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-foreground">{rek.nama_bank}{rek.cabang_bank ? ` - ${rek.cabang_bank}` : ""}</p>
                          <p className="font-mono text-base font-bold tracking-wider text-primary">{rek.nomor_rekening}</p>
                          <p className="text-xs text-muted-foreground">a.n. {rek.nama_pemilik}</p>
                          {rek.peruntukan && <p className="text-xs text-muted-foreground/70 italic">{rek.peruntukan}</p>}
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="metode">Metode Pembayaran</Label>
              <Select value={metode} onValueChange={setMetode}>
                <SelectTrigger id="metode">
                  <SelectValue placeholder="Pilih Metode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Transfer Bank">Transfer Bank</SelectItem>
                  <SelectItem value="Tunai">Tunai / Bayar Langsung</SelectItem>
                  <SelectItem value="Lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="catatan">Catatan Tambahan (Opsional)</Label>
              <Input
                id="catatan"
                placeholder="Contoh: Transfer atas nama Budi"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Bukti Transfer (Format JPG, PNG, atau PDF - Maks. 5MB)</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="shadow-sm border-dashed border-2 hover:bg-slate-50"
                >
                  <UploadCloud className="w-4 h-4 mr-2 text-muted-foreground" />
                  Pilih File Bukti
                </Button>
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                />
                <span className="text-xs text-muted-foreground line-clamp-1 truncate max-w-[200px]">
                  {file ? file.name : "Tidak ada file terpilih"}
                </span>
              </div>

              {previewUrl && file?.type.startsWith("image/") && (
                <div className="mt-2 border rounded-lg p-1.5 max-w-[150px] bg-muted/40 shadow-sm mx-auto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview bukti pembayaran"
                    className="w-full h-auto rounded object-contain max-h-36"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setPayDialogOpen(false)} disabled={uploading}>
              Batal
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengunggah...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Kirim Bukti Pembayaran
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
