"use client"

import { useEffect, useMemo, useState } from "react"
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
import {
  tahunAjaranService,
  TahunAjaranApiItem,
  TahunAjaranListParams,
  BackendYearStatus,
} from "@/lib/services/tahun-ajaran.service"
import { ArrowUpDown, ChevronDown, Filter, MoreVertical, PencilLine, PlusCircle, Trash2 } from "lucide-react"

type YearStatus = "Aktif" | "Nonaktif"
type SortField = "kodeTahun" | "namaTahun" | "keterangan" | "jumlahKelas" | "jumlahSantri" | "status"

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
  status: YearStatus
}

const defaultFormState: YearFormData = {
  kodeTahun: "",
  namaTahun: "",
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

const toBackendStatus = (status: YearStatus): BackendYearStatus => (status === "Aktif" ? "AKTIF" : "NONAKTIF")

const fromBackendStatus = (status: unknown): YearStatus => {
  const normalized = toText(status).toUpperCase()
  return normalized === "NONAKTIF" ? "Nonaktif" : "Aktif"
}

const normalizeYearRow = (raw: TahunAjaranApiItem): YearRow => ({
  id: toNumber(raw.id_tahun_ajaran ?? raw.id, -1),
  kodeTahun: toText(raw.kode_tahun),
  namaTahun: toText(raw.nama_tahun),
  keterangan: toText(raw.keterangan) || "-",
  jumlahKelas: toNumber(raw.jumlah_kelas, 0),
  jumlahSantri: toNumber(raw.jumlah_santri, 0),
  status: fromBackendStatus(raw.status),
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

export default function TahunAjaranPage() {
  const { toast } = useToast()

  const [yearRows, setYearRows] = useState<YearRow[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | YearStatus>("all")

  const [rowsPerPage, setRowsPerPage] = useState("25")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>("kodeTahun")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<YearFormData>(defaultFormState)
  const [editingFormData, setEditingFormData] = useState<YearFormData>(defaultFormState)

  const rowsLimit = Number(rowsPerPage)

  const sortedYears = useMemo(() => {
    return [...yearRows].sort((a, b) => {
      const sortSign = sortDirection === "asc" ? 1 : -1
      const aValue = a[sortField]
      const bValue = b[sortField]

      if (typeof aValue === "number" && typeof bValue === "number") {
        return (aValue - bValue) * sortSign
      }

      return String(aValue).localeCompare(String(bValue), "id", { sensitivity: "base" }) * sortSign
    })
  }, [yearRows, sortField, sortDirection])

  const fetchYears = async () => {
    setIsLoading(true)
    try {
      const params: TahunAjaranListParams = {
        page: currentPage,
        per_page: rowsLimit,
      }

      const query = searchKeyword.trim()
      if (query) params.q = query
      if (statusFilter !== "all") params.status = toBackendStatus(statusFilter)

      const result = await tahunAjaranService.getAll(params)
      const rows = result.data.map(normalizeYearRow).filter((row) => row.id > 0)

      setYearRows(rows)
      setTotalItems(toNumber(result.meta?.total, rows.length))
      setTotalPages(Math.max(1, toNumber(result.meta?.last_page, 1)))
      setCurrentPage(toNumber(result.meta?.current_page, currentPage))
    } catch (error) {
      toast({
        title: "Gagal Memuat Data",
        description: getErrorMessage(error, "Data tahun ajaran gagal dimuat."),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [searchKeyword, statusFilter, rowsPerPage])

  useEffect(() => {
    setSelectedIds([])
    void fetchYears()
  }, [currentPage, rowsPerPage, searchKeyword, statusFilter])

  const pagedYears = sortedYears
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

  const openEditDialog = (rowId: number) => {
    const target = yearRows.find((row) => row.id === rowId)
    if (!target) return

    setEditingId(rowId)
    setEditingFormData({
      kodeTahun: target.kodeTahun,
      namaTahun: target.namaTahun,
      keterangan: target.keterangan === "-" ? "" : target.keterangan,
      status: target.status,
    })
    setIsEditDialogOpen(true)
  }

  const handleCreateYear = () => {
    const run = async () => {
      if (!formData.kodeTahun.trim() || !formData.namaTahun.trim()) return

      setIsLoading(true)
      try {
        await tahunAjaranService.create({
          kode_tahun: formData.kodeTahun,
          nama_tahun: formData.namaTahun,
          keterangan: formData.keterangan,
          status: toBackendStatus(formData.status),
        })

        toast({
          title: "Berhasil",
          description: "Data tahun ajaran berhasil dibuat.",
        })

        setFormData(defaultFormState)
        setIsAddDialogOpen(false)
        await fetchYears()
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal menambahkan data tahun ajaran."),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  const handleUpdateYear = () => {
    const run = async () => {
      if (!editingId || !editingFormData.kodeTahun.trim() || !editingFormData.namaTahun.trim()) return

      setIsLoading(true)
      try {
        await tahunAjaranService.update(editingId, {
          kode_tahun: editingFormData.kodeTahun,
          nama_tahun: editingFormData.namaTahun,
          keterangan: editingFormData.keterangan,
          status: toBackendStatus(editingFormData.status),
        })

        toast({
          title: "Berhasil",
          description: "Data tahun ajaran berhasil diperbarui.",
        })

        setIsEditDialogOpen(false)
        setEditingId(null)
        setEditingFormData(defaultFormState)
        await fetchYears()
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal memperbarui data tahun ajaran."),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  const updateSelectedStatus = (status: YearStatus) => {
    const run = async () => {
      if (selectedIds.length === 0) return

      setIsLoading(true)
      try {
        const updates = selectedIds
          .map((id) => yearRows.find((row) => row.id === id))
          .filter((row): row is YearRow => !!row)
          .map((row) =>
            tahunAjaranService.update(row.id, {
              kode_tahun: row.kodeTahun,
              nama_tahun: row.namaTahun,
              keterangan: row.keterangan === "-" ? "" : row.keterangan,
              status: toBackendStatus(status),
            }),
          )

        await Promise.all(updates)

        toast({
          title: "Berhasil",
          description: "Status tahun ajaran terpilih berhasil diperbarui.",
        })

        setSelectedIds([])
        await fetchYears()
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal memperbarui status tahun ajaran terpilih."),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  const deleteSelectedRows = () => {
    const run = async () => {
      if (selectedIds.length === 0) return

      setIsLoading(true)
      try {
        await Promise.all(selectedIds.map((id) => tahunAjaranService.remove(id)))

        toast({
          title: "Berhasil",
          description: "Data tahun ajaran terpilih berhasil dihapus.",
        })

        setSelectedIds([])
        await fetchYears()
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal menghapus data tahun ajaran terpilih."),
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
        await tahunAjaranService.remove(rowId)
        setSelectedIds((prev) => prev.filter((id) => id !== rowId))
        toast({
          title: "Berhasil",
          description: "Data tahun ajaran berhasil dihapus.",
        })
        await fetchYears()
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal menghapus data tahun ajaran."),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  const visibleStart = sortedYears.length === 0 ? 0 : (currentPage - 1) * rowsLimit + 1
  const visibleEnd = Math.min((currentPage - 1) * rowsLimit + rowsLimit, totalItems)
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
                <Button disabled={isLoading} onClick={handleCreateYear}>
                  Simpan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>Edit Tahun Ajaran</DialogTitle>
                <DialogDescription>Perbarui data tahun ajaran yang dipilih.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-kode-tahun">Kode Tahun</Label>
                    <Input
                      id="edit-kode-tahun"
                      placeholder="Contoh: 2026/2027"
                      value={editingFormData.kodeTahun}
                      onChange={(event) => setEditingFormData((prev) => ({ ...prev, kodeTahun: event.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-nama-tahun">Nama Tahun</Label>
                    <Input
                      id="edit-nama-tahun"
                      placeholder="Contoh: 2026-2027"
                      value={editingFormData.namaTahun}
                      onChange={(event) => setEditingFormData((prev) => ({ ...prev, namaTahun: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-keterangan-tahun">Keterangan</Label>
                  <Input
                    id="edit-keterangan-tahun"
                    placeholder="Keterangan tahun ajaran"
                    value={editingFormData.keterangan}
                    onChange={(event) => setEditingFormData((prev) => ({ ...prev, keterangan: event.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editingFormData.status}
                    onValueChange={(value) => setEditingFormData((prev) => ({ ...prev, status: value as YearStatus }))}
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
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Batal
                </Button>
                <Button disabled={isLoading} onClick={handleUpdateYear}>
                  Simpan Perubahan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <button type="button" className="flex w-full items-center justify-between px-5 py-6 text-left">
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
                  <Button variant="outline" className="h-10 gap-2" disabled={selectedCount === 0 || isLoading}>
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

              {selectedCount > 0 && <p className="text-sm text-muted-foreground">{selectedCount} data dipilih</p>}
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
                      checked={isAllCurrentPageSelected ? true : isSomeCurrentPageSelected ? "indeterminate" : false}
                      onCheckedChange={handleSelectAllOnPage}
                      aria-label="Pilih semua data tahun di halaman ini"
                    />
                  </TableHead>
                  <TableHead className="w-12 text-xs font-semibold uppercase tracking-wide text-muted-foreground">#</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort("kodeTahun")}>KODE TAHUN<ArrowUpDown className={cn("h-3.5 w-3.5", sortField === "kodeTahun" && "text-foreground")} /></button>
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort("namaTahun")}>NAMA TAHUN<ArrowUpDown className={cn("h-3.5 w-3.5", sortField === "namaTahun" && "text-foreground")} /></button>
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort("keterangan")}>KETERANGAN<ArrowUpDown className={cn("h-3.5 w-3.5", sortField === "keterangan" && "text-foreground")} /></button>
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort("jumlahKelas")}>JML. KELAS<ArrowUpDown className={cn("h-3.5 w-3.5", sortField === "jumlahKelas" && "text-foreground")} /></button>
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort("jumlahSantri")}>JML. SANTRI<ArrowUpDown className={cn("h-3.5 w-3.5", sortField === "jumlahSantri" && "text-foreground")} /></button>
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort("status")}>STATUS<ArrowUpDown className={cn("h-3.5 w-3.5", sortField === "status" && "text-foreground")} /></button>
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">AKSI</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {pagedYears.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                      {isLoading ? "Memuat data tahun ajaran..." : "Data tahun ajaran tidak ditemukan."}
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
                      <TableCell className="font-medium">{(currentPage - 1) * rowsLimit + index + 1}</TableCell>
                      <TableCell>{year.kodeTahun}</TableCell>
                      <TableCell>{year.namaTahun}</TableCell>
                      <TableCell>{year.keterangan}</TableCell>
                      <TableCell>{year.jumlahKelas}</TableCell>
                      <TableCell>{year.jumlahSantri}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn("font-semibold", year.status === "Aktif" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
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
                            <DropdownMenuItem onClick={() => openEditDialog(year.id)}>
                              <PencilLine className="mr-2 h-4 w-4" />
                              Edit Tahun
                            </DropdownMenuItem>
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
    </div>
  )
}
