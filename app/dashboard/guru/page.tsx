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
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  BackendPetugasStatus,
  DataPetugasApiItem,
  DataPetugasListParams,
  dataPetugasService,
} from "@/lib/services/petugas.service"
import { dataUnitService } from "@/lib/services/unit.service"
import { dataMasterService } from "@/lib/services/data-master.service"
import { ArrowUpDown, ChevronDown, Download, Eye, Filter, MoreVertical, PencilLine, PlusCircle, Trash2, Upload } from "lucide-react"

type GuruStatus = "Aktif" | "Nonaktif"
type SortField = "nip" | "nama" | "email" | "telepon" | "peran" | "status" | "terakhirMasuk"

interface GuruRow {
  id: number
  nip: string
  nama: string
  email: string
  telepon: string
  peran: string[]
  status: GuruStatus
  terakhirMasuk: string
}

interface GuruFormData {
  nip: string
  nama: string
  email: string
  telepon: string
  password: string
  peran: string[]
  status: GuruStatus
}

const defaultFormState: GuruFormData = {
  nip: "",
  nama: "",
  email: "",
  telepon: "",
  password: "",
  peran: [],
  status: "Aktif",
}

const fallbackPeranOptions = ["Petugas Admin", "Petugas Tata Usaha", "Petugas PPDB", "Petugas SPP", "Staf Pengajar"]

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

const toBackendStatus = (status: GuruStatus): BackendPetugasStatus => (status === "Aktif" ? "AKTIF" : "NONAKTIF")

const fromBackendStatus = (status: unknown): GuruStatus => {
  const normalized = toText(status).toUpperCase()
  return normalized === "NONAKTIF" ? "Nonaktif" : "Aktif"
}

const normalizePetugasRow = (raw: DataPetugasApiItem): GuruRow => ({
  id: toNumber(raw.id_petugas ?? raw.id, -1),
  nip: toText(raw.nomor_induk) || "-",
  nama: toText(raw.nama_lengkap),
  email: toText(raw.alamat_email),
  telepon: toText(raw.nomor_telepon) || "-",
  peran: (() => {
    const raw_peran = raw.peran_akun
    if (!raw_peran) return []
    // Flatten in case backend returns [["Staf Pengajar"]] instead of ["Staf Pengajar"]
    const arr = Array.isArray(raw_peran) ? raw_peran.flat() : [toText(raw_peran)]
    return arr.map((p) => toText(p)).filter(Boolean)
  })(),
  status: fromBackendStatus(raw.status),
  terakhirMasuk: toText(raw.last_login) || "-",
})

