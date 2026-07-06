"use client"

import { useEffect, useState, useMemo } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Search, Save, CheckCircle, Loader2, BookMarked, Plus, Trash2, Printer, FileText, X, Trophy } from "lucide-react"

import { raporService } from "@/lib/services/rapor.service"
import { rangkingKelasService } from "@/lib/services/rangking-kelas.service"
import { dataKelasService } from "@/lib/services/kelas.service"
import { santriService } from "@/lib/services/santri.service"
import { getCachedUser } from "@/lib/auth-cache"
import { semesterOptions } from "../../nilai-mapel/utils/constants"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"
import { useUnit } from "@/contexts/unit-context"

interface Ekstra {
  nama: string
  nilai: string
}

interface SantriRow {
  nomor_induk: string
  nama_santri: string
  status: "BELUM_GENERATE" | "DRAFT" | "TERBIT"
  catatan_wali: string
  id_wali_kelas?: number
  keseharian_kebersihan: string
  keseharian_kerapian: string
  keseharian_keterampilan: string
  keseharian_kelakuan: string
  keseharian_kerajinan: string
  keseharian_kedisiplinan: string
  keseharian_ketaatan: string
  ekstrakurikuler: Ekstra[]
  isDirty: boolean
}

interface RaporMassalFormProps {
  onCancel: () => void
}

