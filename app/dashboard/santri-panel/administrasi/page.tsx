"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Receipt,
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  CreditCard,
  History,
  Info
} from "lucide-react"
import { useSantriAdministrasi } from "@/hooks/use-santri-administrasi"
import { authService } from "@/lib/services/auth.service"
import { Loader2 } from "lucide-react"

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)

const StatusBadge = ({ status }: { status: string }) => {
  switch (status.toLowerCase()) {
    case "lunas":
      return <Badge className="bg-emerald-500/15 text-emerald-600 border-0 font-medium">Lunas</Badge>
    case "menunggu_konfirmasi":
      return <Badge className="bg-blue-500/15 text-blue-600 border-0 font-medium">Menunggu Konfirmasi</Badge>
    case "dibatalkan":
      return <Badge className="bg-slate-500/15 text-slate-600 border-0 font-medium">Dibatalkan</Badge>
    default:
      return <Badge className="bg-red-500/15 text-red-600 border-0 font-medium">Menunggu Pembayaran</Badge>
  }
}

export default function SantriAdministrasiPage() {
  const { data, loading, error, fetchAdministrasi } = useSantriAdministrasi()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkUser = async () => {
      const me = await authService.me()
      if (me && me.user) {
        setUser(me.user)
        const id = me.user.id_santri || me.user.id
        fetchAdministrasi(id.toString())
      }
    }
    checkUser()
  }, [fetchAdministrasi])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Memuat data administrasi...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Gagal Memuat Data</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
      </div>
    )
  }

  const ringkasan = data?.ringkasan
  const invoices = data?.invoice || []
  const profil = data?.profil

  const paymentPercentage = ringkasan?.total_tagihan 
    ? Math.round((ringkasan.total_dibayar / ringkasan.total_tagihan) * 100) 
    : 0

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 border border-primary/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Administrasi Santri</h1>
            <p className="text-muted-foreground max-w-md">
              Kelola tagihan SPP, biaya pendaftaran, dan lihat riwayat pembayaran Anda dalam satu tempat.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1">Status Keuangan</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">{paymentPercentage}%</span>
                <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000" 
                    style={{ width: `${paymentPercentage}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tagihan</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(ringkasan?.total_tagihan || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sudah Dibayar</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(ringkasan?.total_dibayar || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tunggakan</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(ringkasan?.total_tunggakan || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Invoice Table */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Daftar Tagihan & Riwayat
                </CardTitle>
                <CardDescription>Semua rincian biaya dan status pembayaran</CardDescription>
              </div>
              <Badge variant="outline" className="font-normal">
                {invoices.length} Invoice
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-[150px]">No. Invoice</TableHead>
                    <TableHead>Rincian</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Belum ada data tagihan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices.map((inv) => (
                      <TableRow key={inv.id_pembayaran} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-mono text-sm font-medium text-primary">
                          {inv.nomor_invoice}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {inv.rincian_tagihan || (inv.id_pembayaran ? "Biaya Administrasi" : "-")}
                            </span>
                            <span className="text-xs text-muted-foreground italic">
                              {inv.periode_tagihan || "Sekali Bayar"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {inv.waktu_invoice ? new Date(inv.waktu_invoice).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          }) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground whitespace-nowrap">
                          {formatCurrency(inv.jumlah_tagihan)}
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={inv.status_key} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {inv.status_key === 'lunas' && inv.kwitansi_url ? (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" asChild>
                                <a href={inv.kwitansi_url} target="_blank" rel="noreferrer" title="Unduh Kwitansi">
                                  <Download className="w-4 h-4" />
                                </a>
                              </Button>
                            ) : inv.status_key === 'menunggu_pembayaran' ? (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-500" title="Bayar Sekarang">
                                <CreditCard className="w-4 h-4" />
                              </Button>
                            ) : null}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                              <FileText className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Info Sidebar */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="h-16 bg-gradient-to-r from-primary/20 to-accent/20" />
            <CardContent className="p-6 -mt-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-card border-4 border-background flex items-center justify-center text-primary text-2xl font-bold shadow-lg mb-4">
                  {profil?.nama_lengkap?.[0] || "S"}
                </div>
                <h3 className="text-lg font-bold text-foreground">{profil?.nama_lengkap || "-"}</h3>
                <p className="text-xs font-mono text-muted-foreground mb-4">{profil?.nomor_induk || "-"}</p>
                
                <div className="w-full grid grid-cols-2 gap-4 text-left border-t border-border pt-4">
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">Kelas</p>
                    <p className="text-sm font-semibold">{profil?.kelas_sekarang || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">Unit</p>
                    <p className="text-sm font-semibold">{profil?.nama_unit || "-"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info Card */}
          <Card className="border-primary/20 bg-primary/5 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-primary">
                <Info className="w-4 h-4" />
                Informasi Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pembayaran dapat dilakukan melalui transfer bank atau melalui bagian administrasi pesantren. 
                Setelah melakukan transfer, silakan hubungi admin via WhatsApp untuk konfirmasi manual jika status belum berubah.
              </p>
              <div className="p-3 rounded-lg bg-card border border-primary/10">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Pilihan Metode</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span>Transfer Bank (BSI/BRI)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span>Tunai di Kantor TU</span>
                  </div>
                </div>
              </div>
              <Button className="w-full gap-2 shadow-lg shadow-primary/20">
                <Wallet className="w-4 h-4" />
                Bayar via WhatsApp
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
