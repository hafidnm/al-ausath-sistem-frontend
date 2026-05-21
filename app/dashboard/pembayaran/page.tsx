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
  Eye,
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
  const { data, loading, error, fetchProses } = useProsesPembayaran()
  const [search, setSearch] = useState("")
  const [selectedUnit, setSelectedUnit] = useState("all")
  const [selectedKelas, setSelectedKelas] = useState("all")
  const [kelasList, setKelasList] = useState<{ id: number; kode_kelas: string; nama_kelas?: string; tahun_ajaran?: string }[]>([])
  const [kelasLoading, setKelasLoading] = useState(false)
  const [unitList, setUnitList] = useState<string[]>([])

  // Load master data kelas saat mount
  useEffect(() => {
    void fetchProses()
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
  }, [fetchProses])

  // Kelas yang difilter berdasarkan unit terpilih
  const filteredKelas = useMemo(() => {
    if (selectedUnit === "all") return kelasList
    return kelasList.filter(k => k.kode_kelas.startsWith(selectedUnit))
  }, [kelasList, selectedUnit])

  const filtered = useMemo(() => {
    const kw = search.toLowerCase().trim()
    return data.filter((row: ProsesRow) => {
      const matchSearch = !kw || row.namaLengkap.toLowerCase().includes(kw) || row.nomorInduk.toLowerCase().includes(kw)
      const matchUnit = selectedUnit === "all" || row.unitSaatIni.toLowerCase().includes(selectedUnit.toLowerCase())
      const matchKelas = selectedKelas === "all" || row.kelasSaatIni.toLowerCase().includes(selectedKelas.toLowerCase())
      return matchSearch && matchUnit && matchKelas
    })
  }, [data, search, selectedUnit, selectedKelas])

  const handleCari = () => {
    void fetchProses({
      kode_kelas: selectedKelas !== "all" ? selectedKelas : undefined,
      search: search || undefined,
    })
  }

  return (
    <div className="space-y-4">
      {/* Filter bar — dropdown dari master kelas */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input id="search-proses" placeholder="Cari nama / nomor induk..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Select value={selectedUnit} onValueChange={(v) => { setSelectedUnit(v); setSelectedKelas("all") }}>
          <SelectTrigger className="sm:w-36" id="filter-unit-proses">
            <SelectValue placeholder="Filter Unit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Unit</SelectItem>
            {unitList.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={selectedKelas} onValueChange={setSelectedKelas} disabled={kelasLoading}>
          <SelectTrigger className="sm:w-48" id="filter-kelas-proses">
            <SelectValue placeholder={kelasLoading ? "Memuat..." : "Filter Kelas"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelas</SelectItem>
            {filteredKelas.map(k => (
              <SelectItem key={k.kode_kelas} value={k.kode_kelas}>
                {k.kode_kelas}{k.nama_kelas ? ` — ${k.nama_kelas}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={handleCari}>
          <RefreshCw className="w-4 h-4 mr-1" /> Cari
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">Gagal memuat: {error}</p>}

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Lengkap</TableHead>
              <TableHead>Jenis Kelamin</TableHead>
              <TableHead>Nomor Induk</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Kelas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Memuat...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Tidak ada data.</TableCell></TableRow>
            ) : filtered.map((row: ProsesRow) => (
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

  const [search, setSearch] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedJenis, setSelectedJenis] = useState("all")
  const [selectedUnit, setSelectedUnit] = useState("all")
  const [selectedKelas, setSelectedKelas] = useState("all")
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
    const kw = search.toLowerCase().trim()
    return data.filter((row: VerifikasiRow) => {
      const matchSearch = !kw || row.namaLengkap.toLowerCase().includes(kw) || row.nomorInduk.toLowerCase().includes(kw) || row.nomorInvoice.toLowerCase().includes(kw)
      const matchStatus = selectedStatus === "all" || row.statusPembayaran === selectedStatus
      const matchJenis = selectedJenis === "all" || row.jenisTransaksi === selectedJenis
      const matchUnit = selectedUnit === "all" || row.namaUnit.toLowerCase().includes(selectedUnit.toLowerCase())
      return matchSearch && matchStatus && matchJenis && matchUnit
    })
  }, [data, search, selectedStatus, selectedJenis, selectedUnit])

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
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input id="search-verifikasi" placeholder="Cari nama, nomor induk, invoice..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Select value={selectedUnit} onValueChange={(v) => { setSelectedUnit(v); setSelectedKelas("all") }}>
          <SelectTrigger className="w-36" id="filter-unit-verifikasi">
            <SelectValue placeholder="Filter Unit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Unit</SelectItem>
            {unitList.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-52" id="filter-status-verifikasi">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="menunggu_pembayaran">Menunggu Pembayaran</SelectItem>
            <SelectItem value="menunggu_konfirmasi">Menunggu Konfirmasi</SelectItem>
            <SelectItem value="lunas">Lunas</SelectItem>
            <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedJenis} onValueChange={setSelectedJenis}>
          <SelectTrigger className="w-36" id="filter-jenis-verifikasi">
            <SelectValue placeholder="Jenis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jenis</SelectItem>
            <SelectItem value="SPP">SPP</SelectItem>
            <SelectItem value="PPDB">PPDB</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={() => void fetchVerifikasi()} disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

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