export function RaporMassalForm({ onCancel }: RaporMassalFormProps) {
  const { selectedTahunAjaran } = useTahunAjaran()
  const { selectedKodeUnit: contextKodeUnit } = useUnit()
  const selectedKodeUnit = contextKodeUnit?.toUpperCase() ?? ""
  const tahunAjaran = selectedTahunAjaran?.nama_tahun ?? ""
  
  const [semester, setSemester] = useState("1")
  const [kodeKelas, setKodeKelas] = useState("")
  const [rawKelasOptions, setRawKelasOptions] = useState<{value: string, label: string, kode_unit?: string, id_wali_kelas?: number}[]>([])
  
  const [santris, setSantris] = useState<SantriRow[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  
  const [isLoading, setIsLoading] = useState(false)
  const [isOptionsLoading, setIsOptionsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRanking, setIsRanking] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // Dialog Ekstra State
  const [ekstraDialogSantri, setEkstraDialogSantri] = useState<SantriRow | null>(null)
  const [tempEkstra, setTempEkstra] = useState<Ekstra[]>([])

  // PDF Preview State
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
  const [pdfPreviewName, setPdfPreviewName] = useState<string>("")
  const [isPdfLoading, setIsPdfLoading] = useState(false)

  useEffect(() => {
    const fetchKelas = async () => {
      if (!selectedKodeUnit) {
        setRawKelasOptions([])
        setKodeKelas("")
        return
      }

      setIsOptionsLoading(true)
      try {
        const { data } = await dataKelasService.getAll({
          status: "AKTIF",
          per_page: 200,
        })

        const options = data
          .filter(k => !selectedKodeUnit || k.kode_unit === selectedKodeUnit)
          .map(k => ({
            value: k.kode_kelas,
            label: k.nama_kelas,
            kode_unit: k.kode_unit,
            id_wali_kelas: k.id_wali_kelas,
          }))

        setRawKelasOptions(options)
      } catch (error) {
        console.error(error)
      } finally {
        setIsOptionsLoading(false)
      }
    }

    fetchKelas()
  }, [tahunAjaran, selectedKodeUnit])

  useEffect(() => {
    setKodeKelas("")
  }, [tahunAjaran, selectedKodeUnit])

  const fetchData = async () => {
    if (!kodeKelas || !tahunAjaran || !semester) {
      setSantris([])
      return
    }

    setIsLoading(true)
    setError("")
    setSuccessMsg("")

    try {
      // Fetch Santri in class
      const santriData = await santriService.getAll({ kode_kelas: kodeKelas, status: "AKTIF", per_page: "200" })
      
      // Fetch existing Rapor
      const raporData = await raporService.getAll({
        kode_kelas: kodeKelas,
        tahun_ajaran: tahunAjaran,
        semester: semester.toString()
      })
      
      const rows: SantriRow[] = []

      const fetchDetailsPromises = santriData.map(async (s) => {
        const rapor = raporData.find(r => r.nomor_induk === s.nomor_induk)
        
        let row: SantriRow = {
          nomor_induk: s.nomor_induk,
          nama_santri: s.nama_lengkap ?? s.nomor_induk,
          status: "BELUM_GENERATE",
          catatan_wali: "",
          keseharian_kebersihan: "",
          keseharian_kerapian: "",
          keseharian_keterampilan: "",
          keseharian_kelakuan: "",
          keseharian_kerajinan: "",
          keseharian_kedisiplinan: "",
          keseharian_ketaatan: "",
          ekstrakurikuler: [],
          isDirty: false
        }

        if (rapor) {
          row.status = rapor.status === "TERBIT" ? "TERBIT" : "DRAFT"
          row.id_wali_kelas = rapor.id_wali_kelas || undefined
          
          try {
            const detail = await raporService.getCatatanWali({
              nomor_induk: s.nomor_induk,
              tahun_ajaran: tahunAjaran,
              semester: Number(semester)
            })
            
            row.catatan_wali = detail.catatan_wali || ""
            row.keseharian_kebersihan = detail.keseharian_kebersihan || ""
            row.keseharian_kerapian = detail.keseharian_kerapian || ""
            row.keseharian_keterampilan = detail.keseharian_keterampilan || ""
            row.keseharian_kelakuan = detail.keseharian_kelakuan || ""
            row.keseharian_kerajinan = detail.keseharian_kerajinan || ""
            row.keseharian_kedisiplinan = detail.keseharian_kedisiplinan || ""
            row.keseharian_ketaatan = detail.keseharian_ketaatan || ""
            row.ekstrakurikuler = detail.ekstrakurikuler || []
          } catch (e) {
            console.error("Gagal load catatan wali", s.nomor_induk)
          }
        }
        
        rows.push(row)
      })

      await Promise.all(fetchDetailsPromises)
      
      // Sort by nama_santri
      rows.sort((a, b) => a.nama_santri.localeCompare(b.nama_santri))
      setSantris(rows)

    } catch (err) {
      console.error(err)
      setError("Gagal memuat data rapor.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [kodeKelas, tahunAjaran, semester])

  const handleGenerateRanking = async () => {
    if (!kodeKelas || !tahunAjaran || !semester) return
    setIsRanking(true)
    setError("")
    setSuccessMsg("")
    try {
      const result = await rangkingKelasService.generate({
        kode_kelas: kodeKelas,
        tahun_ajaran: tahunAjaran,
        semester: Number(semester),
      })
      setSuccessMsg(`Ranking kelas berhasil diperbarui — ${result.total_siswa} santri terurut.`)
    } catch (err: any) {
      setError(err?.message || "Gagal memperbarui ranking kelas.")
    } finally {
      setIsRanking(false)
    }
  }

  const handleGenerateBulk = async () => {
    const ungenerated = santris.filter(s => s.status === "BELUM_GENERATE")
    if (ungenerated.length === 0) return

    setIsGenerating(true)
    setError("")
    setSuccessMsg("")

    try {
      await raporService.generateBulk({
        tahun_ajaran: tahunAjaran,
        semester: Number(semester),
        nomor_induks: ungenerated.map(s => s.nomor_induk)
      })

      setSuccessMsg(`Berhasil men-generate rapor untuk ${ungenerated.length} santri.`)
      fetchData()
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal generate rapor massal.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveBulk = async () => {
    const dirtyRows = santris.filter(s => s.isDirty)
    if (dirtyRows.length === 0) {
      setError("Tidak ada perubahan untuk disimpan.")
      return
    }

    setIsSaving(true)
    setError("")
    setSuccessMsg("")

    // Cari id wali kelas default dari kelas yang dipilih
    const selectedKelasInfo = rawKelasOptions.find(k => k.value === kodeKelas)
    const defaultIdWali = selectedKelasInfo?.id_wali_kelas

    try {
      await raporService.bulkUpsertCatatanWali({
        kode_kelas: kodeKelas,
        tahun_ajaran: tahunAjaran,
        semester: Number(semester),
        santris: dirtyRows.map(r => ({
          nomor_induk: r.nomor_induk,
          catatan_wali: r.catatan_wali || undefined,
          id_wali_kelas: r.id_wali_kelas || defaultIdWali || undefined,
          keseharian_kebersihan: r.keseharian_kebersihan || undefined,
          keseharian_kerapian: r.keseharian_kerapian || undefined,
          keseharian_keterampilan: r.keseharian_keterampilan || undefined,
          keseharian_kelakuan: r.keseharian_kelakuan || undefined,
          keseharian_kerajinan: r.keseharian_kerajinan || undefined,
          keseharian_kedisiplinan: r.keseharian_kedisiplinan || undefined,
          keseharian_ketaatan: r.keseharian_ketaatan || undefined,
          ekstrakurikuler: r.ekstrakurikuler.length > 0 ? r.ekstrakurikuler : undefined
        }))
      })

      setSuccessMsg(`Berhasil menyimpan perubahan untuk ${dirtyRows.length} santri.`)
      setSantris(prev => prev.map(s => ({ ...s, isDirty: false })))
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal menyimpan rapor massal.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (nomor_induk: string, field: keyof SantriRow, value: string) => {
    setSantris(prev => prev.map(s => {
      if (s.nomor_induk === nomor_induk) {
        return { ...s, [field]: value.toUpperCase(), isDirty: true }
      }
      return s
    }))
  }

  const handleCatatanChange = (nomor_induk: string, value: string) => {
    setSantris(prev => prev.map(s => {
      if (s.nomor_induk === nomor_induk) {
        return { ...s, catatan_wali: value, isDirty: true }
      }
      return s
    }))
  }

  const openEkstraDialog = (santri: SantriRow) => {
    setEkstraDialogSantri(santri)
    setTempEkstra([...santri.ekstrakurikuler])
  }

  const closeEkstraDialog = () => {
    setEkstraDialogSantri(null)
    setTempEkstra([])
  }

  const saveEkstraDialog = () => {
    if (ekstraDialogSantri) {
      setSantris(prev => prev.map(s => {
        if (s.nomor_induk === ekstraDialogSantri.nomor_induk) {
          return { ...s, ekstrakurikuler: tempEkstra.filter(e => e.nama.trim() !== ""), isDirty: true }
        }
        return s
      }))
    }
    closeEkstraDialog()
  }

  const handlePreviewPdf = async (s: SantriRow) => {
    setIsPdfLoading(true)
    setPdfPreviewName(s.nama_santri)
    try {
      const blob = await raporService.downloadPdf({
        nomor_induk: s.nomor_induk,
        tahun_ajaran: tahunAjaran,
        semester: Number(semester),
      })
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl)
      setPdfPreviewUrl(URL.createObjectURL(blob))
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal membuka preview PDF rapor.")
    } finally {
      setIsPdfLoading(false)
    }
  }

  const closePdfPreview = () => {
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl)
    setPdfPreviewUrl(null)
    setPdfPreviewName("")
  }

  const filteredSantris = useMemo(() => {
    return santris.filter(s => {
      return s.nama_santri.toLowerCase().includes(searchQuery.toLowerCase()) || 
             s.nomor_induk.includes(searchQuery)
    })
  }, [santris, searchQuery])

  const ungeneratedCount = santris.filter(s => s.status === "BELUM_GENERATE").length
  const dirtyCount = santris.filter(s => s.isDirty).length

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filter Input Rapor</CardTitle>
          <CardDescription>Pilih kelas untuk memulai input massal.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Kelas</Label>
              <Select
                value={kodeKelas}
                onValueChange={setKodeKelas}
                disabled={!tahunAjaran || !selectedKodeUnit}
              >
                <SelectTrigger>
                  <div className="flex items-center justify-between">
                    <SelectValue placeholder={tahunAjaran && selectedKodeUnit ? "Pilih Kelas" : "Pilih Tahun Ajaran + Unit dulu"} />
                    {isOptionsLoading && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary ml-2" />
                    )}
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {isOptionsLoading ? (
                    <SelectItem key="loading-kelas" value="loading-kelas" disabled>
                      <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Memuat...</div>
                    </SelectItem>
                  ) : (rawKelasOptions.length > 0 ? (
                    rawKelasOptions.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)
                  ) : (
                    <SelectItem key="empty" value="no-kelas" disabled>
                      {selectedTahunAjaran?.nama_tahun && selectedKodeUnit ? "Tidak ada kelas" : "Pilih header terlebih dahulu"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tahun Ajaran</Label>
              <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm">
                <BookMarked className="w-4 h-4 text-primary shrink-0" />
                <span className="flex-1 truncate text-foreground">{tahunAjaran || "Belum dipilih"}</span>
                <Badge variant="secondary" className="text-xs shrink-0">Dari Header</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Semester</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger><SelectValue placeholder="Pilih Semester" /></SelectTrigger>
                <SelectContent>
                  {semesterOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMsg && (
        <Alert className="bg-emerald-50 text-emerald-900 border-emerald-200">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}

      {kodeKelas && (
        <Card>
          <CardHeader className="pb-0">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardTitle>Data Santri</CardTitle>
                <CardDescription>
                  Isi nilai keseharian (A/B/C/D), catatan wali, dan nilai ekstra.
                </CardDescription>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <Button onClick={handleGenerateRanking} disabled={isRanking || santris.length === 0} variant="outline">
                  {isRanking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trophy className="w-4 h-4 mr-2" />}
                  Perbarui Ranking
                </Button>
                {ungeneratedCount > 0 && (
                  <Button onClick={handleGenerateBulk} disabled={isGenerating} variant="default" className="bg-blue-600 hover:bg-blue-700">
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Printer className="w-4 h-4 mr-2" />}
                    Generate Rapor Kelas Ini ({ungeneratedCount})
                  </Button>
                )}
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Cari santri..." 
                    className="pl-9" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto pb-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px] sticky left-0 bg-background z-10 px-1 text-center" title="Preview PDF">PDF</TableHead>
                      <TableHead className="min-w-[200px] sticky left-10 bg-background z-10 shadow-[1px_0_0_0_#e2e8f0]">Nama Santri</TableHead>
                      <TableHead className="w-[100px] text-center px-1">Status</TableHead>
                      <TableHead className="min-w-[250px] px-2">Catatan Wali</TableHead>
                      <TableHead className="w-[60px] text-center px-1" title="Kebersihan">Brs</TableHead>
                      <TableHead className="w-[60px] text-center px-1" title="Kerapian">Rap</TableHead>
                      <TableHead className="w-[60px] text-center px-1" title="Keterampilan">Trm</TableHead>
                      <TableHead className="w-[60px] text-center px-1" title="Kelakuan">Lak</TableHead>
                      <TableHead className="w-[60px] text-center px-1" title="Kerajinan">Raj</TableHead>
                      <TableHead className="w-[60px] text-center px-1" title="Kedisiplinan">Dis</TableHead>
                      <TableHead className="w-[60px] text-center px-1" title="Ketaatan">Taat</TableHead>
                      <TableHead className="min-w-[100px] text-center px-1">Ekstra</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSantris.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                          Tidak ada data santri.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSantris.map(s => {
                        const disabled = s.status === "BELUM_GENERATE" || s.status === "TERBIT"
                        
                        return (
                          <TableRow key={s.nomor_induk} className={s.status === "BELUM_GENERATE" ? "bg-muted/50" : ""}>
                            <TableCell className="sticky left-0 bg-background z-10 px-1 text-center">
                              {s.status !== "BELUM_GENERATE" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                                  title="Preview PDF Rapor"
                                  onClick={() => handlePreviewPdf(s)}
                                  disabled={isPdfLoading}
                                >
                                  {isPdfLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                                </Button>
                              )}
                            </TableCell>
                            <TableCell className="sticky left-10 bg-background z-10 shadow-[1px_0_0_0_#e2e8f0]">
                              <div className="font-medium text-sm whitespace-nowrap">{s.nama_santri}</div>
                              <div className="text-xs text-muted-foreground">{s.nomor_induk}</div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={s.status === "TERBIT" ? "default" : s.status === "DRAFT" ? "outline" : "secondary"}>
                                {s.status.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-2">
                              <Input 
                                className="h-8 w-full text-xs" 
                                placeholder="Catatan Wali..." 
                                value={s.catatan_wali} 
                                onChange={e => handleCatatanChange(s.nomor_induk, e.target.value)} 
                                disabled={disabled}
                              />
                            </TableCell>
                            <TableCell className="px-1"><Input maxLength={1} className="h-8 w-10 text-center mx-auto px-1 uppercase" value={s.keseharian_kebersihan} onChange={e => handleInputChange(s.nomor_induk, "keseharian_kebersihan", e.target.value)} disabled={disabled}/></TableCell>
                            <TableCell className="px-1"><Input maxLength={1} className="h-8 w-10 text-center mx-auto px-1 uppercase" value={s.keseharian_kerapian} onChange={e => handleInputChange(s.nomor_induk, "keseharian_kerapian", e.target.value)} disabled={disabled}/></TableCell>
                            <TableCell className="px-1"><Input maxLength={1} className="h-8 w-10 text-center mx-auto px-1 uppercase" value={s.keseharian_keterampilan} onChange={e => handleInputChange(s.nomor_induk, "keseharian_keterampilan", e.target.value)} disabled={disabled}/></TableCell>
                            <TableCell className="px-1"><Input maxLength={1} className="h-8 w-10 text-center mx-auto px-1 uppercase" value={s.keseharian_kelakuan} onChange={e => handleInputChange(s.nomor_induk, "keseharian_kelakuan", e.target.value)} disabled={disabled}/></TableCell>
                            <TableCell className="px-1"><Input maxLength={1} className="h-8 w-10 text-center mx-auto px-1 uppercase" value={s.keseharian_kerajinan} onChange={e => handleInputChange(s.nomor_induk, "keseharian_kerajinan", e.target.value)} disabled={disabled}/></TableCell>
                            <TableCell className="px-1"><Input maxLength={1} className="h-8 w-10 text-center mx-auto px-1 uppercase" value={s.keseharian_kedisiplinan} onChange={e => handleInputChange(s.nomor_induk, "keseharian_kedisiplinan", e.target.value)} disabled={disabled}/></TableCell>
                            <TableCell className="px-1"><Input maxLength={1} className="h-8 w-10 text-center mx-auto px-1 uppercase" value={s.keseharian_ketaatan} onChange={e => handleInputChange(s.nomor_induk, "keseharian_ketaatan", e.target.value)} disabled={disabled}/></TableCell>
                            <TableCell className="px-1 text-center">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-2 text-xs" 
                                disabled={disabled}
                                onClick={() => openEkstraDialog(s)}
                              >
                                {s.ekstrakurikuler.length > 0 ? `${s.ekstrakurikuler.length} Kegiatan` : "Tambah"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <Button variant="outline" onClick={onCancel}>Kembali</Button>
              <Button
                onClick={handleSaveBulk}
                disabled={isSaving || dirtyCount === 0}
                className="gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? "Menyimpan..." : `Simpan Perubahan (${dirtyCount})`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ekstrakurikuler Dialog */}
      <Dialog open={!!ekstraDialogSantri} onOpenChange={(open) => !open && closeEkstraDialog()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nilai Ekstrakurikuler</DialogTitle>
            <DialogDescription>
              {ekstraDialogSantri?.nama_santri} ({ekstraDialogSantri?.nomor_induk})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            {tempEkstra.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada kegiatan ekstrakurikuler.</p>
            ) : (
              tempEkstra.map((ekstra, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="space-y-1 flex-1">
                    <Label className="text-xs">Nama Kegiatan</Label>
                    <Input 
                      value={ekstra.nama} 
                      onChange={(e) => {
                        const newArr = [...tempEkstra]
                        newArr[idx].nama = e.target.value
                        setTempEkstra(newArr)
                      }}
                      placeholder="Pramuka, Memanah..."
                    />
                  </div>
                  <div className="space-y-1 w-20">
                    <Label className="text-xs">Nilai</Label>
                    <Input 
                      value={ekstra.nilai} 
                      maxLength={2}
                      className="text-center uppercase"
                      onChange={(e) => {
                        const newArr = [...tempEkstra]
                        newArr[idx].nilai = e.target.value
                        setTempEkstra(newArr)
                      }}
                      placeholder="A/B..."
                    />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="mt-5 text-destructive shrink-0" 
                    onClick={() => {
                      const newArr = [...tempEkstra]
                      newArr.splice(idx, 1)
                      setTempEkstra(newArr)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
            <Button 
              variant="outline" 
              className="w-full border-dashed"
              onClick={() => setTempEkstra([...tempEkstra, { nama: "", nilai: "" }])}
            >
              <Plus className="w-4 h-4 mr-2" /> Tambah Kegiatan
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEkstraDialog}>Batal</Button>
            <Button onClick={saveEkstraDialog}>Terapkan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Preview Dialog */}
      <Dialog open={!!pdfPreviewUrl} onOpenChange={(open) => !open && closePdfPreview()}>
        <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-5 pb-3 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-red-500" />
                  Preview Rapor PDF
                </DialogTitle>
                <DialogDescription>{pdfPreviewName}</DialogDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={closePdfPreview}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {pdfPreviewUrl && (
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-full border-0"
                title="Preview PDF Rapor"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
