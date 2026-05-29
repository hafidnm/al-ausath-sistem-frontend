"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
import { BackendStatus, dataUnitService } from "@/lib/services/unit.service"
import { dataKelasService, DataKelasApiItem } from "@/lib/services/kelas.service"
import { tahunAjaranService } from "@/lib/services/tahun-ajaran.service"
import { dataMasterService } from "@/lib/services/data-master.service"
import { ArrowUpDown, ChevronDown, Download, Filter, MoreVertical, PencilLine, PlusCircle, Trash2, Upload } from "lucide-react"

type UiStatus = "Aktif" | "Nonaktif"
type UiPpdbStatus = "Dibuka" | "Ditutup"

interface KelasRow {
  id: number
  namaUnit: string
  kodeUnit: string
  kodeKelas: string
  namaKelas: string
  namaJurusan: string
  tahunAjaran: string
  santriTotal: number
  santriAktif: number
  santriLulus: number
  santriKeluar: number
  status: UiStatus
  statusPpdb: UiPpdbStatus
}

interface KelasFormData {
  kodeUnit: string
  kodeKelas: string
  namaKelas: string
  namaJurusan: string
  tahunAjaran: string
  status: UiStatus
  statusPpdb: UiPpdbStatus
}

interface UnitOption {
  value: string
  label: string
}

interface KelasOption {
  value: string
  label: string
  kodeUnit: string
}

interface TahunAjaranOption {
  value: string
  label: string
}

