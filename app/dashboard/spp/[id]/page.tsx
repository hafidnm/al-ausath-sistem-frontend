"use client"

import { useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Receipt, Wallet, AlertTriangle, User, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useTagihanDetail } from "@/hooks/use-pembayaran"

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v)

const formatDate = (value: string | null) => {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
}

export default function SppTagihanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const { data, loading, error, fetchTagihanDetail } = useTagihanDetail()

  useEffect(() => {
    if (id) {
      void fetchTagihanDetail(id)
    }
  }, [id, fetchTagihanDetail])

  const belumLunas = useMemo(
    () => (data?.invoice ?? []).filter((item) => item.status_key !== "lunas"),
    [data],
  )
  const sudahLunas = useMemo(
    () => (data?.invoice ?? []).filter((item) => item.status_key === "lunas"),
    [data],
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/spp") }>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Detail Tagihan</h1>
          <p className="text-sm text-muted-foreground">Ringkasan dan rincian invoice per santri/calon santri</p>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Memuat detail tagihan...
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center text-destructive">{error}</CardContent>
        </Card>
      ) : !data ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Data tidak ditemukan.</CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-border/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Jumlah Invoice</p>
                <p className="text-xl font-bold">{data.ringkasan.jumlah_invoice}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total Tagihan</p>
                <p className="text-lg font-bold">{formatCurrency(data.ringkasan.total_tagihan)}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Sudah Dibayar</p>
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(data.ringkasan.total_dibayar)}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Belum Dibayar</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(data.ringkasan.total_tunggakan)}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Profil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Nama Lengkap</p>
                  <p className="font-medium">{data.profil.nama_lengkap || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nomor Induk/Pendaftaran</p>
                  <p className="font-mono">{data.profil.nomor_induk || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Unit</p>
                  <p>{data.profil.nama_unit || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Kelas</p>
                  <p>{data.profil.kelas_sekarang || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tahun Ajaran</p>
                  <p>{data.profil.tahun_ajaran || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sumber</p>
                  <Badge variant="outline" className="uppercase">{data.profil.sumber}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Daftar Tagihan</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="belum-lunas" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="belum-lunas">Belum Lunas ({belumLunas.length})</TabsTrigger>
                    <TabsTrigger value="sudah-lunas">Sudah Lunas ({sudahLunas.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="belum-lunas">
                    <InvoiceTable rows={belumLunas} />
                  </TabsContent>

                  <TabsContent value="sudah-lunas">
                    <InvoiceTable rows={sudahLunas} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

function InvoiceTable({
  rows,
}: {
  rows: Array<{
    id_pembayaran: number
    nomor_invoice: string
    periode_tagihan: string | null
    rincian_tagihan: string | null
    jumlah_tagihan: number
    jumlah_dibayar: number
    jumlah_tunggakan: number
    status_label: string
    waktu_invoice: string | null
    kwitansi_url: string | null
  }>
}) {
  return (
    <div className="rounded-lg border border-border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Periode</TableHead>
            <TableHead>Rincian</TableHead>
            <TableHead className="text-right">Tagihan</TableHead>
            <TableHead className="text-right">Dibayar</TableHead>
            <TableHead className="text-right">Tunggakan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Kwitansi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Tidak ada data.</TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id_pembayaran}>
                <TableCell className="font-medium">{row.nomor_invoice}</TableCell>
                <TableCell>{row.periode_tagihan || formatDate(row.waktu_invoice)}</TableCell>
                <TableCell>{row.rincian_tagihan || "Tagihan"}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.jumlah_tagihan)}</TableCell>
                <TableCell className="text-right text-emerald-600">{formatCurrency(row.jumlah_dibayar)}</TableCell>
                <TableCell className="text-right text-red-600">{formatCurrency(row.jumlah_tunggakan)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{row.status_label}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {row.kwitansi_url ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={row.kwitansi_url} target="_blank" rel="noreferrer" download>
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </a>
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
