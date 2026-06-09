"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  Filter,
  Import as ImportIcon,
  MoreVertical,
  PlusCircle,
  Trash2,
  Pencil,
} from "lucide-react"
import {
  dataUnitService,
  DataUnitApiItem,
  DataUnitListParams,
  BackendStatus,
} from "@/lib/services/unit.service"
import { useToast } from "@/hooks/use-toast"

type UnitStatus = "Aktif" | "Nonaktif"
type SortField =
  | "urut"
  | "kode"
  | "nama"
  | "keterangan"
  | "jumlahKelas"
  | "jumlahSantri"
  | "statusUnit"

interface UnitRow {
  id: number
  urut: number
  kode: string
  nama: string
  keterangan: string
  jumlahKelas: number
  jumlahSantri: number
  statusUnit: UnitStatus
}

interface UnitFormData {
  urut: string
  kode: string
  nama: string
  keterangan: string
  jumlahKelas: string
  jumlahSantri: string
  statusUnit: UnitStatus
}

const defaultFormState: UnitFormData = {
  urut: "",
  kode: "",
  nama: "",
  keterangan: "",
  jumlahKelas: "0",
  jumlahSantri: "0",
  statusUnit: "Aktif",
}

const toNumber = (value: unknown, fallback = 0): number => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const toText = (value: unknown): string => {
  if (value == null) return ""
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return ""
}

const toBackendStatus = (status: UnitStatus): BackendStatus => (status === "Aktif" ? "AKTIF" : "NONAKTIF")

const fromBackendStatus = (status: unknown): UnitStatus => {
  const normalized = toText(status).toUpperCase()
  return normalized === "NONAKTIF" ? "Nonaktif" : "Aktif"
}


const normalizeUnitRow = (raw: DataUnitApiItem): UnitRow => ({
  id: toNumber(raw.id_unit ?? raw.id, -1),
  urut: toNumber(raw.nomor_urut, 0),
  kode: toText(raw.kode_unit),
  nama: toText(raw.nama_unit),
  keterangan: toText(raw.keterangan) || "-",
  jumlahKelas: toNumber(raw.jumlah_kelas ?? raw.kelas_count, 0),
  jumlahSantri: toNumber(raw.jumlah_santri ?? raw.santri_count, 0),
  statusUnit: fromBackendStatus(raw.status),
})

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (!error || typeof error !== "object") return fallback
  const err = error as {
    response?: {
      data?: {
        message?: string
      }
    }
    message?: string
  }

  return err.response?.data?.message || err.message || fallback
}