const defaultFormState: KelasFormData = {
  kodeUnit: "",
  kodeKelas: "",
  namaKelas: "",
  namaJurusan: "",
  tahunAjaran: "",
  status: "Aktif",
  statusPpdb: "Dibuka",
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

const toBackendPpdbStatus = (status: UiPpdbStatus): BackendStatus => (status === "Dibuka" ? "AKTIF" : "NONAKTIF")
const fromBackendPpdbStatus = (status: unknown): UiPpdbStatus => (toText(status).toUpperCase() === "AKTIF" ? "Dibuka" : "Ditutup")

const normalizeKelasRow = (raw: DataKelasApiItem): KelasRow => ({
  id: toNumber(raw.id_kelas ?? raw.id, -1),
  namaUnit: toText(raw.unit?.nama_unit) || toText(raw.kode_unit) || "-",
  kodeUnit: toText(raw.kode_unit),
  kodeKelas: toText(raw.kode_kelas),
  namaKelas: toText(raw.nama_kelas),
  namaJurusan: toText(raw.nama_jurusan),
  tahunAjaran: toText(raw.tahun_ajaran),
  santriTotal: toNumber(raw.jumlah_santri),
  santriAktif: toNumber(raw.jumlah_santri_aktif),
  santriLulus: toNumber(raw.jumlah_santri_lulus),
  santriKeluar: toNumber(raw.jumlah_santri_keluar),
  status: fromBackendStatus(raw.status),
  statusPpdb: fromBackendPpdbStatus(raw.status_ppdb),
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

export default function KelasPage() {
  const { toast } = useToast()

  const [rows, setRows] = useState<KelasRow[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [rowsPerPage, setRowsPerPage] = useState("25")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Guard: cegah double-invoke & cascade re-fetch
  const initCalledRef = useRef(false)
  const initDoneRef = useRef(false)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [formData, setFormData] = useState<KelasFormData>(defaultFormState)
  const [editingFormData, setEditingFormData] = useState<KelasFormData>(defaultFormState)

  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([])
  const [tahunOptions, setTahunOptions] = useState<TahunAjaranOption[]>([])
  const [kelasOptions, setKelasOptions] = useState<KelasOption[]>([])

  const [keyword, setKeyword] = useState("")
  const [unitFilter, setUnitFilter] = useState("all")
  const [kelasFilter, setKelasFilter] = useState("all")
  const [tahunFilter, setTahunFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<UiStatus | "all">("all")

  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const rowsLimit = Number(rowsPerPage)

  const visibleRows = useMemo(() => {
    if (kelasFilter === "all") return rows
    return rows.filter((row) => row.kodeKelas === kelasFilter)
  }, [rows, kelasFilter])

  const kelasFilterOptions = useMemo(() => {
    const seen = new Set<string>()
    const options: Array<{ value: string; label: string }> = []
    const source = unitFilter === "all"
      ? kelasOptions
      : kelasOptions.filter((option) => option.kodeUnit === unitFilter)

    for (const option of source) {
      if (!option.value || seen.has(option.value)) continue
      seen.add(option.value)
      options.push({ value: option.value, label: option.label || option.value })
    }

    return options
  }, [unitFilter, kelasOptions])

  const allVisibleSelected = visibleRows.length > 0 && visibleRows.every((row) => selectedIds.includes(row.id))
  const someVisibleSelected = visibleRows.some((row) => selectedIds.includes(row.id))

  const fetchRows = async () => {
    setIsLoading(true)
    try {
      const params: {
        page: number
        per_page: number
        q?: string
        kode_unit?: string
        tahun_ajaran?: string
        status?: BackendStatus
      } = {
        page: currentPage,
        per_page: rowsLimit,
      }

      const q = keyword.trim()
      if (q) params.q = q
      if (unitFilter !== "all") params.kode_unit = unitFilter
      if (tahunFilter !== "all") params.tahun_ajaran = tahunFilter
      if (statusFilter !== "all") params.status = toBackendStatus(statusFilter)

      const result = await dataKelasService.getAll(params)
      const mappedRows = result.data.map(normalizeKelasRow).filter((row) => row.id > 0)

      setRows(mappedRows)
      setSelectedIds([])
      setTotalItems(toNumber(result.meta?.total, mappedRows.length))
      setTotalPages(Math.max(1, toNumber(result.meta?.last_page, 1)))
      setCurrentPage(toNumber(result.meta?.current_page, currentPage))
    } catch (error) {
      toast({
        title: "Gagal Memuat Data",
        description: getErrorMessage(error, "Data kelas gagal dimuat."),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const initData = await dataMasterService.getInitOptions()

        const units: UnitOption[] = []
        for (const item of (initData.unit || [])) {
          const code = toText(item.kode_unit).trim()
          if (!code) continue
          units.push({ value: code, label: toText(item.nama_unit).trim() || code })
        }

        const years: TahunAjaranOption[] = []
        for (const item of (initData.tahun_ajaran || [])) {
          const code = toText(item.kode_tahun).trim()
          if (!code) continue
          years.push({ value: code, label: toText(item.nama_tahun).trim() || code })
        }

        const kelasSeen = new Set<string>()
        const mappedKelas: KelasOption[] = []
        for (const item of (initData.kelas || [])) {
          const kodeKelas = toText(item.kode_kelas).trim()
          if (!kodeKelas || kelasSeen.has(kodeKelas)) continue
          kelasSeen.add(kodeKelas)
          mappedKelas.push({
            value: kodeKelas,
            label: toText(item.nama_kelas).trim() || kodeKelas,
            kodeUnit: toText(item.kode_unit).trim(),
          })
        }

        setUnitOptions(units)
        setTahunOptions(years)
        setKelasOptions(mappedKelas)
        
        initDoneRef.current = true
        // Langsung panggil fetch pertama
        void fetchRows()
      } catch (error) {
        console.error("Gagal memuat opsi filter awal", error)
        initDoneRef.current = true
        void fetchRows()
      }
    }

    if (initCalledRef.current) return
    initCalledRef.current = true
    void loadOptions()
  }, [])

  useEffect(() => {
    if (kelasFilter === "all") return
    const exists = kelasFilterOptions.some((option) => option.value === kelasFilter)
    if (!exists) {
      setKelasFilter("all")
      setCurrentPage(1)
    }
  }, [kelasFilter, kelasFilterOptions])

  useEffect(() => {
    if (!initDoneRef.current) return
    void fetchRows()
  }, [currentPage, rowsPerPage, keyword, unitFilter, kelasFilter, tahunFilter, statusFilter])

  const resetFilter = () => {
    setKeyword("")
    setUnitFilter("all")
    setKelasFilter("all")
    setTahunFilter("all")
    setStatusFilter("all")
    setCurrentPage(1)
  }

  const toggleSelectAll = (checked: boolean | "indeterminate") => {
    const visibleIds = visibleRows.map((row) => row.id)
    if (checked !== true) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)))
      return
    }

    setSelectedIds((prev) => {
      const merged = new Set([...prev, ...visibleIds])
      return Array.from(merged)
    })
  }

  const toggleSelectOne = (id: number, checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
      return
    }

    setSelectedIds((prev) => prev.filter((item) => item !== id))
  }

  const openEditDialog = (rowId: number) => {
    const target = rows.find((row) => row.id === rowId)
    if (!target) return

    setEditingId(rowId)
    setEditingFormData({
      kodeUnit: target.kodeUnit,
      kodeKelas: target.kodeKelas,
      namaKelas: target.namaKelas,
      namaJurusan: target.namaJurusan,
      tahunAjaran: target.tahunAjaran,
      status: target.status,
      statusPpdb: target.statusPpdb,
    })
    setIsEditDialogOpen(true)
  }

  const handleCreate = () => {
    const run = async () => {
      if (!formData.kodeUnit || !formData.kodeKelas.trim() || !formData.namaKelas.trim() || !formData.tahunAjaran) {
        toast({
          title: "Validasi",
          description: "Kode unit, kode kelas, nama kelas, dan tahun ajaran wajib diisi.",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)
      try {
        await dataKelasService.create({
          kode_unit: formData.kodeUnit,
          kode_kelas: formData.kodeKelas,
          nama_kelas: formData.namaKelas,
          nama_jurusan: formData.namaJurusan || null,
          tahun_ajaran: formData.tahunAjaran,
          status: toBackendStatus(formData.status),
          status_ppdb: toBackendPpdbStatus(formData.statusPpdb),
        })

        toast({
          title: "Berhasil",
          description: "Data kelas berhasil dibuat.",
        })

        setIsAddDialogOpen(false)
        setFormData(defaultFormState)
        setCurrentPage(1)
        await fetchRows()
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal menambahkan data kelas."),
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
      if (!editingFormData.kodeUnit || !editingFormData.kodeKelas.trim() || !editingFormData.namaKelas.trim() || !editingFormData.tahunAjaran) {
        toast({
          title: "Validasi",
          description: "Kode unit, kode kelas, nama kelas, dan tahun ajaran wajib diisi.",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)
      try {
        await dataKelasService.update(editingId, {
          kode_unit: editingFormData.kodeUnit,
          kode_kelas: editingFormData.kodeKelas,
          nama_kelas: editingFormData.namaKelas,
          nama_jurusan: editingFormData.namaJurusan || null,
          tahun_ajaran: editingFormData.tahunAjaran,
          status: toBackendStatus(editingFormData.status),
          status_ppdb: toBackendPpdbStatus(editingFormData.statusPpdb),
        })

        toast({
          title: "Berhasil",
          description: "Data kelas berhasil diperbarui.",
        })

        setIsEditDialogOpen(false)
        setEditingId(null)
        setEditingFormData(defaultFormState)
        await fetchRows()
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal memperbarui data kelas."),
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
        await dataKelasService.remove(id)
        setSelectedIds((prev) => prev.filter((item) => item !== id))
        toast({
          title: "Berhasil",
          description: "Data kelas dipindahkan ke trash.",
        })
        await fetchRows()
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal menghapus data kelas."),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  const deleteSelected = () => {
    const run = async () => {
      if (selectedIds.length === 0) return

      setIsLoading(true)
      try {
        await Promise.all(selectedIds.map((id) => dataKelasService.remove(id)))
        setSelectedIds([])
        toast({
          title: "Berhasil",
          description: "Data kelas terpilih dipindahkan ke trash.",
        })
        await fetchRows()
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal menghapus data kelas terpilih."),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  const handleExport = () => {
    const run = async () => {
      try {
        const blob = await dataKelasService.exportExcel({
          q: keyword.trim() || undefined,
          kode_unit: unitFilter === "all" ? undefined : unitFilter,
          tahun_ajaran: tahunFilter === "all" ? undefined : tahunFilter,
          status: statusFilter === "all" ? undefined : toBackendStatus(statusFilter),
        })

        downloadBlob(blob, `data-kelas-${new Date().toISOString().slice(0, 10)}.xlsx`)
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal mengekspor data kelas."),
          variant: "destructive",
        })
      }
    }

    void run()
  }

  const visibleStart = visibleRows.length === 0 ? 0 : (currentPage - 1) * rowsLimit + 1
  const visibleEnd = visibleRows.length === 0 ? 0 : Math.min((currentPage - 1) * rowsLimit + visibleRows.length, totalItems)

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">DAFTAR KELAS</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 gap-2 px-4">
                <PlusCircle className="h-4 w-4" />
                Tambah
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[560px]">
              <DialogHeader>
                <DialogTitle>Tambah Kelas</DialogTitle>
                <DialogDescription>Lengkapi data kelas baru.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Kode Unit</Label>
                    <Select value={formData.kodeUnit} onValueChange={(value) => setFormData((prev) => ({ ...prev, kodeUnit: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {unitOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-kode-kelas">Kode Kelas</Label>
                    <Input
                      id="create-kode-kelas"
                      value={formData.kodeKelas}
                      onChange={(event) => setFormData((prev) => ({ ...prev, kodeKelas: event.target.value }))}
                      placeholder="Contoh: A-PA"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-nama-kelas">Nama Kelas</Label>
                  <Input
                    id="create-nama-kelas"
                    value={formData.namaKelas}
                    onChange={(event) => setFormData((prev) => ({ ...prev, namaKelas: event.target.value }))}
                    placeholder="Contoh: TK A PUTRA"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-nama-jurusan">Nama Jurusan (opsional)</Label>
                  <Input
                    id="create-nama-jurusan"
                    value={formData.namaJurusan}
                    onChange={(event) => setFormData((prev) => ({ ...prev, namaJurusan: event.target.value }))}
                    placeholder="Contoh: IPA"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Tahun Ajaran</Label>
                    <Select
                      value={formData.tahunAjaran}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, tahunAjaran: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tahun ajaran" />
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
                  <div className="space-y-2">
                    <Label>Status PPDB</Label>
                    <Select
                      value={formData.statusPpdb}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, statusPpdb: value as UiPpdbStatus }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status PPDB" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dibuka">Dibuka</SelectItem>
                        <SelectItem value="Ditutup">Ditutup</SelectItem>
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

          <Link href="/dashboard/kelas/import">
            <Button className="h-10 gap-2 px-4" variant="default">
              <Upload className="h-4 w-4" />
              Impor
            </Button>
          </Link>

          <Button className="h-10 gap-2 px-4" variant="default" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Ekspor
          </Button>

          <Link href="/dashboard/kelas/trash">
            <Button className="h-10 gap-2 px-4" variant="default">
              <Trash2 className="h-4 w-4" />
              Dihapus
            </Button>
          </Link>
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                <div className="space-y-2">
                  <Label htmlFor="kelas-keyword">Kata Kunci</Label>
                  <Input
                    id="kelas-keyword"
                    placeholder="Masukan kata kunci pencarian"
                    value={keyword}
                    onChange={(event) => {
                      setKeyword(event.target.value)
                      setCurrentPage(1)
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pilih Unit</Label>
                  <Select
                    value={unitFilter}
                    onValueChange={(value) => {
                      setUnitFilter(value)
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Unit</SelectItem>
                      {unitOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Pilih Kelas</Label>
                  <Select
                    value={kelasFilter}
                    onValueChange={(value) => {
                      setKelasFilter(value)
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kelas</SelectItem>
                      {kelasFilterOptions.map((option) => (
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
                      <SelectValue placeholder="Pilih Tahun Ajaran" />
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
                  <Label>Status</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value as UiStatus | "all")
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Status" />
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 gap-2" disabled={selectedIds.length === 0 || isLoading}>
                  Aksi Masal
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Pilih Aksi</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={deleteSelected}>
                  Hapus Terpilih
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Select value={rowsPerPage} onValueChange={(value) => {
              setRowsPerPage(value)
              setCurrentPage(1)
            }}>
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
            <Table className="min-w-[1200px]">
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Pilih semua data kelas"
                    />
                  </TableHead>
                  <TableHead className="w-12 text-xs font-semibold uppercase tracking-wide text-muted-foreground">#</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">NAMA UNIT</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">KODE KELAS</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">NAMA KELAS</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <button type="button" className="inline-flex items-center gap-1">
                      TAHUN AJARAN
                      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">SANTRI AKTIF</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">SANTRI LULUS</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">SANTRI KELUAR</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">STATUS</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">STATUS PPDB</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">AKSI</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {visibleRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="py-10 text-center text-muted-foreground">
                      {isLoading ? "Memuat data kelas..." : "Data kelas tidak ditemukan."}
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleRows.map((row, index) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(row.id)}
                          onCheckedChange={(checked) => toggleSelectOne(row.id, checked)}
                          aria-label={`Pilih baris ${row.namaKelas}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{(currentPage - 1) * rowsLimit + index + 1}</TableCell>
                      <TableCell>{row.namaUnit}</TableCell>
                      <TableCell>{row.kodeKelas}</TableCell>
                      <TableCell>{row.namaKelas}</TableCell>
                      <TableCell>{row.tahunAjaran}</TableCell>
                      <TableCell>{row.santriAktif}</TableCell>
                      <TableCell>{row.santriLulus}</TableCell>
                      <TableCell>{row.santriKeluar}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={row.status === "Aktif" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}>
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={row.statusPpdb === "Dibuka" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}>
                          {row.statusPpdb}
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
                            <DropdownMenuLabel>Aksi Kelas</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openEditDialog(row.id)}>
                              <PencilLine className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteOne(row.id)}>
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
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Edit Kelas</DialogTitle>
            <DialogDescription>Perbarui data kelas terpilih.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Kode Unit</Label>
                <Select
                  value={editingFormData.kodeUnit}
                  onValueChange={(value) => setEditingFormData((prev) => ({ ...prev, kodeUnit: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-kode-kelas">Kode Kelas</Label>
                <Input
                  id="edit-kode-kelas"
                  value={editingFormData.kodeKelas}
                  onChange={(event) => setEditingFormData((prev) => ({ ...prev, kodeKelas: event.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-nama-kelas">Nama Kelas</Label>
              <Input
                id="edit-nama-kelas"
                value={editingFormData.namaKelas}
                onChange={(event) => setEditingFormData((prev) => ({ ...prev, namaKelas: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-nama-jurusan">Nama Jurusan (opsional)</Label>
              <Input
                id="edit-nama-jurusan"
                value={editingFormData.namaJurusan}
                onChange={(event) => setEditingFormData((prev) => ({ ...prev, namaJurusan: event.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Tahun Ajaran</Label>
                <Select
                  value={editingFormData.tahunAjaran}
                  onValueChange={(value) => setEditingFormData((prev) => ({ ...prev, tahunAjaran: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tahun ajaran" />
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
              <div className="space-y-2">
                <Label>Status PPDB</Label>
                <Select
                  value={editingFormData.statusPpdb}
                  onValueChange={(value) => setEditingFormData((prev) => ({ ...prev, statusPpdb: value as UiPpdbStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status PPDB" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dibuka">Dibuka</SelectItem>
                    <SelectItem value="Ditutup">Ditutup</SelectItem>
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
    </div>
  )
}
