"use client"

import { useEffect, useState } from "react"
import { profilWebService, type ProfilWeb } from "@/lib/services/profil-web.service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Plus, Trash2, Save, AlertTriangle } from "lucide-react"

export default function ProfilWebPage() {
  const { toast } = useToast()
  const [profiles, setProfiles] = useState<ProfilWeb[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newTipe, setNewTipe] = useState("")
  const [newNama, setNewNama] = useState("")
  const [newLamaPendidikan, setNewLamaPendidikan] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [activeTab, setActiveTab] = useState("")

  const fetchProfiles = async () => {
    try {
      const data = await profilWebService.getAll()
      setProfiles(data)
      if (data.length > 0 && !activeTab) {
        setActiveTab(data[0].tipe)
      }
    } catch (error) {
      toast({
        title: "Gagal memuat data",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfiles()
  }, [])

  const handleUpdate = async (profile: ProfilWeb) => {
    setSaving(true)
    try {
      await profilWebService.update(profile.id_profil, profile)
      toast({
        title: "Berhasil",
        description: `Profil ${profile.nama} berhasil diperbarui`,
      })
      fetchProfiles()
    } catch (error) {
      toast({
        title: "Gagal menyimpan",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAdd = async () => {
    if (!newTipe.trim() || !newNama.trim()) {
      toast({ title: "Validasi", description: "Tipe (Kode) dan Nama wajib diisi", variant: "destructive" })
      return
    }
    setIsAdding(true)
    try {
      await profilWebService.create({
        tipe: newTipe.toUpperCase().replace(/\s+/g, "_"),
        nama: newNama,
        lama_pendidikan: newLamaPendidikan,
        visi: "",
        misi: [],
        sejarah: "",
        program_unggulan: []
      })
      toast({ title: "Berhasil", description: "Profil jenjang baru berhasil ditambahkan" })
      setIsAddOpen(false)
      setNewTipe("")
      setNewNama("")
      setNewLamaPendidikan("")
      setActiveTab(newTipe.toUpperCase().replace(/\s+/g, "_"))
      fetchProfiles()
    } catch (error: any) {
      const errRes = error.response?.data
      let errorMsg = error.message
      if (errRes?.errors) {
        errorMsg = Object.values(errRes.errors).map((err: any) => err.join(", ")).join("; ")
      } else if (errRes?.message) {
        errorMsg = errRes.message
      }
      toast({ 
        title: "Gagal Menyimpan", 
        description: errorMsg, 
        variant: "destructive" 
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus profil jenjang ${nama}? Semua data konten di dalamnya akan terhapus.`)) return
    
    try {
      await profilWebService.delete(id)
      toast({ title: "Berhasil", description: "Profil berhasil dihapus" })
      setActiveTab("") // reset active tab
      fetchProfiles()
    } catch (error) {
      toast({ title: "Gagal", description: error instanceof Error ? error.message : "Gagal menghapus profil", variant: "destructive" })
    }
  }

  const handleArrayChange = (
    profileId: number,
    field: "misi" | "program_unggulan",
    index: number,
    value: string
  ) => {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id_profil === profileId) {
          const newArray = [...(p[field] || [])]
          newArray[index] = value
          return { ...p, [field]: newArray }
        }
        return p
      })
    )
  }

  const addArrayItem = (profileId: number, field: "misi" | "program_unggulan") => {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id_profil === profileId) {
          return { ...p, [field]: [...(p[field] || []), ""] }
        }
        return p
      })
    )
  }

  const removeArrayItem = (profileId: number, field: "misi" | "program_unggulan", index: number) => {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id_profil === profileId) {
          const newArray = [...(p[field] || [])]
          newArray.splice(index, 1)
          return { ...p, [field]: newArray }
        }
        return p
      })
    )
  }

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Profil Web</h1>
          <p className="text-muted-foreground">
            Kelola konten Visi, Misi, Sejarah, dan Program Unggulan yang tampil di halaman utama (Landing Page).
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Jenjang Baru
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 flex flex-wrap h-auto">
          {profiles.map((p) => (
            <TabsTrigger key={p.id_profil} value={p.tipe}>
              {p.nama}
            </TabsTrigger>
          ))}
        </TabsList>

        {profiles.map((profile) => (
          <TabsContent key={profile.id_profil} value={profile.tipe}>
            <Card>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle>{profile.nama}</CardTitle>
                  <CardDescription>Ubah detail profil untuk jenjang {profile.tipe}</CardDescription>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => handleDelete(profile.id_profil, profile.nama)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus Jenjang
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nama Penampil</Label>
                    <Input 
                      value={profile.nama} 
                      onChange={(e) => setProfiles(prev => prev.map(p => p.id_profil === profile.id_profil ? { ...p, nama: e.target.value } : p))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lama Pendidikan (Opsional)</Label>
                    <Input 
                      placeholder="Contoh: 3-5 Tahun atau 6 Tahun"
                      value={profile.lama_pendidikan || ""} 
                      onChange={(e) => setProfiles(prev => prev.map(p => p.id_profil === profile.id_profil ? { ...p, lama_pendidikan: e.target.value } : p))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Visi</Label>
                  <Textarea 
                    rows={3}
                    value={profile.visi || ""} 
                    onChange={(e) => setProfiles(prev => prev.map(p => p.id_profil === profile.id_profil ? { ...p, visi: e.target.value } : p))}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Misi</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem(profile.id_profil, "misi")}>
                      <Plus className="w-4 h-4 mr-2" /> Tambah Misi
                    </Button>
                  </div>
                  {profile.misi && profile.misi.map((m, index) => (
                    <div key={index} className="flex gap-2">
                      <Input 
                        value={m} 
                        onChange={(e) => handleArrayChange(profile.id_profil, "misi", index, e.target.value)}
                      />
                      <Button type="button" variant="destructive" size="icon" onClick={() => removeArrayItem(profile.id_profil, "misi", index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Sejarah Singkat</Label>
                  <Textarea 
                    rows={5}
                    value={profile.sejarah || ""} 
                    onChange={(e) => setProfiles(prev => prev.map(p => p.id_profil === profile.id_profil ? { ...p, sejarah: e.target.value } : p))}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Program Unggulan</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem(profile.id_profil, "program_unggulan")}>
                      <Plus className="w-4 h-4 mr-2" /> Tambah Program
                    </Button>
                  </div>
                  {profile.program_unggulan && profile.program_unggulan.map((p, index) => (
                    <div key={index} className="flex gap-2">
                      <Input 
                        value={p} 
                        onChange={(e) => handleArrayChange(profile.id_profil, "program_unggulan", index, e.target.value)}
                      />
                      <Button type="button" variant="destructive" size="icon" onClick={() => removeArrayItem(profile.id_profil, "program_unggulan", index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={() => handleUpdate(profile)} 
                  disabled={saving}
                  className="w-full mt-4"
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Simpan Perubahan
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Jenjang Profil Baru</DialogTitle>
            <DialogDescription>
              Buat profil baru (misal: memisahkan PAUD dan TK).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipe (Kode Unik)</Label>
              <Input 
                placeholder="Contoh: PAUD, TK, SD" 
                value={newTipe}
                onChange={(e) => setNewTipe(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Kode pendek tanpa spasi (otomatis kapital).</p>
            </div>
            <div className="space-y-2">
              <Label>Nama Penampil</Label>
              <Input 
                placeholder="Contoh: Pendidikan Anak Usia Dini (PAUD)" 
                value={newNama}
                onChange={(e) => setNewNama(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Lama Pendidikan (Opsional)</Label>
              <Input 
                placeholder="Contoh: 3-5 Tahun atau 6 Tahun" 
                value={newLamaPendidikan}
                onChange={(e) => setNewLamaPendidikan(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Batal</Button>
            <Button onClick={handleAdd} disabled={isAdding}>
              {isAdding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
