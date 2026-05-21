"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { dataKelasService } from "@/lib/services/kelas.service"
import { dataUnitService } from "@/lib/services/unit.service"
import {
  BackendAkunSantriStatus,
  DataAkunSantriApiItem,
  DataAkunSantriKelasTanpaAkunItem,
  DataAkunSantriListParams,
  DataAkunSantriPayload,
  DataAkunSantriTanpaAkunItem,
  dataAkunSantriService,
} from "@/lib/services/akun-santri.service"
import { dataSantriService } from "@/lib/services/santri.service"
import { Download, Eye, Filter, MoreHorizontal, PencilLine, Plus, RefreshCcw, Trash2, ChevronDown } from "lucide-react"

interface AkunRow {
  id: number
  namaUnit: string
  namaAkun: string
  nomorInduk: string
  namaLengkap: string
  kelasSekarang: string
  tahunAjaran: string
  alamatEmail: string
  nomorTelepon: string
  status: BackendAkunSantriStatus
}

interface AkunFormData {
  nomor_induk: string
  nama_akun: string
  alamat_email: string
  nomor_telepon: string
  password: string
  status: BackendAkunSantriStatus
}

interface FilterOptions {
  units: string[]
  classes: {
    value: string
    label: string
    kodeUnit: string
  }[]
  years: string[]
}

