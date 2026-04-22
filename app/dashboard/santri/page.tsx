"use client"

import Link from "next/link"
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { dataKelasService } from "@/lib/services/kelas.service"
import { tahunAjaranService } from "@/lib/services/tahun-ajaran.service"
import { dataUnitService } from "@/lib/services/unit.service"
import { DataSantriApiItem, DataSantriListParams, DataSantriPayload, dataSantriService } from "@/lib/services/santri.service"
import {
  Plus,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Upload,
  FileSpreadsheet,
  ChevronDown,
  GraduationCap,
  Rows3,
  Search,
} from "lucide-react"

interface SantriRow {
  id: number
  namaUnit: string
  nomorInduk: string
  namaLengkap: string
  kodeKelas: string
  namaKelas: string
  tahunAjaran: string
  jenisKelamin: string
  tempatLahir: string
  tanggalLahir: string
  status: string
  namaWali: string
  nomorTelepon: string
  alamatEmail: string
}

interface KelasOption {
  value: string
  label: string
  kodeUnit: string
}

interface UnitOption {
  value: string
  label: string
}

interface TahunAjaranOption {
  value: string
  label: string
}

interface SantriFormData {
  nomor_induk: string
  nama_lengkap_santri: string
  kode_kelas: string
  jenis_kelamin: string
  status: string
  nama_wali: string
  nomor_telepon: string
  alamat_email: string
}

