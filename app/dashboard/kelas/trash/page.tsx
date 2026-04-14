"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  DataKelasApiItem,
  DataKelasDependencySummary,
  dataKelasService,
} from "@/lib/services/kelas.service"
import { dataUnitService } from "@/lib/services/unit.service"
import { tahunAjaranService } from "@/lib/services/tahun-ajaran.service"
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react"

interface TrashRow {
  id: number
  namaUnit: string
  kodeUnit: string
  kodeKelas: string
  namaKelas: string
  tahunAjaran: string
  deletedAt: string
}

interface UnitOption {
  value: string
  label: string
}

interface TahunAjaranOption {
  value: string
  label: string
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

const normalizeTrashRow = (raw: DataKelasApiItem): TrashRow => ({
  id: toNumber(raw.id_kelas ?? raw.id, -1),
  namaUnit: toText(raw.unit?.nama_unit) || toText(raw.kode_unit) || "-",
  kodeUnit: toText(raw.kode_unit),
  kodeKelas: toText(raw.kode_kelas),
  namaKelas: toText(raw.nama_kelas),
  tahunAjaran: toText(raw.tahun_ajaran),
  deletedAt: toText(raw.deleted_at),
})

const formatDateTime = (value: string): string => {
  if (!value) return "-"
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

const getDependencyTotal = (dependency: DataKelasDependencySummary | null): number => {
  if (!dependency) return 0

  const explicitTotal = toNumber(dependency.total, -1)
  if (explicitTotal >= 0) return explicitTotal

  return [
    toNumber(dependency.data_santri),
    toNumber(dependency.data_kelas_mapel),
    toNumber(dependency.data_nilai_siswa),
    toNumber(dependency.data_raport),
    toNumber(dependency.ppdb_pendaftar),
  ].reduce((sum, item) => sum + item, 0)
}

export default function KelasTrashPage() {
  const { toast } = useToast()

  const [rows, setRows] = useState<TrashRow[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([])
  const [tahunOptions, setTahunOptions] = useState<TahunAjaranOption[]>([])

  const [rowsPerPage, setRowsPerPage] = useState("25")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [draftKeyword, setDraftKeyword] = useState("")
  const [draftUnit, setDraftUnit] = useState("all")
  const [draftTahun, setDraftTahun] = useState("all")

  const [keyword, setKeyword] = useState("")
  const [unitFilter, setUnitFilter] = useState("all")
  const [tahunFilter, setTahunFilter] = useState("all")

  const [isForceDialogOpen, setIsForceDialogOpen] = useState(false)
  const [forceTarget, setForceTarget] = useState<TrashRow | null>(null)
  const [dependencySummary, setDependencySummary] = useState<DataKelasDependencySummary | null>(null)

  const rowsLimit = Number(rowsPerPage)

  const dependencyItems = useMemo(() => {
    const dep = dependencySummary || {}
    return [
      { key: "data_santri", label: "Data Santri", value: toNumber(dep.data_santri) },
      { key: "data_kelas_mapel", label: "Data Kelas Mapel", value: toNumber(dep.data_kelas_mapel) },
      { key: "data_nilai_siswa", label: "Data Nilai Siswa", value: toNumber(dep.data_nilai_siswa) },
      { key: "data_raport", label: "Data Raport", value: toNumber(dep.data_raport) },
      { key: "ppdb_pendaftar", label: "PPDB Pendaftar", value: toNumber(dep.ppdb_pendaftar) },
    ]
  }, [dependencySummary])

  const dependencyTotal = getDependencyTotal(dependencySummary)

  const fetchRows = async () => {
    setIsLoading(true)
    try {
      const result = await dataKelasService.getTrash({
        page: currentPage,
        per_page: rowsLimit,
        q: keyword.trim() || undefined,
        kode_unit: unitFilter === "all" ? undefined : unitFilter,
        tahun_ajaran: tahunFilter === "all" ? undefined : tahunFilter,
      })

      const mappedRows = result.data.map(normalizeTrashRow).filter((row) => row.id > 0)
      setRows(mappedRows)
      setTotalItems(toNumber(result.meta?.total, mappedRows.length))
      setTotalPages(Math.max(1, toNumber(result.meta?.last_page, 1)))
      setCurrentPage(toNumber(result.meta?.current_page, currentPage))
    } catch (error) {
      toast({
        title: "Gagal Memuat Trash",
        description: getErrorMessage(error, "Data trash kelas gagal dimuat."),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [unitResult, tahunResult] = await Promise.all([
          dataUnitService.getAll({ page: 1, per_page: 200 }),
          tahunAjaranService.getAll({ page: 1, per_page: 200 }),
        ])

        const units: UnitOption[] = []
        for (const item of unitResult.data) {
          const code = toText(item.kode_unit).trim()
          if (!code) continue
          units.push({ value: code, label: toText(item.nama_unit).trim() || code })
        }

        const years: TahunAjaranOption[] = []
        for (const item of tahunResult.data) {
          const code = toText(item.kode_tahun).trim()
          if (!code) continue
          years.push({ value: code, label: toText(item.nama_tahun).trim() || code })
        }

        setUnitOptions(units)
        setTahunOptions(years)
      } catch {
        setUnitOptions([])
        setTahunOptions([])
      }
    }

    void loadOptions()
  }, [])

  useEffect(() => {
    void fetchRows()
  }, [currentPage, rowsPerPage, keyword, unitFilter, tahunFilter])

  const applyFilter = () => {
    setKeyword(draftKeyword)
    setUnitFilter(draftUnit)
    setTahunFilter(draftTahun)
    setCurrentPage(1)
  }

  const resetFilter = () => {
    setDraftKeyword("")
    setDraftUnit("all")
    setDraftTahun("all")

    setKeyword("")
    setUnitFilter("all")
    setTahunFilter("all")
    setCurrentPage(1)
  }

  const handleRestore = (id: number) => {
    const run = async () => {
      setIsLoading(true)
      try {
        await dataKelasService.restore(id)
        toast({
          title: "Berhasil",
          description: "Data kelas berhasil dipulihkan.",
        })
        await fetchRows()
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal memulihkan data kelas."),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  const openForceDeleteDialog = (row: TrashRow) => {
    const run = async () => {
      setIsLoading(true)
      try {
        const summary = await dataKelasService.getDependencySummary(row.id)
        setForceTarget(row)
        setDependencySummary(summary)
        setIsForceDialogOpen(true)
      } catch (error) {
        toast({
          title: "Gagal Memeriksa Dependency",
          description: getErrorMessage(
            error,
            "Tidak bisa memeriksa dependency sebelum hapus permanen.",
          ),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  const handleForceDelete = () => {
    const run = async () => {
      if (!forceTarget) return
      if (dependencyTotal > 0) {
        toast({
          title: "Tidak Dapat Hapus Permanen",
          description: "Data kelas masih memiliki dependency. Silakan cek ringkasan dependency.",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)
      try {
        await dataKelasService.forceDelete(forceTarget.id)
        toast({
          title: "Berhasil",
          description: "Data kelas berhasil dihapus permanen.",
        })
        setIsForceDialogOpen(false)
        setForceTarget(null)
        setDependencySummary(null)
        await fetchRows()
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal menghapus permanen data kelas."),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  const visibleStart = rows.length === 0 ? 0 : (currentPage - 1) * rowsLimit + 1
  const visibleEnd = rows.length === 0 ? 0 : Math.min((currentPage - 1) * rowsLimit + rows.length, totalItems)

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">TRASH DATA KELAS</h1>
        <Link href="/dashboard/kelas">
          <Button className="h-11 gap-2 px-5" variant="outline">
            <ArrowLeft className="h-5 w-5" />
            Kembali ke Data Kelas
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="trash-keyword">Kata Kunci</Label>
              <Input
                id="trash-keyword"
                placeholder="Cari kode kelas atau nama kelas"
                value={draftKeyword}
                onChange={(event) => setDraftKeyword(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Pilih Unit</Label>
              <Select value={draftUnit} onValueChange={setDraftUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih unit" />
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
              <Label>Tahun Ajaran</Label>
              <Select value={draftTahun} onValueChange={setDraftTahun}>
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
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={applyFilter}>Terapkan Filter</Button>
            <Button variant="outline" onClick={resetFilter}>
              Reset Filter
            </Button>
            <Select value={rowsPerPage} onValueChange={(value) => {
              setRowsPerPage(value)
              setCurrentPage(1)
            }}>
              <SelectTrigger className="h-10 w-[88px]">
                <SelectValue placeholder="25" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="overflow-hidden rounded-lg border bg-background">
            <Table className="min-w-[1000px]">
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-12 text-xs font-semibold uppercase tracking-wide text-muted-foreground">#</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">NAMA UNIT</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">KODE KELAS</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">NAMA KELAS</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">TAHUN AJARAN</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">WAKTU HAPUS</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">AKSI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      {isLoading ? "Memuat data trash..." : "Belum ada data kelas di trash."}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, index) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{(currentPage - 1) * rowsLimit + index + 1}</TableCell>
                      <TableCell>{row.namaUnit}</TableCell>
                      <TableCell>{row.kodeKelas}</TableCell>
                      <TableCell>{row.namaKelas}</TableCell>
                      <TableCell>{row.tahunAjaran || "-"}</TableCell>
                      <TableCell>{formatDateTime(row.deletedAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1"
                            disabled={isLoading}
                            onClick={() => handleRestore(row.id)}
                          >
                            <RotateCcw className="h-4 w-4" />
                            Restore
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 gap-1"
                            disabled={isLoading}
                            onClick={() => openForceDeleteDialog(row)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Hapus Permanen
                          </Button>
                        </div>
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
              <Badge variant="secondary">{currentPage}</Badge>
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
        open={isForceDialogOpen}
        onOpenChange={(open) => {
          setIsForceDialogOpen(open)
          if (!open) {
            setForceTarget(null)
            setDependencySummary(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Permanen</DialogTitle>
            <DialogDescription>
              {forceTarget
                ? `Cek dependency untuk kelas ${forceTarget.namaKelas} (${forceTarget.kodeKelas}) sebelum hapus permanen.`
                : "Cek dependency sebelum hapus permanen."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-lg border p-4">
              <p className="mb-2 text-sm font-medium text-foreground">Ringkasan Dependency</p>
              <div className="space-y-2">
                {dependencyItems.map((item) => (
                  <div key={item.key} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <Badge variant={item.value > 0 ? "destructive" : "secondary"}>{item.value}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {dependencyTotal > 0 && (
              <p className="text-sm text-destructive">
                Data kelas tidak dapat dihapus permanen karena masih dipakai pada data lain.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsForceDialogOpen(false)}>
              Tutup
            </Button>
            <Button variant="destructive" disabled={dependencyTotal > 0 || isLoading} onClick={handleForceDelete}>
              Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