const formatLastLogin = (value: string): string => {
  if (!value || value === "-") return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

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

const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function GuruPage() {
  const { toast } = useToast()

  const [rows, setRows] = useState<GuruRow[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [searchKeyword, setSearchKeyword] = useState("")
  const [statusFilter, setStatusFilter] = useState<GuruStatus | "all">("all")
  const [roleFilter, setRoleFilter] = useState<string>("all")

  const [draftSearchKeyword, setDraftSearchKeyword] = useState("")
  const [draftStatusFilter, setDraftStatusFilter] = useState<GuruStatus | "all">("all")
  const [draftRoleFilter, setDraftRoleFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>("nama")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Guard: cegah double-invoke & cascade re-fetch
  const initCalledRef = useRef(false)
  const initDoneRef = useRef(false)

  const [rowsPerPage, setRowsPerPage] = useState("25")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [detailData, setDetailData] = useState<GuruRow | null>(null)
  const [formData, setFormData] = useState<GuruFormData>(defaultFormState)
  const [editingFormData, setEditingFormData] = useState<GuruFormData>(defaultFormState)

  const [peranOptions, setPeranOptions] = useState<string[]>(fallbackPeranOptions)

  const rowsLimit = Number(rowsPerPage)

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const sortSign = sortDirection === "asc" ? 1 : -1
      const aValue = a[sortField]
      const bValue = b[sortField]
      return String(aValue).localeCompare(String(bValue), "id", { sensitivity: "base" }) * sortSign
    })
  }, [rows, sortField, sortDirection])

  const displayedRows = useMemo(() => {
    return sortedRows
  }, [sortedRows])

  const selectedCount = selectedIds.length

  const fetchRows = async () => {
    setIsLoading(true)
    try {
      const params: DataPetugasListParams = {
        page: currentPage,
        per_page: rowsLimit,
      }

      const query = searchKeyword.trim()
      if (query) params.q = query
      if (statusFilter !== "all") params.status = toBackendStatus(statusFilter)
      if (roleFilter !== "all") params.peran_akun = roleFilter

      const result = await dataPetugasService.getAll(params)
      const mappedRows = result.data.map(normalizePetugasRow).filter((row) => row.id > 0)

      setRows(mappedRows)
      setTotalItems(toNumber(result.meta?.total, mappedRows.length))
      setTotalPages(Math.max(1, toNumber(result.meta?.last_page, 1)))
      setCurrentPage(toNumber(result.meta?.current_page, currentPage))
    } catch (error) {
      toast({
        title: "Gagal Memuat Data",
        description: getErrorMessage(error, "Data petugas gagal dimuat."),
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
        
        if (initData.peran && initData.peran.length > 0) {
          setPeranOptions(initData.peran)
        }
        
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
    setCurrentPage(1)
  }, [searchKeyword, statusFilter, roleFilter, rowsPerPage])

  useEffect(() => {
    if (!initDoneRef.current) return
    setSelectedIds([])
    void fetchRows()
  }, [currentPage, rowsPerPage, searchKeyword, statusFilter, roleFilter])

  const handleSort = (nextSortField: SortField) => {
    if (sortField === nextSortField) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
      return
    }

    setSortField(nextSortField)
    setSortDirection("asc")
  }

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    const currentIds = displayedRows.map((row) => row.id)
    if (checked !== true) {
      setSelectedIds((prev) => prev.filter((id) => !currentIds.includes(id)))
      return
    }

    setSelectedIds(currentIds)
  }

  const handleSelectOne = (id: number, checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
      return
    }

    setSelectedIds((prev) => prev.filter((item) => item !== id))
  }

  const resetFilter = () => {
    setDraftSearchKeyword("")
    setDraftStatusFilter("all")
    setDraftRoleFilter("all")
    setSearchKeyword("")
    setStatusFilter("all")
    setRoleFilter("all")
    setCurrentPage(1)
  }

  const openEditDialog = (id: number) => {
    const target = rows.find((row) => row.id === id)
    if (!target) return

    setEditingId(id)
    setEditingFormData({
      nip: target.nip === "-" ? "" : target.nip,
      nama: target.nama,
      email: target.email,
      telepon: target.telepon === "-" ? "" : target.telepon,
      password: "",
      peran: target.peran,
      status: target.status,
    })
    setIsEditDialogOpen(true)
  }

  const openDetailDialog = (id: number) => {
    const target = rows.find((row) => row.id === id)
    if (!target) return

    setDetailData(target)
    setIsDetailDialogOpen(true)
  }

  const handleCreate = () => {
    const run = async () => {
      if (!formData.nama.trim() || !formData.email.trim() || !formData.password.trim()) return

      setIsLoading(true)
      try {
        await dataPetugasService.create({
          nomor_induk: formData.nip,
          nama_lengkap: formData.nama,
          peran_akun: formData.peran,
          alamat_email: formData.email,
          nomor_telepon: formData.telepon,
          password: formData.password,
          status: toBackendStatus(formData.status),
        })

        toast({
          title: "Berhasil",
          description: "Data petugas berhasil dibuat.",
        })

        setFormData(defaultFormState)
        setIsAddDialogOpen(false)
        await fetchRows()
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal menambahkan data petugas."),
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
      if (!editingId || !editingFormData.nama.trim() || !editingFormData.email.trim()) return

      setIsLoading(true)
      try {
        await dataPetugasService.update(editingId, {
          nomor_induk: editingFormData.nip,
          nama_lengkap: editingFormData.nama,
          peran_akun: editingFormData.peran,
          alamat_email: editingFormData.email,
          nomor_telepon: editingFormData.telepon,
          password: editingFormData.password.trim() || undefined,
          status: toBackendStatus(editingFormData.status),
        })

        toast({
          title: "Berhasil",
          description: "Data petugas berhasil diperbarui.",
        })

        setIsEditDialogOpen(false)
        setEditingId(null)
        setEditingFormData(defaultFormState)
        await fetchRows()
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal memperbarui data petugas."),
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
        await dataPetugasService.remove(id)
        setSelectedIds((prev) => prev.filter((item) => item !== id))
        toast({
          title: "Berhasil",
          description: "Data petugas berhasil dihapus.",
        })
        await fetchRows()
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal menghapus data petugas."),
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
        await Promise.all(selectedIds.map((id) => dataPetugasService.remove(id)))
        setSelectedIds([])
        toast({
          title: "Berhasil",
          description: "Data petugas terpilih berhasil dihapus.",
        })
        await fetchRows()
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal menghapus data petugas terpilih."),
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
        const blob = await dataPetugasService.exportExcel({
          q: searchKeyword.trim() || undefined,
          status: statusFilter === "all" ? undefined : toBackendStatus(statusFilter),
          peran_akun: roleFilter === "all" ? undefined : roleFilter,
        })

        downloadBlob(blob, `data-petugas-${new Date().toISOString().slice(0, 10)}.xlsx`)
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal mengekspor data petugas."),
          variant: "destructive",
        })
      }
    }

    void run()
  }

  const visibleStart = displayedRows.length === 0 ? 0 : (currentPage - 1) * rowsLimit + 1
  const visibleEnd = displayedRows.length === 0 ? 0 : Math.min((currentPage - 1) * rowsLimit + displayedRows.length, totalItems)

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">DAFTAR PETUGAS</h1>
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
                <DialogTitle>Tambah Petugas</DialogTitle>
                <DialogDescription>Isi data petugas baru dengan lengkap.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nip">Nomor Induk</Label>
                    <Input id="nip" value={formData.nip} onChange={(event) => setFormData((prev) => ({ ...prev, nip: event.target.value }))} placeholder="Nomor induk" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nama">Nama Lengkap</Label>
                    <Input id="nama" value={formData.nama} onChange={(event) => setFormData((prev) => ({ ...prev, nama: event.target.value }))} placeholder="Nama lengkap" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Alamat Email</Label>
                  <Input id="email" value={formData.email} onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))} placeholder="nama@domain.com" />
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="telepon">Nomor Telepon</Label>
                    <Input id="telepon" value={formData.telepon} onChange={(event) => setFormData((prev) => ({ ...prev, telepon: event.target.value }))} placeholder="08xxxx" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={formData.password} onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))} placeholder="Minimal 6 karakter" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Peran Petugas</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between font-normal text-left px-3">
                          <span className="truncate">
                            {formData.peran.length > 0 ? formData.peran.join(", ") : "Pilih peran..."}
                          </span>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-2" align="start">
                        <div className="flex flex-col space-y-2">
                          {peranOptions.map((option) => (
                            <div key={option} className="flex items-center space-x-2 rounded-sm p-1 hover:bg-accent hover:text-accent-foreground">
                              <Checkbox
                                id={`add-role-${option}`}
                                checked={formData.peran.includes(option)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData((prev) => ({ ...prev, peran: [...prev.peran, option] }))
                                  } else {
                                    setFormData((prev) => ({ ...prev, peran: prev.peran.filter((p) => p !== option) }))
                                  }
                                }}
                              />
                              <Label htmlFor={`add-role-${option}`} className="font-normal cursor-pointer flex-1">
                                {option}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as GuruStatus }))}>
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

          <Link href="/dashboard/guru/import">
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
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="search-keyword">Kata Kunci</Label>
                  <Input
                    id="search-keyword"
                    placeholder="Masukan kata kunci pencarian"
                    value={draftSearchKeyword}
                    onChange={(event) => setDraftSearchKeyword(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={draftStatusFilter} onValueChange={(value) => setDraftStatusFilter(value as GuruStatus | "all")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="Aktif">Aktif</SelectItem>
                      <SelectItem value="Nonaktif">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Peran Petugas</Label>
                  <Select value={draftRoleFilter} onValueChange={setDraftRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Peran petugas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Peran</SelectItem>
                      {peranOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={resetFilter}>
                  Reset
                </Button>
                <Button onClick={() => {
                  setSearchKeyword(draftSearchKeyword)
                  setStatusFilter(draftStatusFilter)
                  setRoleFilter(draftRoleFilter)
                  setCurrentPage(1)
                }}>
                  Terapkan
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
                  <DropdownMenuItem className="text-destructive" onClick={deleteSelected}>
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
            <Table className="min-w-[1200px]">
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        displayedRows.length > 0 && displayedRows.every((row) => selectedIds.includes(row.id))
                          ? true
                          : displayedRows.some((row) => selectedIds.includes(row.id))
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={handleSelectAll}
                      aria-label="Pilih semua data petugas"
                    />
                  </TableHead>
                  <TableHead className="w-12 text-xs font-semibold uppercase tracking-wide text-muted-foreground">#</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort("nama")}>NAMA LENGKAP<ArrowUpDown className={cn("h-3.5 w-3.5", sortField === "nama" && "text-foreground")} /></button>
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort("email")}>ALAMAT EMAIL<ArrowUpDown className={cn("h-3.5 w-3.5", sortField === "email" && "text-foreground")} /></button>
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort("telepon")}>NOMOR TELEPON<ArrowUpDown className={cn("h-3.5 w-3.5", sortField === "telepon" && "text-foreground")} /></button>
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort("peran")}>PERAN PETUGAS<ArrowUpDown className={cn("h-3.5 w-3.5", sortField === "peran" && "text-foreground")} /></button>
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort("status")}>STATUS<ArrowUpDown className={cn("h-3.5 w-3.5", sortField === "status" && "text-foreground")} /></button>
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort("terakhirMasuk")}>TERAKHIR MASUK<ArrowUpDown className={cn("h-3.5 w-3.5", sortField === "terakhirMasuk" && "text-foreground")} /></button>
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">AKSI</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {displayedRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-10 text-center text-muted-foreground">
                      {isLoading ? "Memuat data petugas..." : "Data petugas tidak ditemukan."}
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedRows.map((guru, index) => (
                    <TableRow key={guru.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(guru.id)}
                          onCheckedChange={(checked) => handleSelectOne(guru.id, checked)}
                          aria-label={`Pilih baris ${guru.nama}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{(currentPage - 1) * rowsLimit + index + 1}</TableCell>
                      <TableCell>{guru.nama}</TableCell>
                      <TableCell>{guru.email}</TableCell>
                      <TableCell>{guru.telepon}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {guru.peran.map((p) => (
                            <Badge
                              key={p}
                              className={cn(
                                p === "Petugas Keuangan" && "bg-lime-500 text-white hover:bg-lime-500",
                                p === "Petugas Admin" && "bg-blue-600 text-white hover:bg-blue-600",
                                p === "Petugas PPDB" && "bg-emerald-500 text-white hover:bg-emerald-500",
                                p === "Petugas SPP" && "bg-violet-500 text-white hover:bg-violet-500",
                                !["Petugas Keuangan", "Petugas Admin", "Petugas PPDB", "Petugas SPP"].includes(p) &&
                                  "bg-muted text-muted-foreground",
                              )}
                            >
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={guru.status === "Aktif" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}>
                          {guru.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatLastLogin(guru.terakhirMasuk)}</TableCell>
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
                            <DropdownMenuLabel>Aksi Petugas</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openDetailDialog(guru.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Detail
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openEditDialog(guru.id)}>
                              <PencilLine className="mr-2 h-4 w-4" />
                              Edit Data
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteOne(guru.id)}>
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
        open={isDetailDialogOpen}
        onOpenChange={(open) => {
          setIsDetailDialogOpen(open)
          if (!open) setDetailData(null)
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Detail Petugas</DialogTitle>
            <DialogDescription>Informasi lengkap petugas terpilih.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Nomor Induk</p>
                <p className="font-medium">{detailData?.nip || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Nama Lengkap</p>
                <p className="font-medium">{detailData?.nama || "-"}</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Alamat Email</p>
              <p className="font-medium">{detailData?.email || "-"}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Nomor Telepon</p>
                <p className="font-medium">{detailData?.telepon || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Peran Petugas</p>
                <p className="font-medium">{detailData?.peran.join(", ") || "-"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{detailData?.status || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Terakhir Masuk</p>
                <p className="font-medium">{formatLastLogin(detailData?.terakhirMasuk || "-")}</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDetailDialogOpen(false)
                if (detailData) {
                  openEditDialog(detailData.id)
                }
              }}
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setIsDetailDialogOpen(false)
                if (detailData) {
                  deleteOne(detailData.id)
                }
              }}
            >
              Hapus
            </Button>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Edit Petugas</DialogTitle>
            <DialogDescription>Perbarui data petugas yang dipilih.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-nip">Nomor Induk</Label>
                <Input id="edit-nip" value={editingFormData.nip} onChange={(event) => setEditingFormData((prev) => ({ ...prev, nip: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-nama">Nama Lengkap</Label>
                <Input id="edit-nama" value={editingFormData.nama} onChange={(event) => setEditingFormData((prev) => ({ ...prev, nama: event.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Alamat Email</Label>
              <Input id="edit-email" value={editingFormData.email} onChange={(event) => setEditingFormData((prev) => ({ ...prev, email: event.target.value }))} />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-telepon">Nomor Telepon</Label>
                <Input id="edit-telepon" value={editingFormData.telepon} onChange={(event) => setEditingFormData((prev) => ({ ...prev, telepon: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">Password Baru (opsional)</Label>
                <Input id="edit-password" type="password" value={editingFormData.password} onChange={(event) => setEditingFormData((prev) => ({ ...prev, password: event.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Peran Petugas</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between font-normal text-left px-3">
                      <span className="truncate">
                        {editingFormData.peran.length > 0 ? editingFormData.peran.join(", ") : "Pilih peran..."}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-2" align="start">
                    <div className="flex flex-col space-y-2">
                      {peranOptions.map((option) => (
                        <div key={option} className="flex items-center space-x-2 rounded-sm p-1 hover:bg-accent hover:text-accent-foreground">
                          <Checkbox
                            id={`edit-role-${option}`}
                            checked={editingFormData.peran.includes(option)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setEditingFormData((prev) => ({ ...prev, peran: [...prev.peran, option] }))
                              } else {
                                setEditingFormData((prev) => ({ ...prev, peran: prev.peran.filter((p) => p !== option) }))
                              }
                            }}
                          />
                          <Label htmlFor={`edit-role-${option}`} className="font-normal cursor-pointer flex-1">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editingFormData.status} onValueChange={(value) => setEditingFormData((prev) => ({ ...prev, status: value as GuruStatus }))}>
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
    </div>
  )
}
