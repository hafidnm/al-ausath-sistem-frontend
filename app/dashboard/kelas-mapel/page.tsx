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
import {
  BackendStatus,
  dataKelasMapelService,
  DataKelasMapelApiItem,
} from "@/lib/services/kelas-mapel.service"
import { dataKelasService } from "@/lib/services/kelas.service"
import { dataMataPelajaranService } from "@/lib/services/mata-pelajaran.service"
import { dataPetugasService } from "@/lib/services/petugas.service"
import { tahunAjaranService } from "@/lib/services/tahun-ajaran.service"
import { ChevronDown, Download, Eye, Filter, MoreVertical, PencilLine, PlusCircle, Trash2, Upload } from "lucide-react"

type UiStatus = "Aktif" | "Nonaktif"

interface KelasMapelRow {
  id: number
  kodeKelas: string
  namaKelas: string
  kodeMapel: string
  namaMapel: string
  idPetugas: number | null
  namaPetugas: string
  tahunAjaran: string
  semester: number
  bukuAcuan: string
  status: UiStatus
}

interface KelasMapelFormData {
  kodeKelas: string
  kodeMapel: string
  idPetugas: string
  tahunAjaran: string
  semester: "1" | "2"
  bukuAcuan: string
  status: UiStatus
}

interface KelasOption {
  value: string
  label: string
  kodeUnit: string
  tahunAjaran: string
}

interface TahunAjaranOption {
  value: string
  label: string
}

interface UnitOption {
  value: string
  label: string
}

interface PetugasOption {
  value: string
  label: string
}

interface MapelOption {
  value: string
  label: string
  kodeUnit: string
}

