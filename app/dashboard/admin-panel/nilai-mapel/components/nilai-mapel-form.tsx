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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Search, Save, CheckCircle, Loader2, BookMarked, PlusCircle, MinusCircle, Download, Upload } from "lucide-react"

import { nilaiMapelService, BulkUpsertNilaiMapelPayload, NilaiMapelTugasItem } from "@/lib/services/nilai-mapel.service"
import { kkmService } from "@/lib/services/kkm.service"
import { bobotNilaiService } from "@/lib/services/bobot-nilai.service"
import { dataKelasMapelService } from "@/lib/services/kelas-mapel.service"
import { getCachedUser } from "@/lib/auth-cache"
import { calculateRaporRaw, normalizeRaporDisplay, statusKkm } from "../utils/helpers"
import { semesterOptions } from "../utils/constants"
import { downloadNilaiTemplate, parseNilaiCsv, CsvParseResult, CsvSantriRow } from "../utils/csv-helpers"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"
import { useUnit } from "@/contexts/unit-context"

interface SantriRow {
  id: number
  nomor_induk: string
  nama_santri: string
  tugas: string[]
  ulangan: string[]
  uas: string
  keterangan: string
  isDirty: boolean
  originalNilai?: any
}

const extractPetugasInputId = (me: any): number | undefined => {
  const candidates = [
    me?.user?.id_petugas,
    me?.user?.petugas?.id_petugas,
    me?.user?.petugas_id,
    me?.user?.idDataPetugas,
    me?.user?.data_petugas?.id,
    me?.id_petugas,
    me?.petugas?.id_petugas,
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

const normalizeRoleValue = (value: unknown): string[] => {
  if (value == null) return []
  if (Array.isArray(value)) {
    return value.flat(Infinity).filter(Boolean).map(String).map((v) => v.trim().toLowerCase())
  }
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          return parsed.flat(Infinity).filter(Boolean).map(String).map((v) => v.trim().toLowerCase())
        }
      } catch {
        // ignore parse errors
      }
    }
    return [trimmed.toLowerCase()]
  }
  return [String(value).trim().toLowerCase()]
}

const hasRole = (me: any, targetRole: string): boolean => {
  const roles = normalizeRoleValue(me?.user?.peran_akun ?? me?.peran_akun)
  return roles.includes(targetRole.toLowerCase())
}

const parseNilai = (val: string): number => {
  const n = Number(val)
  return isNaN(n) ? 0 : Math.max(0, Math.min(100, n))
}

