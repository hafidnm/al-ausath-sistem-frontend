"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  RefreshCw,
  Search,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Loader2,
  Filter,
  Eye,
} from "lucide-react"
import { useTagihan, useRingkasanPembayaran } from "@/hooks/use-pembayaran"
import type { TagihanRow, StatusPembayaran } from "@/hooks/use-pembayaran"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)

/** Status badge sesuai FE Guide §9 */
const StatusBadge = ({ status }: { status: StatusPembayaran }) => {
  switch (status) {
    case "lunas":
      return <Badge className="bg-emerald-500/15 text-emerald-600 border-0 font-medium">Lunas</Badge>
    case "menunggu_konfirmasi":
      return <Badge className="bg-blue-500/15 text-blue-600 border-0 font-medium">Menunggu Konfirmasi</Badge>
    case "dibatalkan":
      return <Badge className="bg-slate-500/15 text-slate-600 border-0 font-medium">Dibatalkan</Badge>
    case "menunggu_pembayaran":
    default:
      return <Badge className="bg-red-500/15 text-red-600 border-0 font-medium">Menunggu Pembayaran</Badge>
  }
}

const statusOptions: Array<{ value: string; label: string }> = [
  { value: "all", label: "Semua Status" },
  { value: "menunggu_pembayaran", label: "Menunggu Pembayaran" },
  { value: "menunggu_konfirmasi", label: "Menunggu Konfirmasi" },
  { value: "lunas", label: "Lunas" },
  { value: "dibatalkan", label: "Dibatalkan" },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TagihanPage() {
  const { data: tagihanData, loading, error, fetchTagihan } = useTagihan()
  const { data: ringkasan, loading: ringkasanLoading, fetchRingkasan } = useRingkasanPembayaran()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedSumber, setSelectedSumber] = useState("all")

  useEffect(() => {
    void fetchTagihan()
    void fetchRingkasan()
  }, [fetchTagihan, fetchRingkasan])

  const refreshAll = async () => {
    await Promise.all([fetchTagihan(), fetchRingkasan()])
  }

  // ── Derived stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (ringkasan) return ringkasan
    return {
      totalTagihan: tagihanData.reduce((s, r) => s + r.totalTagihan, 0),
      totalDibayar: tagihanData.reduce((s, r) => s + r.totalDibayar, 0),
      totalTunggakan: tagihanData.reduce((s, r) => s + r.totalTunggakan, 0),
      menungguKonfirmasi: tagihanData.filter((r) => r.status === "menunggu_konfirmasi").length,
      lunas: tagihanData.filter((r) => r.status === "lunas").length,
      dibatalkan: tagihanData.filter((r) => r.status === "dibatalkan").length,
    }
  }, [ringkasan, tagihanData])

  // ── Unit options from data ─────────────────────────────────────────────────
  const sumberOptions = useMemo(() => {
    const set = new Set(tagihanData.map((r) => r.sumber))
    return Array.from(set)
  }, [tagihanData])

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    const keyword = searchQuery.toLowerCase().trim()
    return tagihanData.filter((row) => {
      const matchesSearch =
        keyword.length === 0 ||
        row.namaLengkap.toLowerCase().includes(keyword) ||
        row.nomorInduk.toLowerCase().includes(keyword) ||
        row.namaUnit.toLowerCase().includes(keyword)
      const matchesStatus = selectedStatus === "all" || row.status === selectedStatus
      const matchesSumber = selectedSumber === "all" || row.sumber === selectedSumber
      return matchesSearch && matchesStatus && matchesSumber
    })
  }, [tagihanData, searchQuery, selectedStatus, selectedSumber])

  const totalTunggakanFiltered = filteredData.reduce((s, r) => s + r.totalTunggakan, 0)
  const totalSantriTagihan = useMemo(() => {
    const ids = new Set(tagihanData.map((row) => row.id).filter(Boolean))
    return ids.size
  }, [tagihanData])

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Tagihan SPP</h1>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Gagal memuat data tagihan: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tagihan</h1>
          <p className="text-sm text-muted-foreground">
            Daftar tagihan seluruh santri (termasuk calon santri PPDB). Tagihan tampil di website,
            pembayaran via WhatsApp, admin verifikasi lalu kwitansi otomatis tersedia.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refreshAll()}
          disabled={loading || ringkasanLoading}
          id="btn-refresh-tagihan"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Jumlah Santri</p>
                <p className="text-xl font-bold text-foreground">{totalSantriTagihan}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Tagihan</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(stats.totalTagihan)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sudah Dibayar</p>
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(stats.totalDibayar)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Tunggakan</p>
                <p className="text-lg font-bold text-red-600">
                  {formatCurrency(
                    typeof stats.totalTunggakan === "number"
                      ? stats.totalTunggakan
                      : totalTunggakanFiltered,
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle>Daftar Tagihan</CardTitle>
              <CardDescription>
                Menampilkan {filteredData.length} data tagihan
                {totalTunggakanFiltered > 0
                  ? ` · Total Tunggakan: ${formatCurrency(totalTunggakanFiltered)}`
                  : ""}
              </CardDescription>
            </div>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search-tagihan"
                  placeholder="Cari nama, nomor induk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[200px]" id="filter-status-tagihan">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sumberOptions.length > 0 && (
                <Select value={selectedSumber} onValueChange={setSelectedSumber}>
                  <SelectTrigger className="w-full sm:w-[150px]" id="filter-sumber-tagihan">
                    <SelectValue placeholder="Sumber" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="santri">Santri</SelectItem>
                    <SelectItem value="ppdb">PPDB</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {/* Sesuai kolom FE Guide §5.2 */}
                  <TableHead>Nama Unit</TableHead>
                  <TableHead>Nomor Induk</TableHead>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>Kelas Sekarang</TableHead>
                  <TableHead>Tahun Ajaran</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total Tagihan</TableHead>
                  <TableHead className="text-right">Total Dibayar</TableHead>
                  <TableHead className="text-right">Total Tunggakan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Memuat data tagihan...
                      </span>
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                      Tidak ada data tagihan yang sesuai filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((row: TagihanRow) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {row.sumber === "ppdb" && (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              PPDB
                            </Badge>
                          )}
                          <span>{row.namaUnit || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {row.nomorInduk || "-"}
                      </TableCell>
                      <TableCell className="font-medium">{row.namaLengkap || "-"}</TableCell>
                      <TableCell>{row.kelasSaatIni || "-"}</TableCell>
                      <TableCell>{row.tahunAjaran || "-"}</TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(row.totalTagihan)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-emerald-600">
                        {formatCurrency(row.totalDibayar)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          row.totalTunggakan > 0 ? "text-red-600" : "text-muted-foreground"
                        }`}
                      >
                        {formatCurrency(row.totalTunggakan)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/dashboard/spp/${row.idSantri || row.idPendaftaran || row.id}`}>
                            <Eye className="w-4 h-4 mr-1" /> Detail
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
