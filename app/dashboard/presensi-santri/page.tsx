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
import { Search, Download, Calendar, History, FileSpreadsheet, FileIcon as FilePdf, Eye, Check, CheckCircle, Clock, RefreshCw } from "lucide-react"
import { sesiAbsensiService, SesiAbsensiApiItem } from "@/lib/services/sesiabsensi.service"
import { dataUnitService, DataUnitApiItem } from "@/lib/services/unit.service"
import { kelasService, KelasItem } from "@/lib/services/kelas.service"
import { tahunAjaranService, TahunAjaranApiItem } from "@/lib/services/tahun-ajaran.service"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"

interface RekapSantriRow {
  nomor_induk: string
  nama_lengkap_santri: string
  kode_kelas: string
  nama_kelas: string
  total_pertemuan: number
  jumlah_hadir: number
  jumlah_izin: number
  jumlah_sakit: number
  jumlah_alfa: number
  persentase_kehadiran: number
}

type SantriStatus = "hadir" | "izin" | "sakit" | "alfa"

export default function PresensiSantriPage() {
  const [activeTab, setActiveTab] = useState("rekap")
  const { selectedKodeTahun } = useTahunAjaran()
  
  // Guard: cegah double-invoke & cascade re-fetch
  const initCalledRef = useRef(false)
  const [isInitDone, setIsInitDone] = useState(false)
  
  // States for Rekap
  const [rekapRows, setRekapRows] = useState<RekapSantriRow[]>([])
  const [rekapLoading, setRekapLoading] = useState(false)
  const [filterRekap, setFilterRekap] = useState({
    tanggal_mulai: "",
    tanggal_selesai: "",
    q: "",
    kode_kelas: "",
  })

  // Options
  const [unitOptions, setUnitOptions] = useState<DataUnitApiItem[]>([])
  const [kelasOptions, setKelasOptions] = useState<KelasItem[]>([])
  const [selectedUnit, setSelectedUnit] = useState("ALL")
  const [selectedTahunAjaranRekap, setSelectedTahunAjaranRekap] = useState<string>("ALL")

  // Sync from global header tahun ajaran
  useEffect(() => {
    if (selectedKodeTahun) {
      setSelectedTahunAjaranRekap(selectedKodeTahun)
      setSelectedTahunAjaran(selectedKodeTahun)
    }
  }, [selectedKodeTahun])

  // States for Riwayat Sesi
  const [sesiRows, setSesiRows] = useState<SesiAbsensiApiItem[]>([])
  const [sesiLoading, setSesiLoading] = useState(false)
  const [selectedUnitSesi, setSelectedUnitSesi] = useState("ALL")
  const [selectedKelasSesi, setSelectedKelasSesi] = useState("ALL")
  const [kelasSesiOptions, setKelasSesiOptions] = useState<KelasItem[]>([])
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState<TahunAjaranApiItem[]>([])
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>("ALL")
  const [filterSesi, setFilterSesi] = useState({
    tanggal: "",
    status_sesi: "SELESAI",
    q: "",
  })

  // States for Edit Absensi Santri (Admin)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedSesi, setSelectedSesi] = useState<SesiAbsensiApiItem | null>(null)
  const [santriList, setSantriList] = useState<any[]>([])
  const [attendanceData, setAttendanceData] = useState<Record<string, SantriStatus>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingSantri, setIsLoadingSantri] = useState(false)

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
    if (activeTab === "log_aktivitas" && isInitDone) {
      void loadLogs()
    }
  }, [activeTab, isInitDone, selectedKodeTahun])

  useEffect(() => {
    if (initCalledRef.current) return
    initCalledRef.current = true
    void loadOptions()
  }, [])

  // Tab: Rekap (Hanya dipanggil jika init selesai DAN tab aktif)
  useEffect(() => {
    if (!isInitDone || activeTab !== "rekap") return
    void loadRekap()
  }, [isInitDone, activeTab, selectedTahunAjaranRekap, selectedUnit, filterRekap.tanggal_mulai, filterRekap.tanggal_selesai, filterRekap.kode_kelas, filterRekap.q])

  // Tab: Riwayat Sesi (Hanya dipanggil jika init selesai DAN tab aktif)
  useEffect(() => {
    if (!isInitDone || activeTab !== "riwayat") return
    void loadRiwayatSesi()
  }, [isInitDone, activeTab, selectedTahunAjaran, selectedUnitSesi, selectedKelasSesi, filterSesi.tanggal, filterSesi.status_sesi, filterSesi.q])

  const loadOptions = async () => {
    try {
      const initData = await sesiAbsensiService.adminPresensiSantriInit()
      
      setUnitOptions(initData.unit || [])
      setKelasOptions(initData.kelas || [])
      setKelasSesiOptions(initData.kelas || [])

      const tahunList = initData.tahun_ajaran || []
      setTahunAjaranOptions(tahunList)

      const activeTahun = tahunList.find((t: any) => t.status === "AKTIF")
      if (activeTahun?.kode_tahun && !selectedKodeTahun) {
        setSelectedTahunAjaranRekap(activeTahun.kode_tahun)
        setSelectedTahunAjaran(activeTahun.kode_tahun)
      }
      
      setIsInitDone(true)
    } catch (e) {
      console.error("Gagal memuat filter options", e)
      setIsInitDone(true)
    }
  }

  const loadKelasByUnit = async (kode_unit?: string) => {
    try {
      const params: any = { per_page: "500", status: "AKTIF" }
      if (kode_unit) params.kode_unit = kode_unit
      const kelasRes = await kelasService.getAll(params)
      setKelasOptions(kelasRes || [])
    } catch (e) {
      console.error("Gagal memuat kelas", e)
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

  const loadRekap = async (unitOverride?: string) => {
    setRekapLoading(true)
    try {
      const activeUnit = unitOverride !== undefined ? unitOverride : selectedUnit
      const params: any = { ...filterRekap, per_page: 100 }
      if (activeUnit !== "ALL") params.kode_unit = activeUnit
      if (selectedTahunAjaranRekap && selectedTahunAjaranRekap !== "ALL") {
        params.tahun_ajaran = selectedTahunAjaranRekap
      }
      // remove empty kode_kelas so backend won't filter by empty string
      if (!params.kode_kelas) delete params.kode_kelas
      
      const response = await sesiAbsensiService.rekapSantri(params)
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

  const loadRiwayatSesi = async (tahunOverride?: string) => {
    setSesiLoading(true)
    try {
      const params: any = { ...filterSesi, per_page: 100 }
      if (selectedKelasSesi !== "ALL") params.kode_kelas = selectedKelasSesi
      if (selectedUnitSesi !== "ALL") params.kode_unit = selectedUnitSesi
      
      const yearToUse = tahunOverride !== undefined ? tahunOverride : selectedTahunAjaran
      if (yearToUse !== "ALL") {
        params.tahun_ajaran = yearToUse
      }
      
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

  const handleApplyFilterRekap = () => {
    loadRekap(selectedUnit)
  }

  const handleApplyFilterSesi = () => {
    loadRiwayatSesi()
  }

  const handleExport = (format: 'pdf' | 'excel') => {
    const params: any = { ...filterRekap }
    if (selectedUnit !== "ALL") params.kode_unit = selectedUnit
    if (selectedTahunAjaranRekap && selectedTahunAjaranRekap !== "ALL") {
      params.tahun_ajaran = selectedTahunAjaranRekap
    }
    if (!params.kode_kelas) delete params.kode_kelas
    const url = sesiAbsensiService.getExportSantriUrl(format, params)
    window.open(url, '_blank')
  }

  const openEditModal = async (sesi: SesiAbsensiApiItem) => {
    setSelectedSesi(sesi)
    setIsEditModalOpen(true)
    setIsLoadingSantri(true)
    
    try {
      // Get list of all santri in the class for this session
      const detail: any = await sesiAbsensiService.getDaftarSantri(sesi.id_sesi || sesi.id || 0)
      if (detail && detail.santri) {
        setSantriList(detail.santri)
        
        // Populate initial attendance data
        const initialData: Record<string, SantriStatus> = {}
        detail.santri.forEach((s: any) => {
          if (s.status_kehadiran) {
            initialData[s.nomor_induk] = s.status_kehadiran.toLowerCase() as SantriStatus
          } else {
            // Default to hadir if no attendance record exists yet
            initialData[s.nomor_induk] = "hadir"
          }
        })
        setAttendanceData(initialData)
      } else {
        setSantriList([])
      }
    } catch (error: any) {
      toast({
        title: "Gagal memuat detail sesi",
        description: error?.response?.data?.message || "Terjadi kesalahan.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingSantri(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!selectedSesi?.id_sesi) return

    setIsSubmitting(true)
    try {
      const payload = {
        absensi: Object.entries(attendanceData).map(([nomor_induk, status]) => ({
          nomor_induk,
          status_kehadiran: status.toUpperCase() as "HADIR" | "IZIN" | "SAKIT" | "ALFA",
        }))
      }

      await sesiAbsensiService.adminUpsertAbsensiSantri(selectedSesi.id_sesi, payload)
      
      toast({
        title: "Berhasil",
        description: "Data absensi santri berhasil diperbarui.",
      })
      
      setIsEditModalOpen(false)
      loadRekap() // refresh rekap data since attendance might have changed
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

  const handleDeleteSesi = async (idSesi: number) => {
    if (!confirm("Apakah Anda yakin ingin membatalkan (menghapus) semua absensi pada sesi ini?")) return
    
    // In our backend design, we don't have an endpoint to delete an entire session easily,
    // but we can "Cancel" it using the teacher endpoint, or the admin can manage it.
    // Since the instruction didn't specify a delete *session* endpoint, we'll just allow editing.
    toast({
      title: "Info",
      description: "Untuk mengubah absensi, silakan klik tombol Edit.",
    })
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
          <h1 className="text-2xl font-bold text-foreground">Kelola Presensi Santri</h1>
          <p className="text-muted-foreground">Admin panel untuk melihat rekapitulasi dan mengelola absensi santri.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="rekap" className="data-[state=active]:bg-card">
            <CheckCircle className="w-4 h-4 mr-2" />
            Rekap Santri
          </TabsTrigger>
          <TabsTrigger value="riwayat" className="data-[state=active]:bg-card">
            <History className="w-4 h-4 mr-2" />
            Riwayat Sesi (Edit)
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
                <CardTitle className="text-lg">Rekap Kehadiran Santri</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={selectedTahunAjaranRekap} onValueChange={setSelectedTahunAjaranRekap}>
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Tahun Ajaran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Tahun Ajaran</SelectItem>
                      {tahunAjaranOptions.map((t) => (
                        <SelectItem key={t.kode_tahun} value={t.kode_tahun!}>
                          {t.nama_tahun} {t.status === "AKTIF" ? "(Aktif)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      placeholder="Cari NIS/Nama..."
                      className="pl-9 w-40"
                      value={filterRekap.q}
                      onChange={(e) => setFilterRekap({ ...filterRekap, q: e.target.value })}
                    />
                  </div>
                  <Select 
                    value={selectedUnit} 
                    onValueChange={(val) => {
                      setSelectedUnit(val)
                      setFilterRekap(prev => ({ ...prev, kode_kelas: "" }))
                      loadKelasByUnit(val === "ALL" ? undefined : val)
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
                    value={filterRekap.kode_kelas || "ALL"} 
                    onValueChange={(val) => setFilterRekap({ ...filterRekap, kode_kelas: val === "ALL" ? "" : val })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Kelas" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="ALL">Semua Kelas</SelectItem>
                      {kelasOptions.map((k) => (
                        <SelectItem key={k.kode_kelas} value={k.kode_kelas}>{k.nama_kelas} ({k.kode_kelas})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="secondary" onClick={handleApplyFilterRekap}>Filter</Button>
                  
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
                      <TableHead>NIS</TableHead>
                      <TableHead>Nama Santri</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Hadir</TableHead>
                      <TableHead className="text-center">Izin</TableHead>
                      <TableHead className="text-center">Sakit</TableHead>
                      <TableHead className="text-center">Alfa</TableHead>
                      <TableHead className="text-right">% Kehadiran</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rekapLoading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Memuat data rekap...</TableCell>
                      </TableRow>
                    ) : rekapRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Tidak ada data rekap ditemukan.</TableCell>
                      </TableRow>
                    ) : (
                      rekapRows.map((row) => (
                        <TableRow key={row.nomor_induk} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{row.nomor_induk}</TableCell>
                          <TableCell>{row.nama_lengkap_santri}</TableCell>
                          <TableCell>{row.kode_kelas} {row.nama_kelas ? `(${row.nama_kelas})` : ''}</TableCell>
                          <TableCell className="text-center">{row.total_pertemuan}</TableCell>
                          <TableCell className="text-center text-emerald-600 font-medium">{row.jumlah_hadir}</TableCell>
                          <TableCell className="text-center">{row.jumlah_izin}</TableCell>
                          <TableCell className="text-center">{row.jumlah_sakit}</TableCell>
                          <TableCell className="text-center text-destructive font-medium">{row.jumlah_alfa}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className={row.persentase_kehadiran >= 80 ? 'text-emerald-600 border-emerald-200' : 'text-destructive border-destructive/30'}>
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
                  <CardDescription>Klik Edit untuk mengubah kehadiran santri pada sesi yang sudah selesai.</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={selectedTahunAjaran}
                    onValueChange={(val) => {
                      setSelectedTahunAjaran(val)
                    }}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Tahun Ajaran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Tahun Ajaran</SelectItem>
                      {tahunAjaranOptions.map((t) => (
                        <SelectItem key={t.kode_tahun} value={t.kode_tahun!}>
                          {t.nama_tahun} {t.status === "AKTIF" ? "(Aktif)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

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
                  
                  <Button variant="secondary" onClick={handleApplyFilterSesi}>Filter</Button>
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
                      <TableHead>Status Sesi</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sesiLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Memuat riwayat sesi...</TableCell>
                      </TableRow>
                    ) : sesiRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Tidak ada sesi ditemukan.</TableCell>
                      </TableRow>
                    ) : (
                      sesiRows.map((sesi) => (
                        <TableRow key={sesi.id_sesi || sesi.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">#{sesi.id_sesi || sesi.id}</TableCell>
                          <TableCell>{sesi.tanggal}</TableCell>
                          <TableCell>{sesi.hari || (sesi.jadwal as any)?.hari || "-"}</TableCell>
                          <TableCell>{sesi.mapel || sesi.mata_pelajaran || (sesi.jadwal as any)?.kelas_mapel?.mata_pelajaran?.nama_mapel || (sesi.jadwal as any)?.kelasMapel?.mataPelajaran?.nama_mapel || "-"}</TableCell>
                          <TableCell>{sesi.kelas || sesi.kode_kelas || (sesi.jadwal as any)?.kelas_mapel?.kelas?.nama_kelas || (sesi.jadwal as any)?.kelasMapel?.kelas?.nama_kelas || "-"}</TableCell>
                          <TableCell>{getStatusBadge(sesi.status_sesi || "")}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-primary hover:text-primary hover:bg-primary/10 bg-transparent border-primary/20"
                              onClick={() => openEditModal(sesi)}
                            >
                              Edit Absensi Santri
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

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Absensi Santri</DialogTitle>
            <DialogDescription>
              Ubah data kehadiran santri untuk Sesi #{selectedSesi?.id_sesi} - {selectedSesi?.mapel} ({selectedSesi?.kelas})
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {isLoadingSantri ? (
              <div className="flex items-center justify-center py-12">
                <Clock className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : santriList.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Tidak ada data santri untuk sesi ini.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>NIS</TableHead>
                    <TableHead>Nama Santri</TableHead>
                    <TableHead>Hadir</TableHead>
                    <TableHead>Sakit</TableHead>
                    <TableHead>Izin</TableHead>
                    <TableHead>Alfa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {santriList.map((s) => {
                    const status = attendanceData[s.nomor_induk] || "hadir"
                    return (
                      <TableRow key={s.nomor_induk}>
                        <TableCell className="text-muted-foreground">{s.nomor_induk}</TableCell>
                        <TableCell className="font-medium">{s.nama_lengkap_santri || s.santri?.nama_lengkap_santri || s.nomor_induk}</TableCell>
                        <TableCell>
                          <input 
                            type="radio" 
                            name={`status-${s.nomor_induk}`} 
                            checked={status === "hadir"}
                            onChange={() => setAttendanceData(prev => ({...prev, [s.nomor_induk]: "hadir"}))}
                            className="w-4 h-4 accent-primary cursor-pointer" 
                          />
                        </TableCell>
                        <TableCell>
                          <input 
                            type="radio" 
                            name={`status-${s.nomor_induk}`} 
                            checked={status === "sakit"}
                            onChange={() => setAttendanceData(prev => ({...prev, [s.nomor_induk]: "sakit"}))}
                            className="w-4 h-4 accent-chart-3 cursor-pointer" 
                          />
                        </TableCell>
                        <TableCell>
                          <input 
                            type="radio" 
                            name={`status-${s.nomor_induk}`} 
                            checked={status === "izin"}
                            onChange={() => setAttendanceData(prev => ({...prev, [s.nomor_induk]: "izin"}))}
                            className="w-4 h-4 accent-accent cursor-pointer" 
                          />
                        </TableCell>
                        <TableCell>
                          <input 
                            type="radio" 
                            name={`status-${s.nomor_induk}`} 
                            checked={status === "alfa"}
                            onChange={() => setAttendanceData(prev => ({...prev, [s.nomor_induk]: "alfa"}))}
                            className="w-4 h-4 accent-destructive cursor-pointer" 
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          <DialogFooter className="mt-4 pt-4 border-t">
            <Button variant="outline" className="bg-transparent" onClick={() => setIsEditModalOpen(false)}>
              Batal
            </Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleSaveEdit} disabled={isSubmitting || isLoadingSantri}>
              {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
