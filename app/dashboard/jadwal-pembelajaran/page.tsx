"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { dataKelasMapelService } from "@/lib/services/kelas-mapel.service"
import { dataKelasService } from "@/lib/services/kelas.service"
import {
  BackendStatus,
  dataJadwalPembelajaranService,
  DataJadwalPembelajaranApiItem,
} from "@/lib/services/jadwal-pembelajaran.service"
import { dataMataPelajaranService } from "@/lib/services/mata-pelajaran.service"
import { dataPetugasService } from "@/lib/services/petugas.service"
import { tahunAjaranService } from "@/lib/services/tahun-ajaran.service"
import { ChevronDown, Download, Eye, Filter, MoreVertical, PencilLine, PlusCircle, Trash2, Upload } from "lucide-react"

type UiStatus = "Aktif" | "Nonaktif"
type SemesterValue = "1" | "2"

type HariValue =
  | "SENIN"
  | "SELASA"
  | "RABU"
  | "KAMIS"
  | "JUMAT"
  | "SABTU"
  | "MINGGU"

interface JadwalRow {
  id: number
  idKelasMapel: number | null
  kodeKelas: string
  namaKelas: string
  kodeMapel: string
  namaMapel: string
  idPetugas: number | null
  namaPetugas: string
  tahunAjaran: string
  semester: number
  hari: string
  jamMulai: string
  jamSelesai: string
  ruangan: string
  keterangan: string
  status: UiStatus
}

interface JadwalFormData {
  idKelasMapel: string
  kodeKelas: string
  kodeMapel: string
  kelompokMapel: string
  idPetugas: string
  tahunAjaran: string
  semester: SemesterValue
  hari: HariValue
  jamMulai: string
  jamSelesai: string
  ruangan: string
  keterangan: string
  status: UiStatus
}

interface OptionItem {
  value: string
  label: string
}

interface MapelOption extends OptionItem {
  kelompokMapel: string
}

interface KelasMapelOption extends OptionItem {
  kodeKelas: string
  namaKelas: string
  kodeMapel: string
  namaMapel: string
  idPetugas: number | null
  namaPetugas: string
  kodeUnit: string
  namaUnit: string
  kelompokMapel: string
}

const hariOptions: Array<{ value: HariValue; label: string }> = [
  { value: "SENIN", label: "Senin" },
  { value: "SELASA", label: "Selasa" },
  { value: "RABU", label: "Rabu" },
  { value: "KAMIS", label: "Kamis" },
  { value: "JUMAT", label: "Jumat" },
  { value: "SABTU", label: "Sabtu" },
  { value: "MINGGU", label: "Minggu" },
]

const defaultFormState: JadwalFormData = {
  idKelasMapel: "",
  kodeKelas: "",
  kodeMapel: "",
  kelompokMapel: "",
  idPetugas: "none",
  tahunAjaran: "",
  semester: "1",
  hari: "SENIN",
  jamMulai: "07:00:00",
  jamSelesai: "08:00:00",
  ruangan: "",
  keterangan: "",
  status: "Aktif",
}

const toText = (value: unknown): string => {
  if (value == null) return ""
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return ""
}

const toNumber = (value: unknown, fallback = 0): number => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const toBackendStatus = (status: UiStatus): BackendStatus => (status === "Aktif" ? "AKTIF" : "NONAKTIF")
const fromBackendStatus = (status: unknown): UiStatus => (toText(status).toUpperCase() === "NONAKTIF" ? "Nonaktif" : "Aktif")

const toHariValue = (value: unknown): HariValue => {
  const normalized = toText(value).trim().toUpperCase() as HariValue
  return hariOptions.some((item) => item.value === normalized) ? normalized : "SENIN"
}

const normalizeTime = (value: unknown): string => {
  const raw = toText(value).trim()
  if (!raw) return ""
  if (/^\d{2}:\d{2}$/.test(raw)) return `${raw}:00`
  if (/^\d{2}:\d{2}:\d{2}$/.test(raw)) return raw
  return raw
}

const toBackendTime = (value: string): string => {
  const raw = value.trim()
  if (!raw) return raw
  if (/^\d{2}:\d{2}$/.test(raw)) return `${raw}:00`
  if (/^\d{2}:\d{2}:\d{2}$/.test(raw)) return raw
  return raw
}

const normalizeRow = (raw: DataJadwalPembelajaranApiItem): JadwalRow => ({
  id: toNumber(raw.id_jadwal_pembelajaran ?? raw.id_jadwal ?? raw.id, -1),
  idKelasMapel: raw.id_kelas_mapel == null ? null : toNumber(raw.id_kelas_mapel, 0) || null,
  kodeKelas: toText(
    raw.kelasMapel?.kelas?.kode_kelas || raw.kelasMapel?.kode_kelas || raw.kode_kelas || raw.kelas?.kode_kelas,
  ),
  namaKelas: toText(
    raw.kelasMapel?.kelas?.nama_kelas || raw.kelasMapel?.nama_kelas || raw.nama_kelas || raw.kelas?.nama_kelas,
  ),
  kodeMapel: toText(
    raw.kelasMapel?.mataPelajaran?.kode_mapel ||
      raw.kelasMapel?.mata_pelajaran?.kode_mapel ||
      raw.kelasMapel?.kode_mapel ||
      raw.kode_mapel ||
      raw.mapel?.kode_mapel ||
      raw.mata_pelajaran?.kode_mapel ||
      raw.mataPelajaran?.kode_mapel,
  ),
  namaMapel: toText(
    raw.kelasMapel?.mataPelajaran?.nama_mapel ||
      raw.kelasMapel?.mata_pelajaran?.nama_mapel ||
      raw.kelasMapel?.nama_mapel ||
      raw.nama_mapel ||
      raw.mapel?.nama_mapel ||
      raw.mata_pelajaran?.nama_mapel ||
      raw.mataPelajaran?.nama_mapel,
  ),
  idPetugas:
    raw.id_petugas == null
      ? raw.kelasMapel?.petugas?.id_petugas == null
        ? null
        : toNumber(raw.kelasMapel.petugas.id_petugas, 0) || null
      : toNumber(raw.id_petugas, 0) || null,
  namaPetugas: toText(raw.kelasMapel?.petugas?.nama_lengkap || raw.petugas?.nama_lengkap),
  tahunAjaran: toText(raw.tahun_ajaran),
  semester: toNumber(raw.semester, 1),
  hari: toHariValue(raw.hari),
  jamMulai: normalizeTime(raw.jam_mulai),
  jamSelesai: normalizeTime(raw.jam_selesai),
  ruangan: toText(raw.ruangan || raw.ruang),
  keterangan: toText(raw.keterangan),
  status: fromBackendStatus(raw.status),
})

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (!error || typeof error !== "object") return fallback

  const err = error as {
    response?: {
      data?: {
        message?: string
        errors?: Record<string, string[]>
      }
    }
    message?: string
  }

  const firstFieldError = err.response?.data?.errors
    ? Object.values(err.response.data.errors).flat().find(Boolean)
    : undefined

  return firstFieldError || err.response?.data?.message || err.message || fallback
}