export default function UnitPage() {
  const { toast } = useToast()

  const [unitRows, setUnitRows] = useState<UnitRow[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState("")
  const [unitStatusFilter, setUnitStatusFilter] = useState<"all" | UnitStatus>("all")

  const [rowsPerPage, setRowsPerPage] = useState("25")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>("urut")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [formData, setFormData] = useState<UnitFormData>(defaultFormState)

  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingFormData, setEditingFormData] = useState<UnitFormData>(defaultFormState)

  const rowsLimit = Number(rowsPerPage)

  const sortedUnits = useMemo(() => {
    return [...unitRows].sort((a, b) => {
      const sortSign = sortDirection === "asc" ? 1 : -1
      const aValue = a[sortField]
      const bValue = b[sortField]

      if (typeof aValue === "number" && typeof bValue === "number") {
        return (aValue - bValue) * sortSign
      }

      return String(aValue).localeCompare(String(bValue), "id", { sensitivity: "base" }) * sortSign
    })
  }, [unitRows, sortField, sortDirection])

  const fetchUnits = async () => {
    setIsLoading(true)
    try {
      const params: DataUnitListParams = {
        page: currentPage,
        per_page: rowsLimit,
      }

      const query = searchKeyword.trim()
      if (query) params.q = query
      if (unitStatusFilter !== "all") params.status = toBackendStatus(unitStatusFilter)

      const result = await dataUnitService.getAll(params)
      const rows = result.data.map(normalizeUnitRow).filter((row) => row.id > 0)

      setUnitRows(rows)
      setTotalItems(toNumber(result.meta?.total, rows.length))
      setTotalPages(Math.max(1, toNumber(result.meta?.last_page, 1)))
      setCurrentPage(toNumber(result.meta?.current_page, currentPage))
    } catch (error) {
      toast({
        title: "Gagal Memuat Data",
        description: getErrorMessage(error, "Data unit gagal dimuat."),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [searchKeyword, unitStatusFilter, rowsPerPage])

  useEffect(() => {
    setSelectedIds([])
    void fetchUnits()
  }, [currentPage, rowsPerPage, searchKeyword, unitStatusFilter])

  const pagedUnits = sortedUnits
  const pagedIds = pagedUnits.map((unit) => unit.id)
  const isAllCurrentPageSelected = pagedIds.length > 0 && pagedIds.every((id) => selectedIds.includes(id))
  const isSomeCurrentPageSelected = pagedIds.some((id) => selectedIds.includes(id)) && !isAllCurrentPageSelected

  const handleSort = (nextSortField: SortField) => {
    if (sortField === nextSortField) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
      return
    }

    setSortField(nextSortField)
    setSortDirection("asc")
  }

  const handleSelectAllOnPage = (checked: boolean | "indeterminate") => {
    if (checked !== true) {
      setSelectedIds((prev) => prev.filter((id) => !pagedIds.includes(id)))
      return
    }

    setSelectedIds((prev) => Array.from(new Set([...prev, ...pagedIds])))
  }

  const handleSelectOne = (rowId: number, checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedIds((prev) => (prev.includes(rowId) ? prev : [...prev, rowId]))
      return
    }

    setSelectedIds((prev) => prev.filter((id) => id !== rowId))
  }

  const deleteSelectedRows = () => {
    const run = async () => {
      if (selectedIds.length === 0) return

      setIsLoading(true)
      try {
        await Promise.all(selectedIds.map((id) => dataUnitService.remove(id)))

        toast({
          title: "Berhasil",
          description: "Data unit terpilih berhasil dihapus.",
        })

        setSelectedIds([])
        await fetchUnits()
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal menghapus data unit terpilih."),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  const deleteOneRow = (rowId: number) => {
    const run = async () => {
      setIsLoading(true)
      try {
        await dataUnitService.remove(rowId)
        setSelectedIds((prev) => prev.filter((id) => id !== rowId))
        toast({
          title: "Berhasil",
          description: "Data unit berhasil dihapus.",
        })
        await fetchUnits()
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal menghapus data unit."),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  const openDetailDialog = (unit: UnitRow) => {
    setEditingId(unit.id)
    setEditingFormData({
      urut: String(unit.urut),
      kode: unit.kode,
      nama: unit.nama,
      keterangan: unit.keterangan === "-" ? "" : unit.keterangan,
      jumlahKelas: String(unit.jumlahKelas),
      jumlahSantri: String(unit.jumlahSantri),
      statusUnit: unit.statusUnit,
    })
    setIsDetailDialogOpen(true)
  }

  const handleSaveDetail = () => {
    const run = async () => {
      if (!editingId) return
      if (!editingFormData.kode.trim() || !editingFormData.nama.trim()) {
        toast({
          title: "Validasi",
          description: "Kode unit dan nama unit wajib diisi.",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)
      try {
        await dataUnitService.update(editingId, {
          kode_unit: editingFormData.kode,
          nama_unit: editingFormData.nama,
          nomor_urut: editingFormData.urut ? Number(editingFormData.urut) : null,
          keterangan: editingFormData.keterangan || null,
          status: toBackendStatus(editingFormData.statusUnit),
        })

        toast({
          title: "Berhasil",
          description: "Detail unit berhasil diperbarui.",
        })

        setIsDetailDialogOpen(false)
        await fetchUnits()
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal menyimpan perubahan unit."),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  const handleExportExcel = () => {
    const run = async () => {
      setIsLoading(true)
      try {
        const params: Omit<DataUnitListParams, "per_page" | "page"> = {}
        const query = searchKeyword.trim()
        if (query) params.q = query
        if (unitStatusFilter !== "all") params.status = toBackendStatus(unitStatusFilter)

        const blob = await dataUnitService.exportExcel(params)
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = `data-unit-${new Date().toISOString().slice(0, 10)}.xlsx`
        anchor.click()
        URL.revokeObjectURL(url)
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal mengekspor data unit Excel."),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  const handleCreateUnit = () => {
    const run = async () => {
      if (!formData.kode.trim() || !formData.nama.trim()) {
        toast({
          title: "Validasi",
          description: "Kode unit dan nama unit wajib diisi.",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)
      try {
        await dataUnitService.create({
          kode_unit: formData.kode,
          nama_unit: formData.nama,
          nomor_urut: formData.urut ? Number(formData.urut) : null,
          keterangan: formData.keterangan || null,
          status: toBackendStatus(formData.statusUnit),
        })

        toast({
          title: "Berhasil",
          description: "Data unit berhasil dibuat.",
        })

        setFormData(defaultFormState)
        setIsAddDialogOpen(false)
        await fetchUnits()
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal membuat data unit."),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  const resetFilter = () => {
    setSearchKeyword("")
    setUnitStatusFilter("all")
  }

  const selectedCount = selectedIds.length
  const visibleStart = totalItems === 0 ? 0 : (currentPage - 1) * rowsLimit + 1
  const visibleEnd = Math.min(currentPage * rowsLimit, totalItems)

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">DAFTAR UNIT</h1>

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
                <DialogTitle>Tambah Unit Baru</DialogTitle>
                <DialogDescription>Lengkapi data unit sebelum menyimpan.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="unit-urut">No. Urut</Label>
                    <Input
                      id="unit-urut"
                      type="number"
                      min={1}
                      value={formData.urut}
                      onChange={(event) => setFormData((prev) => ({ ...prev, urut: event.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit-kode">Kode Unit</Label>
                    <Input
                      id="unit-kode"
                      placeholder="Contoh: MA"
                      value={formData.kode}
                      onChange={(event) => setFormData((prev) => ({ ...prev, kode: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit-nama">Nama Unit</Label>
                  <Input
                    id="unit-nama"
                    placeholder="Contoh: ALIYAH"
                    value={formData.nama}
                    onChange={(event) => setFormData((prev) => ({ ...prev, nama: event.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit-keterangan">Keterangan</Label>
                  <Input
                    id="unit-keterangan"
                    placeholder="Keterangan jenjang unit"
                    value={formData.keterangan}
                    onChange={(event) => setFormData((prev) => ({ ...prev, keterangan: event.target.value }))}
                  />
                </div>

                <div className="grid gap-2 md:grid-cols-1">
                  <div className="space-y-2">
                    <Label>Status Unit</Label>
                    <Select
                      value={formData.statusUnit}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, statusUnit: value as UnitStatus }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status unit" />
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
                <Button onClick={handleCreateUnit} disabled={isLoading}>
                  Simpan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Link href="/dashboard/unit/import">
            <Button variant="default" className="h-10 gap-2 px-4" disabled={isLoading}>
              <ImportIcon className="h-4 w-4" />
              Impor
            </Button>
          </Link>

          <Button variant="default" className="h-10 gap-2 px-4" onClick={handleExportExcel} disabled={isLoading}>
            <Download className="h-4 w-4" />
            Ekspor
          </Button>
        </div>
      </div>

      <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between px-5 py-6 text-left"
            >
              <span className="flex items-center gap-2 text-2xl font-semibold text-foreground sm:text-3xl">
                <Filter className="h-5 w-5" />
                <span className="text-2xl font-semibold tracking-tight sm:text-3xl">Filter Data</span>
              </span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform duration-200",
                  isFilterOpen && "rotate-180",
                )}
              />
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="border-t pt-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="unit-search">Cari Unit</Label>
                  <Input
                    id="unit-search"
                    placeholder="Cari kode unit, nama unit, atau keterangan"
                    value={searchKeyword}
                    onChange={(event) => setSearchKeyword(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status Unit</Label>
                  <Select
                    value={unitStatusFilter}
                    onValueChange={(value) => setUnitStatusFilter(value as "all" | UnitStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="Aktif">Aktif</SelectItem>
                      <SelectItem value="Nonaktif">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
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
                  <Button variant="outline" className="h-10 gap-2" disabled={selectedCount === 0 || isLoading}>
                    Aksi Masal
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Pilih Aksi</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={deleteSelectedRows}>
                    Hapus Terpilih
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {selectedCount > 0 && (
                <p className="text-sm text-muted-foreground">{selectedCount} baris terpilih</p>
              )}
            </div>

            <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
              <SelectTrigger className="h-10 w-full sm:w-[88px]">
                <SelectValue placeholder="25" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-lg border bg-background">
            <Table className="min-w-[1120px]">
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        isAllCurrentPageSelected
                          ? true
                          : isSomeCurrentPageSelected
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={handleSelectAllOnPage}
                      aria-label="Pilih semua unit di halaman ini"
                    />
                  </TableHead>
                  <TableHead className="w-12 text-xs font-semibold uppercase tracking-wide text-muted-foreground">#</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort("urut")}>
                      NO. URUT
                      <ArrowUpDown className={cn("h-3.5 w-3.5", sortField === "urut" && "text-foreground")} />
                    </button>
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort("kode")}>
                      KODE UNIT
                      <ArrowUpDown className={cn("h-3.5 w-3.5", sortField === "kode" && "text-foreground")} />
                    </button>
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort("nama")}>
                      NAMA UNIT
                      <ArrowUpDown className={cn("h-3.5 w-3.5", sortField === "nama" && "text-foreground")} />
                    </button>
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort("keterangan")}>
                      KETERANGAN
                      <ArrowUpDown className={cn("h-3.5 w-3.5", sortField === "keterangan" && "text-foreground")} />
                    </button>
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort("jumlahKelas")}>
                      JML. KELAS
                      <ArrowUpDown className={cn("h-3.5 w-3.5", sortField === "jumlahKelas" && "text-foreground")} />
                    </button>
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort("jumlahSantri")}>
                      JML. SANTRI
                      <ArrowUpDown className={cn("h-3.5 w-3.5", sortField === "jumlahSantri" && "text-foreground")} />
                    </button>
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort("statusUnit")}>
                      STATUS UNIT
                      <ArrowUpDown className={cn("h-3.5 w-3.5", sortField === "statusUnit" && "text-foreground")} />
                    </button>
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">AKSI</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {pagedUnits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="py-10 text-center text-muted-foreground">
                      {isLoading ? "Memuat data..." : "Data unit tidak ditemukan."}
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedUnits.map((unit, index) => (
                    <TableRow key={unit.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(unit.id)}
                          onCheckedChange={(checked) => handleSelectOne(unit.id, checked)}
                          aria-label={`Pilih baris unit ${unit.nama}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{(currentPage - 1) * rowsLimit + index + 1}</TableCell>
                      <TableCell>{unit.urut}</TableCell>
                      <TableCell>{unit.kode}</TableCell>
                      <TableCell>{unit.nama}</TableCell>
                      <TableCell>{unit.keterangan}</TableCell>
                      <TableCell>{unit.jumlahKelas}</TableCell>
                      <TableCell>{unit.jumlahSantri}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "font-semibold",
                            unit.statusUnit === "Aktif"
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {unit.statusUnit}
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
                            <DropdownMenuLabel>Aksi Unit</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openDetailDialog(unit)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit Unit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteOneRow(unit.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus Unit
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
            <p className="text-sm text-muted-foreground">
              Menampilkan {visibleStart} - {visibleEnd} dari {totalItems} data unit
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                Sebelumnya
              </Button>
              <span className="text-sm text-muted-foreground">
                Halaman {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || isLoading}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Edit Unit</DialogTitle>
            <DialogDescription>Perbarui data unit sesuai kebutuhan.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="detail-urut">No. Urut</Label>
                <Input
                  id="detail-urut"
                  type="number"
                  min={1}
                  value={editingFormData.urut}
                  onChange={(event) => setEditingFormData((prev) => ({ ...prev, urut: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="detail-kode">Kode Unit</Label>
                <Input
                  id="detail-kode"
                  value={editingFormData.kode}
                  onChange={(event) => setEditingFormData((prev) => ({ ...prev, kode: event.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="detail-nama">Nama Unit</Label>
              <Input
                id="detail-nama"
                value={editingFormData.nama}
                onChange={(event) => setEditingFormData((prev) => ({ ...prev, nama: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="detail-keterangan">Keterangan</Label>
              <Input
                id="detail-keterangan"
                value={editingFormData.keterangan}
                onChange={(event) => setEditingFormData((prev) => ({ ...prev, keterangan: event.target.value }))}
              />
            </div>

            <div className="grid gap-2 md:grid-cols-1">
              <div className="space-y-2">
                <Label>Status Unit</Label>
                <Select
                  value={editingFormData.statusUnit}
                  onValueChange={(value) => setEditingFormData((prev) => ({ ...prev, statusUnit: value as UnitStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
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
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveDetail} disabled={isLoading}>
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
