"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, Edit2, Trash2, Loader2, Megaphone, Pin, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
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
import {
  pengumumanService,
  type CreatePengumumanRequest,
  type Pengumuman,
  type PengumumanKategori,
  type PengumumanListQuery,
} from "@/lib/services/pengumuman.service"

// ─── Constants ────────────────────────────────────────────────────────────────

const KATEGORI_OPTIONS: { value: PengumumanKategori | string; label: string }[] = [
  { value: "umum", label: "Umum" },
  { value: "ppdb", label: "PPDB" },
  { value: "akademik", label: "Akademik" },
  { value: "kegiatan", label: "Kegiatan" },
]

const emptyForm: CreatePengumumanRequest = {
  judul: "",
  konten: "",
  kategori: "umum",
  is_aktif: true,
  is_pinned: false,
  urutan: 0,
  tanggal_selesai: null,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getKategoriBadge = (kategori: string) => {
  const colors: Record<string, string> = {
    ppdb: "bg-blue-500/10 text-blue-600 border-0",
    akademik: "bg-green-500/10 text-green-600 border-0",
    kegiatan: "bg-purple-500/10 text-purple-600 border-0",
    umum: "bg-muted text-muted-foreground border-0",
  }
  return colors[kategori] ?? colors.umum
}

const formatDate = (value: string | null) => {
  if (!value) return "-"
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PengumumanPage() {
  const [list, setList] = useState<Pengumuman[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Pengumuman | null>(null)
  const [form, setForm] = useState<CreatePengumumanRequest>(emptyForm)

  // Filters
  const [searchQ, setSearchQ] = useState("")
  const [filterKategori, setFilterKategori] = useState("all")
  const [filterAktif, setFilterAktif] = useState("all")

  const fetchList = useCallback(async (query?: PengumumanListQuery) => {
    setLoading(true)
    try {
      const data = await pengumumanService.getList(query)
      setList(data)
    } catch (err) {
      console.error("Gagal memuat pengumuman:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchList()
  }, [fetchList])

  const handleSearch = () => {
    const query: PengumumanListQuery = {}
    if (searchQ.trim()) query.q = searchQ.trim()
    if (filterKategori !== "all") query.kategori = filterKategori as PengumumanKategori
    if (filterAktif !== "all") query.is_aktif = filterAktif === "aktif"
    void fetchList(query)
  }

  const handleResetFilter = () => {
    setSearchQ("")
    setFilterKategori("all")
    setFilterAktif("all")
    void fetchList()
  }

  const openAdd = () => {
    setEditTarget(null)
    setForm(emptyForm)
    setIsOpen(true)
  }

  const openEdit = (p: Pengumuman) => {
    setEditTarget(p)
    setForm({
      judul: p.judul,
      konten: p.konten,
      kategori: p.kategori,
      is_aktif: p.is_aktif,
      is_pinned: p.is_pinned,
      urutan: p.urutan,
      tanggal_selesai: p.tanggal_selesai,
    })
    setIsOpen(true)
  }

  const handleSave = async () => {
    if (!form.judul.trim() || !form.konten.trim()) {
      alert("Judul dan konten wajib diisi")
      return
    }
    setSaving(true)
    try {
      const payload: CreatePengumumanRequest = {
        ...form,
        urutan: Number(form.urutan),
        tanggal_selesai: form.tanggal_selesai || null,
      }
      if (editTarget) {
        await pengumumanService.update(editTarget.id, payload)
      } else {
        await pengumumanService.create(payload)
      }
      setIsOpen(false)
      await fetchList()
    } catch (err) {
      alert(getErrorMessage(err, "Gagal menyimpan pengumuman"))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (p: Pengumuman) => {
    if (!confirm(`Hapus pengumuman "${p.judul}"?`)) return
    try {
      await pengumumanService.delete(p.id)
      await fetchList()
    } catch (err) {
      alert(getErrorMessage(err, "Gagal menghapus pengumuman"))
    }
  }

  const handleToggleAktif = async (p: Pengumuman) => {
    try {
      await pengumumanService.update(p.id, { is_aktif: !p.is_aktif })
      await fetchList()
    } catch (err) {
      alert(getErrorMessage(err, "Gagal mengubah status pengumuman"))
    }
  }

  const totalAktif = list.filter((p) => p.is_aktif).length
  const totalPinned = list.filter((p) => p.is_pinned).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" />
            Manajemen Pengumuman
          </h1>
          <p className="text-muted-foreground">
            Kelola pengumuman yang tampil di halaman landing website
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Tambah Pengumuman
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{list.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{totalAktif}</p>
            <p className="text-xs text-muted-foreground">Aktif</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{totalPinned}</p>
            <p className="text-xs text-muted-foreground">Pinned</p>
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <p className="text-sm text-foreground">
            💡 <strong>Tip:</strong> Pengumuman <strong>Aktif</strong> otomatis tampil di halaman landing.
            Atur <strong>Tanggal Selesai</strong> untuk pengumuman berkala, atau gunakan <strong>Pin</strong> untuk mengutamakan pengumuman penting.
          </p>
        </CardContent>
      </Card>

      {/* Filter Bar */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="search-pengumuman"
                placeholder="Cari judul pengumuman..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Select value={filterKategori} onValueChange={setFilterKategori}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {KATEGORI_OPTIONS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterAktif} onValueChange={setFilterAktif}>
              <SelectTrigger className="w-full sm:w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="aktif">Aktif</SelectItem>
                <SelectItem value="nonaktif">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button onClick={handleSearch} size="sm">Cari</Button>
              <Button onClick={handleResetFilter} variant="outline" size="sm">Reset</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Daftar Pengumuman</CardTitle>
          <CardDescription>
            Total {list.length} pengumuman • {totalAktif} aktif • {totalPinned} pinned
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Memuat data...</span>
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Belum ada pengumuman. Klik &quot;Tambah Pengumuman&quot; untuk mulai.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Judul</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Berakhir</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          {p.is_pinned && <Pin className="w-4 h-4 text-primary mt-0.5 shrink-0" />}
                          <div>
                            <p className="font-medium text-foreground line-clamp-1">{p.judul}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">{p.konten}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getKategoriBadge(p.kategori)}>
                          {KATEGORI_OPTIONS.find((k) => k.value === p.kategori)?.label ?? p.kategori}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.tanggal_selesai ? formatDate(p.tanggal_selesai) : "Tidak terbatas"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={p.is_aktif}
                            onCheckedChange={() => void handleToggleAktif(p)}
                          />
                          <span className={`text-xs ${p.is_aktif ? "text-primary" : "text-muted-foreground"}`}>
                            {p.is_aktif ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => void handleDelete(p)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Pengumuman" : "Tambah Pengumuman"}</DialogTitle>
            <DialogDescription>
              {editTarget
                ? "Perbarui pengumuman yang sudah ada."
                : "Buat pengumuman baru untuk ditampilkan di landing page."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Judul Pengumuman <span className="text-destructive">*</span></Label>
              <Input
                id="form-judul"
                value={form.judul}
                onChange={(e) => setForm((prev) => ({ ...prev, judul: e.target.value }))}
                placeholder="Contoh: Pengumuman PPDB 2026/2027 Telah Dibuka"
              />
            </div>

            <div className="space-y-2">
              <Label>Konten / Isi Pengumuman <span className="text-destructive">*</span></Label>
              <Textarea
                id="form-konten"
                value={form.konten}
                onChange={(e) => setForm((prev) => ({ ...prev, konten: e.target.value }))}
                placeholder="Tulis isi pengumuman di sini..."
                className="min-h-[120px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={form.kategori}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, kategori: v }))}
                >
                  <SelectTrigger id="form-kategori">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KATEGORI_OPTIONS.map((k) => (
                      <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Urutan Tampil</Label>
                <Input
                  id="form-urutan"
                  type="number"
                  min={0}
                  value={form.urutan}
                  onChange={(e) => setForm((prev) => ({ ...prev, urutan: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tanggal Selesai</Label>
              <Input
                id="form-tanggal-selesai"
                type="date"
                value={form.tanggal_selesai ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, tanggal_selesai: e.target.value || null }))
                }
              />
              <p className="text-xs text-muted-foreground">Kosongkan jika pengumuman tidak memiliki batas waktu.</p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Aktifkan Pengumuman</p>
                <p className="text-xs text-muted-foreground">Tampilkan di halaman landing</p>
              </div>
              <Switch
                id="form-is-aktif"
                checked={form.is_aktif}
                onCheckedChange={(v) => setForm((prev) => ({ ...prev, is_aktif: v }))}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Pin Pengumuman</p>
                  <p className="text-xs text-muted-foreground">Tampilkan di urutan paling atas</p>
                </div>
              </div>
              <Switch
                id="form-is-pinned"
                checked={form.is_pinned}
                onCheckedChange={(v) => setForm((prev) => ({ ...prev, is_pinned: v }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
            <Button onClick={() => { void handleSave() }} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editTarget ? "Simpan Perubahan" : "Buat Pengumuman"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
