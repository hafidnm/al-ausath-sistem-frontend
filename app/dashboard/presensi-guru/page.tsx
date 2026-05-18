"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast"
import { Search, FileSpreadsheet, FileIcon as FilePdf, History, CheckCircle, Clock, Check, Plus } from "lucide-react"

import { sesiAbsensiService, SesiAbsensiApiItem } from "@/lib/services/sesiabsensi.service"
import { dataJadwalPembelajaranService } from "@/lib/services/jadwal-pembelajaran.service"
import { dataPetugasService } from "@/lib/services/petugas.service"
import { dataUnitService, DataUnitApiItem } from "@/lib/services/unit.service"
import { kelasService, KelasItem } from "@/lib/services/kelas.service"

interface RekapPetugasRow {
  id_petugas: number
  nama_lengkap: string
  peran_akun: string
  total_pertemuan: number
  jumlah_hadir: number
  jumlah_izin: number
  jumlah_sakit: number
  jumlah_alfa?: number
  total_menit_terlambat: number
  rata_menit_terlambat_hadir: number
  persentase_kehadiran: number
}

type PetugasOption = { id: number; label: string }
type JadwalOption = { id: number; label: string; mapel: string; kelas: string; hari: string }

export default function PresensiGuruPage() {
  const [activeTab, setActiveTab] = useState("rekap")

  // States for Rekap
  const [rekapRows, setRekapRows] = useState<RekapPetugasRow[]>([])
  const [rekapLoading, setRekapLoading] = useState(false)
  const [filterRekap, setFilterRekap] = useState({
    tanggal_mulai: "",
    tanggal_selesai: "",
    q: "",
  })

  // States for Riwayat Sesi
  const [sesiRows, setSesiRows] = useState<SesiAbsensiApiItem[]>([])
  const [sesiLoading, setSesiLoading] = useState(false)
  const [selectedUnitSesi, setSelectedUnitSesi] = useState("ALL")
  const [selectedKelasSesi, setSelectedKelasSesi] = useState("ALL")
  const [kelasSesiOptions, setKelasSesiOptions] = useState<KelasItem[]>([])
  const [filterSesi, setFilterSesi] = useState({
    tanggal: "",
    status_sesi: "SELESAI",
    q: "",
    id_petugas_hadir: "ALL",
  })

  // Options
  const [petugasOptions, setPetugasOptions] = useState<PetugasOption[]>([])
  const [jadwalOptions, setJadwalOptions] = useState<JadwalOption[]>([])
  const [unitOptions, setUnitOptions] = useState<DataUnitApiItem[]>([])

  // States for Edit Absensi Guru (Admin)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedSesi, setSelectedSesi] = useState<SesiAbsensiApiItem | null>(null)
  const [editData, setEditData] = useState({
    id_petugas: 0,
    status_kehadiran: "HADIR" as "HADIR" | "IZIN" | "SAKIT",
    menit_terlambat: 0,
    keterangan: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // States for Buka Sesi Manual
  const [isBukaSesiOpen, setIsBukaSesiOpen] = useState(false)
  const [bukaSesiData, setBukaSesiData] = useState({
    id_jadwal: 0,
    tanggal: "",
    id_petugas_hadir: 0,
    status_kehadiran: "HADIR" as "HADIR" | "IZIN" | "SAKIT",
    menit_terlambat: 0,
    keterangan: "",
  })

  useEffect(() => {
    loadOptions()
    loadRekap()
    loadRiwayatSesi()
  }, [])

  const loadOptions = async () => {
    try {
      const [petugasRes, jadwalRes, unitRes, kelasRes] = await Promise.all([
        dataPetugasService.getAll({ per_page: 300, status: "AKTIF" }),
        dataJadwalPembelajaranService.getAll({ per_page: 300, status: "AKTIF" }),
        dataUnitService.getAll({ per_page: 100, status: "AKTIF" }),
        kelasService.getAll({ per_page: "500", status: "AKTIF" })
      ])
      
      const mappedPetugas = (petugasRes.data || []).map((item: any) => ({
        id: item.id_petugas || item.id,
        label: `${item.nama_lengkap} (ID: ${item.id_petugas || item.id})`
      })).filter((i: any) => i.id)
      setPetugasOptions(mappedPetugas)

      const mappedJadwal = (jadwalRes.data || []).map((item: any) => {
        const id = item.id_jadwal || item.id
        const mapel = item.kelas_mapel?.mata_pelajaran?.nama_mapel || item.kelasMapel?.mataPelajaran?.nama_mapel || "-"
        const kelas = item.kelas_mapel?.kelas?.nama_kelas || item.kelasMapel?.kelas?.nama_kelas || "-"
        const hari = item.hari || "-"
        const guru = item.kelas_mapel?.petugas?.nama_lengkap || item.kelasMapel?.petugas?.nama_lengkap || "Tanpa Guru"
        return {
          id,
          label: `${mapel} (${kelas}) - ${hari} - ${guru}`,
          mapel,
          kelas,
          hari,
        }
      }).filter((i: any) => i.id)
      setJadwalOptions(mappedJadwal)
      
      setUnitOptions(unitRes.data || [])
      setKelasSesiOptions(kelasRes || [])
    } catch (error) {
      console.error("Gagal memuat options", error)
    }
  }

  const loadKelasSesiByUnit = async (kode_unit?: string) => {
    try {
      const kelasRes = await kelasService.getAll({ per_page: "500", status: "AKTIF", kode_unit })
      setKelasSesiOptions(kelasRes || [])
    } catch (e) {
      console.error("Gagal memuat kelas untuk riwayat sesi", e)
    }
  }

  const loadRekap = async () => {
    setRekapLoading(true)
    try {
      const response = await sesiAbsensiService.rekapPetugas({
        ...filterRekap,
        per_page: 100
      })
      setRekapRows(response?.data || [])
    } catch (error: any) {
      toast({
        title: "Gagal memuat rekap",
        description: error?.response?.data?.message || "Terjadi kesalahan.",
        variant: "destructive",
      })
    } finally {
      setRekapLoading(false)
    }
  }

  const loadRiwayatSesi = async () => {
    setSesiLoading(true)
    try {
      const params: any = { ...filterSesi, per_page: 100 }
      if (params.id_petugas_hadir === "ALL") delete params.id_petugas_hadir
      const response = await sesiAbsensiService.getAll(params)
      setSesiRows(response as SesiAbsensiApiItem[])
    } catch (error: any) {
      toast({
        title: "Gagal memuat riwayat",
        description: error?.response?.data?.message || "Terjadi kesalahan.",
        variant: "destructive",
      })
    } finally {
      setSesiLoading(false)
    }
  }

  const handleExport = (format: 'pdf' | 'excel') => {
    const url = sesiAbsensiService.getExportPetugasUrl(format, filterRekap)
    window.open(url, '_blank')
  }

  const openEditModal = async (sesi: SesiAbsensiApiItem) => {
    setSelectedSesi(sesi)
    
    // Attempt to pre-fill from session data (if the backend includes absensi_pengajar we could use it)
    // For now we pre-fill based on id_petugas_hadir, assuming they were Hadir.
    setEditData({
      id_petugas: sesi.id_petugas_hadir || sesi.id_petugas_pengganti || 0,
      status_kehadiran: "HADIR",
      menit_terlambat: 0,
      keterangan: sesi.keterangan || "",
    })
    
    // We can try fetching detail to get exact absensi_pengajar
    try {
      const detail = await sesiAbsensiService.getById(sesi.id_sesi || sesi.id || 0)
      if (detail && detail.absensi_pengajar && detail.absensi_pengajar.length > 0) {
        const abs = detail.absensi_pengajar[0] as any
        setEditData({
          id_petugas: abs.id_petugas,
          status_kehadiran: abs.status_kehadiran?.toUpperCase() as any || "HADIR",
          menit_terlambat: abs.menit_terlambat || 0,
          keterangan: abs.keterangan || "",
        })
      }
    } catch (e) {
      // ignore silently
    }
    
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedSesi?.id_sesi) return
    if (!editData.id_petugas) {
      toast({ title: "Validasi Gagal", description: "Pilih petugas terlebih dahulu.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      await sesiAbsensiService.adminUpsertAbsensiPengajar(selectedSesi.id_sesi, editData)
      toast({ title: "Berhasil", description: "Data absensi guru berhasil diperbarui." })
      setIsEditModalOpen(false)
      loadRekap()
    } catch (error: any) {
      toast({
        title: "Gagal menyimpan",
        description: error?.response?.data?.message || "Terjadi kesalahan.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openBukaSesiModal = () => {
    setBukaSesiData({
      id_jadwal: 0,
      tanggal: new Date().toISOString().slice(0, 10),
      id_petugas_hadir: 0,
      status_kehadiran: "HADIR",
      menit_terlambat: 0,
      keterangan: "",
    })
    setIsBukaSesiOpen(true)
  }

  const handleBukaSesi = async () => {
    if (!bukaSesiData.id_jadwal || !bukaSesiData.tanggal || !bukaSesiData.id_petugas_hadir) {
      toast({ title: "Validasi Gagal", description: "Jadwal, Tanggal, dan Petugas Hadir wajib diisi.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      await sesiAbsensiService.adminBukaSesi({
        ...bukaSesiData,
        catat_absensi_pengajar: true
      })
      toast({ title: "Berhasil", description: "Sesi absensi berhasil dibuka dan dicatat." })
      setIsBukaSesiOpen(false)
      loadRiwayatSesi()
      loadRekap()
    } catch (error: any) {
      toast({
        title: "Gagal Buka Sesi",
        description: error?.response?.data?.message || "Terjadi kesalahan.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const s = status?.toUpperCase()
    if (s === "HADIR") return <Badge className="bg-primary/10 text-primary border-0">Hadir</Badge>
    if (s === "SAKIT") return <Badge className="bg-chart-3/20 text-chart-4 border-0">Sakit</Badge>
    if (s === "IZIN") return <Badge className="bg-accent/20 text-accent border-0">Izin</Badge>
    if (s === "ALFA") return <Badge className="bg-destructive/10 text-destructive border-0">Alfa</Badge>
    if (s === "SELESAI") return <Badge className="bg-emerald-500/15 text-emerald-700 border-0">Selesai</Badge>
    if (s === "BATAL") return <Badge className="bg-destructive/10 text-destructive border-0">Batal</Badge>
    return <Badge variant="outline">{status}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kelola Presensi Guru</h1>
          <p className="text-muted-foreground">Admin panel untuk melihat rekapitulasi dan mengelola absensi pengajar.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="rekap" className="data-[state=active]:bg-card">
            <CheckCircle className="w-4 h-4 mr-2" />
            Rekap Guru
          </TabsTrigger>
          <TabsTrigger value="riwayat" className="data-[state=active]:bg-card">
            <History className="w-4 h-4 mr-2" />
            Riwayat Sesi (Edit)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rekap" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3 border-b">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <CardTitle className="text-lg">Rekap Kehadiran Guru</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="date"
                    value={filterRekap.tanggal_mulai}
                    onChange={(e) => setFilterRekap({ ...filterRekap, tanggal_mulai: e.target.value })}
                    className="w-36"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="date"
                    value={filterRekap.tanggal_selesai}
                    onChange={(e) => setFilterRekap({ ...filterRekap, tanggal_selesai: e.target.value })}
                    className="w-36"
                  />
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Cari Nama..."
                      className="pl-9 w-48"
                      value={filterRekap.q}
                      onChange={(e) => setFilterRekap({ ...filterRekap, q: e.target.value })}
                    />
                  </div>
                  <Button variant="secondary" onClick={loadRekap}>Filter</Button>
                  
                  <div className="flex items-center gap-2 border-l pl-2 ml-2">
                    <Button variant="outline" className="gap-2" onClick={() => handleExport('excel')}>
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => handleExport('pdf')}>
                      <FilePdf className="w-4 h-4 text-destructive" /> PDF
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Nama Petugas</TableHead>
                      <TableHead>Peran</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Hadir</TableHead>
                      <TableHead className="text-center">Izin</TableHead>
                      <TableHead className="text-center">Sakit</TableHead>
                      <TableHead className="text-center">Alfa</TableHead>
                      <TableHead className="text-center">Total Telat (m)</TableHead>
                      <TableHead className="text-center">Rata Telat</TableHead>
                      <TableHead className="text-right">% Kehadiran</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rekapLoading ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Memuat data rekap...</TableCell>
                      </TableRow>
                    ) : rekapRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Tidak ada data rekap ditemukan.</TableCell>
                      </TableRow>
                    ) : (
                      rekapRows.map((row) => (
                        <TableRow key={row.id_petugas} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{row.nama_lengkap}</TableCell>
                          <TableCell>{row.peran_akun}</TableCell>
                          <TableCell className="text-center">{row.total_pertemuan}</TableCell>
                          <TableCell className="text-center text-emerald-600 font-medium">{row.jumlah_hadir}</TableCell>
                          <TableCell className="text-center">{row.jumlah_izin}</TableCell>
                          <TableCell className="text-center">{row.jumlah_sakit}</TableCell>
                          <TableCell className="text-center text-destructive font-medium">{row.jumlah_alfa || 0}</TableCell>
                          <TableCell className="text-center text-amber-600">{row.total_menit_terlambat}</TableCell>
                          <TableCell className="text-center">{row.rata_menit_terlambat_hadir}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className={row.persentase_kehadiran >= 90 ? 'text-emerald-600 border-emerald-200' : 'text-destructive border-destructive/30'}>
                              {row.persentase_kehadiran}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="riwayat" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3 border-b">
              <div className="flex flex-col gap-4">
                <div>
                  <CardTitle className="text-lg">Riwayat Sesi Absensi</CardTitle>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select 
                    value={selectedUnitSesi} 
                    onValueChange={(val) => {
                      setSelectedUnitSesi(val)
                      setSelectedKelasSesi("ALL")
                      loadKelasSesiByUnit(val === "ALL" ? undefined : val)
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Unit</SelectItem>
                      {unitOptions.map((u) => (
                        <SelectItem key={u.kode_unit} value={u.kode_unit!}>{u.nama_unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select 
                    value={selectedKelasSesi} 
                    onValueChange={(val) => setSelectedKelasSesi(val)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Kelas" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="ALL">Semua Kelas</SelectItem>
                      {kelasSesiOptions.map((k) => (
                        <SelectItem key={k.kode_kelas} value={k.kode_kelas}>{k.nama_kelas} ({k.kode_kelas})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="date"
                    value={filterSesi.tanggal}
                    onChange={(e) => setFilterSesi({ ...filterSesi, tanggal: e.target.value })}
                    className="w-40"
                  />
                  
                  <Select value={filterSesi.status_sesi} onValueChange={(val) => setFilterSesi({ ...filterSesi, status_sesi: val })}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Status Sesi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Status</SelectItem>
                      <SelectItem value="SELESAI">Selesai</SelectItem>
                      <SelectItem value="BATAL">Batal</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Cari Mapel..."
                      className="pl-9 w-40"
                      value={filterSesi.q}
                      onChange={(e) => setFilterSesi({ ...filterSesi, q: e.target.value })}
                    />
                  </div>
                  
                  <Select value={filterSesi.id_petugas_hadir} onValueChange={(val) => setFilterSesi({ ...filterSesi, id_petugas_hadir: val })}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Petugas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Petugas</SelectItem>
                      {petugasOptions.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.label.split(' (')[0]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button variant="secondary" onClick={loadRiwayatSesi}>Filter</Button>
                  
                  <div className="border-l pl-2 ml-2">
                    <Button onClick={openBukaSesiModal} className="bg-primary text-primary-foreground gap-2">
                      <Plus className="w-4 h-4" /> Buka Sesi Manual
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>ID Sesi</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Hari</TableHead>
                      <TableHead>Mapel</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Petugas Hadir</TableHead>
                      <TableHead>Status Sesi</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sesiLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Memuat riwayat sesi...</TableCell>
                      </TableRow>
                    ) : sesiRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Tidak ada sesi ditemukan.</TableCell>
                      </TableRow>
                    ) : (
                      sesiRows.map((sesi) => (
                        <TableRow key={sesi.id_sesi || sesi.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">#{sesi.id_sesi || sesi.id}</TableCell>
                          <TableCell>{sesi.tanggal}</TableCell>
                          <TableCell>{sesi.hari || (sesi.jadwal as any)?.hari || "-"}</TableCell>
                          <TableCell>{sesi.mapel || sesi.mata_pelajaran || (sesi.jadwal as any)?.kelas_mapel?.mata_pelajaran?.nama_mapel || (sesi.jadwal as any)?.kelasMapel?.mataPelajaran?.nama_mapel || "-"}</TableCell>
                          <TableCell>{sesi.kelas || sesi.kode_kelas || (sesi.jadwal as any)?.kelas_mapel?.kelas?.nama_kelas || (sesi.jadwal as any)?.kelasMapel?.kelas?.nama_kelas || "-"}</TableCell>
                          <TableCell>{
                            petugasOptions.find(p => p.id === Number(sesi.id_petugas_hadir))?.label?.split(' (')[0] 
                            || `ID: ${sesi.id_petugas_hadir || '-'}`
                          }</TableCell>
                          <TableCell>{getStatusBadge(sesi.status_sesi || "")}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-primary hover:text-primary hover:bg-primary/10 bg-transparent border-primary/20"
                              onClick={() => openEditModal(sesi)}
                            >
                              Edit Absensi Guru
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Modal Absensi Guru */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Absensi Guru</DialogTitle>
            <DialogDescription>
              Ubah data kehadiran pengajar untuk Sesi #{selectedSesi?.id_sesi} - {selectedSesi?.mapel} ({selectedSesi?.kelas})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Pilih Petugas (Pengajar)</Label>
              <Select value={String(editData.id_petugas)} onValueChange={(v) => setEditData({...editData, id_petugas: Number(v)})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih petugas" />
                </SelectTrigger>
                <SelectContent>
                  {petugasOptions.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Status Kehadiran</Label>
              <RadioGroup value={editData.status_kehadiran} onValueChange={(v) => setEditData({...editData, status_kehadiran: v as any})} className="grid grid-cols-3 gap-3">
                <Label htmlFor="edit-hadir" className={`flex flex-col items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${editData.status_kehadiran === "HADIR" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50 text-foreground"}`}>
                  <RadioGroupItem value="HADIR" id="edit-hadir" className="sr-only" />
                  <span className="font-medium">Hadir</span>
                </Label>
                <Label htmlFor="edit-sakit" className={`flex flex-col items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${editData.status_kehadiran === "SAKIT" ? "border-chart-3 bg-chart-3/10 text-chart-4" : "border-border hover:border-chart-3/50 text-foreground"}`}>
                  <RadioGroupItem value="SAKIT" id="edit-sakit" className="sr-only" />
                  <span className="font-medium">Sakit</span>
                </Label>
                <Label htmlFor="edit-izin" className={`flex flex-col items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${editData.status_kehadiran === "IZIN" ? "border-accent bg-accent/10 text-accent" : "border-border hover:border-accent/50 text-foreground"}`}>
                  <RadioGroupItem value="IZIN" id="edit-izin" className="sr-only" />
                  <span className="font-medium">Izin</span>
                </Label>
              </RadioGroup>
            </div>

            {editData.status_kehadiran === "HADIR" && (
              <div className="space-y-2">
                <Label>Menit Terlambat</Label>
                <Input 
                  type="number" 
                  min={0} 
                  value={editData.menit_terlambat} 
                  onChange={(e) => setEditData({...editData, menit_terlambat: Number(e.target.value)})} 
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Input 
                value={editData.keterangan} 
                onChange={(e) => setEditData({...editData, keterangan: e.target.value})} 
                placeholder="Alasan izin/sakit atau catatan lain"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="bg-transparent" onClick={() => setIsEditModalOpen(false)}>
              Batal
            </Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleSaveEdit} disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Buka Sesi Manual */}
      <Dialog open={isBukaSesiOpen} onOpenChange={setIsBukaSesiOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Buka Sesi Presensi Manual</DialogTitle>
            <DialogDescription>
              Fasilitas admin untuk mencatat sesi absensi yang terlewat oleh guru.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Pilih Jadwal Pembelajaran</Label>
              <Select value={String(bukaSesiData.id_jadwal)} onValueChange={(v) => setBukaSesiData({...bukaSesiData, id_jadwal: Number(v)})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jadwal" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {jadwalOptions.map(j => (
                    <SelectItem key={j.id} value={String(j.id)}>{j.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Sesi</Label>
                <Input 
                  type="date" 
                  value={bukaSesiData.tanggal} 
                  onChange={(e) => setBukaSesiData({...bukaSesiData, tanggal: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Petugas Hadir (Pengajar)</Label>
                <Select value={String(bukaSesiData.id_petugas_hadir)} onValueChange={(v) => setBukaSesiData({...bukaSesiData, id_petugas_hadir: Number(v)})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih petugas" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {petugasOptions.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Status Kehadiran Guru</Label>
              <RadioGroup value={bukaSesiData.status_kehadiran} onValueChange={(v) => setBukaSesiData({...bukaSesiData, status_kehadiran: v as any})} className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="HADIR" id="bs-hadir" />
                  <Label htmlFor="bs-hadir" className="font-normal cursor-pointer">Hadir</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="SAKIT" id="bs-sakit" />
                  <Label htmlFor="bs-sakit" className="font-normal cursor-pointer text-chart-4">Sakit</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="IZIN" id="bs-izin" />
                  <Label htmlFor="bs-izin" className="font-normal cursor-pointer text-accent">Izin</Label>
                </div>
              </RadioGroup>
            </div>

            {bukaSesiData.status_kehadiran === "HADIR" && (
              <div className="space-y-2">
                <Label>Menit Terlambat</Label>
                <Input 
                  type="number" 
                  min={0} 
                  value={bukaSesiData.menit_terlambat} 
                  onChange={(e) => setBukaSesiData({...bukaSesiData, menit_terlambat: Number(e.target.value)})} 
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Input 
                value={bukaSesiData.keterangan} 
                onChange={(e) => setBukaSesiData({...bukaSesiData, keterangan: e.target.value})} 
                placeholder="Catatan tambahan"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="bg-transparent" onClick={() => setIsBukaSesiOpen(false)}>
              Batal
            </Button>
            <Button className="bg-primary text-primary-foreground gap-2" onClick={handleBukaSesi} disabled={isSubmitting}>
              {isSubmitting ? "Memproses..." : <><Check className="w-4 h-4"/> Buat Sesi Baru</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
