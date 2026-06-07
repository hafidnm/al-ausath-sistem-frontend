"use client"

import { useEffect, useMemo, useState } from "react"
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
  Search,
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
  const { data: tagihanData, meta, loading, error, fetchTagihan } = useTagihan()
  const { data: ringkasan, loading: ringkasanLoading, fetchRingkasan } = useRingkasanPembayaran()

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedSumber, setSelectedSumber] = useState("all")
  const [selectedKelas, setSelectedKelas] = useState("all")
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState("all")

  const [appliedSearchQuery, setAppliedSearchQuery] = useState("")
  const [appliedStatus, setAppliedStatus] = useState("all")
  const [appliedSumber, setAppliedSumber] = useState("all")
  const [appliedKelas, setAppliedKelas] = useState("all")
  const [appliedTahunAjaran, setAppliedTahunAjaran] = useState("all")
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // ── Single stable fetch effect ─────────────────────────────────────────────
  useEffect(() => {
    void fetchTagihan({
      page: currentPage,
      per_page: itemsPerPage,
      q: appliedSearchQuery || undefined,
      status: appliedStatus !== "all" ? appliedStatus : undefined,
      sumber: appliedSumber !== "all" ? appliedSumber : undefined,
    })
    void fetchRingkasan()
  }, [currentPage, appliedSearchQuery, appliedStatus, appliedSumber, fetchTagihan, fetchRingkasan])

  const refreshAll = async () => {
    await Promise.all([
      fetchTagihan({
        page: currentPage,
        per_page: itemsPerPage,
        q: appliedSearchQuery || undefined,
        status: appliedStatus !== "all" ? appliedStatus : undefined,
        sumber: appliedSumber !== "all" ? appliedSumber : undefined,
      }),
      fetchRingkasan()
    ])
  }

  const handleApplyFilter = () => {
    setAppliedSearchQuery(searchQuery)
    setAppliedStatus(selectedStatus)
    setAppliedSumber(selectedSumber)
    setAppliedKelas(selectedKelas)
    setAppliedTahunAjaran(selectedTahunAjaran)
    setCurrentPage(1)
  }

  const handleResetFilter = () => {
    setSearchQuery("")
    setSelectedStatus("all")
    setSelectedSumber("all")
    setSelectedKelas("all")
    setSelectedTahunAjaran("all")
    setAppliedSearchQuery("")
    setAppliedStatus("all")
    setAppliedSumber("all")
    setAppliedKelas("all")
    setAppliedTahunAjaran("all")
    setCurrentPage(1)
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

  // ── Options from data ─────────────────────────────────────────────────
  const sumberOptions = useMemo(() => {
    const set = new Set(tagihanData.map((r) => r.sumber))
    return Array.from(set)
  }, [tagihanData])

  const kelasOptions = useMemo(() => {
    const set = new Set(tagihanData.map((r) => r.kelasSaatIni).filter(Boolean))
    return Array.from(set).sort()
  }, [tagihanData])

  const tahunAjaranOptions = useMemo(() => {
    const set = new Set(tagihanData.map((r) => r.tahunAjaran).filter(Boolean))
    return Array.from(set).sort()
  }, [tagihanData])

  // ── Filter ─────────────────────────────────────────────────────────────────
  // Since we use server-side pagination, filteredData is just tagihanData
  // But we still apply local filters for kelas and tahunAjaran since backend doesn't support them yet
  const filteredData = useMemo(() => {
    return tagihanData.filter((row) => {
      const matchesKelas = appliedKelas === "all" || row.kelasSaatIni === appliedKelas
      const matchesTahunAjaran = appliedTahunAjaran === "all" || row.tahunAjaran === appliedTahunAjaran
      return matchesKelas && matchesTahunAjaran
    })
  }, [tagihanData, appliedKelas, appliedTahunAjaran])

  const totalTunggakanFiltered = filteredData.reduce((s, r) => s + r.totalTunggakan, 0)
  
  const localTotalSantri = useMemo(() => {
    const ids = new Set(tagihanData.map((row) => row.id).filter(Boolean))
    return ids.size
  }, [tagihanData])
  const totalSantriTagihan = meta?.total ?? localTotalSantri

  const totalPages = meta?.last_page ?? Math.max(1, Math.ceil(filteredData.length / itemsPerPage))
  
  const localPaginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredData.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredData, currentPage, itemsPerPage])
  const paginatedData = meta ? filteredData : localPaginatedData

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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div className="space-y-2">
                  <Label>Kata Kunci</Label>
                  <Input
                    placeholder="Masukan nama atau nomor induk"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
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
                  <Label>Pilih Kelas</Label>
                  <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kelas</SelectItem>
                      {kelasOptions.map((k) => (
                        <SelectItem key={k} value={k}>
                          Kelas {k}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tahun Ajaran</Label>
                  <Select value={selectedTahunAjaran} onValueChange={setSelectedTahunAjaran}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Tahun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Tahun</SelectItem>
                      {tahunAjaranOptions.map((t) => (
                        <SelectItem key={t} value={t}>
                          TA {t}
                        </SelectItem>
                      ))}
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
                Menampilkan {filteredData.length} data tagihan
                {totalTunggakanFiltered > 0
                  ? ` · Total Tunggakan: ${formatCurrency(totalTunggakanFiltered)}`
                  : ""}
              </CardDescription>
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
                  paginatedData.map((row: TagihanRow) => (
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
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Menampilkan {Math.min(filteredData.length, (currentPage - 1) * itemsPerPage + 1)} -{" "}
                {Math.min(filteredData.length, currentPage * itemsPerPage)} dari {filteredData.length} data
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Sebelummya
                </Button>
                <div className="text-sm font-medium">
                  Halaman {currentPage} dari {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
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
