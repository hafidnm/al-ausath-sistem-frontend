"use client"

import { useEffect, useState, useMemo } from "react"
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
import { AlertTriangle, Search, Save, CheckCircle, Loader2, BookMarked } from "lucide-react"

import { nilaiMapelService, UpsertNilaiMapelPayload } from "@/lib/services/nilai-mapel.service"
import { kkmService } from "@/lib/services/kkm.service"
import { bobotNilaiService } from "@/lib/services/bobot-nilai.service"
import { kelasService } from "@/lib/services/kelas.service"
import { mataPelajaranService } from "@/lib/services/mata-pelajaran.service"
import { authService } from "@/lib/services/auth.service"
import { calculateRaporRaw, normalizeRaporDisplay, statusKkm } from "../utils/helpers"
import { semesterOptions } from "../utils/constants"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"

interface SantriRow {
  id: number
  nomor_induk: string
  nama_santri: string
  tugas1: string
  tugas2: string
  tugas3: string
  uh1: string
  uh2: string
  uh3: string
  uas: string
  keterangan: string
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

export function NilaiMapelForm() {
  const { selectedTahunAjaran } = useTahunAjaran()

  const [kelasOptions, setKelasOptions] = useState<{value: string, label: string}[]>([])
  const [mapelOptions, setMapelOptions] = useState<{value: string, label: string}[]>([])
  
  const [kodeKelas, setKodeKelas] = useState("")
  const [kodeMapel, setKodeMapel] = useState("")
  const tahunAjaran = selectedTahunAjaran?.nama_tahun ?? ""
  const [semester, setSemester] = useState("1")

  const [santris, setSantris] = useState<SantriRow[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false)
  
  const [nilaiKkm, setNilaiKkm] = useState<number | undefined>(undefined)
  const [bobot, setBobot] = useState({ tugas: 20, ulangan: 30, ujian: 50 })
  const [petugasInputId, setPetugasInputId] = useState<number | undefined>(undefined)

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // Load User, Kelas, Mapel
  useEffect(() => {
    authService.me().then(me => setPetugasInputId(extractPetugasInputId(me)))
    kelasService.getAll({ status: "AKTIF", per_page: "200" })
      .then(res => setKelasOptions(res.map(k => ({ value: k.kode_kelas, label: k.nama_kelas ?? k.kode_kelas }))))
      .catch(console.error)
    mataPelajaranService.getAll({ status: "AKTIF", per_page: "200" })
      .then(res => setMapelOptions(res.map(m => ({ value: m.kode_mapel, label: m.nama_mapel ?? m.kode_mapel }))))
      .catch(console.error)
  }, [])

  // Load KKM and Bobot when mapel/ta/semester change
  useEffect(() => {
    if (!kodeMapel || !tahunAjaran || !semester) return
    kkmService.getAll({ kode_mapel: kodeMapel, tahun_ajaran: tahunAjaran, semester: Number(semester) })
      .then(res => {
        if (res.length > 0) setNilaiKkm(res[0].nilai_kkm)
        else setNilaiKkm(75) // default
      })
      .catch(() => setNilaiKkm(75))
      
    bobotNilaiService.getAll({ tahun_ajaran: tahunAjaran, semester: Number(semester) })
      .then(res => {
        const b = res.data?.[0]
        if (b) setBobot({ tugas: b.bobot_harian, ulangan: b.bobot_uts, ujian: b.bobot_uas })
      })
      .catch(console.error)
  }, [kodeMapel, tahunAjaran, semester])

  // Fetch Data Santri and existing Nilai
  useEffect(() => {
    if (!kodeKelas || !kodeMapel || !tahunAjaran || !semester) {
      setSantris([])
      return
    }

    setIsLoading(true)
    setError("")
    setSuccessMsg("")

    nilaiMapelService.getKelasIndex({ kode_kelas: kodeKelas, kode_mapel: kodeMapel, tahun_ajaran: tahunAjaran, semester: Number(semester) })
      .then(data => {
        const rows: SantriRow[] = data.map(item => {
          const n = item.nilai
          
          let t1 = ""
          let t2 = ""
          let t3 = ""
          let uh1 = ""
          let uh2 = ""
          let uh3 = ""
          let uas = ""

          // Parse from nilai_detail if available
          // format: "Tugas:[90.00,85.00,95.00];Ulangan:[70.00,65.00,75.00];UjianAkhir:55.00;NilaiAkhirMapel:66.50"
          if (n?.nilai_detail) {
            const tugasMatch = n.nilai_detail.match(/Tugas:\[(.*?)\]/)
            if (tugasMatch && tugasMatch[1]) {
              const tugasVals = tugasMatch[1].split(',')
              t1 = tugasVals[0] || ""
              t2 = tugasVals[1] || ""
              t3 = tugasVals[2] || ""
            }

            const ulanganMatch = n.nilai_detail.match(/Ulangan:\[(.*?)\]/)
            if (ulanganMatch && ulanganMatch[1]) {
              const ulanganVals = ulanganMatch[1].split(',')
              uh1 = ulanganVals[0] || ""
              uh2 = ulanganVals[1] || ""
              uh3 = ulanganVals[2] || ""
            }

            const uasMatch = n.nilai_detail.match(/UjianAkhir:([0-9.]+)/)
            if (uasMatch && uasMatch[1]) {
              uas = uasMatch[1]
            }
          }

          // Fallback if detail is not available (e.g. old data)
          if (!t1 && !t2 && !t3 && n?.nilai_harian != null) {
            t1 = n.nilai_harian.toString()
            t2 = n.nilai_harian.toString()
            t3 = n.nilai_harian.toString()
          }
          if (!uh1 && !uh2 && !uh3 && n?.nilai_uts != null) {
            uh1 = n.nilai_uts.toString()
            uh2 = n.nilai_uts.toString()
            uh3 = n.nilai_uts.toString()
          }
          if (!uas && n?.nilai_uas != null) {
            uas = n.nilai_uas.toString()
          }

          return {
            id: item.id,
            nomor_induk: item.nomor_induk,
            nama_santri: item.nama_santri,
            tugas1: t1,
            tugas2: t2,
            tugas3: t3,
            uh1: uh1,
            uh2: uh2,
            uh3: uh3,
            uas: uas,
            keterangan: n?.keterangan || "",
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

  }, [kodeKelas, kodeMapel, tahunAjaran, semester])

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

    const dirtyRows = santris.filter(s => s.isDirty)
    if (dirtyRows.length === 0) {
      setError("Tidak ada perubahan untuk disimpan.")
      return
    }

    setIsSaving(true)
    setError("")
    setSuccessMsg("")

    try {
      for (const row of dirtyRows) {
        const payload: UpsertNilaiMapelPayload = {
          nomor_induk: row.nomor_induk,
          kode_mapel: kodeMapel,
          kode_kelas: kodeKelas,
          tahun_ajaran: tahunAjaran,
          semester: Number(semester),
          id_petugas_input: petugasInputId,
          keterangan: row.keterangan || undefined,
          tugas: [
            { nilai: parseNilai(row.tugas1), jenis: "PR" },
            { nilai: parseNilai(row.tugas2), jenis: "TUGAS_PENGGANTI" },
            { nilai: parseNilai(row.tugas3), jenis: "MODUL_KOMPETENSI" },
          ],
          ulangan: [
            { nilai: parseNilai(row.uh1), soal_disusun_pengajar: true, diawasi_pengajar: true },
            { nilai: parseNilai(row.uh2), soal_disusun_pengajar: true, diawasi_pengajar: true },
            { nilai: parseNilai(row.uh3), soal_disusun_pengajar: true, diawasi_pengajar: true },
          ],
          ujian_akhir: parseNilai(row.uas)
        }
        await nilaiMapelService.upsert(payload)
      }
      
      setSuccessMsg(`Berhasil menyimpan nilai untuk ${dirtyRows.length} santri.`)
      // Reset dirty flag
      setSantris(prev => prev.map(s => ({ ...s, isDirty: false })))
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal menyimpan beberapa nilai.")
    } finally {
      setIsSaving(false)
    }
  }

  const filteredSantris = useMemo(() => {
    return santris.filter(s => {
      const matchSearch = s.nama_santri.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.nomor_induk.includes(searchQuery)
      const isIncomplete = !s.tugas1 || !s.tugas2 || !s.tugas3 || !s.uh1 || !s.uh2 || !s.uh3 || !s.uas
      return matchSearch && (showIncompleteOnly ? isIncomplete : true)
    })
  }, [santris, searchQuery, showIncompleteOnly])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filter Input Nilai</CardTitle>
          <CardDescription>Pilih kelas dan mata pelajaran untuk memulai input nilai massal.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Kelas</Label>
              <Select value={kodeKelas} onValueChange={setKodeKelas}>
                <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                <SelectContent>
                  {kelasOptions.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mata Pelajaran</Label>
              <Select value={kodeMapel} onValueChange={setKodeMapel}>
                <SelectTrigger><SelectValue placeholder="Pilih Mapel" /></SelectTrigger>
                <SelectContent>
                  {mapelOptions.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
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

      {kodeKelas && kodeMapel && (
        <Card>
          <CardHeader className="pb-0">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardTitle>Data Santri</CardTitle>
                <CardDescription>
                  KKM: {nilaiKkm ?? "-"} | Bobot: T({bobot.tugas}%) U({bobot.ulangan}%) UAS({bobot.ujian}%)
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
                      <TableHead className="w-[80px]">T1</TableHead>
                      <TableHead className="w-[80px]">T2</TableHead>
                      <TableHead className="w-[80px]">T3</TableHead>
                      <TableHead className="w-[80px]">UH1</TableHead>
                      <TableHead className="w-[80px]">UH2</TableHead>
                      <TableHead className="w-[80px]">UH3</TableHead>
                      <TableHead className="w-[80px]">UAS</TableHead>
                      <TableHead className="w-[80px]">Akhir</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSantris.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          Tidak ada data santri.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSantris.map(s => {
                        const isKosong = !s.tugas1 && !s.tugas2 && !s.tugas3 && !s.uh1 && !s.uh2 && !s.uh3 && !s.uas
                        
                        // Calculate Preview
                        const t = [{ nilai: parseNilai(s.tugas1), jenis: "PR" as const }, { nilai: parseNilai(s.tugas2), jenis: "PR" as const }, { nilai: parseNilai(s.tugas3), jenis: "PR" as const }]
                        const u = [{ nilai: parseNilai(s.uh1), soal_disusun_pengajar: true, diawasi_pengajar: true }, { nilai: parseNilai(s.uh2), soal_disusun_pengajar: true, diawasi_pengajar: true }, { nilai: parseNilai(s.uh3), soal_disusun_pengajar: true, diawasi_pengajar: true }]
                        const uasVal = parseNilai(s.uas)
                        
                        const raw = calculateRaporRaw(t, u, uasVal, bobot)
                        const norm = normalizeRaporDisplay(raw)
                        const status = statusKkm(norm.nilai, nilaiKkm ?? 75)

                        return (
                          <TableRow key={s.nomor_induk} className={isKosong ? "bg-destructive/5" : ""}>
                            <TableCell>
                              <div className="font-medium text-sm">{s.nama_santri}</div>
                              <div className="text-xs text-muted-foreground">{s.nomor_induk}</div>
                            </TableCell>
                            <TableCell><Input className="h-8 w-16 px-2 text-center" value={s.tugas1} onChange={e => handleInputChange(s.nomor_induk, "tugas1", e.target.value)} /></TableCell>
                            <TableCell><Input className="h-8 w-16 px-2 text-center" value={s.tugas2} onChange={e => handleInputChange(s.nomor_induk, "tugas2", e.target.value)} /></TableCell>
                            <TableCell><Input className="h-8 w-16 px-2 text-center" value={s.tugas3} onChange={e => handleInputChange(s.nomor_induk, "tugas3", e.target.value)} /></TableCell>
                            <TableCell><Input className="h-8 w-16 px-2 text-center" value={s.uh1} onChange={e => handleInputChange(s.nomor_induk, "uh1", e.target.value)} /></TableCell>
                            <TableCell><Input className="h-8 w-16 px-2 text-center" value={s.uh2} onChange={e => handleInputChange(s.nomor_induk, "uh2", e.target.value)} /></TableCell>
                            <TableCell><Input className="h-8 w-16 px-2 text-center" value={s.uh3} onChange={e => handleInputChange(s.nomor_induk, "uh3", e.target.value)} /></TableCell>
                            <TableCell><Input className="h-8 w-16 px-2 text-center" value={s.uas} onChange={e => handleInputChange(s.nomor_induk, "uas", e.target.value)} /></TableCell>
                            <TableCell className="text-center font-semibold">
                              {!isKosong ? norm.nilai : "-"}
                            </TableCell>
                            <TableCell>
                              {!isKosong ? (
                                <span className={`text-xs px-2 py-1 rounded-full ${status.isPassed ? "bg-emerald-100 text-emerald-700" : "bg-destructive/10 text-destructive"}`}>
                                  {status.label}
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive">KOSONG</span>
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
            <div className="mt-6 flex justify-end">
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
