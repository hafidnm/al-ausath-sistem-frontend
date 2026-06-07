"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  useProsesPembayaran,
  useVerifikasiPembayaran,
  useDetailPembayaran,
  useUbahStatusPembayaran,
  useHapusPembayaran,
  type VerifikasiRow,
  type ProsesRow,
  type StatusPembayaran,
} from "@/hooks/use-pembayaran"
import { dataKelasService } from "@/lib/services/kelas.service"
import {
  AlertCircle,
  BadgeCheck,
  ChevronDown,
  Eye,
  Filter,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { pembayaranService } from '@/lib/services/pembayaran.service'
import printKwitansi from '@/lib/utils/printKwitansi'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v)

const formatDateTime = (v: string) => {
  if (!v) return "-"
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? v : d.toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

/** Status badge sesuai FE Guide §9 (warna konsisten) */
const StatusBadge = ({ status }: { status: StatusPembayaran }) => {
  const map: Record<StatusPembayaran, { label: string; cls: string }> = {
    menunggu_pembayaran: { label: "Menunggu Pembayaran", cls: "bg-red-500/15 text-red-600 border-0" },
    menunggu_konfirmasi: { label: "Menunggu Konfirmasi", cls: "bg-blue-500/15 text-blue-600 border-0" },
    dibatalkan:          { label: "Dibatalkan",          cls: "bg-slate-500/15 text-slate-600 border-0" },
    lunas:               { label: "Lunas",               cls: "bg-emerald-500/15 text-emerald-600 border-0" },
  }
  const { label, cls } = map[status] ?? map.menunggu_pembayaran
  return <Badge className={`font-medium ${cls}`}>{label}</Badge>
}

const STATUS_ACTIONS: Array<{ value: StatusPembayaran; label: string; danger?: boolean }> = [
  { value: "lunas", label: "✅ Terima / Lunas" },
  { value: "menunggu_pembayaran", label: "Menunggu Pembayaran" },
  { value: "menunggu_konfirmasi", label: "Menunggu Konfirmasi" },
  { value: "dibatalkan", label: "Batalkan", danger: true },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProsesPembayaranTab() {
  const { data, meta, loading, error, fetchProses } = useProsesPembayaran()
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState("10")

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedKeyword, setSelectedKeyword] = useState("")
  const [selectedUnit, setSelectedUnit] = useState("all")
  const [selectedKelas, setSelectedKelas] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")

  const [appliedKeyword, setAppliedKeyword] = useState("")
  const [appliedUnit, setAppliedUnit] = useState("all")
  const [appliedKelas, setAppliedKelas] = useState("all")
  const [appliedStatus, setAppliedStatus] = useState("all")

  const [kelasList, setKelasList] = useState<{ id: number; kode_kelas: string; nama_kelas?: string; tahun_ajaran?: string }[]>([])
  const [kelasLoading, setKelasLoading] = useState(false)
  const [unitList, setUnitList] = useState<string[]>([])

  // Load master data kelas saat mount
  useEffect(() => {
    const loadKelas = async () => {
      setKelasLoading(true)
      try {
        const result = await dataKelasService.getAll({ per_page: 500 })
        const list = result.data
          .filter(item => item.kode_kelas)
          .map(item => ({
            id: item.id_kelas ?? item.id ?? -1,
            kode_kelas: item.kode_kelas ?? "",
            nama_kelas: item.nama_kelas ?? "",
            tahun_ajaran: item.tahun_ajaran ?? "",
          }))
        setKelasList(list)
        const units = Array.from(new Set(list.map(k => (k.kode_kelas.split("-")[0] ?? "")).filter(Boolean))).sort()
        setUnitList(units)
      } catch (err) {
        console.error("Error loading kelas:", err)
        setKelasList([])
      } finally {
        setKelasLoading(false)
      }
    }
    void loadKelas()
  }, [])

  // Fetch data proses dari API setiap kali state filter/halaman berubah
  useEffect(() => {
    void fetchProses({
      page: currentPage,
      per_page: Number(rowsPerPage),
      search: appliedKeyword || undefined,
      kode_unit: appliedUnit !== "all" ? appliedUnit : undefined,
      kode_kelas: appliedKelas !== "all" ? appliedKelas : undefined,
      status: appliedStatus !== "all" ? appliedStatus : undefined,
    })
  }, [currentPage, rowsPerPage, appliedKeyword, appliedUnit, appliedKelas, appliedStatus, fetchProses])

  // Kelas yang difilter berdasarkan unit terpilih
  const filteredKelas = useMemo(() => {
    if (selectedUnit === "all") return kelasList
    return kelasList.filter(k => k.kode_kelas.startsWith(selectedUnit))
  }, [kelasList, selectedUnit])

  const handleApplyFilter = () => {
    setAppliedKeyword(selectedKeyword)
    setAppliedUnit(selectedUnit)
    setAppliedKelas(selectedKelas)
    setAppliedStatus(selectedStatus)
    setCurrentPage(1)
  }

  const handleResetFilter = () => {
    setSelectedKeyword("")
    setSelectedUnit("all")
    setSelectedKelas("all")
    setSelectedStatus("all")
    setAppliedKeyword("")
    setAppliedUnit("all")
    setAppliedKelas("all")
    setAppliedStatus("all")
    setCurrentPage(1)
  }

  const totalPages = meta?.last_page || 1
  const totalItems = meta?.total || 0

  return (
    <div className="space-y-4">
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label>Kata Kunci</Label>
                  <Input
                    placeholder="Masukan nama atau nomor induk"
                    value={selectedKeyword}
                    onChange={(event) => setSelectedKeyword(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pilih Unit</Label>
                  <Select value={selectedUnit} onValueChange={(v) => { setSelectedUnit(v); setSelectedKelas("all") }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Unit</SelectItem>
                      {unitList.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Pilih Kelas</Label>
                  <Select value={selectedKelas} onValueChange={setSelectedKelas} disabled={kelasLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder={kelasLoading ? "Memuat..." : "Pilih Kelas"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kelas</SelectItem>
                      {filteredKelas.map((item) => (
                        <SelectItem key={item.kode_kelas} value={item.kode_kelas}>
                          {item.kode_kelas}{item.nama_kelas ? ` — ${item.nama_kelas}` : ""}
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
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="menunggu_pembayaran">Menunggu Pembayaran</SelectItem>
                      <SelectItem value="menunggu_konfirmasi">Menunggu Konfirmasi</SelectItem>
                      <SelectItem value="lunas">Lunas</SelectItem>
                      <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
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

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Tampilkan</span>
              <Select value={rowsPerPage} onValueChange={(v) => { setRowsPerPage(v); setCurrentPage(1) }}>
                <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">data per halaman</span>
            </div>
            <CardDescription>Menampilkan {data.length} dari {totalItems} santri</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {error && <p className="text-sm text-destructive mb-4">Gagal memuat: {error}</p>}

          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>Jenis Kelamin</TableHead>
                  <TableHead>Nomor Induk</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Status Pembayaran</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-10"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Memuat...</TableCell></TableRow>
                ) : data.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Tidak ada data.</TableCell></TableRow>
                ) : data.map((row: ProsesRow) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.namaLengkap}</TableCell>
                    <TableCell>{row.jenisKelamin || "-"}</TableCell>
                    <TableCell className="font-mono text-sm">{row.nomorInduk || "-"}</TableCell>
                    <TableCell>{row.unitSaatIni || "-"}</TableCell>
                    <TableCell>{row.kelasSaatIni || "-"}</TableCell>
                    <TableCell><StatusBadge status={row.status} /></TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {row.daftarInvoice.length > 0 ? `${row.daftarInvoice.length} invoice` : "Tidak ada"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/dashboard/pembayaran/santri/${row.id}`}>
                          <Eye className="w-4 h-4 mr-1" /> Detail
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">Halaman {currentPage} dari {totalPages}</p>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}>
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Verifikasi Tab ───────────────────────────────────────────────────────────

function VerifikasiPembayaranTab() {
  const { data, loading, error, fetchVerifikasi } = useVerifikasiPembayaran()
  const { fetchDetail, data: detail, loading: detailLoading } = useDetailPembayaran()
  const { ubahStatus, loading: statusLoading } = useUbahStatusPembayaran()
  const { hapus, loading: hapusLoading } = useHapusPembayaran()
  const { toast } = useToast()

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedKeyword, setSelectedKeyword] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedJenis, setSelectedJenis] = useState("all")
  const [selectedUnit, setSelectedUnit] = useState("all")

  const [appliedKeyword, setAppliedKeyword] = useState("")
  const [appliedStatus, setAppliedStatus] = useState("all")
  const [appliedJenis, setAppliedJenis] = useState("all")
  const [appliedUnit, setAppliedUnit] = useState("all")

  const [kelasList, setKelasList] = useState<{ id: number; kode_kelas: string; nama_kelas?: string; tahun_ajaran?: string }[]>([])
  const [unitList, setUnitList] = useState<string[]>([])
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState<VerifikasiRow | null>(null)

  useEffect(() => {
    void fetchVerifikasi()
    const loadKelas = async () => {
      try {
        const result = await dataKelasService.getAll({ per_page: 500 })
        const list = result.data
          .filter(item => item.kode_kelas)
          .map(item => ({
            id: item.id_kelas ?? item.id ?? -1,
            kode_kelas: item.kode_kelas ?? "",
            nama_kelas: item.nama_kelas ?? "",
            tahun_ajaran: item.tahun_ajaran ?? "",
          }))
        setKelasList(list)
        setUnitList(Array.from(new Set(list.map(k => (k.kode_kelas.split("-")[0] ?? "")).filter(Boolean))).sort())
      } catch (err) {
        console.error("Error loading kelas:", err)
      }
    }
    void loadKelas()
  }, [fetchVerifikasi])

  const filtered = useMemo(() => {
    const kw = appliedKeyword.toLowerCase().trim()
    return data.filter((row: VerifikasiRow) => {
      const matchSearch = !kw || row.namaLengkap.toLowerCase().includes(kw) || row.nomorInduk.toLowerCase().includes(kw) || row.nomorInvoice.toLowerCase().includes(kw)
      const matchStatus = appliedStatus === "all" || row.statusPembayaran === appliedStatus
      const matchJenis = appliedJenis === "all" || row.jenisTransaksi === appliedJenis
      const matchUnit = appliedUnit === "all" || row.namaUnit.toLowerCase().includes(appliedUnit.toLowerCase())
      return matchSearch && matchStatus && matchJenis && matchUnit
    })
  }, [data, appliedKeyword, appliedStatus, appliedJenis, appliedUnit])

  const handleApplyFilter = () => {
    setAppliedKeyword(selectedKeyword)
    setAppliedUnit(selectedUnit)
    setAppliedStatus(selectedStatus)
    setAppliedJenis(selectedJenis)
  }

  const handleResetFilter = () => {
    setSelectedKeyword("")
    setSelectedUnit("all")
    setSelectedStatus("all")
    setSelectedJenis("all")
    setAppliedKeyword("")
    setAppliedUnit("all")
    setAppliedStatus("all")
    setAppliedJenis("all")
  }

  const handleOpenDetail = async (row: VerifikasiRow) => {
    setSelectedRow(row)
    setDetailOpen(true)
    await fetchDetail(row.id)
  }

  const handleUbahStatus = async (row: VerifikasiRow, status: StatusPembayaran) => {
    try {
      await ubahStatus(row.id, { status })
      toast({ title: "Status Diperbarui", description: `Status berhasil diubah ke ${status}.` })
      
      if (status === "lunas") {
        const phone = row.noHp || "";
        const message = encodeURIComponent(`Assalamu'alaikum, pemberitahuan dari Ponpes Al-Ausath.\n\nPembayaran ${row.jenisTransaksi} atas nama *${row.namaLengkap}* telah *berhasil diverifikasi* (Lunas).\n\nTerima kasih.`);
        if (phone) {
          const waUrl = `https://wa.me/${phone.replace(/^0/, "62")}?text=${message}`;
          window.open(waUrl, "_blank");
        } else {
          toast({ title: "Info", description: "Nomor WhatsApp tidak tersedia untuk mengirim konfirmasi otomatis." });
        }
        // Attempt to generate / open kwitansi after verification
        try {
          const det = await pembayaranService.getDetail(row.id)
          if (det.informasiKwitansi?.tersedia && det.informasiKwitansi.url) {
            window.open(det.informasiKwitansi.url, '_blank')
          } else {
            await printKwitansi(det)
          }
        } catch (e) {
          console.error('Error generating kwitansi:', e)
          toast({ title: 'Kwitansi', description: 'Gagal membuat kwitansi otomatis.', variant: 'destructive' })
        }
      }

      void fetchVerifikasi()
    } catch (err) {
      toast({ title: "Gagal", description: err instanceof Error ? err.message : "Gagal mengubah status", variant: "destructive" })
    }
  }

  const handleHapus = async (row: VerifikasiRow) => {
    if (!confirm("Hapus data transaksi ini?")) return
    try {
      await hapus(row.id)
      toast({ title: "Berhasil", description: "Transaksi berhasil dihapus." })
      void fetchVerifikasi()
    } catch (err) {
      toast({ title: "Gagal", description: err instanceof Error ? err.message : "Gagal menghapus", variant: "destructive" })
    }
  }

  const isActionLoading = statusLoading || hapusLoading

  return (
    <div className="space-y-4">
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label>Kata Kunci</Label>
                  <Input
                    placeholder="Masukan nama, nomor induk, invoice..."
                    value={selectedKeyword}
                    onChange={(event) => setSelectedKeyword(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pilih Unit</Label>
                  <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Unit</SelectItem>
                      {unitList.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
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
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="menunggu_pembayaran">Menunggu Pembayaran</SelectItem>
                      <SelectItem value="menunggu_konfirmasi">Menunggu Konfirmasi</SelectItem>
                      <SelectItem value="lunas">Lunas</SelectItem>
                      <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Jenis Transaksi</Label>
                  <Select value={selectedJenis} onValueChange={setSelectedJenis}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Jenis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Jenis</SelectItem>
                      <SelectItem value="SPP">SPP</SelectItem>
                      <SelectItem value="PPDB">PPDB</SelectItem>
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
                <Button variant="outline" onClick={() => void fetchVerifikasi()} disabled={loading}>
                  <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {error && <p className="text-sm text-destructive">Gagal memuat: {error}</p>}

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {/* Kolom sesuai FE Guide §6.3 */}
              <TableHead>Nama Unit</TableHead>
              <TableHead>Nomor Induk</TableHead>
              <TableHead>Nama Lengkap</TableHead>
              <TableHead>Nomor Invoice</TableHead>
              <TableHead className="text-right">Total Pembayaran</TableHead>
              <TableHead>Jenis Transaksi</TableHead>
              <TableHead>Status Pembayaran</TableHead>
              <TableHead>Waktu Invoice</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-10"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Memuat...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-10 text-muted-foreground">Tidak ada data verifikasi pembayaran.</TableCell></TableRow>
            ) : filtered.map((row: VerifikasiRow) => (
              <TableRow key={row.id}>
                <TableCell>{row.namaUnit || "-"}</TableCell>
                <TableCell className="font-mono text-sm">{row.nomorInduk || "-"}</TableCell>
                <TableCell className="font-medium">{row.namaLengkap || "-"}</TableCell>
                <TableCell className="font-mono text-sm">{row.nomorInvoice || "-"}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(row.totalPembayaran)}</TableCell>
                <TableCell><Badge variant="outline">{row.jenisTransaksi}</Badge></TableCell>
                <TableCell><StatusBadge status={row.statusPembayaran} /></TableCell>
                <TableCell className="text-sm">{formatDateTime(row.waktuInvoice)}</TableCell>
                <TableCell className="text-right">
                  {/* Quick verify button for menunggu_konfirmasi */}
                  {row.statusPembayaran === "menunggu_konfirmasi" && (
                    <Button variant="outline" size="sm" className="mr-1" disabled={isActionLoading}
                      onClick={() => void handleUbahStatus(row, "lunas")} id={`btn-verifikasi-${row.id}`}>
                      <BadgeCheck className="w-4 h-4 mr-1" /> Verifikasi
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isActionLoading} id={`menu-${row.id}`}>
                        {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreHorizontal className="w-4 h-4" />}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {/* Detail */}
                      <DropdownMenuItem onClick={() => void handleOpenDetail(row)}>
                        <Eye className="w-4 h-4 mr-2" /> Detail
                      </DropdownMenuItem>
                      {/* Ubah Status — menggunakan drawer/sub-menu sesuai FE Guide §9 */}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <AlertCircle className="w-4 h-4 mr-2" /> Ubah Status
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            {STATUS_ACTIONS.map((s) => (
                              <DropdownMenuItem key={s.value} onClick={() => void handleUbahStatus(row, s.value)}
                                className={s.danger ? "text-destructive" : s.value === "lunas" ? "text-emerald-600 font-medium" : ""}>
                                {s.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      {/* Hapus */}
                      <DropdownMenuItem className="text-destructive" onClick={() => void handleHapus(row)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog (GET /{id}/detail) */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detail Pembayaran</DialogTitle>
            <DialogDescription>Informasi lengkap invoice pembayaran.</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Memuat detail...
            </div>
          ) : detail ? (
            <div className="space-y-4 py-2 text-sm">
              {/* Profil Santri */}
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Profil Santri / Pendaftar</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div><Label className="text-xs text-muted-foreground">Nama</Label><p className="font-medium">{detail.profilSantri.namaLengkap}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Nomor Induk</Label><p className="font-medium font-mono">{detail.profilSantri.nomorInduk}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Kelas</Label><p className="font-medium">{detail.profilSantri.kelas || "-"}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Unit</Label><p className="font-medium">{detail.profilSantri.unit || "-"}</p></div>
                </div>
              </div>
              {/* Informasi Invoice */}
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Informasi Invoice</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div><Label className="text-xs text-muted-foreground">Nomor Invoice</Label><p className="font-medium font-mono">{detail.informasiInvoice.nomorInvoice}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Jenis</Label><Badge variant="outline">{detail.informasiInvoice.jenisTransaksi}</Badge></div>
                  <div><Label className="text-xs text-muted-foreground">Total</Label><p className="font-medium">{formatCurrency(detail.informasiInvoice.total)}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Status</Label><StatusBadge status={detail.informasiInvoice.status} /></div>
                  <div className="col-span-2"><Label className="text-xs text-muted-foreground">Tanggal</Label><p className="font-medium">{formatDateTime(detail.informasiInvoice.tanggal)}</p></div>
                </div>
              </div>
              {/* Bukti Pembayaran */}
              {detail.informasiInvoice.bukti_bayar_url && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Bukti Pembayaran</p>
                  <div className="rounded-md border p-2 bg-muted/30">
                    <a href={detail.informasiInvoice.bukti_bayar_url} target="_blank" rel="noreferrer">
                      <img 
                        src={detail.informasiInvoice.bukti_bayar_url} 
                        alt="Bukti Bayar" 
                        className="w-full max-w-sm rounded object-contain border bg-white"
                      />
                    </a>
                    {detail.informasiInvoice.catatan_bayar && (
                      <div className="mt-3 text-sm">
                        <Label className="text-xs text-muted-foreground">Catatan:</Label>
                        <p className="font-medium">{detail.informasiInvoice.catatan_bayar}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Riwayat */}
              {detail.riwayatPembayaran.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Riwayat Pembayaran</p>
                  <div className="rounded border divide-y text-xs">
                    {detail.riwayatPembayaran.map((r) => (
                      <div key={r.id} className="flex justify-between px-3 py-2">
                        <span>{formatDateTime(r.tanggal)} · {r.metode}</span>
                        <span className="font-medium">{formatCurrency(r.nominal)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Tagihan Kustom */}
              {detail.tagihanKustom.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Tagihan Kustom</p>
                  <div className="rounded border divide-y text-xs">
                    {detail.tagihanKustom.map((t) => (
                      <div key={t.id} className="flex justify-between px-3 py-2">
                        <span>{t.nama}</span>
                        <span className="font-medium">{formatCurrency(t.nominal)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Kwitansi */}
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Kwitansi</p>
                {detail.informasiKwitansi?.tersedia && detail.informasiKwitansi.url ? (
                  <a href={detail.informasiKwitansi.url} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">
                    Lihat / Unduh Kwitansi
                  </a>
                ) : (
                  <p className="text-muted-foreground">Kwitansi belum tersedia. Verifikasi pembayaran terlebih dahulu.</p>
                )}
              </div>
            </div>
          ) : selectedRow ? (
            <div className="grid grid-cols-2 gap-4 py-2 text-sm">
              <div><Label className="text-xs text-muted-foreground">Nama Lengkap</Label><p className="font-medium">{selectedRow.namaLengkap}</p></div>
              <div><Label className="text-xs text-muted-foreground">Nomor Invoice</Label><p className="font-medium font-mono">{selectedRow.nomorInvoice}</p></div>
              <div><Label className="text-xs text-muted-foreground">Jenis</Label><Badge variant="outline">{selectedRow.jenisTransaksi}</Badge></div>
              <div><Label className="text-xs text-muted-foreground">Status</Label><StatusBadge status={selectedRow.statusPembayaran} /></div>
              <div><Label className="text-xs text-muted-foreground">Total</Label><p className="font-medium">{formatCurrency(selectedRow.totalPembayaran)}</p></div>
              <div><Label className="text-xs text-muted-foreground">Waktu</Label><p className="font-medium">{formatDateTime(selectedRow.waktuInvoice)}</p></div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PembayaranPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pembayaran</h1>
        <p className="text-sm text-muted-foreground">
          Kelola proses pembayaran santri dan verifikasi transaksi masuk.
        </p>
      </div>

      {/* Tabs: Proses & Verifikasi sesuai FE Guide §6.1 */}
      <Tabs defaultValue="proses" className="space-y-4">
        <TabsList id="tabs-pembayaran">
          <TabsTrigger value="proses" id="tab-proses-pembayaran">
            Proses Pembayaran
          </TabsTrigger>
          <TabsTrigger value="verifikasi" id="tab-verifikasi-pembayaran">
            Verifikasi Pembayaran
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proses">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Proses Pembayaran</CardTitle>
              <CardDescription>
                Filter santri berdasarkan unit/kelas dan kelola tagihan mereka.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProsesPembayaranTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verifikasi">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Verifikasi Pembayaran</CardTitle>
              <CardDescription>
                Verifikasi dan kelola status pembayaran yang masuk dari santri maupun pendaftar PPDB.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VerifikasiPembayaranTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