const defaultForm: AkunFormData = {
  nomor_induk: "",
  nama_akun: "",
  alamat_email: "",
  nomor_telepon: "",
  password: "",
  status: "AKTIF",
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

const normalizeAkunRow = (raw: DataAkunSantriApiItem): AkunRow => ({
  id: toNumber(raw.id_akun_santri ?? raw.id, -1),
  namaUnit: toText(raw.nama_unit),
  namaAkun: toText(raw.nama_akun),
  nomorInduk: toText(raw.nomor_induk),
  namaLengkap: toText(raw.nama_lengkap),
  kelasSekarang: toText(raw.nama_kelas),
  tahunAjaran: toText(raw.tahun_ajaran),
  alamatEmail: toText(raw.alamat_email),
  nomorTelepon: toText(raw.nomor_telepon),
  status: toText(raw.status).toUpperCase() === "NONAKTIF" ? "NONAKTIF" : "AKTIF",
})

const toPayload = (form: AkunFormData): DataAkunSantriPayload => ({
  nomor_induk: form.nomor_induk,
  nama_akun: form.nama_akun || undefined,
  alamat_email: form.alamat_email || null,
  nomor_telepon: form.nomor_telepon || null,
  password: form.password || undefined,
  status: form.status,
})

const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function AkunSantriPage() {
  const { toast } = useToast()

  const [rows, setRows] = useState<AkunRow[]>([])
  const [selectedKeyword, setSelectedKeyword] = useState("")
  const [selectedUnit, setSelectedUnit] = useState("all")
  const [selectedKelas, setSelectedKelas] = useState("all")
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState<"all" | BackendAkunSantriStatus>("all")
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const [rowsPerPage, setRowsPerPage] = useState("25")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false)
  const [detailRow, setDetailRow] = useState<AkunRow | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<AkunFormData>(defaultForm)
  const [editingFormData, setEditingFormData] = useState<AkunFormData>(defaultForm)
  const [syncKelasOptions, setSyncKelasOptions] = useState<DataAkunSantriKelasTanpaAkunItem[]>([])
  const [syncSelectedKelas, setSyncSelectedKelas] = useState("all")
  const [syncSantriOptions, setSyncSantriOptions] = useState<DataAkunSantriTanpaAkunItem[]>([])
  const [syncSelectedNis, setSyncSelectedNis] = useState<string[]>([])
  const [useNisForNamaAkun, setUseNisForNamaAkun] = useState(true)
  const [syncUseNisForNamaAkun, setSyncUseNisForNamaAkun] = useState(true)
  const [syncDefaultPassword, setSyncDefaultPassword] = useState("")
  const [syncStatus, setSyncStatus] = useState<BackendAkunSantriStatus>("AKTIF")

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ units: [], classes: [], years: [] })
  const rowsLimit = Number(rowsPerPage)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false)

  const displayedRows = useMemo(() => {
    return rows.filter((row) => {
      if (selectedUnit !== "all" && row.namaUnit !== selectedUnit) return false
      if (selectedTahunAjaran !== "all" && row.tahunAjaran !== selectedTahunAjaran) return false
      return true
    })
  }, [rows, selectedUnit, selectedTahunAjaran])

  const filteredClassOptions = useMemo(() => {
    if (selectedUnit === "all") return filterOptions.classes

    return filterOptions.classes.filter((item) => item.kodeUnit === selectedUnit)
  }, [filterOptions.classes, rows, selectedUnit])

  const fetchRows = async () => {
    setIsLoading(true)
    try {
      const params: DataAkunSantriListParams = {
        page: currentPage,
        per_page: rowsLimit,
      }

      const q = selectedKeyword.trim()
      if (q) params.q = q
      if (selectedKelas !== "all") params.kode_kelas = selectedKelas
      if (selectedStatus !== "all") params.status = selectedStatus

      const result = await dataAkunSantriService.getAll(params)
      const mappedRows = result.data.map(normalizeAkunRow).filter((row) => row.id > 0)

      setRows(mappedRows)
      setTotalItems(toNumber(result.meta?.total, mappedRows.length))
      setTotalPages(Math.max(1, toNumber(result.meta?.last_page, 1)))
      setCurrentPage(toNumber(result.meta?.current_page, currentPage))
    } catch (error) {
      toast({
        title: "Gagal Memuat Data",
        description: getErrorMessage(error, "Data akun santri gagal dimuat."),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadFilterOptions = async () => {
    try {
      const [unitResult, kelasResult, tahunResult] = await Promise.all([
        dataUnitService.getAll({ page: 1, per_page: 300 }),
        dataKelasService.getAll({ page: 1, per_page: 300 }),
        dataSantriService.getAll({ page: 1, per_page: 300 }),
      ])

      const units = Array.from(
        new Set(
          unitResult.data
            .map((item) => toText(item.kode_unit).trim())
            .filter((item) => item.length > 0),
        ),
      )

      const kelasSeen = new Set<string>()
      const classes = kelasResult.data
        .map((item) => {
          const value = toText(item.kode_kelas).trim()
          const label = toText(item.nama_kelas).trim() || value
          const kodeUnit = toText(item.kode_unit || item.unit?.kode_unit).trim()
          return { value, label, kodeUnit }
        })
        .filter((item) => {
          if (!item.value || kelasSeen.has(item.value)) return false
          kelasSeen.add(item.value)
          return true
        })

      const years = Array.from(
        new Set(
          tahunResult.data
            .map((item) => toText(item.kelas?.tahun_ajaran).trim())
            .filter((item) => item.length > 0),
        ),
      )

      setFilterOptions({ units, classes, years })
    } catch {
      setFilterOptions({ units: [], classes: [], years: [] })
    }
  }

  const loadSyncKelasOptions = async () => {
    try {
      const items = await dataAkunSantriService.getKelasTanpaAkun()
      setSyncKelasOptions(items)
    } catch {
      setSyncKelasOptions([])
    }
  }

  const loadSantriTanpaAkunByKelas = async (kodeKelas: string) => {
    if (!kodeKelas || kodeKelas === "all") {
      setSyncSantriOptions([])
      setSyncSelectedNis([])
      return
    }

    try {
      const items = await dataAkunSantriService.getSantriTanpaAkunByKelas(kodeKelas)
      setSyncSantriOptions(items)
      setSyncSelectedNis([])
    } catch {
      setSyncSantriOptions([])
      setSyncSelectedNis([])
    }
  }

  useEffect(() => {
    void loadFilterOptions()
  }, [])

  useEffect(() => {
    if (!isSyncDialogOpen) return
    void loadSyncKelasOptions()
  }, [isSyncDialogOpen])

  useEffect(() => {
    if (!isSyncDialogOpen) return
    void loadSantriTanpaAkunByKelas(syncSelectedKelas)
  }, [syncSelectedKelas, isSyncDialogOpen])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedKeyword, selectedUnit, selectedKelas, selectedTahunAjaran, selectedStatus, rowsPerPage])

  useEffect(() => {
    if (selectedKelas === "all") return
    const existsInSelectedUnit = filteredClassOptions.some((item) => item.value === selectedKelas)
    if (!existsInSelectedUnit) {
      setSelectedKelas("all")
    }
  }, [filteredClassOptions, selectedKelas])

  useEffect(() => {
    void fetchRows()
  }, [currentPage, rowsPerPage, selectedKeyword, selectedUnit, selectedKelas, selectedTahunAjaran, selectedStatus])

  const resetAddForm = () => setFormData(defaultForm)

  const handleCreate = async () => {
    if (!formData.nomor_induk.trim() || !formData.password.trim()) {
      toast({
        title: "Form Belum Lengkap",
        description: "Nomor induk dan password wajib diisi.",
        variant: "destructive",
      })
      return
    }

    try {
      await dataAkunSantriService.create(
        toPayload({
          ...formData,
          nama_akun: useNisForNamaAkun ? "" : formData.nama_akun,
        }),
      )
      toast({
        title: "Berhasil",
        description: "Akun santri berhasil ditambahkan.",
      })
      setIsAddDialogOpen(false)
      resetAddForm()
      setUseNisForNamaAkun(true)
      void fetchRows()
    } catch (error) {
      toast({
        title: "Gagal Menyimpan",
        description: getErrorMessage(error, "Akun santri gagal ditambahkan."),
        variant: "destructive",
      })
    }
  }

  const openDetail = async (row: AkunRow) => {
    try {
      const detail = await dataAkunSantriService.getById(row.id)
      setDetailRow(normalizeAkunRow(detail))
      setIsDetailDialogOpen(true)
    } catch {
      setDetailRow(row)
      setIsDetailDialogOpen(true)
    }
  }

  const openEdit = (row: AkunRow) => {
    setEditingId(row.id)
    setEditingFormData({
      nomor_induk: row.nomorInduk,
      nama_akun: row.namaAkun,
      alamat_email: row.alamatEmail,
      nomor_telepon: row.nomorTelepon,
      password: "",
      status: row.status,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingId) return

    if (!editingFormData.nama_akun.trim()) {
      toast({
        title: "Form Belum Lengkap",
        description: "Nama akun wajib diisi.",
        variant: "destructive",
      })
      return
    }

    try {
      await dataAkunSantriService.update(editingId, {
        nama_akun: editingFormData.nama_akun,
        alamat_email: editingFormData.alamat_email || null,
        nomor_telepon: editingFormData.nomor_telepon || null,
        password: editingFormData.password || undefined,
        status: editingFormData.status,
      })
      toast({
        title: "Berhasil",
        description: "Akun santri berhasil diperbarui.",
      })
      setIsEditDialogOpen(false)
      setEditingId(null)
      void fetchRows()
    } catch (error) {
      toast({
        title: "Gagal Mengubah",
        description: getErrorMessage(error, "Akun santri gagal diperbarui."),
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (row: AkunRow) => {
    const confirmed = window.confirm(`Hapus akun ${row.namaAkun}?`)
    if (!confirmed) return

    try {
      const result = await dataAkunSantriService.remove(row.id)
      toast({
        title: "Berhasil",
        description: result.message || "Akun santri berhasil dihapus.",
      })
      void fetchRows()
    } catch (error) {
      toast({
        title: "Gagal Menghapus",
        description: getErrorMessage(error, "Akun santri gagal dihapus."),
        variant: "destructive",
      })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast({ title: "Belum Ada Yang Dipilih", description: "Pilih minimal satu akun untuk dihapus.", variant: "destructive" })
      return
    }
    const confirmed = window.confirm(`Hapus ${selectedIds.length} akun santri terpilih?`)
    if (!confirmed) return
    setIsBulkActionLoading(true)
    try {
      const results = await Promise.allSettled(selectedIds.map(id => dataAkunSantriService.remove(id)))
      const success = results.filter(r => r.status === "fulfilled").length
      const failed = results.length - success
      toast({
        title: success > 0 ? "Berhasil" : "Gagal",
        description: failed > 0
          ? `${success} akun berhasil dihapus, ${failed} gagal.`
          : `${success} akun santri berhasil dihapus.`,
        variant: success === 0 ? "destructive" : "default",
      })
      setSelectedIds([])
      void fetchRows()
    } catch (error) {
      toast({ title: "Gagal", description: getErrorMessage(error, "Gagal menghapus akun santri."), variant: "destructive" })
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const params: Omit<DataAkunSantriListParams, "per_page" | "page"> = {}
      const q = selectedKeyword.trim()

      if (q) params.q = q
      if (selectedKelas !== "all") params.kode_kelas = selectedKelas
      if (selectedStatus !== "all") params.status = selectedStatus

      const blob = await dataAkunSantriService.exportExcel(params)
      downloadBlob(blob, `data-akun-santri-${new Date().toISOString().slice(0, 10)}.csv`)
    } catch (error) {
      toast({
        title: "Gagal Export",
        description: getErrorMessage(error, "Gagal mengunduh export data akun santri."),
        variant: "destructive",
      })
    }
  }

  const handleSinkron = async () => {
    try {
      if (!syncUseNisForNamaAkun) {
        toast({
          title: "Fitur Belum Didukung",
          description: "Sinkron backend saat ini hanya mendukung nama akun dari nomor induk.",
          variant: "destructive",
        })
        return
      }

      if (syncDefaultPassword.trim().length < 6) {
        toast({
          title: "Password Tidak Valid",
          description: "Password default wajib diisi minimal 6 karakter.",
          variant: "destructive",
        })
        return
      }

      const result = await dataAkunSantriService.sinkronMassalWithPayload({
        kode_kelas: syncSelectedKelas === "all" ? null : syncSelectedKelas,
        default_password: syncDefaultPassword,
        status: syncStatus,
        nomor_induk: syncSelectedNis.length > 0 ? syncSelectedNis : null,
      })
      toast({
        title: "Sinkron Berhasil",
        description: result.message || "Sinkron akun santri berhasil dijalankan.",
      })
      setIsSyncDialogOpen(false)
      setSyncSelectedNis([])
      setSyncSelectedKelas("all")
      setSyncDefaultPassword("")
      setSyncUseNisForNamaAkun(true)
      void fetchRows()
    } catch (error) {
      toast({
        title: "Sinkron Gagal",
        description: getErrorMessage(error, "Sinkron akun santri gagal dijalankan."),
        variant: "destructive",
      })
    }
  }

  const handleToggleSyncSantri = (nomorInduk: string, checked: boolean) => {
    if (checked) {
      setSyncSelectedNis((prev) => (prev.includes(nomorInduk) ? prev : [...prev, nomorInduk]))
      return
    }
    setSyncSelectedNis((prev) => prev.filter((item) => item !== nomorInduk))
  }

  const resetFilter = () => {
    setSelectedKeyword("")
    setSelectedUnit("all")
    setSelectedKelas("all")
    setSelectedTahunAjaran("all")
    setSelectedStatus("all")
  }

  const formFields = (
    data: AkunFormData,
    setData: React.Dispatch<React.SetStateAction<AkunFormData>>,
    mode: "create" | "edit",
  ) => (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor={`${mode}-nomor-induk`}>Nomor Induk</Label>
        <Input
          id={`${mode}-nomor-induk`}
          placeholder="Nomor induk santri"
          value={data.nomor_induk}
          disabled={mode === "edit"}
          onChange={(event) => setData((prev) => ({ ...prev, nomor_induk: event.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${mode}-nama-akun`}>Nama Akun</Label>
        <Input
          id={`${mode}-nama-akun`}
          placeholder={mode === "create" && useNisForNamaAkun ? "Mengikuti nomor induk" : "Masukkan nama akun"}
          value={data.nama_akun}
          disabled={mode === "create" && useNisForNamaAkun}
          onChange={(event) => setData((prev) => ({ ...prev, nama_akun: event.target.value }))}
        />
        {mode === "create" ? (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Checkbox checked={useNisForNamaAkun} onCheckedChange={(checked) => setUseNisForNamaAkun(checked === true)} />
            Gunakan nomor induk sebagai nama akun
          </label>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${mode}-email`}>Email</Label>
          <Input
            id={`${mode}-email`}
            type="email"
            placeholder="email@domain.com"
            value={data.alamat_email}
            onChange={(event) => setData((prev) => ({ ...prev, alamat_email: event.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${mode}-telepon`}>Nomor Telepon</Label>
          <Input
            id={`${mode}-telepon`}
            placeholder="08xxxxxxxxxx"
            value={data.nomor_telepon}
            onChange={(event) => setData((prev) => ({ ...prev, nomor_telepon: event.target.value }))}
          />
        </div>

      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${mode}-password`}>{mode === "edit" ? "Password Baru" : "Password"}</Label>
          <Input
            id={`${mode}-password`}
            type="password"
            placeholder={mode === "edit" ? "Kosongkan jika tidak diubah" : "Minimal 6 karakter"}
            value={data.password}
            onChange={(event) => setData((prev) => ({ ...prev, password: event.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${mode}-status`}>Status</Label>
          <Select
            value={data.status}
            onValueChange={(value) =>
              setData((prev) => ({
                ...prev,
                status: value === "NONAKTIF" ? "NONAKTIF" : "AKTIF",
              }))
            }
          >
            <SelectTrigger id={`${mode}-status`}>
              <SelectValue placeholder="Pilih status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AKTIF">Aktif</SelectItem>
              <SelectItem value="NONAKTIF">Nonaktif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold uppercase tracking-wide text-foreground">Daftar Akun</h1>

        <div className="flex flex-wrap items-center gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <Button
              size="sm"
              className="h-10 bg-primary px-4 text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                resetAddForm()
                setUseNisForNamaAkun(true)
                setIsAddDialogOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah
            </Button>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Tambah Akun Santri</DialogTitle>
                <DialogDescription>Isi data akun santri sesuai kebutuhan.</DialogDescription>
              </DialogHeader>
              {formFields(formData, setFormData, "create")}
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

          <Button size="sm" className="h-10 bg-primary px-4 text-primary-foreground hover:bg-primary/90" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Ekspor
          </Button>

          <Button size="sm" className="h-10 bg-primary px-4 text-primary-foreground hover:bg-primary/90" onClick={() => setIsSyncDialogOpen(true)}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Sinkron
          </Button>
        </div>
      </div>

      <Card className="border">
        <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="h-14 w-full justify-between rounded-none bg-white px-5 text-base font-semibold text-foreground shadow-none hover:bg-white hover:text-foreground"
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div className="space-y-2">
                  <Label>Kata Kunci</Label>
                  <Input
                    placeholder="Masukan kata kunci pencarian"
                    value={selectedKeyword}
                    onChange={(event) => setSelectedKeyword(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pilih Unit</Label>
                  <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Unit</SelectItem>
                      {filterOptions.units.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
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
                      {filteredClassOptions.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tahun Ajaran</Label>
                  <Select value={selectedTahunAjaran} onValueChange={setSelectedTahunAjaran}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Tahun Ajaran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Tahun</SelectItem>
                      {filterOptions.years.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as "all" | BackendAkunSantriStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="AKTIF">Aktif</SelectItem>
                      <SelectItem value="NONAKTIF">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Button className="bg-primary text-primary-foreground" onClick={() => void fetchRows()}>
                  Terapkan Filter
                </Button>
                <Button variant="outline" onClick={resetFilter}>
                  Reset Filter
                </Button>
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
                if (value === "hapus") void handleBulkDelete()
                if (value === "nonaktifkan") {
                  // future: bulk nonaktif
                }
              }}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aksi-massal">Aksi Massal</SelectItem>
                <SelectItem value="hapus" disabled={isBulkActionLoading}>
                  <span className="flex items-center gap-2"><Trash2 className="h-4 w-4" />{isBulkActionLoading ? "Memproses..." : "Hapus Terpilih"}</span>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
              <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CardDescription>Menampilkan {displayedRows.length} dari {totalItems} akun santri</CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="w-[52px]">
                    <Checkbox
                      checked={displayedRows.length > 0 && displayedRows.every(r => selectedIds.includes(r.id))}
                      onCheckedChange={v => {
                        if (v) setSelectedIds(displayedRows.map(r => r.id))
                        else setSelectedIds([])
                      }}
                      aria-label="Pilih semua"
                    />
                  </TableHead>
                  <TableHead>#</TableHead>
                  <TableHead>Nama Unit</TableHead>
                  <TableHead>Nama Akun</TableHead>
                  <TableHead>Nomor Induk</TableHead>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>Kelas Sekarang</TableHead>
                  <TableHead>Tahun Ajaran</TableHead>
                  <TableHead>Nomor Telepon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="py-8 text-center text-muted-foreground">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : displayedRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="py-8 text-center text-muted-foreground">
                      Belum ada data akun santri.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedRows.map((row, index) => (
                    <TableRow key={row.id} className="border-border">
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(row.id)}
                          onCheckedChange={v => {
                            if (v) setSelectedIds(p => p.includes(row.id) ? p : [...p, row.id])
                            else setSelectedIds(p => p.filter(id => id !== row.id))
                          }}
                        />
                      </TableCell>
                      <TableCell>{(currentPage - 1) * rowsLimit + index + 1}</TableCell>
                      <TableCell>{row.namaUnit || "-"}</TableCell>
                      <TableCell>{row.namaAkun || "-"}</TableCell>
                      <TableCell>{row.nomorInduk || "-"}</TableCell>
                      <TableCell className="font-medium">{row.namaLengkap || "-"}</TableCell>
                      <TableCell>{row.kelasSekarang || "-"}</TableCell>
                      <TableCell>{row.tahunAjaran || "-"}</TableCell>
                      <TableCell>{row.nomorTelepon || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={row.status === "AKTIF" ? "default" : "secondary"}
                          className={row.status === "AKTIF" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}
                        >
                          {row.status === "AKTIF" ? "Aktif" : "Nonaktif"}
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
                            <DropdownMenuItem onClick={() => openDetail(row)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(row)}>
                              <PencilLine className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(row)}>
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

      <Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>Sinkron Akun Santri</DialogTitle>
            <DialogDescription>
              Buat akun untuk santri yang belum punya akun berdasarkan kelas atau pilihan nomor induk.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Pilih Kelas</Label>
                <Select value={syncSelectedKelas} onValueChange={setSyncSelectedKelas}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua kelas tanpa akun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kelas Tanpa Akun</SelectItem>
                    {syncKelasOptions.map((item) => {
                      const kode = toText(item.kode_kelas)
                      const nama = toText(item.nama_kelas)
                      const jumlah = toNumber(item.jumlah_santri_belum_akun)
                      return (
                        <SelectItem key={kode} value={kode}>
                          {kode} - {nama} ({jumlah})
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status Akun</Label>
                <Select value={syncStatus} onValueChange={(value) => setSyncStatus(value === "NONAKTIF" ? "NONAKTIF" : "AKTIF")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AKTIF">Aktif</SelectItem>
                    <SelectItem value="NONAKTIF">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Password Default (wajib)</Label>
              <Input
                type="password"
                placeholder="Minimal 6 karakter"
                value={syncDefaultPassword}
                onChange={(event) => setSyncDefaultPassword(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox checked={syncUseNisForNamaAkun} onCheckedChange={(checked) => setSyncUseNisForNamaAkun(checked === true)} />
                Gunakan nomor induk sebagai nama akun saat sinkron
              </label>
            </div>

            {syncSelectedKelas !== "all" ? (
              <div className="space-y-2">
                <Label>Pilih Santri Tanpa Akun (opsional)</Label>
                <div className="max-h-48 space-y-2 overflow-auto rounded-md border p-3">
                  {syncSantriOptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Tidak ada santri tanpa akun pada kelas ini.</p>
                  ) : (
                    syncSantriOptions.map((item) => {
                      const nomorInduk = toText(item.nomor_induk)
                      return (
                        <label key={nomorInduk} className="flex cursor-pointer items-center gap-2 text-sm">
                          <Checkbox
                            checked={syncSelectedNis.includes(nomorInduk)}
                            onCheckedChange={(checked) => handleToggleSyncSantri(nomorInduk, checked === true)}
                          />
                          <span>{nomorInduk} - {toText(item.nama_lengkap_santri)}</span>
                        </label>
                      )
                    })
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Jika tidak ada yang dipilih, sistem akan sinkron semua santri tanpa akun di kelas terpilih.
                </p>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSyncDialogOpen(false)}>
              Batal
            </Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleSinkron}>
              Jalankan Sinkron
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Detail Akun Santri</DialogTitle>
            <DialogDescription>Informasi akun santri yang dipilih.</DialogDescription>
          </DialogHeader>
          {detailRow ? (
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Nama Akun</p>
                <p className="font-medium">{detailRow.namaAkun || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Nomor Induk</p>
                <p className="font-medium">{detailRow.nomorInduk || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Nama Lengkap</p>
                <p className="font-medium">{detailRow.namaLengkap || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Unit</p>
                <p className="font-medium">{detailRow.namaUnit || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Kelas</p>
                <p className="font-medium">{detailRow.kelasSekarang || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tahun Ajaran</p>
                <p className="font-medium">{detailRow.tahunAjaran || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Nomor Telepon</p>
                <p className="font-medium">{detailRow.nomorTelepon || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{detailRow.alamatEmail || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium">{detailRow.status === "AKTIF" ? "Aktif" : "Nonaktif"}</p>
              </div>
            </div>
          ) : null}
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
            <DialogTitle>Edit Akun Santri</DialogTitle>
            <DialogDescription>Perbarui akun santri yang dipilih.</DialogDescription>
          </DialogHeader>
          {formFields(editingFormData, setEditingFormData, "edit")}
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
