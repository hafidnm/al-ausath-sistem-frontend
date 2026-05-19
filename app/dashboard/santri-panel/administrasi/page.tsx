"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCachedUser } from "@/lib/auth-cache"
import { useTagihan } from "@/hooks/use-pembayaran"
import type { StatusPembayaran } from "@/lib/services/pembayaran.service"
import { AlertCircle, Megaphone, Receipt, Wallet } from "lucide-react"

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
  menunggu_konfirmasi: "Menunggu Konfirmasi",
  lunas: "Lunas",
  dibatalkan: "Dibatalkan",
}

const statusBadgeClassMap: Record<StatusPembayaran, string> = {
  menunggu_pembayaran: "bg-red-500/15 text-red-600 border-0",
  menunggu_konfirmasi: "bg-blue-500/15 text-blue-600 border-0",
  lunas: "bg-emerald-500/15 text-emerald-600 border-0",
  dibatalkan: "bg-slate-500/15 text-slate-600 border-0",
}

export default function SantriAdministrasiPage() {
  const { data: allTagihan, loading, error, fetchTagihan } = useTagihan()
  const [nomorInduk, setNomorInduk] = useState("")

  useEffect(() => {
    void fetchTagihan()
  }, [fetchTagihan])

  useEffect(() => {
    const loadAuth = async () => {
      const authData = await getCachedUser()
      const nis = toText(authData?.user?.nomor_induk).trim()
      setNomorInduk(nis)
    }

    void loadAuth()
  }, [])

  const myTagihan = useMemo(() => {
    if (!nomorInduk) return []
    return allTagihan.filter((item) => toText(item.nomorInduk).trim() === nomorInduk)
  }, [allTagihan, nomorInduk])

  const summary = useMemo(() => {
    return myTagihan.reduce(
      (acc, item) => {
        acc.totalTagihan += item.totalTagihan
        acc.totalDibayar += item.totalDibayar
        acc.totalTunggakan += item.totalTunggakan
        return acc
      },
      {
        totalTagihan: 0,
        totalDibayar: 0,
        totalTunggakan: 0,
      },
    )
  }, [myTagihan])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Administrasi Santri</h1>
          <p className="text-sm text-muted-foreground">
            Pantau tagihan, progres pembayaran, dan informasi administrasi penting.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/santri-panel">Kembali ke Dashboard</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/pengumuman">Info Pembayaran</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Total Tagihan</CardDescription>
            <CardTitle className="text-xl">{formatCurrency(summary.totalTagihan)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Receipt className="h-4 w-4" />
              Akumulasi seluruh invoice
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Sudah Dibayar</CardDescription>
            <CardTitle className="text-xl text-emerald-600">{formatCurrency(summary.totalDibayar)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Wallet className="h-4 w-4" />
              Pembayaran terverifikasi
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Sisa Tunggakan</CardDescription>
            <CardTitle className="text-xl text-red-600">{formatCurrency(summary.totalTunggakan)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              Segera lunasi sebelum jatuh tempo
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Daftar Tagihan Anda</CardTitle>
          <CardDescription>
            Menampilkan {myTagihan.length} data tagihan berdasarkan nomor induk santri.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              Gagal memuat data tagihan: {error}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Tahun Ajaran</TableHead>
                    <TableHead>Total Tagihan</TableHead>
                    <TableHead>Total Dibayar</TableHead>
                    <TableHead>Tunggakan</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                        Memuat data tagihan...
                      </TableCell>
                    </TableRow>
                  ) : myTagihan.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                        Data tagihan belum tersedia untuk akun ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    myTagihan.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.namaLengkap || "-"}</TableCell>
                        <TableCell>{row.kelasSaatIni || "-"}</TableCell>
                        <TableCell>{row.tahunAjaran || "-"}</TableCell>
                        <TableCell>{formatCurrency(row.totalTagihan)}</TableCell>
                        <TableCell>{formatCurrency(row.totalDibayar)}</TableCell>
                        <TableCell>{formatCurrency(row.totalTunggakan)}</TableCell>
                        <TableCell>
                          <Badge className={statusBadgeClassMap[row.status]}>{statusLabelMap[row.status]}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">Butuh Bantuan Administrasi?</CardTitle>
          <CardDescription>
            Jika status belum berubah setelah melakukan transfer, kirim bukti pembayaran ke petugas admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/santri-panel/pengumuman">
              <Megaphone className="mr-2 h-4 w-4" />
              Lihat Pengumuman
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
