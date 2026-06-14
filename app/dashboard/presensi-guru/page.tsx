"use client"

import { useState, useEffect, useRef, useMemo } from "react"
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
import { Search, FileSpreadsheet, FileIcon as FilePdf, History, CheckCircle, Clock, Check, Plus, RefreshCw } from "lucide-react"

import { sesiAbsensiService, SesiAbsensiApiItem } from "@/lib/services/sesiabsensi.service"
import { dataJadwalPembelajaranService } from "@/lib/services/jadwal-pembelajaran.service"
import { dataPetugasService } from "@/lib/services/petugas.service"
import { dataUnitService, DataUnitApiItem } from "@/lib/services/unit.service"
import { kelasService, KelasItem } from "@/lib/services/kelas.service"
import { tahunAjaranService, TahunAjaranApiItem } from "@/lib/services/tahun-ajaran.service"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"
import { useUnit } from "@/contexts/unit-context"

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
  const { selectedKodeTahun } = useTahunAjaran()
  const { selectedKodeUnit } = useUnit()
  
  // Guard: cegah double-invoke & cascade re-fetch
  const initCalledRef = useRef(false)
  const [isInitDone, setIsInitDone] = useState(false)

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
  const [selectedKelasSesi, setSelectedKelasSesi] = useState("ALL")
  const [filterSesi, setFilterSesi] = useState({
    tanggal: "",
    status_sesi: "SELESAI",
    q: "",
    id_petugas_hadir: "ALL",
  })

  // States for Belum Diabsen
  const [belumDiabsenRows, setBelumDiabsenRows] = useState<any[]>([])
  const [belumDiabsenLoading, setBelumDiabsenLoading] = useState(false)
  const [selectedKelasBelum, setSelectedKelasBelum] = useState("ALL")
  const [filterBelumDiabsen, setFilterBelumDiabsen] = useState({
    tanggal: new Date().toISOString().slice(0, 10)
  })

  // Options
  const [petugasOptions, setPetugasOptions] = useState<PetugasOption[]>([])
  const [jadwalOptions, setJadwalOptions] = useState<JadwalOption[]>([])

  const [allKelas, setAllKelas] = useState<KelasItem[]>([])
  
  const kelasOptions = useMemo(() => {
    return allKelas.filter(k => 
      (!selectedKodeUnit || k.kode_unit === selectedKodeUnit) &&
      (!selectedKodeTahun || k.tahun_ajaran === selectedKodeTahun)
    )
  }, [allKelas, selectedKodeUnit, selectedKodeTahun])

  // States for Edit Absensi Guru (Admin)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedSesi, setSelectedSesi] = useState<SesiAbsensiApiItem | null>(null)
  const [editData, setEditData] = useState({
    id_petugas: 0,
    status_kehadiran: "HADIR" as "HADIR" | "IZIN" | "SAKIT" | "ALFA",
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
    status_kehadiran: "HADIR" as "HADIR" | "IZIN" | "SAKIT" | "ALFA",
    menit_terlambat: 0,
    keterangan: "",
  })

  // States for Log Aktivitas
  const [logs, setLogs] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [logLoading, setLogLoading] = useState(false)
  const [activeLogSubTab, setActiveLogSubTab] = useState("aktivitas")

  const loadLogs = async () => {
    setLogLoading(true)
    try {
      const params: any = {}
      if (selectedKodeTahun && selectedKodeTahun !== "ALL") {
        params.tahun_ajaran = selectedKodeTahun
      }
      if (selectedKodeUnit && selectedKodeUnit !== "ALL") {
        params.kode_unit = selectedKodeUnit
      }
      const res = await sesiAbsensiService.adminGetLogAktivitas(params)
      setLogs(res.log_aktivitas || [])
      setAuditLogs(res.log_audit || [])
    } catch (e) {
      console.error("Gagal memuat log aktivitas", e)
      toast({
        title: "Gagal memuat log",
        description: "Terjadi kesalahan saat memuat log aktivitas absensi.",
        variant: "destructive"
      })
    } finally {
      setLogLoading(false)
    }
  }

  useEffect(() => {
    if (initCalledRef.current) return
    initCalledRef.current = true
    void loadOptions()
  }, [])

  // Load log aktivitas saat tab log dibuka pertama kali, atau saat tahun_ajaran berubah
  useEffect(() => {
    if (activeTab === "log_aktivitas" && isInitDone) {
      void loadLogs()
    }
  }, [activeTab, isInitDone, selectedKodeTahun, selectedKodeUnit])

  // Tab: Rekap (Hanya dipanggil jika init selesai DAN tab aktif)
  useEffect(() => {
    if (!isInitDone || activeTab !== "rekap" || !selectedKodeTahun) return
    void loadRekap()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitDone, activeTab, selectedKodeTahun, selectedKodeUnit])

  // Tab: Riwayat Sesi (Hanya dipanggil jika init selesai DAN tab aktif)
  useEffect(() => {
    if (!isInitDone || activeTab !== "riwayat" || !selectedKodeTahun) return
    
    // Auto-clear kelas filter
    setSelectedKelasSesi("ALL")
    
    void loadRiwayatSesi()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitDone, activeTab, selectedKodeUnit, selectedKodeTahun])

  // Re-fetch saat tab "belum_diabsen" aktif atau saat filter dropdown/tahun berubah
  useEffect(() => {
    if (!isInitDone || activeTab !== "belum_diabsen" || !selectedKodeTahun) return

    // Auto-clear kelas filter
    setSelectedKelasBelum("ALL")

    void loadBelumDiabsen()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitDone, activeTab, selectedKodeUnit, selectedKodeTahun])

  const loadOptions = async () => {
    try {
      const initData = await sesiAbsensiService.adminPresensiGuruInit()
      
      const mappedPetugas = (initData.petugas || []).map((item: any) => ({
        id: item.id_petugas || item.id,
        label: `${item.nama_lengkap} (ID: ${item.id_petugas || item.id})`
      })).filter((i: any) => i.id)
      setPetugasOptions(mappedPetugas)

      const mappedJadwal = (initData.jadwal || []).map((item: any) => {
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
      
      setAllKelas(initData.kelas || [])

      setIsInitDone(true)
    } catch (error) {
      console.error("Gagal memuat options", error)
      setIsInitDone(true)
    }
  }

  const loadRekap = async () => {
    setRekapLoading(true)
    try {
      const params: any = { ...filterRekap, per_page: 100 }
      if (selectedKodeTahun) {
        params.tahun_ajaran = selectedKodeTahun
      }
      if (selectedKodeUnit) {
        params.kode_unit = selectedKodeUnit
      }
      const response = await sesiAbsensiService.rekapPetugas(params)
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
      if (selectedKelasSesi !== "ALL") params.kode_kelas = selectedKelasSesi
      if (selectedKodeUnit) params.kode_unit = selectedKodeUnit
      if (selectedKodeTahun) params.tahun_ajaran = selectedKodeTahun
      
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

  const loadBelumDiabsen = async () => {
    setBelumDiabsenLoading(true)
    try {
      const params: any = {
        tanggal: filterBelumDiabsen.tanggal
      }
      if (selectedKodeTahun) params.tahun_ajaran = selectedKodeTahun
      if (selectedKodeUnit) params.kode_unit = selectedKodeUnit
      if (selectedKelasBelum !== "ALL") params.kode_kelas = selectedKelasBelum

      const response = await sesiAbsensiService.adminGetBelumDiabsen(params)
      setBelumDiabsenRows(response || [])
    } catch (error: any) {
      toast({
        title: "Gagal memuat jadwal belum diabsen",
        description: error?.response?.data?.message || "Terjadi kesalahan.",
        variant: "destructive",
      })
    } finally {
      setBelumDiabsenLoading(false)
    }
  }

  const handleExport = (format: 'pdf' | 'excel') => {
    const params: any = { ...filterRekap }
    if (selectedKodeTahun) {
      params.tahun_ajaran = selectedKodeTahun
    }
    if (selectedKodeUnit) {
      params.kode_unit = selectedKodeUnit
    }
    const url = sesiAbsensiService.getExportPetugasUrl(format, params)
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
      loadRiwayatSesi()
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

  const openBukaSesiManualFromJadwal = (item: any) => {
    setBukaSesiData({
      id_jadwal: item.id_jadwal,
      tanggal: item.tanggal,
      id_petugas_hadir: item.id_petugas_hadir || 0,
      status_kehadiran: "ALFA", // Default to ALFA for missed sessions
      menit_terlambat: 0,
      keterangan: "Sesi terlewat, ditambahkan otomatis",
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
      loadBelumDiabsen()
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
          <TabsTrigger value="belum_diabsen" className="data-[state=active]:bg-card">
            <Clock className="w-4 h-4 mr-2" />
            Belum Diabsen
          </TabsTrigger>
          <TabsTrigger value="log_aktivitas" className="data-[state=active]:bg-card">
            <Clock className="w-4 h-4 mr-2 text-indigo-500" />
            Log Aktivitas
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
                  <Button variant="secondary" onClick={loadRekap}>Terapkan</Button>
                  
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
                    value={selectedKelasSesi} 
                    onValueChange={(val) => setSelectedKelasSesi(val)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Kelas" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="ALL">Semua Kelas</SelectItem>
                      {kelasOptions.map((k) => (
                        <SelectItem key={k.kode_kelas} value={k.kode_kelas}>{k.nama_kelas} {k.status !== 'AKTIF' && '(Non-aktif)'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="date"
                    value={filterSesi.tanggal}
                    onChange={(e) => setFilterSesi({ ...filterSesi, tanggal: e.target.value })}
                    className="w-40"
                  />
                  
                  
                  
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
                  
                  <Button variant="secondary" onClick={() => loadRiwayatSesi()}>Terapkan</Button>
                  
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
                      <TableHead>Status Guru</TableHead>
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
                          <TableCell>
                            {getStatusBadge(
                              ((sesi.absensi_pengajar as any[])?.[0]?.status_kehadiran) || 
                              (((sesi as any).absensiPengajar as any[])?.[0]?.status_kehadiran) || 
                              "-"
                            )}
                          </TableCell>
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

        {/* Tab Belum Diabsen */}
        <TabsContent value="belum_diabsen" className="space-y-4">
          <Card className="border-border/50 border-destructive/20 shadow-sm shadow-destructive/10">
            <CardHeader className="pb-3 border-b">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg text-destructive flex items-center gap-2">
                    <Clock className="w-5 h-5" /> 
                    Jadwal Belum Diabsen
                  </CardTitle>
                  <CardDescription>
                    Daftar kelas yang belum dibuka sesinya pada tanggal terpilih
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select 
                    value={selectedKelasBelum} 
                    onValueChange={(val) => setSelectedKelasBelum(val)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Kelas" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="ALL">Semua Kelas</SelectItem>
                      {kelasOptions.map((k) => (
                        <SelectItem key={k.kode_kelas} value={k.kode_kelas}>{k.nama_kelas} {k.status !== 'AKTIF' && '(Non-aktif)'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="date"
                    value={filterBelumDiabsen.tanggal}
                    onChange={(e) => {
                      setFilterBelumDiabsen({ tanggal: e.target.value })
                    }}
                    className="w-40"
                  />
                  <Button variant="secondary" onClick={() => loadBelumDiabsen()} disabled={belumDiabsenLoading}>
                    Terapkan
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-destructive/5 hover:bg-destructive/5">
                    <TableRow>
                      <TableHead>Hari</TableHead>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Mata Pelajaran</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Petugas (Default)</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {belumDiabsenLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Memuat jadwal...</TableCell>
                      </TableRow>
                    ) : belumDiabsenRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Semua jadwal pada tanggal ini sudah diabsen.</TableCell>
                      </TableRow>
                    ) : (
                      belumDiabsenRows.map((item, idx) => (
                        <TableRow key={item.id_jadwal || idx} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{item.hari}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs font-normal">
                              {item.jam_mulai} - {item.jam_selesai}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{item.mapel}</TableCell>
                          <TableCell>{item.kelas}</TableCell>
                          <TableCell>{item.petugas_hadir?.nama_lengkap || "Tanpa Guru"}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => openBukaSesiManualFromJadwal(item)}
                            >
                              Tindak Lanjuti
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

        {/* Tab Log Aktivitas */}
        <TabsContent value="log_aktivitas" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3 border-b">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 text-indigo-600">
                    <History className="w-5 h-5" /> 
                    Audit Trail & Log Aktivitas Absensi
                  </CardTitle>
                  <CardDescription>
                    Pencatatan riwayat pembukaan sesi dan perubahan status kehadiran absensi ustadz/santri secara realtime.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={loadLogs} disabled={logLoading}>
                    <RefreshCw className={`w-4 h-4 ${logLoading ? "animate-spin" : ""}`} /> Segarkan Log
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs value={activeLogSubTab} onValueChange={setActiveLogSubTab} className="space-y-4">
                <TabsList className="bg-muted/50 p-1 w-fit">
                  <TabsTrigger value="aktivitas" className="text-xs data-[state=active]:bg-card">
                    Aktivitas Utama Admin
                  </TabsTrigger>
                  <TabsTrigger value="audit" className="text-xs data-[state=active]:bg-card">
                    Detail Perubahan Sel Absensi
                  </TabsTrigger>
                </TabsList>

                {/* Sub Tab: Aktivitas Utama */}
                <TabsContent value="aktivitas" className="space-y-4">
                  <div className="overflow-x-auto rounded-md border border-border/50">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="w-48">Waktu Kejadian</TableHead>
                          <TableHead className="w-36">Aksi</TableHead>
                          <TableHead className="w-36">Modul</TableHead>
                          <TableHead className="w-48">Operator (Admin)</TableHead>
                          <TableHead>Deskripsi Aktivitas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logLoading ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              Memuat log aktivitas...
                            </TableCell>
                          </TableRow>
                        ) : logs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              Belum ada catatan aktivitas admin di modul absensi.
                            </TableCell>
                          </TableRow>
                        ) : (
                          logs.map((log, idx) => (
                            <TableRow key={log.id_log_aktivitas || idx} className="hover:bg-muted/30">
                              <TableCell className="text-xs text-muted-foreground font-mono">
                                {new Date(log.created_at).toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell>
                                <Badge className={
                                  log.jenis_aksi === "CREATE" 
                                    ? "bg-emerald-500/10 text-emerald-700 border-0 hover:bg-emerald-500/15" 
                                    : log.jenis_aksi === "UPDATE"
                                    ? "bg-indigo-500/10 text-indigo-700 border-0 hover:bg-indigo-500/15"
                                    : "bg-destructive/10 text-destructive border-0 hover:bg-destructive/15"
                                }>
                                  {log.jenis_aksi}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-semibold text-xs border-slate-200">
                                  {log.modul}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium text-xs">
                                {log.nama_admin || `ID Petugas: ${log.id_petugas}`}
                              </TableCell>
                              <TableCell className="text-xs font-medium max-w-md break-words">
                                {log.deskripsi}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* Sub Tab: Detail Perubahan */}
                <TabsContent value="audit" className="space-y-4">
                  <div className="overflow-x-auto rounded-md border border-border/50">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="w-44">Waktu Perubahan</TableHead>
                          <TableHead className="w-64">Jadwal (Sesi)</TableHead>
                          <TableHead className="w-48">Nama (Subjek)</TableHead>
                          <TableHead className="w-32">Tabel Absensi</TableHead>
                          <TableHead className="w-28">Kolom</TableHead>
                          <TableHead className="text-center w-24">Nilai Lama</TableHead>
                          <TableHead className="text-center w-24">Nilai Baru</TableHead>
                          <TableHead>Pengubah</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logLoading ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                              Memuat detail audit...
                            </TableCell>
                          </TableRow>
                        ) : auditLogs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                              Belum ada catatan perubahan sel status kehadiran yang dilakukan admin.
                            </TableCell>
                          </TableRow>
                        ) : (
                          auditLogs.map((audit, idx) => (
                            <TableRow key={audit.id_log || idx} className="hover:bg-muted/30">
                              <TableCell className="text-xs text-muted-foreground font-mono">
                                {new Date(audit.diubah_pada).toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell className="text-xs font-semibold text-indigo-900 max-w-[240px] truncate">
                                {audit.info_jadwal || "-"}
                              </TableCell>
                              <TableCell className="text-xs font-medium text-slate-700 max-w-[180px] truncate">
                                {audit.nama_subjek || "-"}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="font-normal text-xs uppercase bg-slate-100 border-0">
                                  {audit.tabel_terkait?.replace("absensi_", "")}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs font-mono text-muted-foreground">
                                {audit.field_diubah}
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="line-through text-xs text-destructive bg-destructive/5 px-2 py-0.5 rounded font-bold">
                                  {audit.nilai_lama}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="text-xs text-emerald-600 bg-emerald-500/5 px-2 py-0.5 rounded font-bold">
                                  {audit.nilai_baru}
                                </span>
                              </TableCell>
                              <TableCell className="font-medium text-xs">
                                {audit.nama_admin || `ID Petugas: ${audit.diubah_oleh}`}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
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
              <RadioGroup value={editData.status_kehadiran} onValueChange={(v) => setEditData({...editData, status_kehadiran: v as any})} className="grid grid-cols-4 gap-3">
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
                <Label htmlFor="edit-alfa" className={`flex flex-col items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${editData.status_kehadiran === "ALFA" ? "border-destructive bg-destructive/10 text-destructive" : "border-border hover:border-destructive/50 text-foreground"}`}>
                  <RadioGroupItem value="ALFA" id="edit-alfa" className="sr-only" />
                  <span className="font-medium">Alfa</span>
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
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="ALFA" id="bs-alfa" />
                  <Label htmlFor="bs-alfa" className="font-normal cursor-pointer text-destructive">Alfa</Label>
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
