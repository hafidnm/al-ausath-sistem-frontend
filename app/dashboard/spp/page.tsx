"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  RefreshCw,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Loader2,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react"
import { useTagihan } from "@/hooks/use-pembayaran"
import type { TagihanRow, StatusPembayaran } from "@/hooks/use-pembayaran"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)

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

const statusOptions = [
  { value: "all", label: "Semua Status" },
  { value: "menunggu_pembayaran", label: "Menunggu Pembayaran" },
  { value: "menunggu_konfirmasi", label: "Menunggu Konfirmasi" },
  { value: "lunas", label: "Lunas" },
  { value: "dibatalkan", label: "Dibatalkan" },
]

const ITEMS_PER_PAGE = 10

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TagihanPage() {
  const { data: tagihanData, meta, ringkasan, loading, error, fetchTagihan } = useTagihan()

  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Draft filter (not yet applied)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedSumber, setSelectedSumber] = useState("all")

  // Applied filter (triggers API call)
  const [appliedSearch, setAppliedSearch] = useState("")
  const [appliedStatus, setAppliedStatus] = useState("all")
  const [appliedSumber, setAppliedSumber] = useState("all")

  const [currentPage, setCurrentPage] = useState(1)

  const hasFetched = useRef(false)

  const doFetch = (page: number, search: string, status: string, sumber: string, withRingkasan = false) => {
    void fetchTagihan({
      page,
      per_page: ITEMS_PER_PAGE,
      q: search || undefined,
      status: status !== "all" ? status : undefined,
      sumber: sumber !== "all" ? sumber : undefined,
      include_ringkasan: withRingkasan || undefined,
    })
  }

  // Satu useEffect yang handle initial load + filter/page change
  // Tidak pakai 2 effect terpisah agar tidak terjadi double-fetch (React StrictMode)
  useEffect(() => {
    doFetch(currentPage, appliedSearch, appliedStatus, appliedSumber, !hasFetched.current)
    hasFetched.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, appliedSearch, appliedStatus, appliedSumber])

  const handleApplyFilter = () => {
    setAppliedSearch(searchQuery)
    setAppliedStatus(selectedStatus)
    setAppliedSumber(selectedSumber)
    setCurrentPage(1)
  }

  const handleResetFilter = () => {
    setSearchQuery("")
    setSelectedStatus("all")
    setSelectedSumber("all")
    setAppliedSearch("")
    setAppliedStatus("all")
    setAppliedSumber("all")
    setCurrentPage(1)
  }

  const handleRefresh = () => {
    doFetch(currentPage, appliedSearch, appliedStatus, appliedSumber, !ringkasan)
  }

  // Stats — use embedded ringkasan from first load; fall back to page-local aggregation
  const stats = useMemo(() => {
    if (ringkasan) return ringkasan
    return {
      totalTagihan: tagihanData.reduce((s, r) => s + r.totalTagihan, 0),
      totalDibayar: tagihanData.reduce((s, r) => s + r.totalDibayar, 0),
      totalTunggakan: tagihanData.reduce((s, r) => s + r.totalTunggakan, 0),
      menungguKonfirmasi: 0,
      lunas: 0,
      dibatalkan: 0,
    }
  }, [ringkasan, tagihanData])

  const totalPages = meta?.last_page ?? 1
  const totalSantri = meta?.total ?? tagihanData.length

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
          onClick={handleRefresh}
          disabled={loading}
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
                <p className="text-xl font-bold text-foreground">{totalSantri}</p>
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
                <p className="text-lg font-bold text-red-600">{formatCurrency(stats.totalTunggakan)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collapsible Filter Bar */}
      <Card className="border">
        <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="h-14 w-full justify-between rounded-none bg-white px-5 text-base font-semibold text-foreground shadow-none hover:bg-white hover:text-foreground animate-none"
            >
              <span className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter Data
              </span>
              <ChevronDown className="h-5 w-5" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="border-t p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Kata Kunci</Label>
                  <Input
                    placeholder="Masukan nama atau nomor induk"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyFilter()}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pilih Unit/Sumber</Label>
                  <Select value={selectedSumber} onValueChange={setSelectedSumber}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Sumber" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Sumber</SelectItem>
                      <SelectItem value="santri">Santri</SelectItem>
                      <SelectItem value="ppdb">PPDB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status Pembayaran</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleApplyFilter}>
                  Terapkan Filter
                </Button>
                <Button variant="outline" onClick={handleResetFilter}>
                  Reset Filter
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Table Card */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle>Daftar Tagihan</CardTitle>
              <CardDescription>
                Menampilkan {tagihanData.length} data tagihan
                {meta ? ` (total ${meta.total})` : ""}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
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
                ) : tagihanData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                      Tidak ada data tagihan yang sesuai filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  tagihanData.map((row: TagihanRow) => (
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
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{row.namaLengkap || "-"}</span>
                          {row.isAnakGuru && (
                            <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/20 border-0 font-medium text-[10px] px-1.5 py-0.5">
                              Anak Guru
                            </Badge>
                          )}
                        </div>
                      </TableCell>
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Halaman {currentPage} dari {totalPages}
                {meta ? ` · ${meta.total} data` : ""}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || loading}
                >
                  Selanjutnya
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