export function NilaiMapelForm() {
  const { selectedTahunAjaran, selectedKodeTahun } = useTahunAjaran()

  const [rawKelasOptions, setRawKelasOptions] = useState<{value: string, label: string, kode_unit?: string}[]>([])
  const [rawMapelOptions, setRawMapelOptions] = useState<{value: string, label: string, kode_unit?: string}[]>([])
  
  const { selectedKodeUnit: contextKodeUnit } = useUnit()
  const selectedKodeUnit = contextKodeUnit?.toUpperCase() ?? ""

  const [kodeKelas, setKodeKelas] = useState("")
  const [kodeMapel, setKodeMapel] = useState("")
  const tahunAjaranDisplay = selectedTahunAjaran?.nama_tahun ?? ""
  // kode_tahun digunakan sebagai param API (kolom tahun_ajaran di backend menyimpan kode_tahun)
  const tahunAjaran = selectedKodeTahun ?? ""
  const [semester, setSemester] = useState("1")

  const [santris, setSantris] = useState<SantriRow[]>([])
  const [tugasCount, setTugasCount] = useState(3)
  const [ulanganCount, setUlanganCount] = useState(3)

  const [searchQuery, setSearchQuery] = useState("")
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false)
  
  const [nilaiKkm, setNilaiKkm] = useState<number | undefined>(undefined)
  const [bobot, setBobot] = useState({ tugas: 20, ulangan: 30, ujian: 50 })
  const [petugasInputId, setPetugasInputId] = useState<number | undefined>(undefined)

  const [isLoading, setIsLoading] = useState(false)
  const [isOptionsLoading, setIsOptionsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [pendingCsvData, setPendingCsvData] = useState<CsvParseResult | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const csvInputRef = useRef<HTMLInputElement>(null)

  // Load User, Kelas, Mapel
  useEffect(() => {
    const fetchOptions = async () => {
      const me = await getCachedUser()
      const idPetugas = extractPetugasInputId(me)
      const isAdmin = hasRole(me, "Petugas Admin")
      setPetugasInputId(idPetugas)

      if (!tahunAjaran || !selectedKodeUnit) {
        setRawKelasOptions([])
        setRawMapelOptions([])
        setKodeKelas("")
        setKodeMapel("")
        return
      }

      // Selalu fetch jika tahunAjaran dan unit sudah dipilih (halaman ini hanya untuk admin/petugas)
      setIsOptionsLoading(true)
      try {
        const params: any = {
          status: "AKTIF",
          per_page: 200,
        }

        // Jika bukan admin dan punya id_petugas → filter hanya mapel yg diajar petugas tsb
        if (!isAdmin && idPetugas) {
          params.id_petugas = idPetugas
        }
        params.tahun_ajaran = tahunAjaran  // kode_tahun = "2026/2027" sesuai format di DB
        if (semester) params.semester = Number(semester)
        params.kode_unit = selectedKodeUnit

        const { data } = await dataKelasMapelService.getAll(params)

        const kelasMap = new Map<string, { value: string; label: string; kode_unit?: string }>()
        const mapelMap = new Map<string, { value: string; label: string; kode_unit?: string }>()

        for (const item of data) {
          const kodeKelas = item.kode_kelas ?? item.kelas?.kode_kelas
          const namaKelas = item.nama_kelas ?? item.kelas?.nama_kelas ?? kodeKelas
          const kodeMapel = item.kode_mapel ?? item.mapel?.kode_mapel ?? item.mata_pelajaran?.kode_mapel ?? item.mataPelajaran?.kode_mapel
          const namaMapel = item.nama_mapel ?? item.mapel?.nama_mapel ?? item.mata_pelajaran?.nama_mapel ?? item.mataPelajaran?.nama_mapel ?? kodeMapel
          const kodeUnit = item.kode_unit ?? item.kelas?.kode_unit ?? undefined

          if (kodeKelas && !kelasMap.has(kodeKelas)) {
            kelasMap.set(kodeKelas, {
              value: kodeKelas,
              label: namaKelas ?? kodeKelas,
              kode_unit: kodeUnit,
            })
          }

          if (kodeMapel && !mapelMap.has(kodeMapel)) {
            mapelMap.set(kodeMapel, {
              value: kodeMapel,
              label: namaMapel ?? kodeMapel,
              kode_unit: kodeUnit,
            })
          }
        }

        setRawKelasOptions(Array.from(kelasMap.values()))
        setRawMapelOptions(Array.from(mapelMap.values()))
      } catch (error) {
        console.error(error)
        setRawKelasOptions([])
        setRawMapelOptions([])
      } finally {
        setIsOptionsLoading(false)
      }

    }

    fetchOptions()
  }, [tahunAjaran, semester, selectedKodeUnit])

  useEffect(() => {
    setKodeKelas("")
    setKodeMapel("")
  }, [tahunAjaran, selectedKodeUnit])

  const kelasOptions = useMemo(() => {
    let filtered = rawKelasOptions
    if (selectedKodeUnit) {
      filtered = filtered.filter(item => 
        !item.kode_unit || item.kode_unit.toUpperCase() === selectedKodeUnit
      )
    }
    return filtered
  }, [rawKelasOptions, selectedKodeUnit])

  const mapelOptions = useMemo(() => {
    let filtered = rawMapelOptions
    if (selectedKodeUnit) {
      filtered = filtered.filter(item => 
        !item.kode_unit || item.kode_unit.toUpperCase() === selectedKodeUnit
      )
    }
    return filtered
  }, [rawMapelOptions, selectedKodeUnit])

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
      setTugasCount(3)
      setUlanganCount(3)
      return
    }

    setIsLoading(true)
    setError("")
    setSuccessMsg("")

    nilaiMapelService.getKelasIndex({ kode_kelas: kodeKelas, kode_mapel: kodeMapel, tahun_ajaran: tahunAjaran, semester: Number(semester) })
      .then(data => {
        let maxT = 3
        let maxU = 3

        const rows: SantriRow[] = data.map(item => {
          const n = item.nilai
          
          let tugasArr: string[] = []
          let ulanganArr: string[] = []
          let uas = ""

          // Parse from nilai_detail if available
          // format: "Tugas:[90.00,85.00,95.00];Ulangan:[70.00,65.00,75.00];UjianAkhir:55.00;NilaiAkhirMapel:66.50"
          if (n?.nilai_detail) {
            const tugasMatch = n.nilai_detail.match(/Tugas:\[(.*?)\]/)
            if (tugasMatch && tugasMatch[1]) {
              tugasArr = tugasMatch[1].split(',')
            }

            const ulanganMatch = n.nilai_detail.match(/Ulangan:\[(.*?)\]/)
            if (ulanganMatch && ulanganMatch[1]) {
              ulanganArr = ulanganMatch[1].split(',')
            }

            const uasMatch = n.nilai_detail.match(/UjianAkhir:([0-9.]+)/)
            if (uasMatch && uasMatch[1]) {
              uas = uasMatch[1]
            }
          }

          // Fallback if detail is not available (e.g. old data)
          if (tugasArr.length === 0 && n?.nilai_harian != null) {
            tugasArr = [n.nilai_harian.toString(), n.nilai_harian.toString(), n.nilai_harian.toString()]
          }
          if (ulanganArr.length === 0 && n?.nilai_uts != null) {
            ulanganArr = [n.nilai_uts.toString(), n.nilai_uts.toString(), n.nilai_uts.toString()]
          }
          if (!uas && n?.nilai_uas != null) {
            uas = n.nilai_uas.toString()
          }

          if (tugasArr.length > maxT) maxT = tugasArr.length
          if (ulanganArr.length > maxU) maxU = ulanganArr.length

          return {
            id: item.id,
            nomor_induk: item.nomor_induk,
            nama_santri: item.nama_santri,
            tugas: tugasArr,
            ulangan: ulanganArr,
            uas: uas,
            keterangan: n?.keterangan || "",
            isDirty: false,
            originalNilai: n,
          }
        })

        // Pad arrays so all rows have the same max length
        rows.forEach(row => {
          while (row.tugas.length < maxT) row.tugas.push("")
          while (row.ulangan.length < maxU) row.ulangan.push("")
        })

        setTugasCount(maxT)
        setUlanganCount(maxU)
        setSantris(rows)
      })
      .catch(err => {
        console.error(err)
        setError("Gagal memuat data santri untuk kelas ini.")
      })
      .finally(() => setIsLoading(false))

  }, [kodeKelas, kodeMapel, tahunAjaran, semester])

  const handleArrayInputChange = (nomor_induk: string, field: 'tugas' | 'ulangan', index: number, value: string) => {
    setSantris(prev => prev.map(s => {
      if (s.nomor_induk === nomor_induk) {
        const newArr = [...s[field]]
        newArr[index] = value
        return { ...s, [field]: newArr, isDirty: true }
      }
      return s
    }))
  }

  const handleUasChange = (nomor_induk: string, value: string) => {
    setSantris(prev => prev.map(s => {
      if (s.nomor_induk === nomor_induk) {
        return { ...s, uas: value, isDirty: true }
      }
      return s
    }))
  }

  const addTugasColumn = () => {
    setTugasCount(prev => prev + 1)
    setSantris(prev => prev.map(s => ({ ...s, tugas: [...s.tugas, ""] })))
  }

  const removeTugasColumn = () => {
    if (tugasCount > 3) {
      setTugasCount(prev => prev - 1)
      setSantris(prev => prev.map(s => ({ ...s, tugas: s.tugas.slice(0, -1), isDirty: true })))
    }
  }

  const addUlanganColumn = () => {
    setUlanganCount(prev => prev + 1)
    setSantris(prev => prev.map(s => ({ ...s, ulangan: [...s.ulangan, ""] })))
  }

  const removeUlanganColumn = () => {
    if (ulanganCount > 3) {
      setUlanganCount(prev => prev - 1)
      setSantris(prev => prev.map(s => ({ ...s, ulangan: s.ulangan.slice(0, -1), isDirty: true })))
    }
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
      // Kirim SEMUA santri dalam 1 request sekaligus
      const payload: BulkUpsertNilaiMapelPayload = {
        kode_mapel: kodeMapel,
        kode_kelas: kodeKelas,
        tahun_ajaran: tahunAjaran,
        semester: Number(semester),
        id_petugas_input: petugasInputId,
        items: dirtyRows.map(row => ({
          nomor_induk: row.nomor_induk,
          keterangan: row.keterangan || undefined,
          tugas: row.tugas.map((val, idx) => ({
            nilai: parseNilai(val),
            jenis: (idx === 0 ? "PR" : idx === 1 ? "TUGAS_PENGGANTI" : idx === 2 ? "MODUL_KOMPETENSI" : "PR") as NilaiMapelTugasItem["jenis"]
          })),
          ulangan: row.ulangan.map((val) => ({
            nilai: parseNilai(val),
            soal_disusun_pengajar: true,
            diawasi_pengajar: true
          })),
          ujian_akhir: parseNilai(row.uas)
        }))
      }

      const result = await nilaiMapelService.bulkUpsert(payload)

      if (result.errors && result.errors.length > 0) {
        const errDetail = result.errors.map(e => `${e.nomor_induk}: ${e.error}`).join('; ')
        setError(`Tersimpan ${result.saved_count} santri, namun ${result.errors.length} gagal: ${errDetail}`)
      } else {
        setSuccessMsg(`Berhasil menyimpan nilai ${result.saved_count} santri.`)
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
      setError("Pilih kelas dan mapel terlebih dahulu sebelum mengunduh template.")
      return
    }
    downloadNilaiTemplate(
      santris.map(s => ({ nomor_induk: s.nomor_induk, nama_santri: s.nama_santri, tugas: s.tugas, ulangan: s.ulangan, uas: s.uas })),
      tugasCount,
      ulanganCount,
      { kodeKelas, kodeMapel, tahunAjaran, semester },
    )
  }

  const applyCsvData = (result: CsvParseResult) => {
    // Sinkronkan jumlah kolom FE secara penuh dengan jumlah kolom yang ada di CSV (minimal 3 sesuai validasi backend)
    const newTugasCount = Math.max(3, result.tugasCount)
    const newUlanganCount = Math.max(3, result.ulanganCount)

    setTugasCount(newTugasCount)
    setUlanganCount(newUlanganCount)

    // Build lookup from CSV
    const csvMap = new Map<string, CsvSantriRow>(result.rows.map(r => [r.nomor_induk, r]))

    setSantris(prev => prev.map(s => {
      const csvRow = csvMap.get(s.nomor_induk)
      if (!csvRow) return s

      // Gunakan nilai dari CSV, pad dengan string kosong jika CSV tidak memilikinya (sampai batas newTugasCount)
      const tugas = Array.from({ length: newTugasCount }, (_, i) => csvRow.tugas[i] ?? "")
      const ulangan = Array.from({ length: newUlanganCount }, (_, i) => csvRow.ulangan[i] ?? "")

      return { ...s, tugas, ulangan, uas: csvRow.uas, isDirty: true }
    }))

    const warningText = result.errors.length > 0
      ? ` (${result.errors.length} peringatan validasi — cek kembali nilai yang ditandai)`
      : ""
    setSuccessMsg(`CSV berhasil diimpor: ${result.rows.length} santri dimuat.${warningText}`)
  }

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset input so the same file can be re-selected
    e.target.value = ""

    setIsImporting(true)
    setError("")
    setSuccessMsg("")

    try {
      const result = await parseNilaiCsv(file)

      if (result.errors.length > 0 && result.rows.length === 0) {
        setError(result.errors.map(err => `Baris ${err.line}: ${err.message}`).join(" | "))
        return
      }

      // Tampilkan dialog jika jumlah tugas/ulangan di CSV BERBEDA dari yang ada di form
      if (result.tugasCount !== tugasCount || result.ulanganCount !== ulanganCount) {
        setPendingCsvData(result)
        setShowConfirmDialog(true)
      } else {
        applyCsvData(result)
      }
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
      const isIncomplete = s.tugas.some(v => !v) || s.ulangan.some(v => !v) || !s.uas
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
                    <SelectItem key="loading" value="loading-kelas" disabled>
                      <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Memuat...</div>
                    </SelectItem>
                  ) : (kelasOptions.length > 0 ? (
                    kelasOptions.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)
                  ) : (
                    <SelectItem key="empty" value="no-kelas" disabled>
                      {selectedTahunAjaran?.nama_tahun && selectedKodeUnit ? "Tidak ada kelas" : "Pilih header terlebih dahulu"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mata Pelajaran</Label>
              <Select
                value={kodeMapel}
                onValueChange={setKodeMapel}
                disabled={!tahunAjaran || !selectedKodeUnit}
              >
                <SelectTrigger>
                  <div className="flex items-center justify-between">
                    <SelectValue placeholder={tahunAjaran && selectedKodeUnit ? "Pilih Mapel" : "Pilih Tahun Ajaran + Unit dulu"} />
                    {isOptionsLoading && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary ml-2" />
                    )}
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {isOptionsLoading ? (
                    <SelectItem key="loading-mapel" value="loading-mapel" disabled>
                      <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Memuat...</div>
                    </SelectItem>
                  ) : (mapelOptions.length > 0 ? (
                    mapelOptions.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)
                  ) : (
                    <SelectItem key="empty" value="no-mapel" disabled>
                      {selectedTahunAjaran?.nama_tahun && selectedKodeUnit ? "Tidak ada mapel" : "Pilih header terlebih dahulu"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tahun Ajaran</Label>
              <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm">
                <BookMarked className="w-4 h-4 text-primary shrink-0" />
                <span className="flex-1 truncate text-foreground">{tahunAjaranDisplay || "Belum dipilih"}</span>
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
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 border rounded-md p-1 bg-muted/20">
                  <span className="text-xs font-semibold px-2">Tugas</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={removeTugasColumn} disabled={tugasCount <= 3}><MinusCircle className="h-4 w-4" /></Button>
                  <span className="text-xs font-medium w-4 text-center">{tugasCount}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={addTugasColumn}><PlusCircle className="h-4 w-4" /></Button>
                </div>
                <div className="flex items-center gap-2 border rounded-md p-1 bg-muted/20">
                  <span className="text-xs font-semibold px-2">Ulangan</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={removeUlanganColumn} disabled={ulanganCount <= 3}><MinusCircle className="h-4 w-4" /></Button>
                  <span className="text-xs font-medium w-4 text-center">{ulanganCount}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={addUlanganColumn}><PlusCircle className="h-4 w-4" /></Button>
                </div>

                <div className="flex items-center space-x-2 border-l pl-4">
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
              <div className="overflow-x-auto pb-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px] sticky left-0 bg-background z-10 shadow-[1px_0_0_0_#e2e8f0]">Nama Santri</TableHead>
                      {Array.from({length: tugasCount}).map((_, i) => (
                        <TableHead key={`th-t-${i}`} className="w-[80px] text-center px-1">T{i+1}</TableHead>
                      ))}
                      {Array.from({length: ulanganCount}).map((_, i) => (
                        <TableHead key={`th-u-${i}`} className="w-[80px] text-center px-1">UH{i+1}</TableHead>
                      ))}
                      <TableHead className="w-[80px] text-center px-1">UAS</TableHead>
                      <TableHead className="w-[80px] text-center">Akhir</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSantris.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={tugasCount + ulanganCount + 4} className="text-center py-8 text-muted-foreground">
                          Tidak ada data santri.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSantris.map(s => {
                        const isKosong = s.tugas.every(v => !v) && s.ulangan.every(v => !v) && !s.uas
                        
                        // Calculate Preview
                        const t = s.tugas.map(val => ({ nilai: parseNilai(val), jenis: "PR" as const }))
                        const u = s.ulangan.map(val => ({ nilai: parseNilai(val), soal_disusun_pengajar: true, diawasi_pengajar: true }))
                        const uasVal = parseNilai(s.uas)
                        
                        const raw = calculateRaporRaw(t, u, uasVal, bobot)
                        const norm = normalizeRaporDisplay(raw)
                        const status = statusKkm(norm.nilai, nilaiKkm ?? 75)

                        return (
                          <TableRow key={s.nomor_induk} className={isKosong ? "bg-destructive/5" : ""}>
                            <TableCell className="sticky left-0 bg-background z-10 shadow-[1px_0_0_0_#e2e8f0]">
                              <div className="font-medium text-sm whitespace-nowrap">{s.nama_santri}</div>
                              <div className="text-xs text-muted-foreground">{s.nomor_induk}</div>
                            </TableCell>
                            {s.tugas.map((val, i) => (
                              <TableCell key={`t-${i}`} className="px-1"><Input className="h-8 w-16 px-2 text-center mx-auto" value={val} onChange={e => handleArrayInputChange(s.nomor_induk, "tugas", i, e.target.value)} /></TableCell>
                            ))}
                            {s.ulangan.map((val, i) => (
                              <TableCell key={`u-${i}`} className="px-1"><Input className="h-8 w-16 px-2 text-center mx-auto" value={val} onChange={e => handleArrayInputChange(s.nomor_induk, "ulangan", i, e.target.value)} /></TableCell>
                            ))}
                            <TableCell className="px-1"><Input className="h-8 w-16 px-2 text-center mx-auto" value={s.uas} onChange={e => handleUasChange(s.nomor_induk, e.target.value)} /></TableCell>
                            <TableCell className="text-center font-semibold">
                              {!isKosong ? norm.nilai : "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              {!isKosong ? (
                                <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${status === "TUNTAS" ? "bg-emerald-100 text-emerald-700" : "bg-destructive/10 text-destructive"}`}>
                                  {status.replace('_', ' ')}
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive whitespace-nowrap">KOSONG</span>
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
                  title="Unduh template CSV sesuai jumlah komponen Tugas & Ulangan saat ini"
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

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Impor CSV</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingCsvData && `CSV yang diimpor memiliki ${pendingCsvData.tugasCount} tugas dan ${pendingCsvData.ulanganCount} ulangan, sedangkan form saat ini memiliki ${tugasCount} tugas dan ${ulanganCount} ulangan. Mengimpor akan mengubah jumlah kolom menyesuaikan dengan CSV. Lanjutkan?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingCsvData(null)}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (pendingCsvData) applyCsvData(pendingCsvData)
              setShowConfirmDialog(false)
              setPendingCsvData(null)
            }}>Ya, Impor</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
