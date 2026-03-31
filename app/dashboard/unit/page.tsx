"use client"

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
  PencilLine,
  PlusCircle,
  Trash2,
} from "lucide-react"

type UnitStatus = "Aktif" | "Nonaktif"
type PpdbStatus = "Dibuka" | "Ditutup"
type SortField =
  | "urut"
  | "kode"
  | "nama"
  | "keterangan"
  | "jumlahKelas"
  | "jumlahSantri"
  | "statusUnit"
  | "statusPpdb"

interface UnitRow {
  id: number
  urut: number
  kode: string
  nama: string
  keterangan: string
  jumlahKelas: number
  jumlahSantri: number
  statusUnit: UnitStatus
  statusPpdb: PpdbStatus
}

interface UnitFormData {
  urut: string
  kode: string
  nama: string
  keterangan: string
  jumlahKelas: string
  jumlahSantri: string
  statusUnit: UnitStatus
  statusPpdb: PpdbStatus
}

const defaultFormState: UnitFormData = {
  urut: "",
  kode: "",
  nama: "",
  keterangan: "",
  jumlahKelas: "0",
  jumlahSantri: "0",
  statusUnit: "Aktif",
  statusPpdb: "Dibuka",
}

const initialUnits: UnitRow[] = [
  {
    id: 1,
    urut: 1,
    kode: "PAUD",
    nama: "PAUD",
    keterangan: "Jenjang PAUD",
    jumlahKelas: 1,
    jumlahSantri: 16,
    statusUnit: "Aktif",
    statusPpdb: "Dibuka",
  },
  {
    id: 2,
    urut: 2,
    kode: "TK",
    nama: "TK",
    keterangan: "Jenjang TK",
    jumlahKelas: 4,
    jumlahSantri: 70,
    statusUnit: "Aktif",
    statusPpdb: "Dibuka",
  },
  {
    id: 3,
    urut: 3,
    kode: "MI",
    nama: "MTQU",
    keterangan: "Jenjang MTQU",
    jumlahKelas: 12,
    jumlahSantri: 221,
    statusUnit: "Aktif",
    statusPpdb: "Dibuka",
  },
  {
    id: 4,
    urut: 4,
    kode: "MTS",
    nama: "MUTAWASITHAH",
    keterangan: "Jenjang MUTAWASITHAH",
    jumlahKelas: 6,
    jumlahSantri: 102,
    statusUnit: "Aktif",
    statusPpdb: "Dibuka",
  },
  {
    id: 5,
    urut: 5,
    kode: "MA",
    nama: "ALIYAH",
    keterangan: "Jenjang ALIYAH",
    jumlahKelas: 6,
    jumlahSantri: 37,
    statusUnit: "Aktif",
    statusPpdb: "Dibuka",
  },
]

const exportHeaders = [
  "No Urut",
  "Kode Unit",
  "Nama Unit",
  "Keterangan",
  "Jumlah Kelas",
  "Jumlah Santri",
  "Status Unit",
  "Status PPDB",
]

