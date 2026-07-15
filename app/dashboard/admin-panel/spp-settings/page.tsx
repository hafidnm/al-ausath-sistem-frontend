"use client"

import { useState, useEffect } from "react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import {
  CreditCard,
  Plus,
  Trash2,
  Edit,
  Save,
  RefreshCw,
  Building2,
  CalendarDays,
  GraduationCap,
  Tag,
  Zap,
  Users,
  Info,
} from "lucide-react"
import { useSppSettings, useCreateSppSetting, useUpdateSppSetting, useDeleteSppSetting } from "@/hooks/use-spp-setting"
import { useMasterData } from "@/hooks/use-master-data"
import { useToast } from "@/hooks/use-toast"
import { CreateSppSettingRequest } from "@/lib/services/spp.types"
import { sppService } from "@/lib/services/spp.service"

export default function SppSettingsPage() {
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { data: settings, loading, fetchSettings } = useSppSettings()
  const { units, kelas, tahunAjaran, categories, golonganSpp, loading: masterLoading } = useMasterData(isDialogOpen)
  const { createSetting, loading: creating } = useCreateSppSetting()
  const { updateSetting, loading: updating } = useUpdateSppSetting()
  const { deleteSetting } = useDeleteSppSetting()
  const [provisionLoading, setProvisionLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  // Generate dialog state
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [generateTargetId, setGenerateTargetId] = useState<string | null>(null)
  const [generateLoading, setGenerateLoading] = useState(false)
  const currentYear = new Date().getFullYear()
  const [generateForm, setGenerateForm] = useState({
    bulan_mulai: 7,
    tahun_mulai: currentYear,
    bulan_selesai: 6,
    tahun_selesai: currentYear + 1,
  })
  const [formData, setFormData] = useState<CreateSppSettingRequest>({
    id_unit: null,
    jenjang: null,
    kode_kelas: null,
    id_golongan_spp: null,
    kategori_tagihan_id: null,
    jumlah: 0,
    discount: null,
    periode: null,
    keterangan: "",
    aktif: true,
  })

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const resetForm = () => {
    setFormData({
      id_unit: null,
      jenjang: null,
      kode_kelas: null,
      id_golongan_spp: null,
      kategori_tagihan_id: null,
      jumlah: 0,
      discount: null,
      periode: null,
      keterangan: "",
      aktif: true,
    })
    setEditingId(null)
  }

  const handleEdit = (item: any) => {
    setFormData({
      id_unit: item.idUnit ? Number(item.idUnit) : null,
      jenjang: item.jenjang || null,
      kode_kelas: item.kodeKelas || null,
      id_golongan_spp: item.idGolonganSpp ? Number(item.idGolonganSpp) : null,
      kategori_tagihan_id: item.idKategoriTagihan ? Number(item.idKategoriTagihan) : null,
      jumlah: item.nominal || 0,
      discount: item.discount ? Number(item.discount) : null,
      periode: item.tahunAjaran || null,
      keterangan: item.keterangan || "",
      aktif: item.aktif,
    })
    setEditingId(item.id)
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await updateSetting(editingId, formData)
        toast({ title: "Berhasil", description: "Pengaturan berhasil diperbarui" })
      } else {
        await createSetting(formData)
        toast({ title: "Berhasil", description: "Pengaturan berhasil dibuat" })
      }
      setIsDialogOpen(false)
      resetForm()
      fetchSettings()
    } catch (e) {
      // Error handled by hook
    }
  }

  const handleOpenGenerate = (id: string) => {
    setGenerateTargetId(id)
    setGenerateForm({ bulan_mulai: 7, tahun_mulai: currentYear, bulan_selesai: 6, tahun_selesai: currentYear + 1 })
    setGenerateDialogOpen(true)
  }

  const handleGenerate = async () => {
    if (!generateTargetId) return
    setGenerateLoading(true)
    try {
      const res = await sppService.generateTagihanPeriode(generateTargetId, generateForm)
      toast({
        title: "Berhasil Generate Tagihan!",
        description: res.message,
      })
      setGenerateDialogOpen(false)
      fetchSettings()
    } catch (e: any) {
      toast({ title: "Gagal", description: e?.message ?? "Terjadi kesalahan", variant: "destructive" })
    } finally {
      setGenerateLoading(false)
    }
  }

  const discountOption = [
    { value: 10, label: "10%" },
    { value: 50, label: "50%" },
   ]
   
  const BULAN = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ]

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus pengaturan ini?")) return
    setDeleteLoading(id)
    try {
      await deleteSetting(id)
      toast({ title: "Berhasil", description: "Pengaturan berhasil dihapus" })
      await fetchSettings()
    } catch (e: any) {
      const errorMsg = e?.message || "Gagal menghapus pengaturan. Silakan coba lagi."
      toast({ title: "Gagal", description: errorMsg, variant: "destructive" })
      console.error("Delete error:", e)
    } finally {
      setDeleteLoading(null)
    }
  }

  const handleProvisionBills = async () => {
    if (!confirm("Jalankan provision tagihan SPP untuk seluruh santri aktif?")) return

    setProvisionLoading(true)
    try {
      const result = await sppService.provisionBills()
      toast({
        title: "Provision berhasil",
        description: `${result.data.processed} santri aktif diproses.`,
      })
      await fetchSettings()
    } catch (error: any) {
      toast({
        title: "Gagal",
        description: error?.message ?? "Gagal menjalankan provision tagihan SPP.",
        variant: "destructive",
      })
    } finally {
      setProvisionLoading(false)
    }
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            Pengaturan Tagihan SPP
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Definisikan nominal tagihan berdasarkan unit, jenjang, atau kelas.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchSettings()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleProvisionBills} disabled={provisionLoading}>
            <Zap className={`w-4 h-4 mr-2 ${provisionLoading ? "animate-pulse" : ""}`} />
            {provisionLoading ? "Provisioning..." : "Provision Tagihan"}
          </Button>

          {/* Dialog Tambah / Edit */}
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm() }}>
            <DialogTrigger asChild>
              <Button id="btn-tambah-spp-setting">
                <Plus className="w-4 h-4 mr-2" /> Tambah Setting
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-card">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">{editingId ? "Edit" : "Tambah"} Pengaturan SPP</DialogTitle>
                <DialogDescription>
                  Tentukan kriteria penagihan. Sistem akan otomatis membuat tagihan untuk santri yang sesuai.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" /> Unit Kerja
                    </Label>
                    <Select
                      value={formData.id_unit?.toString() ?? "__none__"}
                      onValueChange={(v) => setFormData({ ...formData, id_unit: v === "__none__" ? null : Number(v) })}
                    >
                      <SelectTrigger><SelectValue placeholder="Pilih Unit" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Semua Unit</SelectItem>
                        {units.map(u => <SelectItem key={u.value} value={u.value.toString()}>{u.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground">Unit Kerja: Cabang/Lembaga (MI, MTS, MA, dsb)</p>
                  </div>
                  {/* Jenjang dropdown — filter unit yg punya kode_unit valid */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-primary" /> Jenjang
                    </Label>
                    <Select
                      value={formData.jenjang || "__none__"}
                      onValueChange={(v) => setFormData({ ...formData, jenjang: v === "__none__" ? null : v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Pilih Jenjang" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Semua Jenjang</SelectItem>
                        {units
                          .filter(u => u.code && u.code.trim() !== "")
                          .map(u => (
                            <SelectItem key={u.code} value={u.code!}>{u.label} ({u.code})</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Baris 2: Golongan SPP + Kode Kelas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" /> Golongan SPP
                    </Label>
                    <Select
                      value={formData.id_golongan_spp?.toString() ?? "__none__"}
                      onValueChange={(v) => setFormData({ ...formData, id_golongan_spp: v === "__none__" ? null : Number(v) })}
                    >
                      <SelectTrigger><SelectValue placeholder="Pilih Golongan" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Tanpa Golongan</SelectItem>
                        {golonganSpp.map(g => <SelectItem key={g.value} value={g.value.toString()}>{g.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground">Opsional: filter berdasar golongan santri</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-primary" /> Kode Kelas
                    </Label>
                    <Select
                      value={formData.kode_kelas || "__none__"}
                      onValueChange={(v) => setFormData({ ...formData, kode_kelas: v === "__none__" ? null : v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Semua Kelas</SelectItem>
                        {kelas.map(k => <SelectItem key={k.value} value={k.value.toString()}>{k.label} ({k.value})</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground">Opsional: spesifik ke kelas tertentu</p>
                  </div>
                </div>

                {/* Baris 3: Kategori + Periode */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-primary" /> Kategori Tagihan
                    </Label>
                    <Select
                      value={formData.kategori_tagihan_id?.toString() ?? "__none__"}
                      onValueChange={(v) => setFormData({ ...formData, kategori_tagihan_id: v === "__none__" ? null : Number(v) })}
                    >
                      <SelectTrigger><SelectValue placeholder="Pilih Kategori" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Tanpa Kategori</SelectItem>
                        {categories.map(c => <SelectItem key={c.value} value={c.value.toString()}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-primary" /> Tahun Ajaran / Periode
                    </Label>
                    <Select
                      value={formData.periode || "__none__"}
                      onValueChange={(v) => setFormData({ ...formData, periode: v === "__none__" ? null : v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Pilih Periode" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Semua Periode</SelectItem>
                        {tahunAjaran.map(t => <SelectItem key={t.value} value={t.value.toString()}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Nominal Tagihan</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">IDR</span>
                      <Input
                        type="number"
                        className="pl-12 font-mono text-lg"
                        value={formData.jumlah}
                        onChange={(e) => setFormData({ ...formData, jumlah: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 flex flex-col justify-end">
                    <Label className="mb-2">Status Aktif</Label>
                    <div className="flex items-center gap-3 h-10">
                      <span className={formData.aktif ? "text-emerald-600 font-bold" : "text-muted-foreground"}>
                        {formData.aktif ? "Aktif" : "Nonaktif"}
                      </span>
                      <Switch
                        checked={formData.aktif}
                        onCheckedChange={(checked) => setFormData({ ...formData, aktif: checked })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Keterangan Tambahan</Label>
                  <Input
                    placeholder="Contoh: Tagihan SPP Bulanan Standar"
                    value={formData.keterangan || ""}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  />
                </div>
              </div>

                 <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-primary" /> Diskon
                    </Label>
                    <Select
                      value={formData.discount?.toString() || "__none__"}
                      onValueChange={(v) => setFormData({ ...formData, discount: v === "__none__" ? null : parseFloat(v) })}
                    >
                      <SelectTrigger><SelectValue placeholder="discount" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Diskon</SelectItem>
                        {discountOption.map(t => <SelectItem key={t.value} value={t.value.toString()}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                <Button
                  onClick={handleSubmit}
                  disabled={creating || updating}
                  className="min-w-[120px]"
                  id="btn-submit-spp-setting"
                >
                  {creating || updating ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {editingId ? "Simpan Perubahan" : "Buat Setting"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Anak Guru Discount Info Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/50 px-4 py-3 text-sm">
        <Users className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-amber-800 dark:text-amber-400">Potongan Anak Guru Aktif</p>
          <p className="text-amber-700 dark:text-amber-500 text-xs mt-0.5">
            Santri yang bertanda <span className="font-semibold">Anak Guru</span> akan otomatis mendapat potongan <span className="font-semibold">50%</span> dari nominal tagihan saat tagihan dibuat.
            Kolom nominal di bawah menampilkan tarif normal dan tarif Anak Guru (50%).
          </p>
        </div>
        <Info className="w-4 h-4 text-amber-500 shrink-0" />
      </div>

      {/* Table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          <div className="rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Unit / Jenjang</TableHead>
                  <TableHead className="font-bold">Tahun Ajaran</TableHead>
                  <TableHead className="font-bold">Kategori</TableHead>
                  <TableHead className="text-right font-bold">Nominal</TableHead>
                  <TableHead className="text-center font-bold">Status</TableHead>
                  <TableHead className="text-right font-bold">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                      <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : settings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                      Belum ada pengaturan tagihan. Klik &quot;Tambah Setting&quot; untuk memulai.
                    </TableCell>
                  </TableRow>
                ) : (
                  settings.map((item) => (
                    <TableRow key={item.id} className="hover:bg-primary/5 transition-colors group">
                      <TableCell>
                        <div className="font-medium">{item.unit?.nama_unit || item.jenjang || "Semua Unit"}</div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          {item.jenjang && <span className="mr-2">Jenjang: <b>{item.jenjang}</b></span>}
                          {item.kodeKelas && <span>Kelas: <b>{item.kodeKelas}</b></span>}
                          {item.golonganSpp && <span className="block">Golongan: {item.golonganSpp.nama_golongan}</span>}
                        </div>
                      </TableCell>
                      <TableCell>{item.tahunAjaran || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {item.kategoriTagihan?.nama_tagihan || "Umum"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="font-mono font-bold">{formatCurrency(item.nominal)}</span>
                          <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" />
                            {formatCurrency(Math.round(item.nominal * 0.5))}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={item.aktif ? "bg-emerald-500" : "bg-slate-400"}>
                          {item.aktif ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Generate Tagihan Periode"
                            onClick={() => handleOpenGenerate(item.id)}
                          >
                            <Zap className="w-4 h-4 text-amber-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                            disabled={deleteLoading === item.id}
                            title={deleteLoading === item.id ? "Menghapus..." : "Hapus"}
                          >
                            {deleteLoading === item.id ? (
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

      {/* Generate Tagihan Periode Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" /> Generate Tagihan Per Periode
            </DialogTitle>
            <DialogDescription>
              Buat tagihan bulanan otomatis untuk setiap santri yang sesuai dengan setting ini.
              Sistem akan membuat 1 tagihan per bulan per santri.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Bulan Mulai</Label>
                <Select
                  value={String(generateForm.bulan_mulai)}
                  onValueChange={(v) => setGenerateForm({ ...generateForm, bulan_mulai: Number(v) })}
                >
                  <SelectTrigger id="gen-bulan-mulai"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BULAN.map((b, i) => <SelectItem key={i + 1} value={String(i + 1)}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tahun Mulai</Label>
                <Input
                  id="gen-tahun-mulai"
                  type="number"
                  value={generateForm.tahun_mulai}
                  onChange={(e) => setGenerateForm({ ...generateForm, tahun_mulai: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Bulan Selesai</Label>
                <Select
                  value={String(generateForm.bulan_selesai)}
                  onValueChange={(v) => setGenerateForm({ ...generateForm, bulan_selesai: Number(v) })}
                >
                  <SelectTrigger id="gen-bulan-selesai"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BULAN.map((b, i) => <SelectItem key={i + 1} value={String(i + 1)}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tahun Selesai</Label>
                <Input
                  id="gen-tahun-selesai"
                  type="number"
                  value={generateForm.tahun_selesai}
                  onChange={(e) => setGenerateForm({ ...generateForm, tahun_selesai: Number(e.target.value) })}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
              Contoh: {BULAN[generateForm.bulan_mulai - 1]} {generateForm.tahun_mulai} – {BULAN[generateForm.bulan_selesai - 1]} {generateForm.tahun_selesai}
              &nbsp;= {Math.max(0, (generateForm.tahun_selesai - generateForm.tahun_mulai) * 12 + generateForm.bulan_selesai - generateForm.bulan_mulai + 1)} bulan
            </p>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setGenerateDialogOpen(false)}>Batal</Button>
            <Button onClick={handleGenerate} disabled={generateLoading} className="bg-amber-500 hover:bg-amber-600 text-white" id="btn-confirm-generate">
              {generateLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
              Generate Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