const defaultForm: SantriFormData = {
  nomor_induk: "",
  nama_lengkap_santri: "",
  kode_kelas: "",
  jenis_kelamin: "",
  status: "AKTIF",
  nama_wali: "",
  nomor_telepon: "",
  alamat_email: "",
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

const normalizeSantriRow = (raw: DataSantriApiItem): SantriRow => ({
  id: toNumber(raw.id_santri ?? raw.id, -1),
  namaUnit: toText(raw.kelas?.kode_unit),
  nomorInduk: toText(raw.nomor_induk),
  namaLengkap: toText(raw.nama_lengkap_santri),
  kodeKelas: toText(raw.kode_kelas),
  namaKelas: toText(raw.kelas?.nama_kelas) || toText(raw.kode_kelas),
  tahunAjaran: toText(raw.kelas?.tahun_ajaran),
  jenisKelamin: toText(raw.jenis_kelamin).toUpperCase(),
  tempatLahir: toText(raw.tempat_lahir),
  tanggalLahir: toText(raw.tanggal_lahir),
  status: toText(raw.status).toUpperCase() || "AKTIF",
  namaWali: toText(raw.nama_wali),
  nomorTelepon: toText(raw.nomor_telepon),
  alamatEmail: toText(raw.alamat_email),
})

const toPayload = (form: SantriFormData): DataSantriPayload => ({
  nomor_induk: form.nomor_induk,
  nama_lengkap_santri: form.nama_lengkap_santri,
  kode_kelas: form.kode_kelas,
  jenis_kelamin: form.jenis_kelamin || null,
  status: form.status || null,
  nama_wali: form.nama_wali || null,
  nomor_telepon: form.nomor_telepon || null,
  alamat_email: form.alamat_email || null,
})

const formatStatus = (status: string): string => {
  const normalized = status.toUpperCase()
  if (normalized === "AKTIF") return "Aktif"
  if (normalized === "CUTI") return "Cuti"
  if (normalized === "LULUS") return "Lulus"
  if (normalized === "KELUAR") return "Keluar"
  return status
}

const formatGender = (gender: string): string => {
  if (gender === "L") return "Laki-laki"
  if (gender === "P") return "Perempuan"
  return "-"
}

const formatDate = (value: string): string => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function SantriPage() {
  const { toast } = useToast()

  const [rows, setRows] = useState<SantriRow[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedKelas, setSelectedKelas] = useState("all")
  const [selectedUnit, setSelectedUnit] = useState("all")
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [kelasOptions, setKelasOptions] = useState<KelasOption[]>([])
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([])
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState<TahunAjaranOption[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const [isLoading, setIsLoading] = useState(false)
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false)
  const [rowsPerPage, setRowsPerPage] = useState("10")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [summaryTotals, setSummaryTotals] = useState({
    totalSantri: 0,
    aktif: 0,
    lulus: 0,
    keluar: 0,
  })

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [detailRow, setDetailRow] = useState<SantriRow | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<SantriFormData>(defaultForm)
  const [editingFormData, setEditingFormData] = useState<SantriFormData>(defaultForm)

  const rowsLimit = Number(rowsPerPage)

  const displayedRows = useMemo(() => rows, [rows])

  const filteredKelasOptions = useMemo(() => {
    if (selectedUnit === "all") return kelasOptions
    return kelasOptions.filter((option) => option.kodeUnit === selectedUnit)
  }, [kelasOptions, selectedUnit])

  const stats = useMemo(() => {
    return {
      aktif: summaryTotals.aktif,
      lulus: summaryTotals.lulus,
      keluar: summaryTotals.keluar,
    }
  }, [summaryTotals])

  const isAllChecked = displayedRows.length > 0 && displayedRows.every((row) => selectedIds.includes(row.id))

  const fetchRows = async () => {
    setIsLoading(true)
    try {
      const params: DataSantriListParams = {
        page: currentPage,
        per_page: rowsLimit,
      }

      const query = searchQuery.trim()
      if (query) params.q = query
      if (selectedUnit !== "all") params.kode_unit = selectedUnit
      if (selectedKelas !== "all") params.kode_kelas = selectedKelas
      if (selectedTahunAjaran !== "all") params.tahun_ajaran = selectedTahunAjaran
      if (selectedStatus !== "all") params.status = selectedStatus

      const result = await dataSantriService.getAll(params)
      const mappedRows = result.data.map(normalizeSantriRow).filter((row) => row.id > 0)

      setRows(mappedRows)
      setTotalItems(toNumber(result.meta?.total, mappedRows.length))
      setTotalPages(Math.max(1, toNumber(result.meta?.last_page, 1)))
      setCurrentPage(toNumber(result.meta?.current_page, currentPage))

      const summaryBaseParams: DataSantriListParams = {}
      if (query) summaryBaseParams.q = query
      if (selectedUnit !== "all") summaryBaseParams.kode_unit = selectedUnit
      if (selectedKelas !== "all") summaryBaseParams.kode_kelas = selectedKelas
      if (selectedTahunAjaran !== "all") summaryBaseParams.tahun_ajaran = selectedTahunAjaran

      if (selectedStatus === "all") {
        const [aktifResult, lulusResult, keluarResult] = await Promise.all([
          dataSantriService.getAll({ ...summaryBaseParams, status: "AKTIF", page: 1, per_page: 1 }),
          dataSantriService.getAll({ ...summaryBaseParams, status: "LULUS", page: 1, per_page: 1 }),
          dataSantriService.getAll({ ...summaryBaseParams, status: "KELUAR", page: 1, per_page: 1 }),
        ])

        setSummaryTotals({
          totalSantri: toNumber(result.meta?.total),
          aktif: toNumber(aktifResult.meta?.total),
          lulus: toNumber(lulusResult.meta?.total),
          keluar: toNumber(keluarResult.meta?.total),
        })
      } else {
        const totalByStatus = toNumber(result.meta?.total)
        setSummaryTotals({
          totalSantri: totalByStatus,
          aktif: selectedStatus === "AKTIF" ? totalByStatus : 0,
          lulus: selectedStatus === "LULUS" ? totalByStatus : 0,
          keluar: selectedStatus === "KELUAR" ? totalByStatus : 0,
        })
      }
    } catch (error) {
      toast({
        title: "Gagal Memuat Data",
        description: getErrorMessage(error, "Data santri gagal dimuat."),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadKelasOptions = async () => {
    try {
      const result = await dataKelasService.getAll({ page: 1, per_page: 300 })
      const kelasSeen = new Set<string>()
      const tahunSeen = new Set<string>()
      const mappedKelas: KelasOption[] = []
      const mappedTahun: TahunAjaranOption[] = []

      for (const item of result.data) {
        const kodeKelas = toText(item.kode_kelas).trim()
        if (kodeKelas && !kelasSeen.has(kodeKelas)) {
          kelasSeen.add(kodeKelas)
          mappedKelas.push({
            value: kodeKelas,
            label: toText(item.nama_kelas).trim() || kodeKelas,
            kodeUnit: toText(item.kode_unit || item.unit?.kode_unit).trim(),
          })
        }

        const tahun = toText(item.tahun_ajaran).trim()
        if (tahun && !tahunSeen.has(tahun)) {
          tahunSeen.add(tahun)
          mappedTahun.push({ value: tahun, label: tahun })
        }
      }

      setKelasOptions(mappedKelas)
      if (mappedTahun.length > 0) {
        setTahunAjaranOptions(mappedTahun)
      }
    } catch {
      setKelasOptions([])
    }
  }

  const loadUnitOptions = async () => {
    try {
      const result = await dataUnitService.getAll({ page: 1, per_page: 300 })
      const mapped = result.data
        .map((item) => {
          const code = toText(item.kode_unit).trim()
          const label = toText(item.nama_unit).trim() || code
          return { value: code, label }
        })
        .filter((item) => item.value)

      setUnitOptions(mapped)
    } catch {
      setUnitOptions([])
    }
  }

  const loadTahunAjaranOptions = async () => {
    try {
      const result = await tahunAjaranService.getAll({ page: 1, per_page: 200 })
      const mapped = result.data
        .map((item) => {
          const value = toText(item.nama_tahun).trim() || toText(item.kode_tahun).trim()
          return { value, label: value }
        })
        .filter((item) => item.value)

      if (mapped.length > 0) {
        setTahunAjaranOptions(mapped)
      }
    } catch {
      setTahunAjaranOptions((prev) => prev)
    }
  }

  useEffect(() => {
    void loadKelasOptions()
    void loadUnitOptions()
    void loadTahunAjaranOptions()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedUnit, selectedKelas, selectedTahunAjaran, selectedStatus, rowsPerPage])

  useEffect(() => {
    if (selectedKelas === "all") return
    const existsInCurrentUnit = filteredKelasOptions.some((option) => option.value === selectedKelas)
    if (!existsInCurrentUnit) {
      setSelectedKelas("all")
    }
  }, [selectedUnit, filteredKelasOptions, selectedKelas])

  useEffect(() => {
    setSelectedIds([])
  }, [displayedRows])

  useEffect(() => {
    void fetchRows()
  }, [currentPage, rowsPerPage, searchQuery, selectedUnit, selectedKelas, selectedTahunAjaran, selectedStatus])

  const resetAddForm = () => {
    setFormData(defaultForm)
  }

  const handleCreate = async () => {
    if (!formData.nomor_induk.trim() || !formData.nama_lengkap_santri.trim() || !formData.kode_kelas.trim()) {
      toast({
        title: "Form Belum Lengkap",
        description: "Nomor induk, nama lengkap, dan kelas wajib diisi.",
        variant: "destructive",
      })
      return
    }

    try {
      await dataSantriService.create(toPayload(formData))
      toast({
        title: "Berhasil",
        description: "Data santri berhasil ditambahkan.",
      })
      setIsAddDialogOpen(false)
      resetAddForm()
      void fetchRows()
    } catch (error) {
      toast({
        title: "Gagal Menyimpan",
        description: getErrorMessage(error, "Data santri gagal ditambahkan."),
        variant: "destructive",
      })
    }
  }

  const openDetail = (row: SantriRow) => {
    setDetailRow(row)
    setIsDetailDialogOpen(true)
  }

  const openEdit = (row: SantriRow) => {
    setEditingId(row.id)
    setEditingFormData({
      nomor_induk: row.nomorInduk,
      nama_lengkap_santri: row.namaLengkap,
      kode_kelas: row.kodeKelas,
      jenis_kelamin: row.jenisKelamin,
      status: row.status,
      nama_wali: row.namaWali,
      nomor_telepon: row.nomorTelepon,
      alamat_email: row.alamatEmail,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingId) return

    if (!editingFormData.nomor_induk.trim() || !editingFormData.nama_lengkap_santri.trim() || !editingFormData.kode_kelas.trim()) {
      toast({
        title: "Form Belum Lengkap",
        description: "Nomor induk, nama lengkap, dan kelas wajib diisi.",
        variant: "destructive",
      })
      return
    }

    try {
      await dataSantriService.update(editingId, toPayload(editingFormData))
      toast({
        title: "Berhasil",
        description: "Data santri berhasil diperbarui.",
      })
      setIsEditDialogOpen(false)
      setEditingId(null)
      void fetchRows()
    } catch (error) {
      toast({
        title: "Gagal Mengubah",
        description: getErrorMessage(error, "Data santri gagal diperbarui."),
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (row: SantriRow) => {
    const confirmed = window.confirm(`Hapus data santri ${row.namaLengkap}?`)
    if (!confirmed) return

    try {
      const result = await dataSantriService.remove(row.id)
      toast({
        title: "Berhasil",
        description: result.message || "Data santri berhasil dihapus.",
      })
      void fetchRows()
    } catch (error) {
      toast({
        title: "Gagal Menghapus",
        description: getErrorMessage(error, "Data santri gagal dihapus."),
        variant: "destructive",
      })
    }
  }

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(displayedRows.map((row) => row.id))
      return
    }
    setSelectedIds([])
  }

  const handleToggleRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
      return
    }
    setSelectedIds((prev) => prev.filter((item) => item !== id))
  }

  const handleExport = async () => {
    try {
      const params: Omit<DataSantriListParams, "per_page" | "page"> = {}
      const query = searchQuery.trim()

      if (query) params.q = query
      if (selectedUnit !== "all") params.kode_unit = selectedUnit
      if (selectedStatus !== "all") params.status = selectedStatus
      if (selectedKelas !== "all") params.kode_kelas = selectedKelas
      if (selectedTahunAjaran !== "all") params.tahun_ajaran = selectedTahunAjaran

      const blob = await dataSantriService.exportExcel(params)
      downloadBlob(blob, `data-santri-${new Date().toISOString().slice(0, 10)}.csv`)
    } catch (error) {
      toast({
        title: "Gagal Export",
        description: getErrorMessage(error, "Gagal mengunduh export data santri."),
        variant: "destructive",
      })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast({
        title: "Belum Ada Data Dipilih",
        description: "Pilih minimal satu santri untuk aksi dihapus.",
      })
      return
    }

    const confirmed = window.confirm(`Hapus ${selectedIds.length} data santri terpilih?`)
    if (!confirmed) return

    setIsBulkActionLoading(true)
    try {
      const results = await Promise.allSettled(selectedIds.map((id) => dataSantriService.remove(id)))
      const successCount = results.filter((result) => result.status === "fulfilled").length
      const failedCount = results.length - successCount

      if (successCount > 0) {
        toast({
          title: "Berhasil",
          description:
            failedCount > 0
              ? `${successCount} data berhasil dihapus, ${failedCount} data gagal.`
              : `${successCount} data santri berhasil dihapus.`,
        })
      } else {
        toast({
          title: "Gagal",
          description: "Tidak ada data yang berhasil dihapus.",
          variant: "destructive",
        })
      }

      setSelectedIds([])
      await fetchRows()
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  const formFields = (
    data: SantriFormData,
    setData: Dispatch<SetStateAction<SantriFormData>>,
  ) => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nomor_induk">Nomor Induk</Label>
          <Input
            id="nomor_induk"
            placeholder="Nomor induk santri"
            value={data.nomor_induk}
            onChange={(event) => setData((prev) => ({ ...prev, nomor_induk: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kode_kelas">Kelas</Label>
          <Select
            value={data.kode_kelas || undefined}
            onValueChange={(value) => setData((prev) => ({ ...prev, kode_kelas: value }))}
          >
            <SelectTrigger id="kode_kelas">
              <SelectValue placeholder="Pilih kelas" />
            </SelectTrigger>
            <SelectContent>
              {kelasOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nama_lengkap_santri">Nama Lengkap</Label>
        <Input
          id="nama_lengkap_santri"
          placeholder="Nama lengkap santri"
          value={data.nama_lengkap_santri}
          onChange={(event) => setData((prev) => ({ ...prev, nama_lengkap_santri: event.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
          <Select
            value={data.jenis_kelamin || undefined}
            onValueChange={(value) => setData((prev) => ({ ...prev, jenis_kelamin: value }))}
          >
            <SelectTrigger id="jenis_kelamin">
              <SelectValue placeholder="Pilih" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="L">Laki-laki</SelectItem>
              <SelectItem value="P">Perempuan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={data.status} onValueChange={(value) => setData((prev) => ({ ...prev, status: value }))}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Pilih status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AKTIF">Aktif</SelectItem>
              <SelectItem value="CUTI">Cuti</SelectItem>
              <SelectItem value="LULUS">Lulus</SelectItem>
              <SelectItem value="KELUAR">Keluar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nama_wali">Nama Wali</Label>
        <Input
          id="nama_wali"
          placeholder="Nama wali"
          value={data.nama_wali}
          onChange={(event) => setData((prev) => ({ ...prev, nama_wali: event.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nomor_telepon">No. Telepon</Label>
          <Input
            id="nomor_telepon"
            placeholder="08xxxxxxxxxx"
            value={data.nomor_telepon}
            onChange={(event) => setData((prev) => ({ ...prev, nomor_telepon: event.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="alamat_email">Email</Label>
          <Input
            id="alamat_email"
            type="email"
            placeholder="email@domain.com"
            value={data.alamat_email}
            onChange={(event) => setData((prev) => ({ ...prev, alamat_email: event.target.value }))}
          />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold uppercase tracking-wide text-foreground">Daftar Santri</h1>

        <div className="flex flex-wrap items-center gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <Button
              size="sm"
              className="h-10 bg-primary px-4 text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                resetAddForm()
                setIsAddDialogOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah
            </Button>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Tambah Santri Baru</DialogTitle>
                <DialogDescription>Isi data santri baru dengan lengkap</DialogDescription>
              </DialogHeader>
              {formFields(formData, setFormData)}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Batal
                </Button>
                <Button className="bg-primary text-primary-foreground" onClick={handleCreate}>
                  Simpan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Link href="/dashboard/santri/import">
            <Button size="sm" className="h-10 bg-primary px-4 text-primary-foreground hover:bg-primary/90">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
          </Link>

          <Button size="sm" className="h-10 bg-primary px-4 text-primary-foreground hover:bg-primary/90" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Ekspor
          </Button>

          <Link href="/dashboard/santri/pindah-kelas">
            <Button size="sm" className="h-10 bg-primary px-4 text-primary-foreground hover:bg-primary/90">
              <Rows3 className="mr-2 h-4 w-4" />
              Pindah Kelas
            </Button>
          </Link>

          <Link href="/dashboard/santri/trash">
            <Button size="sm" className="h-10 bg-primary px-4 text-primary-foreground hover:bg-primary/90">
              <Trash2 className="mr-2 h-4 w-4" />
              Riwayat Hapus
            </Button>
          </Link>

        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Jumlah Santri (Total)", count: summaryTotals.totalSantri, color: "bg-primary" },
          { label: "Santri Aktif (Total)", count: stats.aktif, color: "bg-primary/90" },
          { label: "Santri Lulus (Total)", count: stats.lulus, color: "bg-primary/80" },
          { label: "Santri Keluar (Total)", count: stats.keluar, color: "bg-primary/70" },
        ].map((stat) => (
          <Card key={stat.label} className={`overflow-hidden border-0 text-white ${stat.color}`}>
            <CardContent className="relative p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">{stat.label}</p>
                  <p className="text-4xl font-semibold leading-tight">{stat.count}</p>
                </div>
                <div className="rounded-full bg-white/20 p-4">
                  <GraduationCap className="h-9 w-9 opacity-80" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border">
        <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="h-14 w-full justify-between rounded-none bg-white px-5 text-base font-semibold text-foreground shadow-none hover:bg-white hover:text-foreground hover:opacity-100 active:bg-white active:text-foreground active:opacity-100 focus-visible:bg-white focus-visible:text-foreground data-[state=open]:bg-white data-[state=open]:text-foreground data-[state=open]:opacity-100"
            >
              <span className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter Data
              </span>
              <ChevronDown className="h-5 w-5" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="border-t p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2 md:col-span-2 xl:col-span-3">
                  <Label htmlFor="santri-kata-kunci">Kata Kunci</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="santri-kata-kunci"
                      placeholder="Masukan kata kunci pencarian"
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Pilih Unit</Label>
                  <Select value={selectedUnit} onValueChange={setSelectedUnit}>
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
                  <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kelas</SelectItem>
                      {filteredKelasOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tahun Ajaran</Label>
                  <Select value={selectedTahunAjaran} onValueChange={setSelectedTahunAjaran}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tahun Ajaran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Tahun</SelectItem>
                      {tahunAjaranOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status Santri</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status Santri" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="AKTIF">Aktif</SelectItem>
                      <SelectItem value="CUTI">Cuti</SelectItem>
                      <SelectItem value="LULUS">Lulus</SelectItem>
                      <SelectItem value="KELUAR">Keluar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Select
              defaultValue="aksi-massal"
              onValueChange={(value) => {
                if (value === "hapus") {
                  void handleBulkDelete()
                }
              }}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aksi-massal">Aksi Massal</SelectItem>
                <SelectItem value="hapus" disabled={isBulkActionLoading}>
                  {isBulkActionLoading ? "Memproses..." : "Hapus Terpilih"}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
              <SelectTrigger className="w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CardDescription>
            Menampilkan {displayedRows.length} dari {totalItems} santri
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="w-[52px]">
                    <Checkbox
                      checked={isAllChecked}
                      onCheckedChange={(value) => handleToggleAll(value === true)}
                      aria-label="Pilih semua"
                    />
                  </TableHead>
                  <TableHead>#</TableHead>
                  <TableHead>Nama Unit</TableHead>
                  <TableHead>Nomor Induk</TableHead>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>Kelas Sekarang</TableHead>
                  <TableHead>Tahun Ajaran</TableHead>
                  <TableHead>Jenis Kelamin</TableHead>
                  <TableHead>Tempat, Tanggal Lahir</TableHead>
                  <TableHead>Nomor Telepon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={12} className="py-8 text-center text-muted-foreground">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : displayedRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="py-8 text-center text-muted-foreground">
                      Belum ada data santri.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedRows.map((santri, index) => (
                    <TableRow key={santri.id} className="border-border">
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(santri.id)}
                          onCheckedChange={(value) => handleToggleRow(santri.id, value === true)}
                          aria-label={`Pilih ${santri.namaLengkap}`}
                        />
                      </TableCell>
                      <TableCell>{(currentPage - 1) * rowsLimit + index + 1}</TableCell>
                      <TableCell>{santri.namaUnit || "-"}</TableCell>
                      <TableCell>{santri.nomorInduk || "-"}</TableCell>
                      <TableCell className="font-medium">{santri.namaLengkap || "-"}</TableCell>
                      <TableCell>{santri.namaKelas || "-"}</TableCell>
                      <TableCell>{santri.tahunAjaran || "-"}</TableCell>
                      <TableCell>{formatGender(santri.jenisKelamin)}</TableCell>
                      <TableCell>
                        {santri.tempatLahir || "-"}, {formatDate(santri.tanggalLahir)}
                      </TableCell>
                      <TableCell>{santri.nomorTelepon || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={santri.status === "AKTIF" ? "default" : "secondary"}
                          className={santri.status === "AKTIF" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}
                        >
                          {formatStatus(santri.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openDetail(santri)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(santri)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileSpreadsheet className="mr-2 h-4 w-4" />
                              Lihat Rapor
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(santri)}>
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

          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">Halaman {currentPage} dari {totalPages}</p>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}>
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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
            <DialogTitle>Detail Santri</DialogTitle>
            <DialogDescription>Informasi lengkap data santri.</DialogDescription>
          </DialogHeader>
          {detailRow && (
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Nomor Induk</p>
                <p className="font-medium">{detailRow.nomorInduk}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Nama Lengkap</p>
                <p className="font-medium">{detailRow.namaLengkap}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Kelas</p>
                <p className="font-medium">{detailRow.namaKelas}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Jenis Kelamin</p>
                <p className="font-medium">{formatGender(detailRow.jenisKelamin)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium">{formatStatus(detailRow.status)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Nama Wali</p>
                <p className="font-medium">{detailRow.namaWali || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Nomor Telepon</p>
                <p className="font-medium">{detailRow.nomorTelepon || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{detailRow.alamatEmail || "-"}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Data Santri</DialogTitle>
            <DialogDescription>Perbarui data santri yang dipilih.</DialogDescription>
          </DialogHeader>
          {formFields(editingFormData, setEditingFormData)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Batal
            </Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleUpdate}>
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
