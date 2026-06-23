"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { ekskulService, EkskulApiItem, PendaftaranApiItem } from "@/lib/services/ekskul.service"
import { dataMasterService } from "@/lib/services/data-master.service"
import { dataSantriService, DataSantriApiItem } from "@/lib/services/santri.service"
import { Download, Search, Users, PlusCircle, MoreVertical, PencilLine, Trash2, CheckCircle2 } from "lucide-react"
import { useUnit } from "@/contexts/unit-context"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"

interface UnitOption { value: string; label: string }
interface KelasOption { kode_kelas: string; nama_kelas: string; kode_unit: string; status?: string; tahun_ajaran?: string }

// ─── Dialog Tambah ─────────────────────────────────────────────────────────────
interface AddDialogProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  unitOptions: UnitOption[]
  allKelas: KelasOption[]
  ekskulOptions: EkskulApiItem[]
  selectedKodeUnit: string | null
  selectedKodeTahun: string | null
}

function AddPendaftarDialog({ open, onClose, onSaved, unitOptions, allKelas, ekskulOptions, selectedKodeUnit, selectedKodeTahun }: AddDialogProps) {
  const { toast } = useToast()
  const [filterUnit, setFilterUnit] = useState("")
  const [filterKelas, setFilterKelas] = useState("")
  const [santriList, setSantriList] = useState<DataSantriApiItem[]>([])
  const [isLoadingSantri, setIsLoadingSantri] = useState(false)
  const [selectedSantri, setSelectedSantri] = useState<DataSantriApiItem | null>(null)
  const [selectedEkskul, setSelectedEkskul] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Reset tiap kali dialog dibuka
  useEffect(() => {
    if (open) {
      setFilterUnit(selectedKodeUnit || "")
      setFilterKelas("")
      setSantriList([])
      setSelectedSantri(null)
      setSelectedEkskul("")
    }
  }, [open, selectedKodeUnit])

  // Filter kelas berdasarkan unit dan tahun ajaran yang aktif
  const kelasByUnit = filterUnit
    ? allKelas.filter(k => k.kode_unit === filterUnit && k.status === "AKTIF" && k.tahun_ajaran === selectedKodeTahun)
    : []

  // Reset kelas kalau unit berubah
  useEffect(() => { setFilterKelas(""); setSelectedSantri(null) }, [filterUnit])

  // Fetch santri setiap kali kelas berubah
  useEffect(() => {
    if (!filterKelas) { setSantriList([]); return }
    setIsLoadingSantri(true)
    dataSantriService.getAll({ kode_kelas: filterKelas, status: "AKTIF", per_page: 100 })
      .then(res => setSantriList(res.data))
      .catch(() => toast({ title: "Gagal memuat data santri", variant: "destructive" }))
      .finally(() => setIsLoadingSantri(false))
  }, [filterKelas])

  // Ekskul filtered by unit santri yang dipilih (atau unit filter)
  const ekskulFiltered = ekskulOptions.filter(e =>
    !e.kode_unit || e.kode_unit === filterUnit
  )

  const handleSave = async () => {
    if (!selectedSantri?.id_santri || !selectedEkskul) {
      toast({ title: "Pilih santri dan ekskul terlebih dahulu", variant: "destructive" }); return
    }
    setIsSaving(true)
    try {
      await ekskulService.createPendaftaran({
        id_santri: selectedSantri.id_santri!,
        id_ekskul: Number(selectedEkskul),
      })
      toast({ title: `${selectedSantri.nama_lengkap_santri} berhasil didaftarkan` })
      onSaved()
      onClose()
    } catch (e: any) {
      toast({ title: "Gagal", description: e?.response?.data?.message ?? "Terjadi kesalahan", variant: "destructive" })
    } finally { setIsSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Tambah Pendaftar Ekskul</DialogTitle></DialogHeader>

        <div className="grid gap-5">
          {/* Step 1: Pilih Unit & Kelas */}
          <div className="grid gap-2">
            <p className="text-sm font-medium text-muted-foreground">1. Pilih Unit &amp; Kelas</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Unit</Label>
                <Select value={filterUnit} onValueChange={setFilterUnit}>
                  <SelectTrigger><SelectValue placeholder="Pilih unit..." /></SelectTrigger>
                  <SelectContent>
                    {unitOptions.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Kelas</Label>
                <Select value={filterKelas} onValueChange={setFilterKelas} disabled={!filterUnit}>
                  <SelectTrigger><SelectValue placeholder={filterUnit ? "Pilih kelas..." : "Pilih unit dulu"} /></SelectTrigger>
                  <SelectContent>
                    {kelasByUnit.map(k => (
                      <SelectItem key={k.kode_kelas} value={k.kode_kelas}>{k.nama_kelas} ({k.kode_kelas})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Step 2: Pilih Santri dari List */}
          {filterKelas && (
            <div className="grid gap-2">
              <p className="text-sm font-medium text-muted-foreground">2. Pilih Santri</p>
              <div className="border rounded-lg overflow-hidden max-h-52 overflow-y-auto">
                {isLoadingSantri ? (
                  <div className="p-3 space-y-2">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-8 w-full" />)}
                  </div>
                ) : santriList.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">Tidak ada santri aktif di kelas ini</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">NIS</th>
                        <th className="px-3 py-2 text-left font-medium">Nama</th>
                        <th className="px-3 py-2 w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {santriList.map(s => {
                        const isSelected = selectedSantri?.id_santri === s.id_santri
                        return (
                          <tr
                            key={s.id_santri}
                            onClick={() => setSelectedSantri(isSelected ? null : s)}
                            className={`cursor-pointer border-t transition-colors ${isSelected ? "bg-primary/10" : "hover:bg-muted/60"}`}
                          >
                            <td className="px-3 py-2 text-muted-foreground">{s.nomor_induk}</td>
                            <td className="px-3 py-2 font-medium">{s.nama_lengkap_santri}</td>
                            <td className="px-3 py-2 text-center">
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-primary mx-auto" />}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
              {selectedSantri && (
                <p className="text-xs text-emerald-600 font-medium">
                  ✓ Terpilih: {selectedSantri.nama_lengkap_santri}
                </p>
              )}
            </div>
          )}

          {/* Step 3: Pilih Ekskul */}
          {selectedSantri && (
            <div className="grid gap-2">
              <p className="text-sm font-medium text-muted-foreground">3. Pilih Ekskul</p>
              <Select value={selectedEkskul} onValueChange={setSelectedEkskul}>
                <SelectTrigger><SelectValue placeholder="Pilih ekskul..." /></SelectTrigger>
                <SelectContent>
                  {ekskulFiltered.length === 0 ? (
                    <SelectItem value="none" disabled>Tidak ada ekskul tersedia untuk unit ini</SelectItem>
                  ) : (
                    ekskulFiltered.map(e => (
                      <SelectItem key={e.id_ekskul} value={String(e.id_ekskul)}>
                        {e.nama_ekskul}
                        {e.unit ? ` (${e.unit.nama_unit})` : " (Semua Unit)"}
                        {e.kuota ? ` — Sisa ${Math.max(0, e.kuota - (e.jumlah_pendaftar ?? 0))}/${e.kuota}` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSave} disabled={isSaving || !selectedSantri || !selectedEkskul}>
            {isSaving ? "Menyimpan..." : "Daftarkan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Dialog Edit ────────────────────────────────────────────────────────────────
interface EditDialogProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  row: PendaftaranApiItem | null
  allKelas: KelasOption[]
  ekskulOptions: EkskulApiItem[]
}

function EditPendaftarDialog({ open, onClose, onSaved, row, allKelas, ekskulOptions }: EditDialogProps) {
  const { toast } = useToast()
  const [selectedEkskul, setSelectedEkskul] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Resolve kode_unit santri dari kode_kelas-nya
  const kodeUnitSantri = row?.santri?.kode_kelas
    ? allKelas.find(k => k.kode_kelas === row.santri?.kode_kelas)?.kode_unit
    : undefined

  // Filter ekskul: tampilkan yang sesuai unit santri atau untuk semua unit
  const ekskulFiltered = ekskulOptions.filter(e =>
    !e.kode_unit || (kodeUnitSantri && e.kode_unit === kodeUnitSantri)
  )

  useEffect(() => {
    if (open && row) setSelectedEkskul(String(row.id_ekskul))
  }, [open, row])

  const handleSave = async () => {
    if (!row || !selectedEkskul) return
    setIsSaving(true)
    try {
      await ekskulService.updatePendaftaran(row.id_pendaftaran, { id_ekskul: Number(selectedEkskul) })
      toast({ title: "Pilihan ekskul berhasil diperbarui" })
      onSaved()
      onClose()
    } catch (e: any) {
      toast({ title: "Gagal", description: e?.response?.data?.message ?? "Terjadi kesalahan", variant: "destructive" })
    } finally { setIsSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Pilihan Ekskul</DialogTitle>
        </DialogHeader>
        {row && (
          <div className="grid gap-4 py-2">
            {/* Info santri */}
            <div className="rounded-lg bg-muted px-4 py-3 text-sm grid gap-1">
              <div className="font-semibold">{row.santri?.nama_lengkap_santri ?? "-"}</div>
              <div className="text-muted-foreground flex gap-4">
                <span>{row.santri?.nomor_induk}</span>
                <span>Kelas: {row.santri?.kode_kelas}</span>
                {kodeUnitSantri && <span>Unit: {kodeUnitSantri}</span>}
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label>Pilih Ekskul <span className="text-destructive">*</span></Label>
              <Select value={selectedEkskul} onValueChange={setSelectedEkskul}>
                <SelectTrigger><SelectValue placeholder="Pilih ekskul..." /></SelectTrigger>
                <SelectContent>
                  {ekskulFiltered.length === 0 ? (
                    <SelectItem value="none" disabled>Tidak ada ekskul tersedia</SelectItem>
                  ) : (
                    ekskulFiltered.map(e => (
                      <SelectItem key={e.id_ekskul} value={String(e.id_ekskul)}>
                        {e.nama_ekskul}
                        {e.unit ? ` (${e.unit.nama_unit})` : " (Semua Unit)"}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {kodeUnitSantri && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Hanya menampilkan ekskul unit <strong>{kodeUnitSantri}</strong> dan ekskul umum
                </p>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSave} disabled={isSaving || !selectedEkskul}>
            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function EkskulRekapPage() {
  const { toast } = useToast()
  const { selectedKodeUnit, isLoading: isUnitLoading } = useUnit()
  const { selectedKodeTahun, isLoading: isTahunLoading } = useTahunAjaran()
  const contextReady = !isUnitLoading && !isTahunLoading
  const initCalledRef = useRef(false)
  const initDoneRef = useRef(false)

  const [rows, setRows] = useState<PendaftaranApiItem[]>([])
  const [ekskulOptions, setEkskulOptions] = useState<EkskulApiItem[]>([])
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([])
  const [allKelas, setAllKelas] = useState<KelasOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const [filterEkskul, setFilterEkskul] = useState("all")
  const [draftEkskul, setDraftEkskul] = useState("all")
  const [keyword, setKeyword] = useState("")
  const [draftKeyword, setDraftKeyword] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Dialog State
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<PendaftaranApiItem | null>(null)

  const buildParams = useCallback(() => {
    const params: Record<string, unknown> = { page: currentPage, per_page: 25 }
    if (filterEkskul !== "all") params.id_ekskul = filterEkskul
    if (selectedKodeUnit) params.kode_unit = selectedKodeUnit
    if (keyword.trim()) params.q = keyword.trim()
    return params
  }, [currentPage, filterEkskul, selectedKodeUnit, keyword])

  const fetchRows = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await ekskulService.getRekap(buildParams())
      setRows(result.data ?? [])
      setTotalPages(result.last_page ?? 1)
      setTotalItems(result.total ?? (result.data ?? []).length)
    } catch {
      toast({ title: "Gagal memuat rekap", variant: "destructive" })
    } finally { setIsLoading(false) }
  }, [buildParams])

  useEffect(() => {
    if (!contextReady) return
    const load = async () => {
      try {
        const [initData, ekskulData] = await Promise.all([
          dataMasterService.getInitOptions(),
          ekskulService.getAll({ all: true }),
        ])
        setUnitOptions((initData.unit ?? []).map((u: any) => ({ value: u.kode_unit, label: u.nama_unit || u.kode_unit })))
        setAllKelas(initData.kelas ?? [])
        setEkskulOptions(ekskulData.data ?? ekskulData)
      } catch { /* continue */ } finally {
        initDoneRef.current = true
        await fetchRows()
      }
    }
    if (!initCalledRef.current) {
      initCalledRef.current = true
      void load()
    } else if (initDoneRef.current) {
      void fetchRows()
    }
  }, [contextReady])

  useEffect(() => {
    if (!initDoneRef.current) return
    void fetchRows()
  }, [currentPage, filterEkskul, selectedKodeUnit, keyword])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setKeyword(draftKeyword)
    setFilterEkskul(draftEkskul)
    setCurrentPage(1)
  }

  const resetFilter = () => {
    setDraftKeyword("")
    setDraftEkskul("all")
    setKeyword("")
    setFilterEkskul("all")
    setCurrentPage(1)
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const params: Record<string, unknown> = {}
      if (filterEkskul !== "all") params.id_ekskul = filterEkskul
      if (selectedKodeUnit) params.kode_unit = selectedKodeUnit
      if (keyword.trim()) params.q = keyword.trim()

      const blob = await ekskulService.exportRekap(params)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `rekap-pendaftar-ekskul-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: "Export berhasil" })
    } catch {
      toast({ title: "Gagal export", variant: "destructive" })
    } finally { setIsExporting(false) }
  }

  const handleDelete = async (id: number, namaSantri: string) => {
    if (!confirm(`Hapus pendaftaran ekskul atas nama "${namaSantri}"?`)) return
    try {
      await ekskulService.deletePendaftaran(id)
      toast({ title: "Pendaftaran berhasil dihapus" })
      await fetchRows()
    } catch (e: any) {
      toast({ title: "Gagal menghapus", description: e?.response?.data?.message ?? "Terjadi kesalahan", variant: "destructive" })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rekap Pendaftar Ekskul</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Total <span className="font-semibold text-foreground">{totalItems}</span> santri terdaftar
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddOpen(true)} className="gap-2">
            <PlusCircle className="w-4 h-4" /> Tambah Pendaftar
          </Button>
          <Button onClick={handleExport} disabled={isExporting} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            {isExporting ? "Mengekspor..." : "Export Excel"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Ekskul</Label>
            <Select value={draftEkskul} onValueChange={setDraftEkskul}>
              <SelectTrigger className="w-52 h-9"><SelectValue placeholder="Semua Ekskul" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Ekskul</SelectItem>
                {ekskulOptions
                  .filter(e => !selectedKodeUnit || !e.kode_unit || e.kode_unit === selectedKodeUnit)
                  .map(e => (
                    <SelectItem key={e.id_ekskul} value={String(e.id_ekskul)}>{e.nama_ekskul}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          
          <form onSubmit={handleSearch} className="flex gap-2 items-end ml-auto">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Cari Nama</Label>
              <Input
                value={draftKeyword}
                onChange={e => setDraftKeyword(e.target.value)}
                placeholder="Cari nama santri..."
                className="w-56 h-9"
              />
            </div>
            <Button type="button" variant="outline" className="h-9" onClick={resetFilter}>Reset</Button>
            <Button type="submit" className="h-9">Terapkan</Button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 text-center">#</TableHead>
                <TableHead>Nama Santri</TableHead>
                <TableHead>No. Induk</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Ekskul Dipilih</TableHead>
                <TableHead>Tanggal Daftar</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Memuat data...</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="w-8 h-8 opacity-40" />
                      <p className="text-sm">Belum ada santri yang mendaftar ekskul.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : rows.map((row, idx) => (
                <TableRow key={row.id_pendaftaran}>
                  <TableCell className="text-center text-muted-foreground text-sm">
                    {(currentPage - 1) * 25 + idx + 1}
                  </TableCell>
                  <TableCell className="font-medium">{row.santri?.nama_lengkap_santri ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{row.santri?.nomor_induk ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.santri?.kode_kelas ?? "-"}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-primary">{row.ekskul?.nama_ekskul ?? "-"}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {row.created_at ? new Date(row.created_at).toLocaleDateString("id-ID", {
                      day: "2-digit", month: "long", year: "numeric",
                    }) : "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingRow(row)}>
                          <PencilLine className="w-4 h-4 mr-2" />Edit Ekskul
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(row.id_pendaftaran, row.santri?.nama_lengkap_santri ?? "Santri")}
                        ><Trash2 className="w-4 h-4 mr-2" />Hapus</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Sebelumnya</Button>
          <span className="flex items-center text-sm text-muted-foreground px-3">
            Hal {currentPage} dari {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Berikutnya</Button>
        </div>
      )}

      {/* Dialog Tambah */}
      <AddPendaftarDialog
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSaved={fetchRows}
        unitOptions={unitOptions}
        allKelas={allKelas}
        ekskulOptions={ekskulOptions}
        selectedKodeUnit={selectedKodeUnit}
        selectedKodeTahun={selectedKodeTahun}
      />

      {/* Dialog Edit */}
      <EditPendaftarDialog
        open={editingRow !== null}
        onClose={() => setEditingRow(null)}
        onSaved={fetchRows}
        row={editingRow}
        allKelas={allKelas}
        ekskulOptions={ekskulOptions}
      />
    </div>
  )
}
