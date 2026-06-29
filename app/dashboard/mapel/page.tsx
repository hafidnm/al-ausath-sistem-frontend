"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, useRef } from "react"
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
  dataMataPelajaranService,
  DataMataPelajaranApiItem,
} from "@/lib/services/mata-pelajaran.service"
import { dataUnitService } from "@/lib/services/unit.service"
import { dataMasterService } from "@/lib/services/data-master.service"
import { useUnit } from "@/contexts/unit-context"
import { ChevronDown, Download, Eye, Filter, MoreVertical, PencilLine, PlusCircle, Trash2, Upload } from "lucide-react"

type UiStatus = "Aktif" | "Nonaktif"

interface MapelRow {
  id: number
  kodeMapel: string
  namaMapel: string
  kodeUnit: string | null
  kelompokMapel: string | null
  keterangan: string | null
  status: UiStatus
}

interface MapelFormData {
  kodeMapel: string
  namaMapel: string
  kodeUnit: string | null
  kelompokMapel: string | null
  keterangan: string | null
  status: UiStatus
}

interface UnitOption {
  value: string
  label: string
}

const defaultFormState: MapelFormData = {
  kodeMapel: "",
  namaMapel: "",
  kodeUnit: null,
  kelompokMapel: null,
  keterangan: null,
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

const normalizeRow = (raw: DataMataPelajaranApiItem): MapelRow => ({
  id: toNumber(raw.id_mapel ?? raw.id, -1),
  kodeMapel: toText(raw.kode_mapel),
  namaMapel: toText(raw.nama_mapel),
  kodeUnit: raw.kode_unit ?? null,
  kelompokMapel: raw.kelompok_mapel ?? null,
  keterangan: raw.keterangan ?? null,
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
  const { selectedKodeUnit, isLoading: isUnitLoading } = useUnit()
  const contextReady = !isUnitLoading

  const [rows, setRows] = useState<MapelRow[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const initCalledRef = useRef(false)
  const initDoneRef = useRef(false)
  const [allMapelOptions, setAllMapelOptions] = useState<any[]>([])

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [detailData, setDetailData] = useState<MapelRow | null>(null)

  const [formData, setFormData] = useState<MapelFormData>(defaultFormState)
  const [editingFormData, setEditingFormData] = useState<MapelFormData>(defaultFormState)
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([])

  const [keyword, setKeyword] = useState("")
  const [statusFilter, setStatusFilter] = useState<UiStatus | "all">("all")
  const [kelompokMapelFilter, setKelompokMapelFilter] = useState<string | "all">("all")

  const [draftKeyword, setDraftKeyword] = useState("")
  const [draftStatusFilter, setDraftStatusFilter] = useState<UiStatus | "all">("all")
  const [draftKelompokMapelFilter, setDraftKelompokMapelFilter] = useState<string | "all">("all")

  const [rowsPerPage, setRowsPerPage] = useState("25")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const rowsLimit = Number(rowsPerPage)

  const fetchRows = async () => {
    setIsLoading(true)
    try {
      const params: {
        page: number
        per_page: number
        q?: string
        status?: BackendStatus
        kode_unit?: string
        kelompok_mapel?: string
      } = {
        page: currentPage,
        per_page: rowsLimit,
      }

      const q = keyword.trim()
      if (q) params.q = q
      if (statusFilter !== "all") params.status = toBackendStatus(statusFilter)
      if (selectedKodeUnit) params.kode_unit = selectedKodeUnit
      if (kelompokMapelFilter !== "all") params.kelompok_mapel = kelompokMapelFilter

      const result = await dataMataPelajaranService.getAll(params)
      const mappedRows = result.data.map(normalizeRow).filter((row) => row.id > 0)

      setRows(mappedRows)
      setSelectedIds((prev) => prev.filter((id) => mappedRows.some((row) => row.id === id)))
      setTotalItems(toNumber(result.meta?.total, mappedRows.length))
      setTotalPages(Math.max(1, toNumber(result.meta?.last_page, 1)))
      setCurrentPage(toNumber(result.meta?.current_page, currentPage))
    } catch (error) {
      toast({
        title: "Gagal Memuat Data",
        description: getErrorMessage(error, "Data mata pelajaran gagal dimuat."),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!contextReady) return
    const loadOptions = async () => {
      try {
        const initData = await dataMasterService.getInitOptions()
        
        const options: UnitOption[] = []
        for (const item of (initData.unit || [])) {
          const code = toText(item.kode_unit).trim()
          if (!code) continue
          options.push({
            value: code,
            label: toText(item.nama_unit).trim() || code,
          })
        }
        setUnitOptions(options)
        setAllMapelOptions(initData.mapel || [])
      } catch (error) {
        console.error("Gagal memuat opsi filter awal", error)
      } finally {
        initDoneRef.current = true
        void fetchRows()
      }
    }

    if (!initCalledRef.current) {
      initCalledRef.current = true
      void loadOptions()
    } else if (initDoneRef.current) {
      void fetchRows()
    }
  }, [contextReady])

  const kelompokMapelOptions = useMemo(() => {
    const values = new Set<string>()
    for (const item of allMapelOptions) {
      if (selectedKodeUnit && item.kode_unit !== selectedKodeUnit) continue
      const name = toText(item.kelompok_mapel).trim()
      if (name) values.add(name)
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b, "id"))
  }, [allMapelOptions, selectedKodeUnit])

  useEffect(() => {
    if (kelompokMapelFilter === "all") return
    const exists = kelompokMapelOptions.some((option) => option === kelompokMapelFilter)
    if (!exists) {
      setKelompokMapelFilter("all")
      setDraftKelompokMapelFilter("all")
      setCurrentPage(1)
    }
  }, [kelompokMapelFilter, kelompokMapelOptions])

  useEffect(() => {
    if (!initDoneRef.current) return
    void fetchRows()
  }, [currentPage, rowsPerPage, keyword, statusFilter, selectedKodeUnit, kelompokMapelFilter])

  const resetFilter = () => {
    setDraftKeyword("")
    setDraftStatusFilter("all")
    setDraftKelompokMapelFilter("all")
    setKeyword("")
    setStatusFilter("all")
    setKelompokMapelFilter("all")
    setCurrentPage(1)
  }

  const openDetailDialog = (id: number) => {
    const run = async () => {
      setIsLoading(true)
      try {
        const detail = await dataMataPelajaranService.getById(id)
        setDetailData(normalizeRow(detail))
        setIsDetailDialogOpen(true)
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal memuat detail data mata pelajaran."),
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
      kodeMapel: target.kodeMapel,
      namaMapel: target.namaMapel,
      kodeUnit: target.kodeUnit || null,
      kelompokMapel: target.kelompokMapel || null,
      keterangan: target.keterangan || null,
      status: target.status,
    })
    setIsEditDialogOpen(true)
  }

  const handleCreate = () => {
    const run = async () => {
      if (!formData.kodeMapel.trim() || !formData.namaMapel.trim() || !formData.kodeUnit) {
        toast({
          title: "Validasi",
          description: "Kode mapel, nama mapel, dan kode unit wajib diisi.",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)
      try {
        await dataMataPelajaranService.create({
          kode_mapel: formData.kodeMapel,
          nama_mapel: formData.namaMapel,
          kode_unit: formData.kodeUnit || null,
          kelompok_mapel: formData.kelompokMapel || null,
          keterangan: formData.keterangan || null,
          status: toBackendStatus(formData.status),
        })

        toast({
          title: "Berhasil",
          description: "Data mata pelajaran berhasil dibuat.",
        })

        setIsAddDialogOpen(false)
        setFormData(defaultFormState)
        setCurrentPage(1)
        await fetchRows()
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal menambahkan data mata pelajaran."),
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
      if (!editingFormData.kodeMapel.trim() || !editingFormData.namaMapel.trim() || !editingFormData.kodeUnit) {
        toast({
          title: "Validasi",
          description: "Kode mapel, nama mapel, dan kode unit wajib diisi.",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)
      try {
        await dataMataPelajaranService.update(editingId, {
          kode_mapel: editingFormData.kodeMapel,
          nama_mapel: editingFormData.namaMapel,
          kode_unit: editingFormData.kodeUnit || null,
          kelompok_mapel: editingFormData.kelompokMapel || null,
          keterangan: editingFormData.keterangan || null,
          status: toBackendStatus(editingFormData.status),
        })

        toast({
          title: "Berhasil",
          description: "Data mata pelajaran berhasil diperbarui.",
        })

        setIsEditDialogOpen(false)
        setEditingId(null)
        setEditingFormData(defaultFormState)
        await fetchRows()
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal memperbarui data mata pelajaran."),
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
        await dataMataPelajaranService.remove(id)
        toast({
          title: "Berhasil",
          description: "Data mata pelajaran berhasil dihapus.",
        })
        await fetchRows()
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal menghapus data mata pelajaran."),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? rows.map((row) => row.id) : [])
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

      const yes = window.confirm(`Hapus ${selectedIds.length} data mata pelajaran terpilih?`)
      if (!yes) return

      setIsLoading(true)
      try {
        const results = await Promise.allSettled(selectedIds.map((id) => dataMataPelajaranService.remove(id)))
        const failed = results.filter((result) => result.status === "rejected").length
        const success = results.length - failed

        if (success > 0) {
          toast({
            title: "Berhasil",
            description: `${success} data mata pelajaran berhasil dihapus.${failed > 0 ? ` ${failed} data gagal dihapus.` : ""}`,
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
        const blob = await dataMataPelajaranService.exportCsv({
          q: keyword.trim() || undefined,
          status: statusFilter === "all" ? undefined : toBackendStatus(statusFilter),
          kode_unit: selectedKodeUnit || undefined,
          kelompok_mapel: kelompokMapelFilter === "all" ? undefined : kelompokMapelFilter,
        })

        downloadBlob(blob, `data-mata-pelajaran-${new Date().toISOString().slice(0, 10)}.csv`)
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal mengekspor data mata pelajaran."),
          variant: "destructive",
        })
      }
    }

    void run()
  }

  const visibleStart = rows.length === 0 ? 0 : (currentPage - 1) * rowsLimit + 1
  const visibleEnd = rows.length === 0 ? 0 : Math.min((currentPage - 1) * rowsLimit + rows.length, totalItems)
  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(row.id))

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">DATA MATA PELAJARAN</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 gap-2 px-4">
                <PlusCircle className="h-4 w-4" />
                Tambah
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Tambah Mata Pelajaran</DialogTitle>
                <DialogDescription>Lengkapi data mata pelajaran baru.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="create-kode-mapel">
                      Kode Mapel <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="create-kode-mapel"
                      value={formData.kodeMapel}
                      onChange={(event) => setFormData((prev) => ({ ...prev, kodeMapel: event.target.value }))}
                      placeholder="Contoh: MATH"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-nama-mapel">
                      Nama Mapel <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="create-nama-mapel"
                      value={formData.namaMapel}
                      onChange={(event) => setFormData((prev) => ({ ...prev, namaMapel: event.target.value }))}
                      placeholder="Contoh: Matematika"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>
                      Kode Unit <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.kodeUnit || ""}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, kodeUnit: value || null }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih unit (wajib)" />
                      </SelectTrigger>
                      <SelectContent>
                        {unitOptions
                          .filter((option) => !selectedKodeUnit || option.value === selectedKodeUnit)
                          .map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.value} - {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-kelompok-mapel">Kelompok Mapel</Label>
                    <Input
                      id="create-kelompok-mapel"
                      value={formData.kelompokMapel || ""}
                      onChange={(event) => setFormData((prev) => ({ ...prev, kelompokMapel: event.target.value || null }))}
                      placeholder="Contoh: Matematika"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-keterangan">Keterangan</Label>
                  <Input
                    id="create-keterangan"
                    value={formData.keterangan || ""}
                    onChange={(event) => setFormData((prev) => ({ ...prev, keterangan: event.target.value || null }))}
                    placeholder="Keterangan tambahan"
                  />
                </div>

                <div className="space-y-2 md:w-1/3">
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

          <Link href="/dashboard/mapel/import">
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="mapel-keyword">Kata Kunci</Label>
                  <Input
                    id="mapel-keyword"
                    placeholder="Cari kode mapel / nama mapel / kelompok"
                    value={draftKeyword}
                    onChange={(event) => setDraftKeyword(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={draftStatusFilter}
                    onValueChange={(value) => setDraftStatusFilter(value as UiStatus | "all")}
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

                <div className="space-y-2">
                  <Label>Kelompok Mapel</Label>
                  <Select
                    value={draftKelompokMapelFilter}
                    onValueChange={(value) => setDraftKelompokMapelFilter(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kelompok mapel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kelompok</SelectItem>
                      {kelompokMapelOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={resetFilter}>
                  Reset
                </Button>
                <Button onClick={() => {
                  setKeyword(draftKeyword)
                  setStatusFilter(draftStatusFilter)
                  setKelompokMapelFilter(draftKelompokMapelFilter)
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
            <Table className="min-w-[1100px]">
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
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">KODE MAPEL</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">NAMA MAPEL</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">KODE UNIT</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">KELOMPOK</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">STATUS</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">AKSI</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      {isLoading ? "Memuat data mata pelajaran..." : "Data mata pelajaran tidak ditemukan."}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, index) => (
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
                      <TableCell className="font-mono text-sm">{row.kodeMapel || "-"}</TableCell>
                      <TableCell>{row.namaMapel || "-"}</TableCell>
                      <TableCell className="text-sm">{row.kodeUnit || "-"}</TableCell>
                      <TableCell className="text-sm">{row.kelompokMapel || "-"}</TableCell>
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
                            <DropdownMenuLabel>Aksi Mata Pelajaran</DropdownMenuLabel>
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
                                const yes = window.confirm("Hapus data mata pelajaran ini?")
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
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Edit Mata Pelajaran</DialogTitle>
            <DialogDescription>Perbarui data mata pelajaran terpilih.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-kode-mapel">
                  Kode Mapel <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-kode-mapel"
                  value={editingFormData.kodeMapel}
                  onChange={(event) => setEditingFormData((prev) => ({ ...prev, kodeMapel: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-nama-mapel">
                  Nama Mapel <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-nama-mapel"
                  value={editingFormData.namaMapel}
                  onChange={(event) => setEditingFormData((prev) => ({ ...prev, namaMapel: event.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Kode Unit <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={editingFormData.kodeUnit || ""}
                  onValueChange={(value) =>
                    setEditingFormData((prev) => ({
                      ...prev,
                      kodeUnit: value || null,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih unit (wajib)" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.value} - {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-kelompok-mapel">Kelompok Mapel</Label>
                <Input
                  id="edit-kelompok-mapel"
                  value={editingFormData.kelompokMapel || ""}
                  onChange={(event) => setEditingFormData((prev) => ({ ...prev, kelompokMapel: event.target.value || null }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-keterangan">Keterangan</Label>
              <Input
                id="edit-keterangan"
                value={editingFormData.keterangan || ""}
                onChange={(event) => setEditingFormData((prev) => ({ ...prev, keterangan: event.target.value || null }))}
              />
            </div>

            <div className="space-y-2 md:w-1/3">
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
            <DialogTitle>Detail Mata Pelajaran</DialogTitle>
            <DialogDescription>Informasi lengkap data mata pelajaran terpilih.</DialogDescription>
          </DialogHeader>

          {!detailData ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Memuat detail data...</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 py-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Kode Mapel</p>
                <p className="font-medium">{detailData.kodeMapel || "-"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Nama Mapel</p>
                <p className="font-medium">{detailData.namaMapel || "-"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Kode Unit</p>
                <p className="font-medium">{detailData.kodeUnit || "-"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Kelompok Mapel</p>
                <p className="font-medium">{detailData.kelompokMapel || "-"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Keterangan</p>
                <p className="font-medium">{detailData.keterangan || "-"}</p>
              </div>
              <div className="rounded-lg border p-3">
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
