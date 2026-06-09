"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Building2,
  CreditCard,
  Edit,
  Landmark,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/axios"

interface RekeningBank {
  id_rekening: number
  nama_rekening: string
  nama_pemilik: string
  nomor_rekening: string
  nama_bank: string
  cabang_bank: string | null
  peruntukan: string | null
  status: "AKTIF" | "NONAKTIF"
}

const emptyForm = {
  nama_rekening: "",
  nama_pemilik: "",
  nomor_rekening: "",
  nama_bank: "",
  cabang_bank: "",
  peruntukan: "",
  status: "AKTIF" as "AKTIF" | "NONAKTIF",
}

export default function RekeningSettingsPage() {
  const { toast } = useToast()
  const [data, setData] = useState<RekeningBank[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...emptyForm })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get("/administrasi/rekening")
      setData(res.data?.data ?? [])
    } catch {
      toast({ title: "Gagal", description: "Gagal memuat data rekening.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { void fetchData() }, [fetchData])

  const resetForm = () => {
    setForm({ ...emptyForm })
    setEditingId(null)
  }

  const handleEdit = (item: RekeningBank) => {
    setForm({
      nama_rekening: item.nama_rekening,
      nama_pemilik: item.nama_pemilik,
      nomor_rekening: item.nomor_rekening,
      nama_bank: item.nama_bank,
      cabang_bank: item.cabang_bank ?? "",
      peruntukan: item.peruntukan ?? "",
      status: item.status,
    })
    setEditingId(item.id_rekening)
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.nama_rekening || !form.nomor_rekening || !form.nama_bank || !form.nama_pemilik) {
      toast({ title: "Validasi", description: "Nama rekening, nama pemilik, nomor rekening, dan nama bank wajib diisi.", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        await api.put(`/administrasi/rekening/${editingId}`, form)
        toast({ title: "Berhasil", description: "Rekening berhasil diperbarui." })
      } else {
        await api.post("/administrasi/rekening", form)
        toast({ title: "Berhasil", description: "Rekening berhasil ditambahkan." })
      }
      setIsDialogOpen(false)
      resetForm()
      void fetchData()
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? "Terjadi kesalahan"
      toast({ title: "Gagal", description: msg, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus rekening ini?")) return
    setDeleteLoading(id)
    try {
      await api.delete(`/administrasi/rekening/${id}`)
      toast({ title: "Berhasil", description: "Rekening berhasil dihapus." })
      void fetchData()
    } catch (e: any) {
      toast({ title: "Gagal", description: e?.response?.data?.message ?? "Gagal menghapus.", variant: "destructive" })
    } finally {
      setDeleteLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Landmark className="w-6 h-6 text-primary" />
            Pengaturan Rekening Bank
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola nomor rekening yang akan ditampilkan pada halaman pembayaran (PPDB, SPP, dan Infaq).
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void fetchData()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm() }}>
            <DialogTrigger asChild>
              <Button id="btn-tambah-rekening">
                <Plus className="w-4 h-4 mr-2" /> Tambah Rekening
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px] bg-card">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                  <CreditCard className="w-5 h-5 text-primary" />
                  {editingId ? "Edit" : "Tambah"} Rekening Bank
                </DialogTitle>
                <DialogDescription>
                  Rekening ini akan muncul sebagai tujuan transfer di halaman pembayaran santri.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nama_bank">Nama Bank <span className="text-destructive">*</span></Label>
                    <Input
                      id="nama_bank"
                      placeholder="Contoh: BRI, BCA, BNI"
                      value={form.nama_bank}
                      onChange={(e) => setForm({ ...form, nama_bank: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cabang_bank">Cabang Bank</Label>
                    <Input
                      id="cabang_bank"
                      placeholder="Contoh: Karanganyar"
                      value={form.cabang_bank}
                      onChange={(e) => setForm({ ...form, cabang_bank: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nomor_rekening">Nomor Rekening <span className="text-destructive">*</span></Label>
                  <Input
                    id="nomor_rekening"
                    placeholder="Contoh: 1234567890"
                    className="font-mono text-lg"
                    value={form.nomor_rekening}
                    onChange={(e) => setForm({ ...form, nomor_rekening: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nama_pemilik">Nama Pemilik Rekening <span className="text-destructive">*</span></Label>
                    <Input
                      id="nama_pemilik"
                      placeholder="Nama sesuai buku rekening"
                      value={form.nama_pemilik}
                      onChange={(e) => setForm({ ...form, nama_pemilik: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nama_rekening">Label Rekening <span className="text-destructive">*</span></Label>
                    <Input
                      id="nama_rekening"
                      placeholder="Contoh: Rekening SPP MA"
                      value={form.nama_rekening}
                      onChange={(e) => setForm({ ...form, nama_rekening: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="peruntukan">Peruntukan</Label>
                    <Input
                      id="peruntukan"
                      placeholder="Contoh: SPP, Infaq, PPDB"
                      value={form.peruntukan}
                      onChange={(e) => setForm({ ...form, peruntukan: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "AKTIF" | "NONAKTIF" })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AKTIF">Aktif</SelectItem>
                        <SelectItem value="NONAKTIF">Nonaktif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                <Button onClick={handleSubmit} disabled={saving} id="btn-submit-rekening">
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {editingId ? "Simpan Perubahan" : "Tambah Rekening"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800/50 px-4 py-3 text-sm">
        <Building2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-blue-800 dark:text-blue-300">Rekening Tujuan Transfer</p>
          <p className="text-blue-700 dark:text-blue-400 text-xs mt-0.5">
            Semua rekening berstatus <strong>Aktif</strong> akan ditampilkan pada dialog upload bukti pembayaran di halaman administrasi santri, pembayaran PPDB, dan infaq.
          </p>
        </div>
      </div>

      {/* Table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          <div className="rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Bank</TableHead>
                  <TableHead className="font-bold">Nomor Rekening</TableHead>
                  <TableHead className="font-bold">Nama Pemilik</TableHead>
                  <TableHead className="font-bold">Label</TableHead>
                  <TableHead className="font-bold">Peruntukan</TableHead>
                  <TableHead className="text-center font-bold">Status</TableHead>
                  <TableHead className="text-right font-bold">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                      <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                      Belum ada rekening bank. Klik &quot;Tambah Rekening&quot; untuk mulai menambahkan.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item) => (
                    <TableRow key={item.id_rekening} className="hover:bg-primary/5 transition-colors group">
                      <TableCell>
                        <div className="font-semibold">{item.nama_bank}</div>
                        {item.cabang_bank && (
                          <div className="text-xs text-muted-foreground">{item.cabang_bank}</div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-sm tracking-wider">{item.nomor_rekening}</TableCell>
                      <TableCell>{item.nama_pemilik}</TableCell>
                      <TableCell>{item.nama_rekening}</TableCell>
                      <TableCell>
                        {item.peruntukan ? (
                          <span className="text-xs text-muted-foreground">{item.peruntukan}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={item.status === "AKTIF" ? "bg-emerald-500" : "bg-slate-400"}>
                          {item.status === "AKTIF" ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => void handleDelete(item.id_rekening)}
                            disabled={deleteLoading === item.id_rekening}
                          >
                            {deleteLoading === item.id_rekening ? (
                              <RefreshCw className="w-4 h-4 text-destructive animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-destructive" />
                            )}
                          </Button>
                        </div>
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
