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
  ChevronDown,
  Eye,
  Filter,
  MoreVertical,
  PencilLine,
  PlusCircle,
  Trash2,
} from "lucide-react"

type YearStatus = "Aktif" | "Nonaktif"
type SortField =
  | "kodeTahun"
  | "namaTahun"
  | "keterangan"
  | "jumlahKelas"
  | "jumlahSantri"
  | "status"

interface YearRow {
  id: number
  kodeTahun: string
  namaTahun: string
  keterangan: string
  jumlahKelas: number
  jumlahSantri: number
  status: YearStatus
}

interface YearFormData {
  kodeTahun: string
  namaTahun: string
  keterangan: string
  jumlahKelas: string
  jumlahSantri: string
  status: YearStatus
}

const defaultFormState: YearFormData = {
  kodeTahun: "",
  namaTahun: "",
  keterangan: "",
  jumlahKelas: "0",
  jumlahSantri: "0",
  status: "Aktif",
}

const initialYears: YearRow[] = [
  {
    id: 1,
    kodeTahun: "2026/2027",
    namaTahun: "2026-2027",
    keterangan: "-",
    jumlahKelas: 0,
    jumlahSantri: 0,
    status: "Aktif",
  },
  {
    id: 2,
    kodeTahun: "2025/2026",
    namaTahun: "2025-2026",
    keterangan: "2025-2026",
    jumlahKelas: 29,
    jumlahSantri: 446,
    status: "Aktif",
  },
]

