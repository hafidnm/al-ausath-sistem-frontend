"use client"

import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ekskulService, EkskulApiItem } from "@/lib/services/ekskul.service"
import { dataMasterService } from "@/lib/services/data-master.service"
import { useUnit } from "@/contexts/unit-context"
import {
  MoreVertical, PlusCircle, PencilLine, Trash2, LockOpen, Lock, Users,
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UnitOption { value: string; label: string }

const defaultForm = {
  nama_ekskul: "",
  deskripsi: "",
  kode_unit: "",
  kuota: "",
  status: "AKTIF",
  status_pendaftaran: "TUTUP",
}

// ─── EkskulForm di luar komponen utama agar tidak di-remount setiap render ───
interface EkskulFormProps {
  data: typeof defaultForm
  onChange: (v: typeof defaultForm) => void
  unitOptions: UnitOption[]
}

function EkskulForm({ data, onChange, unitOptions }: EkskulFormProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <Label>Nama Ekskul <span className="text-destructive">*</span></Label>
        <Input value={data.nama_ekskul} onChange={e => onChange({ ...data, nama_ekskul: e.target.value })} placeholder="Contoh: Hadroh" />
      </div>
      <div className="grid gap-1.5">
        <Label>Deskripsi</Label>
        <Textarea rows={3} value={data.deskripsi} onChange={e => onChange({ ...data, deskripsi: e.target.value })} placeholder="Deskripsi singkat ekskul" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>Unit</Label>
          <Select value={data.kode_unit || "none"} onValueChange={v => onChange({ ...data, kode_unit: v === "none" ? "" : v })}>
            <SelectTrigger><SelectValue placeholder="Semua Unit" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Semua Unit</SelectItem>
              {unitOptions.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label>Kuota</Label>
          <Input type="number" min={1} value={data.kuota} onChange={e => onChange({ ...data, kuota: e.target.value })} placeholder="Kosong = tidak terbatas" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>Status</Label>
          <Select value={data.status} onValueChange={v => onChange({ ...data, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="AKTIF">Aktif</SelectItem>
              <SelectItem value="NONAKTIF">Nonaktif</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label>Status Pendaftaran</Label>
          <Select value={data.status_pendaftaran} onValueChange={v => onChange({ ...data, status_pendaftaran: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="BUKA">Buka</SelectItem>
              <SelectItem value="TUTUP">Tutup</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

export default function EkskulPage() {
  const { toast } = useToast()
  const { selectedKodeUnit, isLoading: isUnitLoading } = useUnit()
  const contextReady = !isUnitLoading
  const initDoneRef = useRef(false)
  const initCalledRef = useRef(false)

  const [rows, setRows] = useState<EkskulApiItem[]>([])
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState(defaultForm)
  const [editFormData, setEditFormData] = useState(defaultForm)

  const [filterStatus, setFilterStatus] = useState("all")
  const [draftStatus, setDraftStatus] = useState("all")

  const fetchRows = async () => {
    setIsLoading(true)
    try {
      const params: Record<string, unknown> = { all: true }
      if (selectedKodeUnit) params.kode_unit = selectedKodeUnit
      if (filterStatus !== "all") params.status = filterStatus
      const result = await ekskulService.getAll(params)
      setRows(result.data ?? result)
    } catch {
      toast({ title: "Gagal memuat data ekskul", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!contextReady) return
    const load = async () => {
      try {
        const initData = await dataMasterService.getInitOptions()
        setUnitOptions((initData.unit ?? []).map((u: any) => ({
          value: u.kode_unit,
          label: u.nama_unit || u.kode_unit,
        })))
      } catch { /* fallback to empty */ } finally {
        initDoneRef.current = true
        await fetchRows()
      }
    }
    if (!initCalledRef.current) {
      initCalledRef.current = true
      void load()
    } else if (initDoneRef.current) {
      void fetchRows()
    }
  }, [contextReady])

  useEffect(() => {
    if (!initDoneRef.current) return
    void fetchRows()
  }, [selectedKodeUnit, filterStatus])

  const handleCreate = async () => {
    if (!formData.nama_ekskul.trim()) {
      toast({ title: "Nama ekskul wajib diisi", variant: "destructive" }); return
    }
    setIsLoading(true)
    try {
      await ekskulService.create({
        ...formData,
        kode_unit: formData.kode_unit || undefined,
        kuota: formData.kuota ? Number(formData.kuota) : undefined,
      } as any)
      toast({ title: "Ekskul berhasil dibuat" })
      setIsAddOpen(false)
      setFormData(defaultForm)
      await fetchRows()
    } catch (e: any) {
      toast({ title: "Gagal", description: e?.response?.data?.message ?? "Terjadi kesalahan", variant: "destructive" })
    } finally { setIsLoading(false) }
  }

  const openEdit = (row: EkskulApiItem) => {
    setEditingId(row.id_ekskul)
    setEditFormData({
      nama_ekskul: row.nama_ekskul,
      deskripsi: row.deskripsi ?? "",
      kode_unit: row.kode_unit ?? "",
      kuota: row.kuota != null ? String(row.kuota) : "",
      status: row.status,
      status_pendaftaran: row.status_pendaftaran,
    })
    setIsEditOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingId) return
    setIsLoading(true)
    try {
      await ekskulService.update(editingId, {
        ...editFormData,
        kode_unit: editFormData.kode_unit || undefined,
        kuota: editFormData.kuota ? Number(editFormData.kuota) : undefined,
      } as any)
      toast({ title: "Ekskul berhasil diperbarui" })
      setIsEditOpen(false)
      await fetchRows()
    } catch (e: any) {
      toast({ title: "Gagal", description: e?.response?.data?.message ?? "Terjadi kesalahan", variant: "destructive" })
    } finally { setIsLoading(false) }
  }

  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Hapus ekskul "${nama}"?`)) return
    setIsLoading(true)
    try {
      await ekskulService.remove(id)
      toast({ title: "Ekskul berhasil dihapus" })
      await fetchRows()
    } catch (e: any) {
      toast({ title: "Gagal menghapus", description: e?.response?.data?.message ?? "Terjadi kesalahan", variant: "destructive" })
    } finally { setIsLoading(false) }
  }

  const handleTogglePendaftaran = async (row: EkskulApiItem) => {
    const next = row.status_pendaftaran === "BUKA" ? "TUTUP" : "BUKA"
    try {
      await ekskulService.update(row.id_ekskul, { status_pendaftaran: next })
      toast({ title: `Pendaftaran ${row.nama_ekskul} ${next === "BUKA" ? "dibuka" : "ditutup"}` })
      await fetchRows()
    } catch (e: any) {
      toast({ title: "Gagal", description: e?.response?.data?.message, variant: "destructive" })
    }
  }


  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Master Ekstrakurikuler</h1>
          <p className="text-muted-foreground text-sm mt-1">Kelola program ekskul dan buka/tutup pendaftaran santri</p>
        </div>
        <Button onClick={() => { setFormData(defaultForm); setIsAddOpen(true) }} className="gap-2">
          <PlusCircle className="w-4 h-4" /> Tambah Ekskul
        </Button>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Status Ekskul</Label>
            <Select value={draftStatus} onValueChange={setDraftStatus}>
              <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Semua Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="AKTIF">Aktif</SelectItem>
                <SelectItem value="NONAKTIF">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            className="h-9" 
            onClick={() => setFilterStatus(draftStatus)}
          >
            Terapkan
          </Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Ekskul</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-center">Kuota</TableHead>
                <TableHead className="text-center">Pendaftar</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Pendaftaran</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Memuat data...</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Belum ada data ekskul.</TableCell></TableRow>
              ) : rows.map(row => (
                <TableRow key={row.id_ekskul}>
                  <TableCell>
                    <div className="font-medium">{row.nama_ekskul}</div>
                    {row.deskripsi && <div className="text-xs text-muted-foreground line-clamp-1">{row.deskripsi}</div>}
                  </TableCell>
                  <TableCell>{row.unit?.nama_unit ?? row.kode_unit ?? <span className="text-muted-foreground italic">Semua Unit</span>}</TableCell>
                  <TableCell className="text-center">{row.kuota ?? <span className="text-muted-foreground">∞</span>}</TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      {row.jumlah_pendaftar ?? 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={row.status === "AKTIF" ? "default" : "secondary"}>
                      {row.status === "AKTIF" ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      onClick={() => handleTogglePendaftaran(row)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        row.status_pendaftaran === "BUKA"
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400"
                      }`}
                    >
                      {row.status_pendaftaran === "BUKA" ? <><LockOpen className="w-3 h-3" /> Buka</> : <><Lock className="w-3 h-3" /> Tutup</>}
                    </button>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(row)}><PencilLine className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(row.id_ekskul, row.nama_ekskul)}
                        ><Trash2 className="w-4 h-4 mr-2" />Hapus</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Tambah */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Tambah Ekskul Baru</DialogTitle></DialogHeader>
          <EkskulForm data={formData} onChange={setFormData} unitOptions={unitOptions} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Batal</Button>
            <Button onClick={handleCreate} disabled={isLoading}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Edit */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Ekskul</DialogTitle></DialogHeader>
          <EkskulForm data={editFormData} onChange={setEditFormData} unitOptions={unitOptions} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
            <Button onClick={handleUpdate} disabled={isLoading}>Simpan Perubahan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
