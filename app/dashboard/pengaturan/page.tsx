"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { 
  Settings, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  RefreshCw, 
  ShieldCheck, 
  CreditCard,
  Building2,
  CalendarDays,
  GraduationCap,
  Tag
} from "lucide-react"
import { useSppSettings, useCreateSppSetting, useUpdateSppSetting, useDeleteSppSetting } from "@/hooks/use-spp-setting"
import { useMasterData } from "@/hooks/use-master-data"
import { useToast } from "@/hooks/use-toast"
import { CreateSppSettingRequest } from "@/lib/services/spp.types"

export default function PengaturanPage() {
  const { toast } = useToast()
  const { data: settings, loading, fetchSettings } = useSppSettings()
  const { units, kelas, tahunAjaran, categories, loading: masterLoading } = useMasterData()
  const { createSetting, loading: creating } = useCreateSppSetting()
  const { updateSetting, loading: updating } = useUpdateSppSetting()
  const { deleteSetting } = useDeleteSppSetting()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateSppSettingRequest>({
    id_unit: null,
    jenjang: null,
    kode_kelas: null,
    kategori_tagihan_id: null,
    jumlah: 0,
    periode: null,
    keterangan: "",
    aktif: true
  })

  const resetForm = () => {
    setFormData({
      id_unit: null,
      jenjang: null,
      kode_kelas: null,
      kategori_tagihan_id: null,
      jumlah: 0,
      periode: null,
      keterangan: "",
      aktif: true
    })
    setEditingId(null)
  }

  const handleEdit = (item: any) => {
    setFormData({
      id_unit: item.idUnit ? Number(item.idUnit) : null,
      jenjang: item.jenjang || null,
      kode_kelas: item.kodeKelas || null,
      kategori_tagihan_id: item.idKategoriTagihan ? Number(item.idKategoriTagihan) : null,
      jumlah: item.nominal || 0,
      periode: item.tahunAjaran || null,
      keterangan: item.keterangan || "",
      aktif: item.aktif
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

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus pengaturan ini?")) return
    try {
      await deleteSetting(id)
      toast({ title: "Berhasil", description: "Pengaturan berhasil dihapus" })
      fetchSettings()
    } catch (e) {}
  }

  const formatCurrency = (v: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v)

  return (
    <div className="container mx-auto py-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b pb-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <Settings className="w-10 h-10 text-primary" />
            Pengaturan Sistem
          </h1>
          <p className="text-muted-foreground mt-2">
            Kelola konfigurasi penagihan SPP, unit, dan parameter sistem lainnya.
          </p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={() => fetchSettings()}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
           </Button>
        </div>
      </div>

      <Tabs defaultValue="spp" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Umum
          </TabsTrigger>
          <TabsTrigger value="spp" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> SPP
          </TabsTrigger>
          <TabsTrigger value="unit" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Unit
          </TabsTrigger>
        </TabsList>

        {/* --- SPP SETTINGS TAB --- */}
        <TabsContent value="spp" className="mt-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Pengaturan Tagihan SPP</h2>
              <p className="text-sm text-muted-foreground">Definisikan nominal tagihan berdasarkan unit, jenjang, atau kelas.</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="shadow-lg hover:shadow-primary/20 transition-all">
                  <Plus className="w-4 h-4 mr-2" /> Tambah Setting
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-card">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">{editingId ? 'Edit' : 'Tambah'} Pengaturan SPP</DialogTitle>
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
                        value={formData.id_unit?.toString()} 
                        onValueChange={(v) => setFormData({...formData, id_unit: v === 'null' ? null : Number(v)})}
                      >
                        <SelectTrigger><SelectValue placeholder="Pilih Unit" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="null">Semua Unit</SelectItem>
                          {units.map(u => <SelectItem key={u.value} value={u.value.toString()}>{u.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground">Unit Kerja: Cabang/Lembaga (MI, MTS, MA, dsb)</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-primary" /> Jenjang
                      </Label>
                      <Select 
                        value={formData.jenjang || "null"} 
                        onValueChange={(v) => setFormData({...formData, jenjang: v === 'null' ? null : v})}
                      >
                        <SelectTrigger><SelectValue placeholder="Pilih Jenjang" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="null">Semua Jenjang</SelectItem>
                          {/* Populate from units but use code as value */}
                          {units.map(u => (
                            <SelectItem key={u.code} value={u.code || ""}>{u.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-primary" /> Kategori Tagihan
                      </Label>
                      <Select 
                        value={formData.kategori_tagihan_id?.toString()} 
                        onValueChange={(v) => setFormData({...formData, kategori_tagihan_id: v === 'null' ? null : Number(v)})}
                      >
                        <SelectTrigger><SelectValue placeholder="Pilih Kategori" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="null">Tanpa Kategori</SelectItem>
                          {categories.map(c => <SelectItem key={c.value} value={c.value.toString()}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-primary" /> Tahun Ajaran / Periode
                      </Label>
                      <Select 
                        value={formData.periode || "null"} 
                        onValueChange={(v) => setFormData({...formData, periode: v === 'null' ? null : v})}
                      >
                        <SelectTrigger><SelectValue placeholder="Pilih Periode" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="null">Semua Periode</SelectItem>
                          {tahunAjaran.map(t => <SelectItem key={t.value} value={t.value.toString()}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-1">
                      <Label className="font-bold">Nominal Tagihan</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">IDR</span>
                        <Input 
                          type="number" 
                          className="pl-12 font-mono text-lg"
                          value={formData.jumlah} 
                          onChange={(e) => setFormData({...formData, jumlah: Number(e.target.value)})} 
                        />
                      </div>
                    </div>
                    <div className="space-y-2 flex flex-col justify-end">
                      <Label className="mb-2">Status Aktif</Label>
                      <div className="flex items-center gap-3 h-10">
                        <span className={formData.aktif ? "text-emerald-600 font-bold" : "text-muted-foreground"}>
                          {formData.aktif ? 'Aktif' : 'Nonaktif'}
                        </span>
                        <Switch 
                          checked={formData.aktif} 
                          onCheckedChange={(checked) => setFormData({...formData, aktif: checked})} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Keterangan Tambahan</Label>
                    <Input 
                      placeholder="Contoh: Tagihan SPP Bulanan Standar" 
                      value={formData.keterangan || ""} 
                      onChange={(e) => setFormData({...formData, keterangan: e.target.value})} 
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={creating || updating}
                    className="min-w-[120px]"
                  >
                    {creating || updating ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    {editingId ? 'Simpan Perubahan' : 'Buat Setting'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
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
                    <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">Memuat data...</TableCell></TableRow>
                  ) : settings.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">Belum ada pengaturan tagihan.</TableCell></TableRow>
                  ) : (
                    settings.map((item) => (
                      <TableRow key={item.id} className="hover:bg-primary/5 transition-colors group">
                        <TableCell>
                          <div className="font-medium">{item.unit?.nama_unit || 'Semua Unit'}</div>
                          <div className="text-xs text-muted-foreground">{item.jenjang || 'Semua Jenjang'}</div>
                        </TableCell>
                        <TableCell>{item.tahunAjaran || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {item.kategoriTagihan?.nama_tagihan || 'Umum'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          {formatCurrency(item.nominal)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={item.aktif ? 'bg-emerald-500' : 'bg-slate-400'}>
                            {item.aktif ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                              <Edit className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- GENERAL SETTINGS TAB --- */}
        <TabsContent value="general" className="mt-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Pengaturan Umum</CardTitle>
              <CardDescription>Konfigurasi identitas lembaga dan parameter global.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Nama Lembaga</Label>
                <Input defaultValue="Pondok Pesantren Al-Ausath" />
              </div>
              <div className="grid gap-2">
                <Label>Alamat Website Utama</Label>
                <Input defaultValue="https://al-ausath.com" />
              </div>
              <Button>Simpan Perubahan</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- UNIT TAB --- */}
        <TabsContent value="unit" className="mt-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {units.map(u => (
               <Card key={u.value} className="border-none shadow hover:shadow-md transition-shadow">
                 <CardHeader className="pb-2">
                   <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center mb-2">
                     <Building2 className="w-5 h-5 text-primary" />
                   </div>
                   <CardTitle className="text-lg">{u.label}</CardTitle>
                   <CardDescription>Kode: {u.value}</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <Button variant="link" className="p-0 h-auto text-xs">Lihat Detail Unit &rarr;</Button>
                 </CardContent>
               </Card>
             ))}
           </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