const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

const toCsvCell = (value: unknown): string => {
  const text = toText(value)
  const escaped = text.replace(/"/g, '""')
  return `"${escaped}"`
}

const buildCsvFromRows = (rows: JadwalRow[]): string => {
  const header = [
    "kode_kelas",
    "nama_kelas",
    "kode_mapel",
    "nama_mapel",
    "hari",
    "jam_mulai",
    "jam_selesai",
    "nama_petugas",
    "tahun_ajaran",
    "semester",
    "ruangan",
    "status",
    "keterangan",
  ]

  const lines = rows.map((row) =>
    [
      row.kodeKelas,
      row.namaKelas,
      row.kodeMapel,
      row.namaMapel,
      row.hari,
      row.jamMulai,
      row.jamSelesai,
      row.namaPetugas,
      row.tahunAjaran,
      row.semester,
      row.ruangan,
      row.status,
      row.keterangan,
    ]
      .map((cell) => toCsvCell(cell))
      .join(","),
  )

  return [header.join(","), ...lines].join("\n")
}

export default function JadwalPembelajaranPage() {
  const { toast } = useToast()

  const [rows, setRows] = useState<JadwalRow[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [detailData, setDetailData] = useState<JadwalRow | null>(null)

  const [formData, setFormData] = useState<JadwalFormData>(defaultFormState)
  const [editingFormData, setEditingFormData] = useState<JadwalFormData>(defaultFormState)

  const [kelasMapelOptions, setKelasMapelOptions] = useState<KelasMapelOption[]>([])
  const [kelasOptions, setKelasOptions] = useState<OptionItem[]>([])
  const [mapelOptions, setMapelOptions] = useState<MapelOption[]>([])
  const [kelompokMapelOptions, setKelompokMapelOptions] = useState<OptionItem[]>([])
  const [petugasOptions, setPetugasOptions] = useState<OptionItem[]>([])
  const [tahunOptions, setTahunOptions] = useState<OptionItem[]>([])

  const [keyword, setKeyword] = useState("")
  const [unitFilter, setUnitFilter] = useState("all")
  const [kelasFilter, setKelasFilter] = useState("all")
  const [mapelFilter, setMapelFilter] = useState("all")
  const [petugasFilter, setPetugasFilter] = useState("all")
  const [tahunFilter, setTahunFilter] = useState("all")
  const [hariFilter, setHariFilter] = useState("all")
  const [semesterFilter, setSemesterFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<UiStatus | "all">("all")

  const [rowsPerPage, setRowsPerPage] = useState("25")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const rowsLimit = Number(rowsPerPage)

  const dayOrder: Record<HariValue, number> = {
    SENIN: 1,
    SELASA: 2,
    RABU: 3,
    KAMIS: 4,
    JUMAT: 5,
    SABTU: 6,
    MINGGU: 7,
  }

  const kelasMapelById = useMemo(() => {
    const map = new Map<string, KelasMapelOption>()
    for (const option of kelasMapelOptions) map.set(option.value, option)
    return map
  }, [kelasMapelOptions])

  const resolveRowWithKelasMapel = (row: JadwalRow): JadwalRow => {
    if (!row.idKelasMapel) return row

    const related = kelasMapelById.get(String(row.idKelasMapel))
    if (!related) return row

    return {
      ...row,
      kodeKelas: row.kodeKelas || related.kodeKelas,
      namaKelas: row.namaKelas || related.namaKelas,
      kodeMapel: row.kodeMapel || related.kodeMapel,
      namaMapel: row.namaMapel || related.namaMapel,
      idPetugas: row.idPetugas ?? related.idPetugas,
      namaPetugas: row.namaPetugas || related.namaPetugas,
    }
  }

  const resolvedRows = useMemo(() => rows.map((row) => resolveRowWithKelasMapel(row)), [rows, kelasMapelById])

  const unitFilterOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const option of kelasMapelOptions) {
      if (!option.kodeUnit) continue
      map.set(option.kodeUnit, option.namaUnit || option.kodeUnit)
    }

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([value, label]) => ({ value, label }))
  }, [kelasMapelOptions])

  const kelasFilterOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const option of kelasMapelOptions) {
      if (unitFilter !== "all" && option.kodeUnit !== unitFilter) continue
      if (!option.kodeKelas) continue
      map.set(option.kodeKelas, option.namaKelas || option.kodeKelas)
    }

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([value, label]) => ({ value, label }))
  }, [kelasMapelOptions, unitFilter])

  const mapelFilterOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const option of kelasMapelOptions) {
      if (unitFilter !== "all" && option.kodeUnit !== unitFilter) continue
      if (kelasFilter !== "all" && option.kodeKelas !== kelasFilter) continue
      if (!option.kodeMapel) continue
      map.set(option.kodeMapel, option.namaMapel || option.kodeMapel)
    }

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([value, label]) => ({ value, label }))
  }, [kelasMapelOptions, unitFilter, kelasFilter])

  const visibleRows = useMemo(() => {
    let nextRows = resolvedRows

    if (unitFilter !== "all") {
      nextRows = nextRows.filter((row) => {
        const related = row.idKelasMapel ? kelasMapelById.get(String(row.idKelasMapel)) : null
        return related?.kodeUnit === unitFilter
      })
    }
    if (kelasFilter !== "all") nextRows = nextRows.filter((row) => row.kodeKelas === kelasFilter)
    if (mapelFilter !== "all") nextRows = nextRows.filter((row) => row.kodeMapel === mapelFilter)
    if (petugasFilter !== "all") nextRows = nextRows.filter((row) => String(row.idPetugas ?? "") === petugasFilter)
    if (hariFilter !== "all") nextRows = nextRows.filter((row) => row.hari === hariFilter)
    if (semesterFilter !== "all") nextRows = nextRows.filter((row) => row.semester === Number(semesterFilter))

    return [...nextRows].sort((a, b) => {
      const dayA = dayOrder[toHariValue(a.hari)] || 99
      const dayB = dayOrder[toHariValue(b.hari)] || 99
      if (dayA !== dayB) return dayA - dayB

      const timeA = a.jamMulai || "99:99:99"
      const timeB = b.jamMulai || "99:99:99"
      if (timeA !== timeB) return timeA.localeCompare(timeB)

      return a.id - b.id
    })
  }, [resolvedRows, unitFilter, kelasFilter, mapelFilter, petugasFilter, hariFilter, semesterFilter, kelasMapelById])

  const selectedCreateKelasMapel = useMemo(
    () => (formData.idKelasMapel ? kelasMapelById.get(formData.idKelasMapel) || null : null),
    [formData.idKelasMapel, kelasMapelById],
  )

  const selectedEditKelasMapel = useMemo(
    () => (editingFormData.idKelasMapel ? kelasMapelById.get(editingFormData.idKelasMapel) || null : null),
    [editingFormData.idKelasMapel, kelasMapelById],
  )

  const fetchRows = async () => {
    setIsLoading(true)
    try {
      const params: {
        page: number
        per_page: number
        q?: string
        id_petugas?: number
        tahun_ajaran?: string
        hari?: string
        semester?: number
        status?: BackendStatus
      } = {
        page: currentPage,
        per_page: rowsLimit,
      }

      const q = keyword.trim()
      if (q) params.q = q
      if (petugasFilter !== "all") params.id_petugas = toNumber(petugasFilter, 0)
      if (tahunFilter !== "all") params.tahun_ajaran = tahunFilter
      if (hariFilter !== "all") params.hari = hariFilter
      if (semesterFilter !== "all") params.semester = Number(semesterFilter)
      if (statusFilter !== "all") params.status = toBackendStatus(statusFilter)

      const result = await dataJadwalPembelajaranService.getAll(params)
      const mappedRows = result.data.map(normalizeRow).filter((row) => row.id > 0)

      setRows(mappedRows)
      setSelectedIds((prev) => prev.filter((id) => mappedRows.some((row) => row.id === id)))
      setTotalItems(toNumber(result.meta?.total, mappedRows.length))
      setTotalPages(Math.max(1, toNumber(result.meta?.last_page, 1)))
      setCurrentPage(toNumber(result.meta?.current_page, currentPage))
    } catch (error) {
      toast({
        title: "Gagal Memuat Data",
        description: getErrorMessage(error, "Data jadwal pembelajaran gagal dimuat."),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [kelasMapelResult, kelasResult, mapelResult, petugasResult, tahunResult] = await Promise.all([
          dataKelasMapelService.getAll({ page: 1, per_page: 500 }),
          dataKelasService.getAll({ page: 1, per_page: 500 }),
          dataMataPelajaranService.getAll({ page: 1, per_page: 500 }),
          dataPetugasService.getAll({ page: 1, per_page: 200 }),
          tahunAjaranService.getAll({ page: 1, per_page: 200 }),
        ])

        const kelasUnitByKode = new Map(
          kelasResult.data
            .map((item) => {
              const kodeKelas = toText(item.kode_kelas).trim()
              if (!kodeKelas) return null
              return [
                kodeKelas,
                {
                  kodeUnit: toText(item.kode_unit || item.unit?.kode_unit).trim().toUpperCase(),
                  namaUnit: toText(item.unit?.nama_unit).trim(),
                },
              ] as const
            })
            .filter((entry): entry is readonly [string, { kodeUnit: string; namaUnit: string }] => entry !== null),
        )

        const kelasMapel = kelasMapelResult.data
          .map((item) => ({
            value: String(toNumber(item.id_kelas_mapel ?? item.id, 0)),
            label: [
              toText(item.nama_kelas || item.kelas?.nama_kelas),
              toText(item.nama_mapel || item.mapel?.nama_mapel),
              toText(item.petugas?.nama_lengkap),
            ]
              .filter(Boolean)
              .join(" - "),
            kodeKelas: toText(item.kode_kelas || item.kelas?.kode_kelas),
            namaKelas: toText(item.nama_kelas || item.kelas?.nama_kelas),
            kodeMapel: toText(item.kode_mapel || item.mapel?.kode_mapel),
            namaMapel: toText(item.nama_mapel || item.mapel?.nama_mapel),
            idPetugas: item.id_petugas == null ? null : toNumber(item.id_petugas, 0) || null,
            namaPetugas: toText(item.petugas?.nama_lengkap),
            kodeUnit: "",
            namaUnit: "",
            kelompokMapel: "",
          }))
          .filter((item) => item.value && item.kodeKelas && item.kodeMapel)

        const kelas = kelasResult.data
          .map((item) => ({
            value: toText(item.kode_kelas).trim(),
            label: toText(item.nama_kelas).trim() || toText(item.kode_kelas).trim(),
          }))
          .filter((item) => item.value)

        const mapel = mapelResult.data
          .map((item) => ({
            value: toText(item.kode_mapel).trim(),
            label: toText(item.nama_mapel).trim() || toText(item.kode_mapel).trim(),
            kelompokMapel: toText(item.kelompok_mapel).trim(),
          }))
          .filter((item) => item.value)

        const kelompokMapel = Array.from(new Set(mapel.map((item) => item.kelompokMapel).filter(Boolean))).map((value) => ({
          value,
          label: value,
        }))
        const kelompokByKodeMapel = new Map(mapel.map((item) => [item.value, item.kelompokMapel]))
        const enrichedKelasMapel = kelasMapel.map((item) => ({
          ...item,
          idPetugas: item.idPetugas,
          kodeUnit: kelasUnitByKode.get(item.kodeKelas)?.kodeUnit || "",
          namaUnit: kelasUnitByKode.get(item.kodeKelas)?.namaUnit || "",
          kelompokMapel: kelompokByKodeMapel.get(item.kodeMapel) || "",
        }))

        const petugas = petugasResult.data
          .map((item) => {
            const idPetugas = toNumber(item.id_petugas ?? item.id, 0)
            return {
              value: idPetugas > 0 ? String(idPetugas) : "",
              label: toText(item.nama_lengkap).trim() || `Petugas #${idPetugas}`,
            }
          })
          .filter((item) => item.value)

        const tahun = tahunResult.data
          .map((item) => ({
            value: toText(item.kode_tahun).trim(),
            label: toText(item.nama_tahun).trim() || toText(item.kode_tahun).trim(),
          }))
          .filter((item) => item.value)

        setKelasMapelOptions(enrichedKelasMapel)
        setKelasOptions(kelas)
        setMapelOptions(mapel)
        setKelompokMapelOptions(kelompokMapel)
        setPetugasOptions(petugas)
        setTahunOptions(tahun)
      } catch {
        setKelasMapelOptions([])
        setKelasOptions([])
        setMapelOptions([])
        setKelompokMapelOptions([])
        setPetugasOptions([])
        setTahunOptions([])
      }
    }

    void loadOptions()
  }, [])

  useEffect(() => {
    void fetchRows()
  }, [
    currentPage,
    rowsPerPage,
    keyword,
    unitFilter,
    kelasFilter,
    mapelFilter,
    petugasFilter,
    tahunFilter,
    hariFilter,
    semesterFilter,
    statusFilter,
  ])

  useEffect(() => {
    if (kelasFilter !== "all" && !kelasFilterOptions.some((option) => option.value === kelasFilter)) {
      setKelasFilter("all")
    }
  }, [kelasFilter, kelasFilterOptions])

  useEffect(() => {
    if (mapelFilter !== "all" && !mapelFilterOptions.some((option) => option.value === mapelFilter)) {
      setMapelFilter("all")
    }
  }, [mapelFilter, mapelFilterOptions])

  useEffect(() => {
    if (!isAddDialogOpen || !formData.idKelasMapel) return

    const selected = kelasMapelById.get(formData.idKelasMapel)
    if (!selected) return

    setFormData((prev) => {
      const nextIdPetugas = selected.idPetugas ? String(selected.idPetugas) : "none"
      if (
        prev.kodeKelas === selected.kodeKelas &&
        prev.kodeMapel === selected.kodeMapel &&
        prev.kelompokMapel === selected.kelompokMapel &&
        prev.idPetugas === nextIdPetugas
      ) {
        return prev
      }

      return {
        ...prev,
        kodeKelas: selected.kodeKelas,
        kodeMapel: selected.kodeMapel,
        kelompokMapel: selected.kelompokMapel,
        idPetugas: nextIdPetugas,
      }
    })
  }, [isAddDialogOpen, formData.idKelasMapel, kelasMapelById])

  useEffect(() => {
    if (!isEditDialogOpen || !editingFormData.idKelasMapel) return

    const selected = kelasMapelById.get(editingFormData.idKelasMapel)
    if (!selected) return

    setEditingFormData((prev) => {
      const nextIdPetugas = selected.idPetugas ? String(selected.idPetugas) : "none"
      if (
        prev.kodeKelas === selected.kodeKelas &&
        prev.kodeMapel === selected.kodeMapel &&
        prev.kelompokMapel === selected.kelompokMapel &&
        prev.idPetugas === nextIdPetugas
      ) {
        return prev
      }

      return {
        ...prev,
        kodeKelas: selected.kodeKelas,
        kodeMapel: selected.kodeMapel,
        kelompokMapel: selected.kelompokMapel,
        idPetugas: nextIdPetugas,
      }
    })
  }, [isEditDialogOpen, editingFormData.idKelasMapel, kelasMapelById])

  const resetFilter = () => {
    setKeyword("")
    setUnitFilter("all")
    setKelasFilter("all")
    setMapelFilter("all")
    setPetugasFilter("all")
    setTahunFilter("all")
    setHariFilter("all")
    setSemesterFilter("all")
    setStatusFilter("all")
    setCurrentPage(1)
  }

  const openDetailDialog = (id: number) => {
    const run = async () => {
      setIsLoading(true)
      try {
        const detail = await dataJadwalPembelajaranService.getById(id)
        setDetailData(resolveRowWithKelasMapel(normalizeRow(detail)))
        setIsDetailDialogOpen(true)
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal memuat detail data jadwal pembelajaran."),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  const openEditDialog = (rowId: number) => {
    const target = resolvedRows.find((row) => row.id === rowId)
    if (!target) return
    const currentKelasMapel = target.idKelasMapel ? kelasMapelById.get(String(target.idKelasMapel)) : null

    setEditingId(rowId)
    setEditingFormData({
      idKelasMapel: target.idKelasMapel ? String(target.idKelasMapel) : "",
      kodeKelas: currentKelasMapel?.kodeKelas || target.kodeKelas || "",
      kodeMapel: currentKelasMapel?.kodeMapel || target.kodeMapel || "",
      kelompokMapel: currentKelasMapel?.kelompokMapel || "",
      idPetugas: currentKelasMapel?.idPetugas ? String(currentKelasMapel.idPetugas) : target.idPetugas ? String(target.idPetugas) : "none",
      tahunAjaran: target.tahunAjaran,
      semester: target.semester === 2 ? "2" : "1",
      hari: toHariValue(target.hari),
      jamMulai: target.jamMulai || "07:00:00",
      jamSelesai: target.jamSelesai || "08:00:00",
      ruangan: target.ruangan,
      keterangan: target.keterangan,
      status: target.status,
    })
    setIsEditDialogOpen(true)
  }

  const handleCreate = () => {
    const run = async () => {
      if (!formData.idKelasMapel || !formData.tahunAjaran || !formData.jamMulai || !formData.jamSelesai) {
        toast({
          title: "Validasi",
          description: "Data kelas mapel, tahun ajaran, jam mulai, dan jam selesai wajib diisi.",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)
      try {
        await dataJadwalPembelajaranService.create({
          id_kelas_mapel: toNumber(formData.idKelasMapel, 0),
          id_petugas: formData.idPetugas === "none" ? null : toNumber(formData.idPetugas, 0) || null,
          tahun_ajaran: formData.tahunAjaran,
          semester: Number(formData.semester),
          hari: formData.hari,
          jam_mulai: toBackendTime(formData.jamMulai),
          jam_selesai: toBackendTime(formData.jamSelesai),
          ruangan: formData.ruangan || null,
          keterangan: formData.keterangan || null,
          status: toBackendStatus(formData.status),
        })

        toast({ title: "Berhasil", description: "Data jadwal pembelajaran berhasil dibuat." })

        setIsAddDialogOpen(false)
        setFormData(defaultFormState)
        setCurrentPage(1)
        await fetchRows()
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal menambahkan data jadwal pembelajaran."),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  const handleUpdate = () => {
    const run = async () => {
      if (!editingId) return
      if (!editingFormData.idKelasMapel || !editingFormData.tahunAjaran || !editingFormData.jamMulai || !editingFormData.jamSelesai) {
        toast({
          title: "Validasi",
          description: "Data kelas mapel, tahun ajaran, jam mulai, dan jam selesai wajib diisi.",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)
      try {
        await dataJadwalPembelajaranService.update(editingId, {
          id_kelas_mapel: toNumber(editingFormData.idKelasMapel, 0),
          id_petugas: editingFormData.idPetugas === "none" ? null : toNumber(editingFormData.idPetugas, 0) || null,
          tahun_ajaran: editingFormData.tahunAjaran,
          semester: Number(editingFormData.semester),
          hari: editingFormData.hari,
          jam_mulai: toBackendTime(editingFormData.jamMulai),
          jam_selesai: toBackendTime(editingFormData.jamSelesai),
          ruangan: editingFormData.ruangan || null,
          keterangan: editingFormData.keterangan || null,
          status: toBackendStatus(editingFormData.status),
        })

        toast({ title: "Berhasil", description: "Data jadwal pembelajaran berhasil diperbarui." })

        setIsEditDialogOpen(false)
        setEditingId(null)
        setEditingFormData(defaultFormState)
        await fetchRows()
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal memperbarui data jadwal pembelajaran."),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  const deleteOne = (id: number) => {
    const run = async () => {
      setIsLoading(true)
      try {
        await dataJadwalPembelajaranService.remove(id)
        toast({ title: "Berhasil", description: "Data jadwal pembelajaran berhasil dihapus." })
        await fetchRows()
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal menghapus data jadwal pembelajaran."),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? visibleRows.map((row) => row.id) : [])
  }

  const toggleSelectRow = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev
        return [...prev, id]
      }
      return prev.filter((item) => item !== id)
    })
  }

  const deleteSelected = () => {
    const run = async () => {
      if (selectedIds.length === 0) return

      const yes = window.confirm(`Hapus ${selectedIds.length} data jadwal pembelajaran terpilih?`)
      if (!yes) return

      setIsLoading(true)
      try {
        const results = await Promise.allSettled(selectedIds.map((id) => dataJadwalPembelajaranService.remove(id)))
        const failed = results.filter((result) => result.status === "rejected").length
        const success = results.length - failed

        if (success > 0) {
          toast({
            title: "Berhasil",
            description: `${success} data jadwal pembelajaran berhasil dihapus.${failed > 0 ? ` ${failed} data gagal dihapus.` : ""}`,
          })
        } else {
          toast({
            title: "Gagal",
            description: "Semua data terpilih gagal dihapus.",
            variant: "destructive",
          })
        }

        await fetchRows()
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  const handleExport = () => {
    const run = async () => {
      try {
        const hasClientOnlyFilter = unitFilter !== "all" || kelasFilter !== "all" || mapelFilter !== "all"
        if (hasClientOnlyFilter) {
          if (visibleRows.length === 0) {
            toast({
              title: "Tidak Ada Data",
              description: "Tidak ada data sesuai filter untuk diekspor.",
              variant: "destructive",
            })
            return
          }

          const csvContent = buildCsvFromRows(visibleRows)
          const csvBlob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
          downloadBlob(csvBlob, `data-jadwal-pembelajaran-${new Date().toISOString().slice(0, 10)}.csv`)
          return
        }

        const blob = await dataJadwalPembelajaranService.exportCsv({
          q: keyword.trim() || undefined,
          id_petugas: petugasFilter === "all" ? undefined : toNumber(petugasFilter, 0),
          tahun_ajaran: tahunFilter === "all" ? undefined : tahunFilter,
          hari: hariFilter === "all" ? undefined : hariFilter,
          semester: semesterFilter === "all" ? undefined : Number(semesterFilter),
          status: statusFilter === "all" ? undefined : toBackendStatus(statusFilter),
        })

        if (blob.size <= 1 && visibleRows.length > 0) {
          const csvContent = buildCsvFromRows(visibleRows)
          const csvBlob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
          downloadBlob(csvBlob, `data-jadwal-pembelajaran-${new Date().toISOString().slice(0, 10)}.csv`)
          return
        }

        downloadBlob(blob, `data-jadwal-pembelajaran-${new Date().toISOString().slice(0, 10)}.csv`)
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal mengekspor data jadwal pembelajaran."),
          variant: "destructive",
        })
      }
    }

    void run()
  }

  const visibleStart = visibleRows.length === 0 ? 0 : (currentPage - 1) * rowsLimit + 1
  const visibleEnd = visibleRows.length === 0 ? 0 : Math.min((currentPage - 1) * rowsLimit + visibleRows.length, totalItems)
  const allSelected = visibleRows.length > 0 && visibleRows.every((row) => selectedIds.includes(row.id))

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">DATA JADWAL PEMBELAJARAN</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 gap-2 px-4">
                <PlusCircle className="h-4 w-4" />
                Tambah
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[900px]">
              <DialogHeader>
                <DialogTitle>Tambah Jadwal Pembelajaran</DialogTitle>
                <DialogDescription>Lengkapi data jadwal pembelajaran baru.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  <div className="space-y-2 min-w-0">
                    <Label>Data Kelas Mapel</Label>
                    <Select value={formData.idKelasMapel} onValueChange={(value) => setFormData((prev) => ({ ...prev, idKelasMapel: value }))}>
                      <SelectTrigger className="w-full min-w-0">
                        <SelectValue className="truncate" placeholder="Pilih data kelas mapel" />
                      </SelectTrigger>
                      <SelectContent>
                        {kelasMapelOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 min-w-0">
                    <Label>Kode Mapel</Label>
                    <Input className="w-full" value={selectedCreateKelasMapel?.kodeMapel || ""} readOnly placeholder="Terisi otomatis" />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <Label>Kode Kelas</Label>
                    <Input className="w-full" value={selectedCreateKelasMapel?.kodeKelas || ""} readOnly placeholder="Terisi otomatis" />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <Label>Kode Unit</Label>
                    <Input className="w-full" value={selectedCreateKelasMapel?.kodeUnit || ""} readOnly placeholder="Terisi otomatis" />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <Label>Petugas</Label>
                    <Input className="w-full" value={selectedCreateKelasMapel?.namaPetugas || "Tanpa Petugas"} readOnly placeholder="Terisi otomatis" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Tahun Ajaran</Label>
                    <Select value={formData.tahunAjaran} onValueChange={(value) => setFormData((prev) => ({ ...prev, tahunAjaran: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tahun" />
                      </SelectTrigger>
                      <SelectContent>
                        {tahunOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Select value={formData.semester} onValueChange={(value) => setFormData((prev) => ({ ...prev, semester: value as SemesterValue }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Hari</Label>
                    <Select value={formData.hari} onValueChange={(value) => setFormData((prev) => ({ ...prev, hari: value as HariValue }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih hari" />
                      </SelectTrigger>
                      <SelectContent>
                        {hariOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as UiStatus }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Aktif">Aktif</SelectItem>
                        <SelectItem value="Nonaktif">Nonaktif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-jam-mulai">Jam Mulai</Label>
                    <Input
                      id="create-jam-mulai"
                      type="time"
                      step={1}
                      value={formData.jamMulai}
                      onChange={(event) => setFormData((prev) => ({ ...prev, jamMulai: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-jam-selesai">Jam Selesai</Label>
                    <Input
                      id="create-jam-selesai"
                      type="time"
                      step={1}
                      value={formData.jamSelesai}
                      onChange={(event) => setFormData((prev) => ({ ...prev, jamSelesai: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-ruang">Ruangan</Label>
                    <Input
                      id="create-ruang"
                      value={formData.ruangan}
                      onChange={(event) => setFormData((prev) => ({ ...prev, ruangan: event.target.value }))}
                      placeholder="Contoh: A1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-keterangan">Keterangan</Label>
                    <Input
                      id="create-keterangan"
                      value={formData.keterangan}
                      onChange={(event) => setFormData((prev) => ({ ...prev, keterangan: event.target.value }))}
                      placeholder="Catatan tambahan"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Batal
                </Button>
                <Button disabled={isLoading} onClick={handleCreate}>
                  Simpan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Link href="/dashboard/jadwal-pembelajaran/import">
            <Button className="h-10 gap-2 px-4" variant="default">
              <Upload className="h-4 w-4" />
              Impor
            </Button>
          </Link>

          <Button className="h-10 gap-2 px-4" variant="default" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Ekspor 
          </Button>
        </div>
      </div>

      <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <button type="button" className="flex w-full items-center justify-between px-6 py-5 text-left">
              <span className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-foreground">
                <Filter className="h-5 w-5" />
                Filter Data
              </span>
              <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", isFilterOpen && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="border-t pt-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-9">
                <div className="space-y-2 min-w-0">
                  <Label htmlFor="jadwal-keyword">Kata Kunci</Label>
                  <Input
                    id="jadwal-keyword"
                    placeholder="Cari kelas/mapel"
                    value={keyword}
                    onChange={(event) => {
                      setKeyword(event.target.value)
                      setCurrentPage(1)
                    }}
                  />
                </div>
                <div className="space-y-2 min-w-0">
                  <Label>Kode Unit</Label>
                  <Select value={unitFilter} onValueChange={(value) => { setUnitFilter(value); setCurrentPage(1) }}>
                    <SelectTrigger className="w-full min-w-0">
                      <SelectValue className="truncate" placeholder="Pilih kode unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Unit</SelectItem>
                      {unitFilterOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.value} - {option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 min-w-0">
                  <Label>Kode Kelas</Label>
                  <Select value={kelasFilter} onValueChange={(value) => { setKelasFilter(value); setCurrentPage(1) }}>
                    <SelectTrigger className="w-full min-w-0">
                      <SelectValue className="truncate" placeholder="Pilih kode kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kelas</SelectItem>
                      {kelasFilterOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.value} - {option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 min-w-0">
                  <Label>Mapel</Label>
                  <Select value={mapelFilter} onValueChange={(value) => { setMapelFilter(value); setCurrentPage(1) }}>
                    <SelectTrigger className="w-full min-w-0">
                      <SelectValue className="truncate" placeholder="Pilih mapel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Mapel</SelectItem>
                      {mapelFilterOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.value} - {option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 min-w-0">
                  <Label>Petugas</Label>
                  <Select value={petugasFilter} onValueChange={(value) => { setPetugasFilter(value); setCurrentPage(1) }}>
                    <SelectTrigger className="w-full min-w-0">
                      <SelectValue className="truncate" placeholder="Pilih petugas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Petugas</SelectItem>
                      {petugasOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 min-w-0">
                  <Label>Tahun Ajaran</Label>
                  <Select value={tahunFilter} onValueChange={(value) => { setTahunFilter(value); setCurrentPage(1) }}>
                    <SelectTrigger className="w-full min-w-0">
                      <SelectValue className="truncate" placeholder="Pilih tahun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Tahun</SelectItem>
                      {tahunOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 min-w-0">
                  <Label>Hari</Label>
                  <Select value={hariFilter} onValueChange={(value) => { setHariFilter(value); setCurrentPage(1) }}>
                    <SelectTrigger className="w-full min-w-0">
                      <SelectValue className="truncate" placeholder="Pilih hari" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Hari</SelectItem>
                      {hariOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 min-w-0">
                  <Label>Semester</Label>
                  <Select value={semesterFilter} onValueChange={(value) => { setSemesterFilter(value); setCurrentPage(1) }}>
                    <SelectTrigger className="w-full min-w-0">
                      <SelectValue className="truncate" placeholder="Pilih semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Semester</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 min-w-0">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value as UiStatus | "all"); setCurrentPage(1) }}>
                    <SelectTrigger className="w-full min-w-0">
                      <SelectValue className="truncate" placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="Aktif">Aktif</SelectItem>
                      <SelectItem value="Nonaktif">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Button variant="outline" onClick={resetFilter}>Reset Filter</Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-10 gap-2 px-4" variant="outline" disabled={isLoading || selectedIds.length === 0}>
                  Aksi Masal
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Aksi Data Terpilih</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={deleteSelected}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus Terpilih ({selectedIds.length})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Select value={rowsPerPage} onValueChange={(value) => { setRowsPerPage(value); setCurrentPage(1) }}>
              <SelectTrigger className="h-10 w-full sm:w-[88px]">
                <SelectValue placeholder="25" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-lg border bg-background">
            <Table className="min-w-[1300px]">
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-10 text-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={allSelected}
                      onChange={(event) => toggleSelectAll(event.target.checked)}
                    />
                  </TableHead>
                  <TableHead className="w-12 text-xs font-semibold uppercase tracking-wide text-muted-foreground">#</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">KODE KELAS</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">KELAS</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">KODE MAPEL</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">MAPEL</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">HARI</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">JAM</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">PETUGAS</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">TAHUN/SEM</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">RUANG</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">STATUS</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">AKSI</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {visibleRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="py-10 text-center text-muted-foreground">
                      {isLoading ? "Memuat data jadwal pembelajaran..." : "Data jadwal pembelajaran tidak ditemukan."}
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleRows.map((row, index) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={selectedIds.includes(row.id)}
                          onChange={(event) => toggleSelectRow(row.id, event.target.checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{(currentPage - 1) * rowsLimit + index + 1}</TableCell>
                      <TableCell>{row.kodeKelas || "-"}</TableCell>
                      <TableCell>{row.namaKelas || row.kodeKelas || "-"}</TableCell>
                      <TableCell>{row.kodeMapel || "-"}</TableCell>
                      <TableCell>{row.namaMapel || row.kodeMapel || "-"}</TableCell>
                      <TableCell>{row.hari || "-"}</TableCell>
                      <TableCell className="font-mono text-sm tabular-nums">{row.jamMulai && row.jamSelesai ? `${row.jamMulai} - ${row.jamSelesai}` : "-"}</TableCell>
                      <TableCell>{row.namaPetugas || "-"}</TableCell>
                      <TableCell>{row.tahunAjaran || "-"} / {row.semester || "-"}</TableCell>
                      <TableCell>{row.ruangan || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={row.status === "Aktif" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}>
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-1 px-2 text-xs font-semibold">
                              <MoreVertical className="h-3.5 w-3.5" />
                              AKSI
                              <ChevronDown className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi Jadwal Pembelajaran</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openDetailDialog(row.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(row.id)}>
                              <PencilLine className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                const yes = window.confirm("Hapus data jadwal pembelajaran ini?")
                                if (yes) deleteOne(row.id)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">Tampil {visibleStart}-{visibleEnd} dari {totalItems}</p>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                Previous
              </Button>
              <Button size="sm" className="h-8 min-w-8 px-2">{currentPage}</Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) {
            setEditingId(null)
            setEditingFormData(defaultFormState)
          }
        }}
      >
        <DialogContent className="sm:max-w-[760px]">
          <DialogHeader>
            <DialogTitle>Edit Jadwal Pembelajaran</DialogTitle>
            <DialogDescription>Perbarui data jadwal pembelajaran terpilih.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <div className="space-y-2 min-w-0">
                <Label>Data Kelas Mapel</Label>
                <Select value={editingFormData.idKelasMapel} onValueChange={(value) => setEditingFormData((prev) => ({ ...prev, idKelasMapel: value }))}>
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue className="truncate" placeholder="Pilih data kelas mapel" />
                  </SelectTrigger>
                  <SelectContent>
                    {kelasMapelOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 min-w-0">
                <Label>Kode Mapel</Label>
                <Input className="w-full" value={selectedEditKelasMapel?.kodeMapel || ""} readOnly placeholder="Terisi otomatis" />
              </div>
              <div className="space-y-2 min-w-0">
                <Label>Kode Kelas</Label>
                <Input className="w-full" value={selectedEditKelasMapel?.kodeKelas || ""} readOnly placeholder="Terisi otomatis" />
              </div>
              <div className="space-y-2 min-w-0">
                <Label>Kode Unit</Label>
                <Input className="w-full" value={selectedEditKelasMapel?.kodeUnit || ""} readOnly placeholder="Terisi otomatis" />
              </div>
              <div className="space-y-2 min-w-0">
                <Label>Petugas</Label>
                <Input className="w-full" value={selectedEditKelasMapel?.namaPetugas || "Tanpa Petugas"} readOnly placeholder="Terisi otomatis" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Tahun Ajaran</Label>
                <Select value={editingFormData.tahunAjaran} onValueChange={(value) => setEditingFormData((prev) => ({ ...prev, tahunAjaran: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {tahunOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Semester</Label>
                <Select value={editingFormData.semester} onValueChange={(value) => setEditingFormData((prev) => ({ ...prev, semester: value as SemesterValue }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hari</Label>
                <Select value={editingFormData.hari} onValueChange={(value) => setEditingFormData((prev) => ({ ...prev, hari: value as HariValue }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih hari" />
                  </SelectTrigger>
                  <SelectContent>
                    {hariOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editingFormData.status} onValueChange={(value) => setEditingFormData((prev) => ({ ...prev, status: value as UiStatus }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aktif">Aktif</SelectItem>
                    <SelectItem value="Nonaktif">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="edit-jam-mulai">Jam Mulai</Label>
                <Input
                  id="edit-jam-mulai"
                  type="time"
                  step={1}
                  value={editingFormData.jamMulai}
                  onChange={(event) => setEditingFormData((prev) => ({ ...prev, jamMulai: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-jam-selesai">Jam Selesai</Label>
                <Input
                  id="edit-jam-selesai"
                  type="time"
                  step={1}
                  value={editingFormData.jamSelesai}
                  onChange={(event) => setEditingFormData((prev) => ({ ...prev, jamSelesai: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-ruang">Ruangan</Label>
                <Input
                  id="edit-ruang"
                  value={editingFormData.ruangan}
                  onChange={(event) => setEditingFormData((prev) => ({ ...prev, ruangan: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-keterangan">Keterangan</Label>
                <Input
                  id="edit-keterangan"
                  value={editingFormData.keterangan}
                  onChange={(event) => setEditingFormData((prev) => ({ ...prev, keterangan: event.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Batal</Button>
            <Button disabled={isLoading} onClick={handleUpdate}>Simpan Perubahan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>Detail Jadwal Pembelajaran</DialogTitle>
            <DialogDescription>Informasi lengkap data jadwal pembelajaran terpilih.</DialogDescription>
          </DialogHeader>

          {!detailData ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Memuat detail data...</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 py-3 md:grid-cols-2">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Kode Kelas</p>
                <p className="font-medium">{detailData.kodeKelas || "-"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Kelas</p>
                <p className="font-medium">{detailData.namaKelas || detailData.kodeKelas || "-"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Kode Mapel</p>
                <p className="font-medium">{detailData.kodeMapel || "-"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Mapel</p>
                <p className="font-medium">{detailData.namaMapel || detailData.kodeMapel || "-"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Petugas</p>
                <p className="font-medium">{detailData.namaPetugas || "-"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Tahun/Semester</p>
                <p className="font-medium">{detailData.tahunAjaran || "-"} / {detailData.semester || "-"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Hari</p>
                <p className="font-medium">{detailData.hari || "-"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Jam</p>
                <p className="font-medium font-mono tabular-nums">{detailData.jamMulai && detailData.jamSelesai ? `${detailData.jamMulai} - ${detailData.jamSelesai}` : "-"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Ruang</p>
                <p className="font-medium">{detailData.ruangan || "-"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-medium">{detailData.status}</p>
              </div>
              <div className="rounded-lg border p-3 md:col-span-2">
                <p className="text-xs text-muted-foreground">Keterangan</p>
                <p className="font-medium">{detailData.keterangan || "-"}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
