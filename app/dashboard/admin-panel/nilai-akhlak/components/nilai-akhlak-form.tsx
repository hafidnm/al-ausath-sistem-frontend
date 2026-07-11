"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Search, Save, CheckCircle, Loader2, BookMarked, Download, Upload } from "lucide-react"

import { nilaiAkhlakService, BulkUpsertNilaiAkhlakPayload } from "@/lib/services/nilai-akhlak.service"
import { kelasService } from "@/lib/services/kelas.service"
import { getCachedUser } from "@/lib/auth-cache"
import { semesterOptions } from "../utils/constants"
import { downloadAkhlakTemplate, parseAkhlakCsv, CsvAkhlakParseResult } from "../utils/csv-helpers"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"
import { useUnit } from "@/contexts/unit-context"

interface SantriRow {
  id: number
  nomor_induk: string
  nama_santri: string
  nilai_angka: string
  deskripsi: string
  isDirty: boolean
  originalNilai?: any
}

const extractPetugasInputId = (me: any): number | undefined => {
  const candidates = [
    me?.user?.id_petugas,
    me?.user?.petugas_id,
    me?.user?.idDataPetugas,
    me?.user?.data_petugas?.id,
    me?.id_petugas,
    me?.petugas_id,
    me?.idDataPetugas,
    me?.data_petugas?.id,
    me?.user?.id,
    me?.id,
  ]
  for (const candidate of candidates) {
    const id = Number(candidate)
    if (Number.isFinite(id) && id > 0) return id
  }
  return undefined
}

const parseNilai = (val: string): number => {
  const n = Number(val)
  return isNaN(n) ? 0 : Math.max(0, Math.min(100, n))
}