const toCsvSafe = (value: string | number) => {
  const escaped = String(value).replace(/"/g, '""')
  return `"${escaped}"`
}

export default function UnitPage() {
  const [unitRows, setUnitRows] = useState<UnitRow[]>(initialUnits)
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState("")
  const [unitStatusFilter, setUnitStatusFilter] = useState<"all" | UnitStatus>("all")
  const [ppdbStatusFilter, setPpdbStatusFilter] = useState<"all" | PpdbStatus>("all")

  const [rowsPerPage, setRowsPerPage] = useState("25")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>("urut")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [formData, setFormData] = useState<UnitFormData>(defaultFormState)

  const filteredUnits = useMemo(() => {
    const query = searchKeyword.trim().toLowerCase()

    return unitRows.filter((unit) => {
      const matchesQuery =
        !query ||
        [unit.kode, unit.nama, unit.keterangan].some((value) => value.toLowerCase().includes(query))

      const matchesUnitStatus = unitStatusFilter === "all" || unit.statusUnit === unitStatusFilter
      const matchesPpdbStatus = ppdbStatusFilter === "all" || unit.statusPpdb === ppdbStatusFilter

      return matchesQuery && matchesUnitStatus && matchesPpdbStatus
    })
  }, [unitRows, searchKeyword, unitStatusFilter, ppdbStatusFilter])

  const sortedUnits = useMemo(() => {
    return [...filteredUnits].sort((a, b) => {
      const sortSign = sortDirection === "asc" ? 1 : -1

      const aValue = a[sortField]
      const bValue = b[sortField]

      if (typeof aValue === "number" && typeof bValue === "number") {
        return (aValue - bValue) * sortSign
      }

      return String(aValue).localeCompare(String(bValue), "id", { sensitivity: "base" }) * sortSign
    })
  }, [filteredUnits, sortField, sortDirection])

  const rowsLimit = Number(rowsPerPage)
  const totalPages = Math.max(1, Math.ceil(sortedUnits.length / rowsLimit))

  useEffect(() => {
    setCurrentPage(1)
  }, [searchKeyword, unitStatusFilter, ppdbStatusFilter, rowsPerPage])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const startIndex = (currentPage - 1) * rowsLimit
  const pagedUnits = sortedUnits.slice(startIndex, startIndex + rowsLimit)

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

  const updateSelectedUnitStatus = (status: UnitStatus) => {
    if (selectedIds.length === 0) return

    setUnitRows((prev) => prev.map((unit) => (selectedIds.includes(unit.id) ? { ...unit, statusUnit: status } : unit)))
  }

  const updateSelectedPpdbStatus = (status: PpdbStatus) => {
    if (selectedIds.length === 0) return

    setUnitRows((prev) => prev.map((unit) => (selectedIds.includes(unit.id) ? { ...unit, statusPpdb: status } : unit)))
  }

  const deleteSelectedRows = () => {
    if (selectedIds.length === 0) return

    setUnitRows((prev) => prev.filter((unit) => !selectedIds.includes(unit.id)))
    setSelectedIds([])
  }

  const toggleUnitStatus = (rowId: number) => {
    setUnitRows((prev) =>
      prev.map((unit) => {
        if (unit.id !== rowId) return unit

        return {
          ...unit,
          statusUnit: unit.statusUnit === "Aktif" ? "Nonaktif" : "Aktif",
        }
      }),
    )
  }

  const togglePpdbStatus = (rowId: number) => {
    setUnitRows((prev) =>
      prev.map((unit) => {
        if (unit.id !== rowId) return unit

        return {
          ...unit,
          statusPpdb: unit.statusPpdb === "Dibuka" ? "Ditutup" : "Dibuka",
        }
      }),
    )
  }

  const deleteOneRow = (rowId: number) => {
    setUnitRows((prev) => prev.filter((unit) => unit.id !== rowId))
    setSelectedIds((prev) => prev.filter((id) => id !== rowId))
  }

  const handleMockImport = () => {
    const nextId = unitRows.length ? Math.max(...unitRows.map((unit) => unit.id)) + 1 : 1

    const newImportedUnit: UnitRow = {
      id: nextId,
      urut: nextId,
      kode: `UNIT-${nextId}`,
      nama: `UNIT BARU ${nextId}`,
      keterangan: "Data hasil impor",
      jumlahKelas: 0,
      jumlahSantri: 0,
      statusUnit: "Aktif",
      statusPpdb: "Ditutup",
    }

    setUnitRows((prev) => [newImportedUnit, ...prev])
  }

  const handleExportCsv = () => {
    const csvRows = sortedUnits.map((unit) => [
      unit.urut,
      unit.kode,
      unit.nama,
      unit.keterangan,
      unit.jumlahKelas,
      unit.jumlahSantri,
      unit.statusUnit,
      unit.statusPpdb,
    ])

    const csvContent = [exportHeaders.map(toCsvSafe).join(","), ...csvRows.map((row) => row.map(toCsvSafe).join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")

    anchor.href = url
    anchor.download = `data-unit-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()

    URL.revokeObjectURL(url)
  }

  const handleCreateUnit = () => {
    if (!formData.kode.trim() || !formData.nama.trim()) return

    const nextId = unitRows.length ? Math.max(...unitRows.map((unit) => unit.id)) + 1 : 1

    const newUnit: UnitRow = {
      id: nextId,
      urut: Number(formData.urut) || nextId,
      kode: formData.kode.trim().toUpperCase(),
      nama: formData.nama.trim().toUpperCase(),
      keterangan: formData.keterangan.trim() || "-",
      jumlahKelas: Number(formData.jumlahKelas) || 0,
      jumlahSantri: Number(formData.jumlahSantri) || 0,
      statusUnit: formData.statusUnit,
      statusPpdb: formData.statusPpdb,
    }

    setUnitRows((prev) => [...prev, newUnit])
    setFormData(defaultFormState)
    setIsAddDialogOpen(false)
  }

  const resetFilter = () => {
    setSearchKeyword("")
    setUnitStatusFilter("all")
    setPpdbStatusFilter("all")
  }

  const selectedCount = selectedIds.length
  const visibleStart = sortedUnits.length === 0 ? 0 : startIndex + 1
  const visibleEnd = Math.min(startIndex + rowsLimit, sortedUnits.length)

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

                <div className="grid gap-2 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="unit-jumlah-kelas">Jumlah Kelas</Label>
                    <Input
                      id="unit-jumlah-kelas"
                      type="number"
                      min={0}
                      value={formData.jumlahKelas}
                      onChange={(event) => setFormData((prev) => ({ ...prev, jumlahKelas: event.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit-jumlah-santri">Jumlah Santri</Label>
                    <Input
                      id="unit-jumlah-santri"
                      type="number"
                      min={0}
                      value={formData.jumlahSantri}
                      onChange={(event) => setFormData((prev) => ({ ...prev, jumlahSantri: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-2">
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

                  <div className="space-y-2">
                    <Label>Status PPDB</Label>
                    <Select
                      value={formData.statusPpdb}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, statusPpdb: value as PpdbStatus }))}
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
                <Button onClick={handleCreateUnit}>Simpan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="default" className="h-10 gap-2 px-4" onClick={handleMockImport}>
            <ImportIcon className="h-4 w-4" />
            Impor
          </Button>

          <Button variant="default" className="h-10 gap-2 px-4" onClick={handleExportCsv}>
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
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
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

                <div className="space-y-2">
                  <Label>Status PPDB</Label>
                  <Select
                    value={ppdbStatusFilter}
                    onValueChange={(value) => setPpdbStatusFilter(value as "all" | PpdbStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="Dibuka">Dibuka</SelectItem>
                      <SelectItem value="Ditutup">Ditutup</SelectItem>
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
                  <Button variant="outline" className="h-10 gap-2" disabled={selectedCount === 0}>
                    Aksi Masal
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Pilih Aksi</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => updateSelectedUnitStatus("Aktif")}>Aktifkan Unit</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateSelectedUnitStatus("Nonaktif")}>Nonaktifkan Unit</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => updateSelectedPpdbStatus("Dibuka")}>Buka PPDB</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateSelectedPpdbStatus("Ditutup")}>Tutup PPDB</DropdownMenuItem>
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
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort("statusPpdb")}>
                      STATUS PPDB
                      <ArrowUpDown className={cn("h-3.5 w-3.5", sortField === "statusPpdb" && "text-foreground")} />
                    </button>
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">AKSI</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {pagedUnits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="py-10 text-center text-muted-foreground">
                      Data unit tidak ditemukan.
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
                      <TableCell className="font-medium">{startIndex + index + 1}</TableCell>
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
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "gap-1.5 font-semibold",
                            unit.statusPpdb === "Dibuka"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {unit.statusPpdb}
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
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <PencilLine className="mr-2 h-4 w-4" />
                              Edit Unit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toggleUnitStatus(unit.id)}>
                              Ubah Status Unit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => togglePpdbStatus(unit.id)}>
                              Ubah Status PPDB
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
              Menampilkan {visibleStart} - {visibleEnd} dari {sortedUnits.length} data unit
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
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
                disabled={currentPage === totalPages}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
