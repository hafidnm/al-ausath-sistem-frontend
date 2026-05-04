"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, FileText, CheckCircle2 } from "lucide-react"
import { useTunggakanSantri } from "@/hooks/use-pembayaran"

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v)

const formatDateTime = (v: string) => {
  if (!v) return "-"
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? v : d.toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric"
  })
}

export default function ProsesPembayaranSantriPage() {
  const params = useParams()
  const router = useRouter()
  const idSantri = params.id as string

  const { data, loading, error, fetchTunggakan } = useTunggakanSantri()

  useEffect(() => {
    if (idSantri) {
      void fetchTunggakan(idSantri)
    }
  }, [idSantri, fetchTunggakan])

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Detail Pembayaran Santri</h1>
          <p className="text-sm text-muted-foreground">
            Lihat tunggakan dan proses pembayaran untuk santri.
          </p>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-20 text-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Memuat data tagihan santri...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-20 text-center text-destructive">
            <p>Gagal memuat data: {error}</p>
            <Button variant="outline" onClick={() => void fetchTunggakan(idSantri)} className="mt-4">Coba Lagi</Button>
          </CardContent>
        </Card>
      ) : !data ? (
        <Card>
          <CardContent className="py-20 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Tidak Ada Tunggakan</h2>
            <p className="text-muted-foreground">Santri ini tidak memiliki tagihan yang belum lunas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Kolom Kiri: Profil & Ringkasan */}
          <div className="space-y-6 md:col-span-1">
            <Card>
              <CardHeader className="pb-4 border-b">
                <CardTitle className="text-lg">Profil Santri</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Nama Lengkap</p>
                  <p className="font-medium text-base">{data.nama_santri}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Nomor Induk</p>
                    <p className="font-mono">{data.nomor_induk}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Kelas</p>
                    <p>{data.kode_kelas}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground font-medium mb-2">Total Tunggakan</p>
                <p className="text-3xl font-bold text-primary">{formatCurrency(data.total_tunggakan)}</p>
                <div className="mt-4 pt-4 border-t border-primary/10 flex justify-between text-sm">
                  <span className="text-muted-foreground">Jumlah Tagihan:</span>
                  <span className="font-semibold">{data.jumlah_transaksi_tunggakan} Item</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Kolom Kanan: Daftar Tagihan */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Rincian Tagihan Belum Lunas</CardTitle>
                <CardDescription>Daftar invoice dan tagihan yang perlu diselesaikan.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.rincian.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Tidak ada tagihan tertunggak.</p>
                  ) : (
                    data.rincian.map((item, idx) => (
                      <div key={item.id_pembayaran || idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-primary/10 text-primary rounded-md hidden sm:block">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold">{item.kategori}</p>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                              <span>Tgl Jatuh Tempo: {formatDateTime(item.tanggal_bayar)}</span>
                              <span>•</span>
                              <Badge variant="outline" className="font-normal">{item.status.replace(/_/g, ' ').toUpperCase()}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 sm:mt-0 flex flex-col sm:items-end gap-2">
                          <p className="font-bold text-lg">{formatCurrency(item.nominal_bayar)}</p>
                          {/* Future: Process button per invoice */}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
