"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"
import { useToast } from "@/hooks/use-toast"
import { DataSantriApiItem, DataSantriListParams, dataSantriService } from "@/lib/services/santri.service"
import { dataKelasService } from "@/lib/services/kelas.service"
import { useUnit } from "@/contexts/unit-context"
import {
  ArrowLeft, Download, Eye, GraduationCap, MoreHorizontal, RefreshCw, Search, Trash2, Undo2, Users,
} from "lucide-react"

/* ─── helpers ─────────────────────────────────────────────────────────── */
const toText = (v: unknown): string => {
  if (v == null) return ""
  if (typeof v === "string") return v
  if (typeof v === "number" || typeof v === "boolean") return String(v)
  return ""
}
const toNumber = (v: unknown, fb = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fb }
const getErr = (e: unknown, fb: string) => {
  const err = e as { response?: { data?: { message?: string } }; message?: string }
  return err?.response?.data?.message || (e as any)?.message || fb
}
const formatGender = (g: string) => g === "L" ? "Laki-laki" : g === "P" ? "Perempuan" : "-"
const formatDate = (v: string) => {
  if (!v) return "-"
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })
}
const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

interface LulusRow {
  id: number
  nomorInduk: string
  namaLengkap: string
  namaKelas: string
  namaUnit: string
  tahunMasuk: number | null
  tahunLulus: number | null
  jenisKelamin: string
  namaWali: string
  nomorTelepon: string
  alamatEmail: string
  tempatLahir: string
  tanggalLahir: string
  agama: string
}

const normalizeRow = (raw: DataSantriApiItem): LulusRow => ({
  id: toNumber(raw.id_santri ?? raw.id, -1),
  nomorInduk: toText(raw.nomor_induk),
  namaLengkap: toText(raw.nama_lengkap_santri),
  namaKelas: toText(raw.kelas?.nama_kelas) || toText(raw.kode_kelas),
  namaUnit: toText(raw.kelas?.kode_unit),
  tahunMasuk: raw.tahun_masuk ?? null,
  tahunLulus: raw.tahun_lulus ?? null,
  jenisKelamin: toText(raw.jenis_kelamin).toUpperCase(),
  namaWali: toText(raw.nama_wali),
  nomorTelepon: toText(raw.nomor_telepon),
  alamatEmail: toText(raw.alamat_email),
  tempatLahir: toText(raw.tempat_lahir),
  tanggalLahir: toText(raw.tanggal_lahir),
  agama: toText(raw.agama),
})