const defaultFormState: KelasMapelFormData = {
  kodeKelas: "",
  kodeMapel: "",
  idPetugas: "",
  tahunAjaran: "",
  semester: "1",
  bukuAcuan: "",
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

const normalizeRow = (raw: DataKelasMapelApiItem): KelasMapelRow => ({
  id: toNumber(raw.id_kelas_mapel ?? raw.id, -1),
  kodeKelas: toText(raw.kode_kelas || raw.kelas?.kode_kelas),
  namaKelas: toText(raw.nama_kelas || raw.kelas?.nama_kelas),
  kodeMapel: toText(raw.kode_mapel || raw.mapel?.kode_mapel || raw.mata_pelajaran?.kode_mapel || raw.mataPelajaran?.kode_mapel),
  namaMapel: toText(raw.nama_mapel || raw.mapel?.nama_mapel || raw.mata_pelajaran?.nama_mapel || raw.mataPelajaran?.nama_mapel),
  idPetugas: raw.id_petugas == null ? null : toNumber(raw.id_petugas, 0) || null,
  namaPetugas: toText(raw.petugas?.nama_lengkap),
  tahunAjaran: toText(raw.tahun_ajaran),
  semester: toNumber(raw.semester, 1),
  bukuAcuan: toText(raw.buku_acuan),
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

export default function MapelPage() {
  const { toast } = useToast()

  const [rows, setRows] = useState<KelasMapelRow[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [detailData, setDetailData] = useState<KelasMapelRow | null>(null)

  const [formData, setFormData] = useState<KelasMapelFormData>(defaultFormState)
  const [editingFormData, setEditingFormData] = useState<KelasMapelFormData>(defaultFormState)

  const [kelasOptions, setKelasOptions] = useState<KelasOption[]>([])
  const [mapelOptions, setMapelOptions] = useState<MapelOption[]>([])
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([])
  const [tahunOptions, setTahunOptions] = useState<TahunAjaranOption[]>([])
  const [petugasOptions, setPetugasOptions] = useState<PetugasOption[]>([])

  const [keyword, setKeyword] = useState("")
  const [unitFilter, setUnitFilter] = useState("all")
  const [kelasFilter, setKelasFilter] = useState("all")
  const [petugasFilter, setPetugasFilter] = useState("all")
  const [tahunFilter, setTahunFilter] = useState("all")
  const [semesterFilter, setSemesterFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<UiStatus | "all">("all")
  const [formUnitFilter, setFormUnitFilter] = useState("all")
  const [editUnitFilter, setEditUnitFilter] = useState("all")

  const [rowsPerPage, setRowsPerPage] = useState("25")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const rowsLimit = Number(rowsPerPage)

  const kelasByUnit = useMemo(() => {
    if (unitFilter === "all") return kelasOptions
    return kelasOptions.filter((option) => option.kodeUnit === unitFilter)
  }, [kelasOptions, unitFilter])

  const formKelasByUnit = useMemo(() => {
    if (formUnitFilter === "all") return kelasOptions
    return kelasOptions.filter((option) => option.kodeUnit === formUnitFilter)
  }, [kelasOptions, formUnitFilter])

  const formMapelByUnit = useMemo(() => {
    if (formUnitFilter === "all") return mapelOptions
    // Mapel dengan kodeUnit kosong (lintas unit) selalu ditampilkan
    return mapelOptions.filter((option) => !option.kodeUnit || option.kodeUnit === formUnitFilter)
  }, [mapelOptions, formUnitFilter])

  const editKelasByUnit = useMemo(() => {
    if (editUnitFilter === "all") return kelasOptions
    return kelasOptions.filter((option) => option.kodeUnit === editUnitFilter)
  }, [kelasOptions, editUnitFilter])

  const editMapelByUnit = useMemo(() => {
    if (editUnitFilter === "all") return mapelOptions
    // Mapel dengan kodeUnit kosong (lintas unit) selalu ditampilkan
    return mapelOptions.filter((option) => !option.kodeUnit || option.kodeUnit === editUnitFilter)
  }, [mapelOptions, editUnitFilter])

  const kelasUnitMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const option of kelasOptions) {
      if (!option.value) continue
      map.set(option.value, option.kodeUnit)
    }
    return map
  }, [kelasOptions])

  const kelasTahunMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const option of kelasOptions) {
      if (!option.value) continue
      map.set(option.value, option.tahunAjaran)
    }
    return map
  }, [kelasOptions])

  const visibleRows = useMemo(() => {
    let nextRows = rows

    if (semesterFilter !== "all") {
      const semester = Number(semesterFilter)
      nextRows = nextRows.filter((row) => row.semester === semester)
    }

    if (unitFilter !== "all") {
      nextRows = nextRows.filter((row) => kelasUnitMap.get(row.kodeKelas) === unitFilter)
    }

    return nextRows
  }, [rows, semesterFilter, unitFilter, kelasUnitMap])

  const fetchRows = async () => {
    setIsLoading(true)
    try {
      const params: {
        page: number
        per_page: number
        q?: string
        kode_kelas?: string
        kode_mapel?: string
        id_petugas?: number
        tahun_ajaran?: string
        semester?: number
        status?: BackendStatus
      } = {
        page: currentPage,
        per_page: rowsLimit,
      }

      const q = keyword.trim()
      if (q) params.q = q
      if (kelasFilter !== "all") params.kode_kelas = kelasFilter
      if (petugasFilter !== "all") params.id_petugas = toNumber(petugasFilter, 0)
      if (tahunFilter !== "all") params.tahun_ajaran = tahunFilter
      if (semesterFilter !== "all") params.semester = Number(semesterFilter)
      if (statusFilter !== "all") params.status = toBackendStatus(statusFilter)

      const result = await dataKelasMapelService.getAll(params)
      const mappedRows = result.data.map(normalizeRow).filter((row) => row.id > 0)

      setRows(mappedRows)
      setSelectedIds((prev) => prev.filter((id) => mappedRows.some((row) => row.id === id)))
      setTotalItems(toNumber(result.meta?.total, mappedRows.length))
      setTotalPages(Math.max(1, toNumber(result.meta?.last_page, 1)))
      setCurrentPage(toNumber(result.meta?.current_page, currentPage))
    } catch (error) {
      toast({
        title: "Gagal Memuat Data",
        description: getErrorMessage(error, "Data kelas mapel gagal dimuat."),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [kelasResult, mapelResult, tahunResult, petugasResult] = await Promise.all([
          dataKelasService.getAll({ page: 1, per_page: 500 }),
          dataMataPelajaranService.getAll({ page: 1, per_page: 500 }),
          tahunAjaranService.getAll({ page: 1, per_page: 200 }),
          dataPetugasService.getAll({ page: 1, per_page: 200 }),
        ])

        const kelas: KelasOption[] = []
        const units: UnitOption[] = []
        const unitSeen = new Set<string>()
        for (const item of kelasResult.data) {
          const kode = toText(item.kode_kelas).trim()
          const kodeUnit = toText(item.kode_unit || item.unit?.kode_unit).trim().toUpperCase()
          const tahunAjaran = toText(
            item.tahun_ajaran ?? item.tahun_ajaran_relasi?.kode_tahun ?? item.tahunAjaranRelasi?.kode_tahun,
          ).trim()
          if (!kode) continue
          kelas.push({ value: kode, label: toText(item.nama_kelas).trim() || kode, kodeUnit, tahunAjaran })

          if (kodeUnit && !unitSeen.has(kodeUnit)) {
            unitSeen.add(kodeUnit)
            units.push({
              value: kodeUnit,
              label: toText(item.unit?.nama_unit).trim() || kodeUnit,
            })
          }
        }

        const years: TahunAjaranOption[] = []
        for (const item of tahunResult.data) {
          const kode = toText(item.kode_tahun).trim()
          if (!kode) continue
          years.push({ value: kode, label: toText(item.nama_tahun).trim() || kode })
        }

        const mapel: MapelOption[] = []
        for (const item of mapelResult.data) {
          const kode = toText(item.kode_mapel).trim().toUpperCase()
          if (!kode) continue
          mapel.push({
            value: kode,
            label: toText(item.nama_mapel).trim() || kode,
            kodeUnit: toText(item.kode_unit).trim().toUpperCase(),
          })
        }

        const petugas: PetugasOption[] = []
        for (const item of petugasResult.data) {
          const idPetugas = toNumber(item.id_petugas ?? item.id, 0)
          if (idPetugas <= 0) continue
          petugas.push({
            value: String(idPetugas),
            label: toText(item.nama_lengkap).trim() || `Petugas #${idPetugas}`,
          })
        }

        setKelasOptions(kelas)
        setMapelOptions(mapel)
        setUnitOptions(units)
        setTahunOptions(years)
        setPetugasOptions(petugas)
      } catch {
        setKelasOptions([])
        setMapelOptions([])
        setUnitOptions([])
        setTahunOptions([])
        setPetugasOptions([])
      }
    }

    void loadOptions()
  }, [])

  useEffect(() => {
    if (kelasFilter !== "all" && !kelasByUnit.some((option) => option.value === kelasFilter)) {
      setKelasFilter("all")
      setCurrentPage(1)
      return
    }

    void fetchRows()
  }, [currentPage, rowsPerPage, keyword, unitFilter, kelasFilter, petugasFilter, tahunFilter, semesterFilter, statusFilter, kelasByUnit])

  useEffect(() => {
    if (!formData.kodeKelas) return
    if (!formKelasByUnit.some((option) => option.value === formData.kodeKelas)) {
      setFormData((prev) => ({ ...prev, kodeKelas: "", tahunAjaran: "" }))
    }
  }, [formData.kodeKelas, formKelasByUnit])

  useEffect(() => {
    if (!formData.kodeMapel) return
    if (!formMapelByUnit.some((option) => option.value === formData.kodeMapel)) {
      setFormData((prev) => ({ ...prev, kodeMapel: "" }))
    }
  }, [formData.kodeMapel, formMapelByUnit])

  // Auto-fill tahun ajaran dari kelas yang dipilih (form tambah)
  useEffect(() => {
    if (!formData.kodeKelas) {
      setFormData((prev) => (prev.tahunAjaran === "" ? prev : { ...prev, tahunAjaran: "" }))
      return
    }
    const tahun = kelasTahunMap.get(formData.kodeKelas) || ""
    setFormData((prev) => (prev.tahunAjaran === tahun ? prev : { ...prev, tahunAjaran: tahun }))
  }, [formData.kodeKelas, kelasTahunMap])

  useEffect(() => {
    if (!editingFormData.kodeKelas) return
    if (!editKelasByUnit.some((option) => option.value === editingFormData.kodeKelas)) {
      setEditingFormData((prev) => ({ ...prev, kodeKelas: "", tahunAjaran: "" }))
    }
  }, [editingFormData.kodeKelas, editKelasByUnit])

  useEffect(() => {
    if (!editingFormData.kodeMapel) return
    if (!editMapelByUnit.some((option) => option.value === editingFormData.kodeMapel)) {
      setEditingFormData((prev) => ({ ...prev, kodeMapel: "" }))
    }
  }, [editingFormData.kodeMapel, editMapelByUnit])

  // Auto-fill tahun ajaran dari kelas yang dipilih (form edit)
  useEffect(() => {
    if (!isEditDialogOpen || !editingFormData.kodeKelas) return
    const tahun = kelasTahunMap.get(editingFormData.kodeKelas) || ""
    setEditingFormData((prev) => (prev.tahunAjaran === tahun ? prev : { ...prev, tahunAjaran: tahun }))
  }, [isEditDialogOpen, editingFormData.kodeKelas, kelasTahunMap])

  const resetFilter = () => {
    setKeyword("")
    setUnitFilter("all")
    setKelasFilter("all")
    setPetugasFilter("all")
    setTahunFilter("all")
    setSemesterFilter("all")
    setStatusFilter("all")
    setCurrentPage(1)
  }

  const openDetailDialog = (id: number) => {
    const run = async () => {
      setIsLoading(true)
      try {
        const detail = await dataKelasMapelService.getById(id)
        setDetailData(normalizeRow(detail))
        setIsDetailDialogOpen(true)
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal memuat detail data kelas mapel."),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  const openEditDialog = (rowId: number) => {
    const target = rows.find((row) => row.id === rowId)
    if (!target) return

    setEditingId(rowId)
    setEditingFormData({
      kodeKelas: target.kodeKelas,
      kodeMapel: target.kodeMapel,
      idPetugas: target.idPetugas ? String(target.idPetugas) : "",
      tahunAjaran: target.tahunAjaran,
      semester: target.semester === 2 ? "2" : "1",
      bukuAcuan: target.bukuAcuan,
      status: target.status,
    })
    setEditUnitFilter(kelasUnitMap.get(target.kodeKelas) || "all")
    setIsEditDialogOpen(true)
  }

  const handleCreate = () => {
    const run = async () => {
      if (!formData.kodeKelas || !formData.kodeMapel.trim() || !formData.tahunAjaran || !formData.idPetugas || formData.idPetugas === "none") {
        toast({
          title: "Validasi",
          description: "Kode kelas, kode mapel, tahun ajaran, dan petugas wajib diisi.",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)
      try {
        await dataKelasMapelService.create({
          kode_kelas: formData.kodeKelas,
          kode_mapel: formData.kodeMapel,
          id_petugas: formData.idPetugas === "none" ? null : toNumber(formData.idPetugas, 0) || null,
          tahun_ajaran: formData.tahunAjaran,
          semester: Number(formData.semester),
          buku_acuan: formData.bukuAcuan || null,
          status: toBackendStatus(formData.status),
        })

        toast({
          title: "Berhasil",
          description: "Data kelas mapel berhasil dibuat.",
        })

        setIsAddDialogOpen(false)
        setFormData(defaultFormState)
        setCurrentPage(1)
        await fetchRows()
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal menambahkan data kelas mapel."),
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
      if (!editingFormData.kodeKelas || !editingFormData.kodeMapel.trim() || !editingFormData.tahunAjaran || !editingFormData.idPetugas || editingFormData.idPetugas === "none") {
        toast({
          title: "Validasi",
          description: "Kode kelas, kode mapel, tahun ajaran, dan petugas wajib diisi.",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)
      try {
        await dataKelasMapelService.update(editingId, {
          kode_kelas: editingFormData.kodeKelas,
          kode_mapel: editingFormData.kodeMapel,
          id_petugas: editingFormData.idPetugas === "none" ? null : toNumber(editingFormData.idPetugas, 0) || null,
          tahun_ajaran: editingFormData.tahunAjaran,
          semester: Number(editingFormData.semester),
          buku_acuan: editingFormData.bukuAcuan || null,
          status: toBackendStatus(editingFormData.status),
        })

        toast({
          title: "Berhasil",
          description: "Data kelas mapel berhasil diperbarui.",
        })

        setIsEditDialogOpen(false)
        setEditingId(null)
        setEditingFormData(defaultFormState)
        await fetchRows()
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal memperbarui data kelas mapel."),
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
        await dataKelasMapelService.remove(id)
        toast({
          title: "Berhasil",
          description: "Data kelas mapel berhasil dihapus.",
        })
        await fetchRows()
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal menghapus data kelas mapel."),
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
      if (selectedIds.length === 0) {
        toast({
          title: "Tidak Ada Data Terpilih",
          description: "Pilih minimal satu data untuk dihapus.",
          variant: "destructive",
        })
        return
      }

      const yes = window.confirm(`Hapus ${selectedIds.length} data kelas mapel terpilih?`)
      if (!yes) return

      setIsLoading(true)
      try {
        const results = await Promise.allSettled(selectedIds.map((id) => dataKelasMapelService.remove(id)))
        const failed = results.filter((result) => result.status === "rejected").length
        const success = results.length - failed

        if (success > 0) {
          toast({
            title: "Berhasil",
            description: `${success} data kelas mapel berhasil dihapus.${failed > 0 ? ` ${failed} data gagal dihapus.` : ""}`,
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
        const blob = await dataKelasMapelService.exportCsv({
          q: keyword.trim() || undefined,
          kode_kelas: kelasFilter === "all" ? undefined : kelasFilter,
          id_petugas: petugasFilter === "all" ? undefined : toNumber(petugasFilter, 0),
          tahun_ajaran: tahunFilter === "all" ? undefined : tahunFilter,
          semester: semesterFilter === "all" ? undefined : Number(semesterFilter),
          status: statusFilter === "all" ? undefined : toBackendStatus(statusFilter),
        })

        downloadBlob(blob, `data-kelas-mapel-${new Date().toISOString().slice(0, 10)}.csv`)
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal mengekspor data kelas mapel."),
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
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">DATA KELAS MAPEL</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 gap-2 px-4">
                <PlusCircle className="h-4 w-4" />
                Tambah
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Tambah Data Kelas Mapel</DialogTitle>
                <DialogDescription>Lengkapi data kelas mapel baru.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Kode Unit</Label>
                    <Select value={formUnitFilter} onValueChange={setFormUnitFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Unit</SelectItem>
                        {unitOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.value} - {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Kelas</Label>
                    <Select value={formData.kodeKelas} onValueChange={(value) => setFormData((prev) => ({ ...prev, kodeKelas: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kelas" />
                      </SelectTrigger>
                      <SelectContent>
                        {formKelasByUnit.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Kode Mapel</Label>
                    <Select value={formData.kodeMapel} onValueChange={(value) => setFormData((prev) => ({ ...prev, kodeMapel: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kode mapel" />
                      </SelectTrigger>
                      <SelectContent>
                        {formMapelByUnit.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.value} - {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>
                      Petugas <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.idPetugas}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, idPetugas: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih petugas" />
                      </SelectTrigger>
                      <SelectContent>
                        {petugasOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-buku-acuan">Buku Acuan</Label>
                    <Input
                      id="create-buku-acuan"
                      value={formData.bukuAcuan}
                      onChange={(event) => setFormData((prev) => ({ ...prev, bukuAcuan: event.target.value }))}
                      placeholder="Contoh: Buku Paket Matematika"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Tahun Ajaran</Label>
                    <Input
                      value={formData.tahunAjaran || ""}
                      readOnly
                      placeholder={formData.kodeKelas ? "Tidak tersedia" : "Pilih kelas dahulu"}
                      className="bg-muted/50 cursor-not-allowed"
                    />
                    {formData.kodeKelas && !formData.tahunAjaran && (
                      <p className="text-xs text-amber-600">Tahun ajaran tidak ditemukan untuk kelas ini.</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Select
                      value={formData.semester}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, semester: value as "1" | "2" }))}
                    >
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
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as UiStatus }))}
                    >
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

          <Link href="/dashboard/kelas-mapel/import">
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-7">
                <div className="space-y-2">
                  <Label htmlFor="mapel-keyword">Kata Kunci</Label>
                  <Input
                    id="mapel-keyword"
                    placeholder="Cari kode mapel / nama mapel"
                    value={keyword}
                    onChange={(event) => {
                      setKeyword(event.target.value)
                      setCurrentPage(1)
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kode Unit</Label>
                  <Select
                    value={unitFilter}
                    onValueChange={(value) => {
                      setUnitFilter(value)
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Unit</SelectItem>
                      {unitOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.value} - {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Kelas</Label>
                  <Select
                    value={kelasFilter}
                    onValueChange={(value) => {
                      setKelasFilter(value)
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kelas</SelectItem>
                      {kelasByUnit.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nama Petugas</Label>
                  <Select
                    value={petugasFilter}
                    onValueChange={(value) => {
                      setPetugasFilter(value)
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih petugas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Petugas</SelectItem>
                      {petugasOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tahun Ajaran</Label>
                  <Select
                    value={tahunFilter}
                    onValueChange={(value) => {
                      setTahunFilter(value)
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tahun ajaran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Tahun</SelectItem>
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
                  <Select
                    value={semesterFilter}
                    onValueChange={(value) => {
                      setSemesterFilter(value)
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Semester</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value as UiStatus | "all")
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
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
                <Button variant="outline" onClick={resetFilter}>
                  Reset Filter
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
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
              <div className="text-sm text-muted-foreground">Opsional mapel tersedia: {mapelOptions.length}</div>
            </div>

            <Select
              value={rowsPerPage}
              onValueChange={(value) => {
                setRowsPerPage(value)
                setCurrentPage(1)
              }}
            >
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
            <Table className="min-w-[1000px]">
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
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">NAMA KELAS</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">KODE MAPEL</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">NAMA MAPEL</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">NAMA PETUGAS</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">TAHUN AJARAN</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">SEMESTER</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">STATUS</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">AKSI</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {visibleRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="py-10 text-center text-muted-foreground">
                      {isLoading ? "Memuat data kelas mapel..." : "Data kelas mapel tidak ditemukan."}
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
                      <TableCell>{row.namaKelas || "-"}</TableCell>
                      <TableCell>{row.kodeMapel || "-"}</TableCell>
                      <TableCell>{row.namaMapel || "-"}</TableCell>
                      <TableCell>{row.namaPetugas || "-"}</TableCell>
                      <TableCell>{row.tahunAjaran || "-"}</TableCell>
                      <TableCell>{row.semester || "-"}</TableCell>
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
                            <DropdownMenuLabel>Aksi Kelas Mapel</DropdownMenuLabel>
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
                                const yes = window.confirm("Hapus data kelas mapel ini?")
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
              <Button size="sm" className="h-8 min-w-8 px-2">
                {currentPage}
              </Button>
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Data Kelas Mapel</DialogTitle>
            <DialogDescription>Perbarui data kelas mapel terpilih.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Kode Unit</Label>
                <Select value={editUnitFilter} onValueChange={setEditUnitFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Unit</SelectItem>
                    {unitOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.value} - {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kelas</Label>
                <Select
                  value={editingFormData.kodeKelas}
                  onValueChange={(value) => setEditingFormData((prev) => ({ ...prev, kodeKelas: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {editKelasByUnit.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kode Mapel</Label>
                <Select
                  value={editingFormData.kodeMapel}
                  onValueChange={(value) => setEditingFormData((prev) => ({ ...prev, kodeMapel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kode mapel" />
                  </SelectTrigger>
                  <SelectContent>
                    {editMapelByUnit.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.value} - {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Petugas <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={editingFormData.idPetugas}
                  onValueChange={(value) => setEditingFormData((prev) => ({ ...prev, idPetugas: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih petugas (wajib)" />
                  </SelectTrigger>
                  <SelectContent>
                    {petugasOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-buku-acuan">Buku Acuan</Label>
                <Input
                  id="edit-buku-acuan"
                  value={editingFormData.bukuAcuan}
                  onChange={(event) => setEditingFormData((prev) => ({ ...prev, bukuAcuan: event.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Tahun Ajaran</Label>
                <Input
                  value={editingFormData.tahunAjaran || ""}
                  readOnly
                  placeholder={editingFormData.kodeKelas ? "Tidak tersedia" : "Pilih kelas dahulu"}
                  className="bg-muted/50 cursor-not-allowed"
                />
                {editingFormData.kodeKelas && !editingFormData.tahunAjaran && (
                  <p className="text-xs text-amber-600">Tahun ajaran tidak ditemukan untuk kelas ini.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Semester</Label>
                <Select
                  value={editingFormData.semester}
                  onValueChange={(value) => setEditingFormData((prev) => ({ ...prev, semester: value as "1" | "2" }))}
                >
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
                <Label>Status</Label>
                <Select
                  value={editingFormData.status}
                  onValueChange={(value) => setEditingFormData((prev) => ({ ...prev, status: value as UiStatus }))}
                >
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Batal
            </Button>
            <Button disabled={isLoading} onClick={handleUpdate}>
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Detail Data Kelas Mapel</DialogTitle>
            <DialogDescription>Informasi lengkap data kelas mapel terpilih.</DialogDescription>
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
                <p className="text-xs text-muted-foreground">Nama Kelas</p>
                <p className="font-medium">{detailData.namaKelas || "-"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Kode Mapel</p>
                <p className="font-medium">{detailData.kodeMapel || "-"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Nama Mapel</p>
                <p className="font-medium">{detailData.namaMapel || "-"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Tahun Ajaran</p>
                <p className="font-medium">{detailData.tahunAjaran || "-"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Semester</p>
                <p className="font-medium">{detailData.semester || "-"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">ID Petugas</p>
                <p className="font-medium">{detailData.idPetugas ?? "-"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Nama Petugas</p>
                <p className="font-medium">{detailData.namaPetugas || "-"}</p>
              </div>
              <div className="rounded-lg border p-3 md:col-span-2">
                <p className="text-xs text-muted-foreground">Buku Acuan</p>
                <p className="font-medium">{detailData.bukuAcuan || "-"}</p>
              </div>
              <div className="rounded-lg border p-3 md:col-span-2">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-medium">{detailData.status}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