export function NilaiAkhlakForm() {
  const { selectedTahunAjaran } = useTahunAjaran()
  const { selectedUnit } = useUnit()
  
  const kodeUnitFromContext = selectedUnit?.kode_unit?.toUpperCase() ?? ""

  const [kelasOptions, setKelasOptions] = useState<{value: string, label: string, kode_unit?: string, id_wali_kelas?: number | null}[]>([])
  
  const [kodeKelas, setKodeKelas] = useState("")
  const tahunAjaran = selectedTahunAjaran?.nama_tahun ?? ""
  const [semester, setSemester] = useState("1")
  const [aspek, setAspek] = useState("AKHLAK")

  const [santris, setSantris] = useState<SantriRow[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false)
  
  const [petugasInputId, setPetugasInputId] = useState<number | undefined>(undefined)

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const csvInputRef = useRef<HTMLInputElement>(null)

  // Load User & Kelas
  useEffect(() => {
    const fetchUserAndKelas = async () => {
      const me = await getCachedUser()
      const idPetugas = extractPetugasInputId(me)
      const rolesStr = String(me?.user?.peran_akun || me?.peran_akun || "").toLowerCase()
      const isAdmin = rolesStr.includes("admin")
      setPetugasInputId(idPetugas)

      try {
        const res = await kelasService.getAll({ status: "AKTIF", per_page: "200" })
        let list = res

        // Pengajar hanya melihat kelas dimana dia menjadi wali kelas
        if (!isAdmin && idPetugas) {
          list = list.filter(k => k.id_wali_kelas === idPetugas)
        }

        setKelasOptions(list.map(k => ({
          value: k.kode_kelas ?? "",
          label: k.nama_kelas ?? k.kode_kelas ?? "",
          kode_unit: k.kode_unit,
          id_wali_kelas: k.id_wali_kelas,
        })))
      } catch (err) {
        console.error(err)
      }
    }

    fetchUserAndKelas()
  }, [])

  const displayedKelasOptions = useMemo(() => {
    let filtered = kelasOptions
    if (kodeUnitFromContext) {
      filtered = filtered.filter(item => 
        !item.kode_unit || item.kode_unit.toUpperCase() === kodeUnitFromContext
      )
    }

    const activeCode = kodeKelas.trim()

    if (!activeCode) return filtered
    if (filtered.some(item => item.value === activeCode)) return filtered

    return [
      {
        value: activeCode,
        label: `${activeCode} (Tersimpan)`,
      },
      ...filtered,
    ]
  }, [kelasOptions, kodeKelas, kodeUnitFromContext])

  // Fetch Data Santri and existing Nilai
  useEffect(() => {
    if (!kodeKelas || !tahunAjaran || !semester || !aspek) {
      setSantris([])
      return
    }

    setIsLoading(true)
    setError("")
    setSuccessMsg("")

    nilaiAkhlakService.getKelasIndex({ kode_kelas: kodeKelas, tahun_ajaran: tahunAjaran, semester: Number(semester), aspek })
      .then(data => {
        const rows: SantriRow[] = data.map(item => {
          const n = item.nilai_akhlak
          return {
            id: item.id,
            nomor_induk: item.nomor_induk,
            nama_santri: item.nama_santri,
            nilai_angka: n?.nilai_angka?.toString() || "",
            deskripsi: n?.deskripsi || "",
            isDirty: false,
            originalNilai: n,
          }
        })
        setSantris(rows)
      })
      .catch(err => {
        console.error(err)
        setError("Gagal memuat data santri untuk kelas ini.")
      })
      .finally(() => setIsLoading(false))

  }, [kodeKelas, tahunAjaran, semester, aspek])

  const handleInputChange = (nomor_induk: string, field: keyof SantriRow, value: string) => {
    setSantris(prev => prev.map(s => {
      if (s.nomor_induk === nomor_induk) {
        return { ...s, [field]: value, isDirty: true }
      }
      return s
    }))
  }

  const handleSave = async () => {
    if (!petugasInputId) {
      setError("ID Petugas tidak ditemukan.")
      return
    }

    const dirtyRows = santris.filter(s => s.isDirty && s.nilai_angka)
    if (dirtyRows.length === 0) {
      setError("Tidak ada perubahan untuk disimpan.")
      return
    }

    setIsSaving(true)
    setError("")
    setSuccessMsg("")

    try {
      // Kirim SEMUA santri dalam 1 request sekaligus
      const payload: BulkUpsertNilaiAkhlakPayload = {
        tahun_ajaran: tahunAjaran,
        semester: Number(semester),
        aspek: aspek || "AKHLAK",
        id_petugas_input: petugasInputId,
        items: dirtyRows.map(row => ({
          nomor_induk: row.nomor_induk,
          nilai_angka: parseNilai(row.nilai_angka),
          deskripsi: row.deskripsi.trim() || undefined,
        }))
      }

      const result = await nilaiAkhlakService.bulkUpsert(payload)

      if (result.errors && result.errors.length > 0) {
        const errDetail = result.errors.map(e => `${e.nomor_induk}: ${e.error}`).join('; ')
        setError(`Tersimpan ${result.saved_count} santri, namun ${result.errors.length} gagal: ${errDetail}`)
      } else {
        setSuccessMsg(`Berhasil menyimpan nilai akhlak ${result.saved_count} santri.`)
      }

      // Reset dirty flag
      setSantris(prev => prev.map(s => ({ ...s, isDirty: false })))
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal menyimpan nilai.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownloadTemplate = () => {
    if (santris.length === 0) {
      setError("Pilih kelas terlebih dahulu sebelum mengunduh template.")
      return
    }
    downloadAkhlakTemplate(
      santris.map(s => ({
        nomor_induk: s.nomor_induk,
        nama_santri: s.nama_santri,
        nilai_angka: s.nilai_angka,
        deskripsi: s.deskripsi
      })),
      { kodeKelas, aspek, tahunAjaran, semester },
    )
  }

  const applyCsvData = (result: CsvAkhlakParseResult) => {
    const csvMap = new Map(result.rows.map(r => [r.nomor_induk, r]))

    setSantris(prev => prev.map(s => {
      const csvRow = csvMap.get(s.nomor_induk)
      if (!csvRow) return s

      return {
        ...s,
        nilai_angka: csvRow.nilai_angka,
        deskripsi: csvRow.deskripsi !== undefined ? csvRow.deskripsi : s.deskripsi,
        isDirty: true
      }
    }))

    const warningText = result.errors.length > 0
      ? ` (${result.errors.length} peringatan validasi — cek kembali nilai yang ditandai)`
      : ""
    setSuccessMsg(`CSV berhasil diimpor: ${result.rows.length} santri dimuat.${warningText}`)
  }

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""

    setIsImporting(true)
    setError("")
    setSuccessMsg("")

    try {
      const result = await parseAkhlakCsv(file)

      if (result.errors.length > 0 && result.rows.length === 0) {
        setError(result.errors.map(err => `Baris ${err.line}: ${err.message}`).join(" | "))
        return
      }

      applyCsvData(result)
    } catch {
      setError("Gagal membaca file CSV. Pastikan format file sesuai template.")
    } finally {
      setIsImporting(false)
    }
  }

  const filteredSantris = useMemo(() => {
    return santris.filter(s => {
      const matchSearch = s.nama_santri.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.nomor_induk.includes(searchQuery)
      const isIncomplete = !s.nilai_angka
      return matchSearch && (showIncompleteOnly ? isIncomplete : true)
    })
  }, [santris, searchQuery, showIncompleteOnly])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filter Input Nilai Akhlak</CardTitle>
          <CardDescription>Pilih kelas dan kriteria untuk memulai input nilai massal.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Kelas</Label>
              <Select value={kodeKelas} onValueChange={setKodeKelas}>
                <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                <SelectContent>
                  {displayedKelasOptions.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
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
            <div className="space-y-2">
              <Label>Aspek</Label>
              <Input value={aspek} onChange={(e) => setAspek(e.target.value)} placeholder="Misal: AKHLAK" />
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
                  Masukkan nilai akhlak angka (0-100) dan catatan.
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch id="incomplete-mode" checked={showIncompleteOnly} onCheckedChange={setShowIncompleteOnly} />
                  <Label htmlFor="incomplete-mode">Belum Lengkap</Label>
                </div>
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Nama Santri</TableHead>
                      <TableHead className="w-[120px]">Nilai (0-100)</TableHead>
                      <TableHead>Deskripsi/Catatan Wali</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSantris.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Tidak ada data santri.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSantris.map(s => {
                        const isKosong = !s.nilai_angka
                        
                        return (
                          <TableRow key={s.nomor_induk} className={isKosong ? "bg-destructive/5" : ""}>
                            <TableCell>
                              <div className="font-medium text-sm">{s.nama_santri}</div>
                              <div className="text-xs text-muted-foreground">{s.nomor_induk}</div>
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number"
                                min={0}
                                max={100}
                                className="h-8 w-20 px-2 text-center" 
                                value={s.nilai_angka} 
                                onChange={e => handleInputChange(s.nomor_induk, "nilai_angka", e.target.value)} 
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                className="h-8 w-full px-2" 
                                placeholder="Catatan opsional..."
                                value={s.deskripsi} 
                                onChange={e => handleInputChange(s.nomor_induk, "deskripsi", e.target.value)} 
                              />
                            </TableCell>
                            <TableCell>
                              {isKosong ? (
                                <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive font-semibold">KOSONG</span>
                              ) : (
                                <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">TERISI</span>
                              )}
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
              <div className="flex flex-wrap gap-2">
                {/* Hidden file input for CSV upload */}
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleImportCsv}
                />
                <Button
                  variant="outline"
                  className="bg-transparent gap-2"
                  onClick={handleDownloadTemplate}
                  disabled={santris.length === 0}
                  title="Unduh template CSV sesuai data saat ini"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </Button>
                <Button
                  variant="outline"
                  className="bg-transparent gap-2"
                  onClick={() => csvInputRef.current?.click()}
                  disabled={isImporting || santris.length === 0}
                  title="Import nilai dari CSV yang sudah diisi"
                >
                  {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {isImporting ? "Memproses..." : "Import CSV"}
                </Button>
              </div>
              <Button onClick={handleSave} disabled={isSaving || santris.filter(s => s.isDirty).length === 0} className="gap-2">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan Perubahan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