export default function SantriLulusPage() {
  const { toast } = useToast()

  /* ─── state ─────────────────────────────────────────────────── */
  const [rows, setRows] = useState<LulusRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isBulkLoading, setIsBulkLoading] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedKelas, setSelectedKelas] = useState("all")
  const [rowsPerPage, setRowsPerPage] = useState("10")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [kelasOptions, setKelasOptions] = useState<{ value: string; label: string; kodeUnit: string; tahunAjaran: string }[]>([])
  
  const { selectedKodeUnit } = useUnit()
  const { selectedKodeTahun } = useTahunAjaran()

  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const isAllChecked = rows.length > 0 && rows.every(r => selectedIds.includes(r.id))

  const [detailRow, setDetailRow] = useState<LulusRow | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  /* ─── filtered kelas ──────────────────────────────────────────── */
  const filteredKelas = useMemo(() => {
    let filtered = kelasOptions.filter(k => k.tahunAjaran === selectedKodeTahun)
    if (selectedKodeUnit) filtered = filtered.filter(k => k.kodeUnit === selectedKodeUnit)
    return filtered
  }, [kelasOptions, selectedKodeUnit, selectedKodeTahun])

  /* ─── fetch ─────────────────────────────────────────────────── */
  const fetchRows = async () => {
    setIsLoading(true)
    try {
      const params: DataSantriListParams = {
        status: "LULUS",
        page: currentPage,
        per_page: Number(rowsPerPage),
      }
      if (searchQuery.trim()) params.q = searchQuery.trim()
      if (selectedKodeUnit) params.kode_unit = selectedKodeUnit
      if (selectedKelas !== "all") params.kode_kelas = selectedKelas
      if (selectedKodeTahun) params.tahun_ajaran = selectedKodeTahun

      const result = await dataSantriService.getAll(params)
      let data = result.data.map(normalizeRow).filter(r => r.id > 0)

      setRows(data)
      setTotalItems(toNumber(result.meta?.total, data.length))
      setTotalPages(Math.max(1, toNumber(result.meta?.last_page, 1)))
      setCurrentPage(toNumber(result.meta?.current_page, currentPage))
    } catch (e) {
      toast({ title: "Gagal memuat data", description: getErr(e, "Gagal memuat daftar santri lulus."), variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const loadOptions = async () => {
    try {
      const [kelasRes] = await Promise.all([
        dataKelasService.getAll({ page: 1, per_page: 300 }),
      ])
      const seen = new Set<string>()
      const kelas: { value: string; label: string; kodeUnit: string; tahunAjaran: string }[] = []
      for (const k of kelasRes.data) {
        const v = toText(k.kode_kelas)
        if (v && !seen.has(v)) { seen.add(v); kelas.push({ value: v, label: toText(k.nama_kelas) || v, kodeUnit: toText(k.kode_unit || k.unit?.kode_unit), tahunAjaran: toText(k.tahun_ajaran) }) }
      }
      setKelasOptions(kelas)
    } catch { /* ignore */ }
  }

  useEffect(() => { void loadOptions() }, [])
  useEffect(() => { setCurrentPage(1) }, [searchQuery, selectedKodeUnit, selectedKelas, selectedKodeTahun, rowsPerPage])
  useEffect(() => { if (selectedKelas !== "all" && !filteredKelas.some(k => k.value === selectedKelas)) setSelectedKelas("all") }, [selectedKodeUnit, selectedKodeTahun])
  useEffect(() => { void fetchRows() }, [currentPage, rowsPerPage, searchQuery, selectedKodeUnit, selectedKelas, selectedKodeTahun])

  /* ─── actions ────────────────────────────────────────────────── */
  const handleBatalLulus = async (ids: number[]) => {
    if (ids.length === 0) return
    const confirmed = window.confirm(`Batalkan kelulusan ${ids.length} santri? Status akan kembali ke AKTIF dan tahun lulus dihapus.`)
    if (!confirmed) return
    setIsBulkLoading(true)
    try {
      const result = await dataSantriService.batalLulus(ids)
      toast({ title: "Berhasil", description: result.message })
      setSelectedIds([])
      void fetchRows()
    } catch (e) {
      toast({ title: "Gagal", description: getErr(e, "Gagal membatalkan kelulusan."), variant: "destructive" })
    } finally {
      setIsBulkLoading(false)
    }
  }

  const handleDeleteLulus = async (ids: number[]) => {
    if (ids.length === 0) return
    const confirmed = window.confirm(
      ids.length === 1
        ? "Hapus permanen data alumni ini?"
        : `Hapus permanen ${ids.length} data alumni terpilih? Aksi ini tidak bisa dibatalkan.`
    )
    if (!confirmed) return
    setIsBulkLoading(true)
    try {
      const results = await Promise.allSettled(ids.map(id => dataSantriService.remove(id)))
      const success = results.filter(r => r.status === "fulfilled").length
      const failed = results.length - success
      toast({
        title: success > 0 ? "Berhasil" : "Gagal",
        description: failed > 0
          ? `${success} berhasil dihapus, ${failed} gagal.`
          : `${success} data alumni berhasil dihapus.`,
        variant: success === 0 ? "destructive" : "default",
      })
      setSelectedIds([])
      void fetchRows()
    } catch (e) {
      toast({ title: "Gagal", description: getErr(e, "Gagal menghapus data alumni."), variant: "destructive" })
    } finally {
      setIsBulkLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const params: Omit<DataSantriListParams, "per_page" | "page"> = { status: "LULUS" }
      if (searchQuery.trim()) params.q = searchQuery.trim()
      if (selectedKodeUnit) params.kode_unit = selectedKodeUnit
      if (selectedKelas !== "all") params.kode_kelas = selectedKelas
      if (selectedKodeTahun) params.tahun_ajaran = selectedKodeTahun
      const blob = await dataSantriService.exportExcel(params)
      downloadBlob(blob, `alumni-lulus-${new Date().toISOString().slice(0, 10)}.csv`)
    } catch (e) {
      toast({ title: "Gagal Ekspor", description: getErr(e, "Gagal mengunduh data alumni."), variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-9 w-9">
            <Link href="/dashboard/santri"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-semibold uppercase tracking-wide text-foreground">Santri Lulus</h1>
            <p className="text-sm text-muted-foreground">Data arsip santri yang telah lulus</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="h-10 bg-primary px-4 text-primary-foreground hover:bg-primary/90" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />Ekspor CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-0 bg-primary text-white overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Alumni</p>
              <p className="text-4xl font-semibold">{totalItems}</p>
            </div>
            <div className="rounded-full bg-white/20 p-4"><GraduationCap className="h-9 w-9 opacity-80" /></div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-primary/80 text-white overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Ditampilkan</p>
              <p className="text-4xl font-semibold">{rows.length}</p>
            </div>
            <div className="rounded-full bg-white/20 p-4"><Users className="h-9 w-9 opacity-80" /></div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-primary/60 text-white overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Dipilih</p>
              <p className="text-4xl font-semibold">{selectedIds.length}</p>
            </div>
            <div className="rounded-full bg-white/20 p-4"><RefreshCw className="h-9 w-9 opacity-80" /></div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card className="border">
        <CardHeader className="pb-3">
          <p className="font-semibold flex items-center gap-2 text-sm"><Search className="h-4 w-4" /> Filter & Pencarian</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1 lg:col-span-2">
              <Label>Cari Nama / NIS</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Cari santri..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1 lg:col-span-2">
              <Label>Kelas</Label>
              <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                <SelectTrigger><SelectValue placeholder="Semua Kelas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {filteredKelas.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <Select
                defaultValue="aksi-massal"
                onValueChange={(v) => {
                  if (v === "batal-lulus") void handleBatalLulus(selectedIds)
                  if (v === "hapus") void handleDeleteLulus(selectedIds)
                }}
              >
                <SelectTrigger className="w-[190px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aksi-massal">Aksi Massal</SelectItem>
                  <SelectItem value="batal-lulus" disabled={isBulkLoading}>
                    <span className="flex items-center gap-2"><Undo2 className="h-4 w-4" />Batalkan Kelulusan</span>
                  </SelectItem>
                  <SelectItem value="hapus" disabled={isBulkLoading}>
                    <span className="flex items-center gap-2"><Trash2 className="h-4 w-4" />Hapus Terpilih</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
              <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CardDescription>Menampilkan {rows.length} dari {totalItems} alumni lulus</CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="w-[52px]">
                    <Checkbox checked={isAllChecked} onCheckedChange={v => {
                      if (v) setSelectedIds(rows.map(r => r.id))
                      else setSelectedIds([])
                    }} aria-label="Pilih semua" />
                  </TableHead>
                  <TableHead>#</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>NIS</TableHead>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Thn Masuk</TableHead>
                  <TableHead>Thn Lulus</TableHead>
                  <TableHead>Jenis Kelamin</TableHead>
                  <TableHead>Wali</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={11} className="py-8 text-center text-muted-foreground">Memuat data...</TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="py-12 text-center">
                      <GraduationCap className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                      <p className="text-muted-foreground">Belum ada data alumni lulus.</p>
                    </TableCell>
                  </TableRow>
                ) : rows.map((r, idx) => (
                  <TableRow key={r.id} className="border-border">
                    <TableCell>
                      <Checkbox checked={selectedIds.includes(r.id)} onCheckedChange={v => {
                        if (v) setSelectedIds(p => p.includes(r.id) ? p : [...p, r.id])
                        else setSelectedIds(p => p.filter(id => id !== r.id))
                      }} />
                    </TableCell>
                    <TableCell>{(currentPage - 1) * Number(rowsPerPage) + idx + 1}</TableCell>
                    <TableCell>{r.namaUnit || "-"}</TableCell>
                    <TableCell>{r.nomorInduk || "-"}</TableCell>
                    <TableCell className="font-medium">{r.namaLengkap || "-"}</TableCell>
                    <TableCell>{r.namaKelas || "-"}</TableCell>
                    <TableCell>{r.tahunMasuk ?? "-"}</TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 border">
                        {r.tahunLulus ?? "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatGender(r.jenisKelamin)}</TableCell>
                    <TableCell>{r.namaWali || "-"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { setDetailRow(r); setIsDetailOpen(true) }}>
                            <Eye className="mr-2 h-4 w-4" />Detail
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => void handleBatalLulus([r.id])} className="text-amber-600">
                            <Undo2 className="mr-2 h-4 w-4" />Batalkan Kelulusan
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => void handleDeleteLulus([r.id])} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">Halaman {currentPage} dari {totalPages}</p>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}>
                Sebelumnya
              </Button>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}>
                Selanjutnya
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Detail Alumni
            </DialogTitle>
            <DialogDescription>{detailRow?.namaLengkap}</DialogDescription>
          </DialogHeader>
          {detailRow && (
            <div className="grid grid-cols-2 gap-3 py-2 text-sm">
              {[
                ["NIS", detailRow.nomorInduk],
                ["Nama Lengkap", detailRow.namaLengkap],
                ["Unit", detailRow.namaUnit || "-"],
                ["Kelas", detailRow.namaKelas || "-"],
                ["Tahun Masuk", detailRow.tahunMasuk ?? "-"],
                ["Tahun Lulus", detailRow.tahunLulus ?? "-"],
                ["Jenis Kelamin", formatGender(detailRow.jenisKelamin)],
                ["Agama", detailRow.agama || "-"],
                ["Tempat Lahir", detailRow.tempatLahir || "-"],
                ["Tanggal Lahir", formatDate(detailRow.tanggalLahir)],
                ["Nama Wali", detailRow.namaWali || "-"],
                ["No. Telepon", detailRow.nomorTelepon || "-"],
                ["Email", detailRow.alamatEmail || "-"],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-muted-foreground">{label}</p>
                  <p className="font-medium">{val}</p>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Tutup</Button>
            {detailRow && (
              <Button
                variant="outline"
                className="text-amber-600 border-amber-300"
                onClick={() => { setIsDetailOpen(false); void handleBatalLulus([detailRow.id]) }}
              >
                <Undo2 className="mr-2 h-4 w-4" />Batalkan Kelulusan
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