export default function TahunAjaranPage() {
  const [yearRows, setYearRows] = useState<YearRow[]>(initialYears)
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | YearStatus>("all")

  const [rowsPerPage, setRowsPerPage] = useState("25")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>("kodeTahun")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [formData, setFormData] = useState<YearFormData>(defaultFormState)

  const filteredYears = useMemo(() => {
    const query = searchKeyword.trim().toLowerCase()

    return yearRows.filter((year) => {
      const matchesQuery =
        !query ||
        [year.kodeTahun, year.namaTahun, year.keterangan].some((value) => value.toLowerCase().includes(query))

      const matchesStatus = statusFilter === "all" || year.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [yearRows, searchKeyword, statusFilter])

  const sortedYears = useMemo(() => {
    return [...filteredYears].sort((a, b) => {
      const sortSign = sortDirection === "asc" ? 1 : -1

      const aValue = a[sortField]
      const bValue = b[sortField]

      if (typeof aValue === "number" && typeof bValue === "number") {
        return (aValue - bValue) * sortSign
      }

      return String(aValue).localeCompare(String(bValue), "id", { sensitivity: "base" }) * sortSign
    })
  }, [filteredYears, sortField, sortDirection])

  const rowsLimit = Number(rowsPerPage)
  const totalPages = Math.max(1, Math.ceil(sortedYears.length / rowsLimit))

  useEffect(() => {
    setCurrentPage(1)
  }, [searchKeyword, statusFilter, rowsPerPage])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const startIndex = (currentPage - 1) * rowsLimit
  const pagedYears = sortedYears.slice(startIndex, startIndex + rowsLimit)

  const pagedIds = pagedYears.map((year) => year.id)
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

  const resetFilter = () => {
    setSearchKeyword("")
    setStatusFilter("all")
  }

  const updateSelectedStatus = (status: YearStatus) => {
    if (selectedIds.length === 0) return

    setYearRows((prev) => prev.map((year) => (selectedIds.includes(year.id) ? { ...year, status } : year)))
  }

  const deleteSelectedRows = () => {
    if (selectedIds.length === 0) return

    setYearRows((prev) => prev.filter((year) => !selectedIds.includes(year.id)))
    setSelectedIds([])
  }

  const toggleRowStatus = (rowId: number) => {
    setYearRows((prev) =>
      prev.map((year) =>
        year.id === rowId ? { ...year, status: year.status === "Aktif" ? "Nonaktif" : "Aktif" } : year,
      ),
    )
  }

  const deleteOneRow = (rowId: number) => {
    setYearRows((prev) => prev.filter((year) => year.id !== rowId))
    setSelectedIds((prev) => prev.filter((id) => id !== rowId))
  }

  const handleCreateYear = () => {
    if (!formData.kodeTahun.trim() || !formData.namaTahun.trim()) return

    const nextId = yearRows.length ? Math.max(...yearRows.map((year) => year.id)) + 1 : 1

    const newRow: YearRow = {
      id: nextId,
      kodeTahun: formData.kodeTahun.trim(),
      namaTahun: formData.namaTahun.trim(),
      keterangan: formData.keterangan.trim() || "-",
      jumlahKelas: Number(formData.jumlahKelas) || 0,
      jumlahSantri: Number(formData.jumlahSantri) || 0,
      status: formData.status,
    }

    setYearRows((prev) => [newRow, ...prev])
    setFormData(defaultFormState)
    setIsAddDialogOpen(false)
  }

  const visibleStart = sortedYears.length === 0 ? 0 : startIndex + 1
  const visibleEnd = Math.min(startIndex + rowsLimit, sortedYears.length)
  const selectedCount = selectedIds.length

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">DAFTAR TAHUN</h1>

        <div className="flex flex-wrap items-center gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 gap-2 px-4">
                <PlusCircle className="h-4 w-4" />
                Tambah
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>Tambah Tahun Ajaran</DialogTitle>
                <DialogDescription>Lengkapi data tahun ajaran untuk disimpan.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="kode-tahun">Kode Tahun</Label>
                    <Input
                      id="kode-tahun"
                      placeholder="Contoh: 2026/2027"
                      value={formData.kodeTahun}
                      onChange={(event) => setFormData((prev) => ({ ...prev, kodeTahun: event.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nama-tahun">Nama Tahun</Label>
                    <Input
                      id="nama-tahun"
                      placeholder="Contoh: 2026-2027"
                      value={formData.namaTahun}
                      onChange={(event) => setFormData((prev) => ({ ...prev, namaTahun: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keterangan-tahun">Keterangan</Label>
                  <Input
                    id="keterangan-tahun"
                    placeholder="Keterangan tahun ajaran"
                    value={formData.keterangan}
                    onChange={(event) => setFormData((prev) => ({ ...prev, keterangan: event.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="jumlah-kelas">Jumlah Kelas</Label>
                    <Input
                      id="jumlah-kelas"
                      type="number"
                      min={0}
                      value={formData.jumlahKelas}
                      onChange={(event) => setFormData((prev) => ({ ...prev, jumlahKelas: event.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jumlah-santri">Jumlah Santri</Label>
                    <Input
                      id="jumlah-santri"
                      type="number"
                      min={0}
                      value={formData.jumlahSantri}
                      onChange={(event) => setFormData((prev) => ({ ...prev, jumlahSantri: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as YearStatus }))}
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

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleCreateYear}>Simpan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between px-5 py-6 text-left"
            >
              <span className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                <Filter className="h-5 w-5" />
                Filter Data
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
                  <Label htmlFor="search-year">Cari Tahun</Label>
                  <Input
                    id="search-year"
                    placeholder="Cari kode tahun, nama tahun, atau keterangan"
                    value={searchKeyword}
                    onChange={(event) => setSearchKeyword(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | YearStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Status" />
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
            <div className="flex items-center gap-3">
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
                  <DropdownMenuItem onClick={() => updateSelectedStatus("Aktif")}>Aktifkan</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateSelectedStatus("Nonaktif")}>Nonaktifkan</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={deleteSelectedRows}>
                    Hapus Terpilih
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {selectedCount > 0 && (
                <p className="text-sm text-muted-foreground">{selectedCount} data dipilih</p>
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
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-lg border bg-background">
            <Table className="min-w-[980px]">
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
                      aria-label="Pilih semua data tahun di halaman ini"
                    />
                  </TableHead>
                  <TableHead className="w-12 text-xs font-semibold uppercase tracking-wide text-muted-foreground">#</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort("kodeTahun")}>
                      KODE TAHUN
                      <ArrowUpDown className={cn("h-3.5 w-3.5", sortField === "kodeTahun" && "text-foreground")} />
                    </button>
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort("namaTahun")}>
                      NAMA TAHUN
                      <ArrowUpDown className={cn("h-3.5 w-3.5", sortField === "namaTahun" && "text-foreground")} />
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
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort("status")}>
                      STATUS
                      <ArrowUpDown className={cn("h-3.5 w-3.5", sortField === "status" && "text-foreground")} />
                    </button>
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">AKSI</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {pagedYears.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                      Data tahun ajaran tidak ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedYears.map((year, index) => (
                    <TableRow key={year.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(year.id)}
                          onCheckedChange={(checked) => handleSelectOne(year.id, checked)}
                          aria-label={`Pilih baris tahun ${year.namaTahun}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{startIndex + index + 1}</TableCell>
                      <TableCell>{year.kodeTahun}</TableCell>
                      <TableCell>{year.namaTahun}</TableCell>
                      <TableCell>{year.keterangan}</TableCell>
                      <TableCell>{year.jumlahKelas}</TableCell>
                      <TableCell>{year.jumlahSantri}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "font-semibold",
                            year.status === "Aktif"
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {year.status}
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
                            <DropdownMenuLabel>Aksi Tahun</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <PencilLine className="mr-2 h-4 w-4" />
                              Edit Tahun
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toggleRowStatus(year.id)}>Ubah Status</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteOneRow(year.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus Tahun
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
              Tampil {visibleStart}-{visibleEnd} dari {sortedYears.length}
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
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
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
