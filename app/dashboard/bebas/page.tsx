"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import api from "@/lib/axios"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useToast } from "@/hooks/use-toast"
import {
  RefreshCw,
  Search,
  Plus,
  Receipt,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Loader2,
  Eye,
  Trash2,
  FileDown,
  Calendar,
  Layers,
  ChevronDown,
  Filter,
} from "lucide-react"

// Types matching backend Eloquent structure
interface TagihanBebas {
  id_bebas: number
  id_santri: number
  nama_tagihan: string
  nominal_tagihan: number
  nominal_bayar: number
  status_lunas: 'lunas' | 'belum_lunas'
  created_at: string
  santri?: {
    id_santri: number
    nama_lengkap_santri: string
    nomor_induk: string
    kode_kelas: string
  }
  pembayaran?: PembayaranBebas[]
}

interface PembayaranBebas {
  id_pembayaran_bebas: number
  id_bebas: number
  nominal_bayar: number
  tanggal_bayar: string
  catatan?: string
  id_petugas_verifikator?: number
  created_at: string
  file_path_pdf?: string
}

interface Santri {
  id_santri: number
  nama_lengkap_santri: string
  nomor_induk: string
  kode_kelas: string
}

export default function AdministrasiBebasPage() {
  const { toast } = useToast()
  const [data, setData] = useState<TagihanBebas[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Step-by-step filters for student selection in creation modal
  const [units, setUnits] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [selectedJenjang, setSelectedJenjang] = useState("")
  const [selectedKelas, setSelectedKelas] = useState("")
  const [selectedGender, setSelectedGender] = useState("")

  // Filters & Searches
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterUnit, setFilterUnit] = useState("all")
  const [filterKelas, setFilterKelas] = useState("all")

  const [appliedSearch, setAppliedSearch] = useState("")
  const [appliedStatus, setAppliedStatus] = useState("all")
  const [appliedUnit, setAppliedUnit] = useState("all")
  const [appliedKelas, setAppliedKelas] = useState("all")

  // Modals
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [bayarOpen, setBayarOpen] = useState(false)
  const [selectedTagihan, setSelectedTagihan] = useState<TagihanBebas | null>(null)

  // Form states
  const [newTagihan, setNewTagihan] = useState({
    id_santri: "",
    nama_tagihan: "",
    nominal_tagihan: "",
  })
  const [newPembayaran, setNewPembayaran] = useState({
    nominal_bayar: "",
    catatan: "",
  })

  // Fetch all bills
  const fetchAllData = async () => {
    setLoading(true)
    try {
      // Fetch bills
      const res = await api.get("/administrasi/bebas")
      setData(res.data?.data || res.data || [])
    } catch (error) {
      console.error(error)
      toast({
        title: "Koneksi Gagal",
        description: "Gagal menghubungkan ke server untuk sinkronisasi data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUnits = async () => {
    try {
      const res = await api.get("/akademik/unit")
      setUnits(res.data?.data || res.data || [])
    } catch (err) {
      console.error("Gagal memuat jenjang:", err)
    }
  }

  const handleJenjangChange = async (unitCode: string) => {
    setSelectedJenjang(unitCode)
    setSelectedKelas("")
    setSelectedGender("")
    setNewTagihan(prev => ({ ...prev, id_santri: "" }))
    setStudents([])
    setClasses([])

    try {
      const res = await api.get("/akademik/kelas", { params: { kode_unit: unitCode, per_page: 100 } })
      setClasses(res.data?.data || res.data || [])
    } catch (err) {
      console.error("Gagal memuat kelas:", err)
    }
  }

  const handleKelasChange = (kelasCode: string) => {
    setSelectedKelas(kelasCode)
    setSelectedGender("")
    setNewTagihan(prev => ({ ...prev, id_santri: "" }))
    setStudents([])
  }

  const handleGenderChange = async (gender: string) => {
    setSelectedGender(gender)
    setNewTagihan(prev => ({ ...prev, id_santri: "" }))
    setStudents([])

    if (!selectedKelas) return

    try {
      const res = await api.get("/akademik/santri", {
        params: {
          kode_kelas: selectedKelas,
          jenis_kelamin: gender,
          per_page: 200
        }
      })
      setStudents(res.data?.data || res.data || [])
    } catch (err) {
      console.error("Gagal memuat santri:", err)
    }
  }

  useEffect(() => {
    fetchAllData()
    fetchUnits()
  }, [])

  // Derived options from data
  const filterUnitOptions = useMemo(() => {
    const set = new Set(data.map((r) => r.santri?.kode_kelas?.split("-")[0] ?? "").filter(Boolean))
    return Array.from(set).sort()
  }, [data])

  const filterKelasOptions = useMemo(() => {
    const set = new Set(data.map((r) => r.santri?.kode_kelas ?? "").filter(Boolean))
    return Array.from(set).sort()
  }, [data])

  const handleApplyFilter = () => {
    setAppliedSearch(search)
    setAppliedStatus(filterStatus)
    setAppliedUnit(filterUnit)
    setAppliedKelas(filterKelas)
  }

  const handleResetFilter = () => {
    setSearch("")
    setFilterStatus("all")
    setFilterUnit("all")
    setFilterKelas("all")
    setAppliedSearch("")
    setAppliedStatus("all")
    setAppliedUnit("all")
    setAppliedKelas("all")
  }

  // Derived filtered metrics
  const filtered = useMemo(() => {
    return data.filter((item) => {
      const nama = item.santri?.nama_lengkap_santri || ""
      const nis = item.santri?.nomor_induk || ""
      const label = item.nama_tagihan || ""
      const matchesSearch =
        !appliedSearch ||
        nama.toLowerCase().includes(appliedSearch.toLowerCase()) ||
        nis.toLowerCase().includes(appliedSearch.toLowerCase()) ||
        label.toLowerCase().includes(appliedSearch.toLowerCase())

      const matchesStatus =
        appliedStatus === "all" ||
        (appliedStatus === "lunas" && item.status_lunas === "lunas") ||
        (appliedStatus === "belum_lunas" && item.status_lunas === "belum_lunas")

      const matchesUnit =
        appliedUnit === "all" ||
        (item.santri?.kode_kelas ?? "").startsWith(appliedUnit)

      const matchesKelas =
        appliedKelas === "all" ||
        item.santri?.kode_kelas === appliedKelas

      return matchesSearch && matchesStatus && matchesUnit && matchesKelas
    })
  }, [data, appliedSearch, appliedStatus, appliedUnit, appliedKelas])

  // Total outstanding amounts
  const metrics = useMemo(() => {
    const total = data.reduce((acc, curr) => acc + Number(curr.nominal_tagihan), 0)
    const paid = data.reduce((acc, curr) => acc + Number(curr.nominal_bayar), 0)
    const remaining = total - paid
    return { total, paid, remaining }
  }, [data])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val)
  }

  // Action: Create Tagihan
  const handleCreateTagihan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTagihan.id_santri || !newTagihan.nama_tagihan || !newTagihan.nominal_tagihan) {
      toast({
        title: "Validasi Gagal",
        description: "Harap isi semua kolom wajib.",
        variant: "destructive",
      })
      return
    }

    setActionLoading(true)
    try {
      await api.post("/administrasi/bebas", {
        id_santri: Number(newTagihan.id_santri),
        nama_tagihan: newTagihan.nama_tagihan,
        nominal_tagihan: Number(newTagihan.nominal_tagihan),
      })

      toast({
        title: "Berhasil",
        description: "Tagihan baru berhasil diterbitkan.",
      })
      setCreateOpen(false)
      setNewTagihan({ id_santri: "", nama_tagihan: "", nominal_tagihan: "" })
      fetchAllData()
    } catch (error: any) {
      toast({
        title: "Gagal",
        description: error.response?.data?.message || error.message || "Terjadi kesalahan sistem.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Action: Add Payment / Installment
  const handleAddPembayaran = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTagihan || !newPembayaran.nominal_bayar) return

    setActionLoading(true)
    try {
      const result = await api.post(`/administrasi/bebas/${selectedTagihan.id_bebas}/pembayaran`, {
        nominal_bayar: Number(newPembayaran.nominal_bayar),
        catatan: newPembayaran.catatan,
      })

      toast({
        title: "Pembayaran Berhasil",
        description: "Cicilan pembayaran berhasil dicatat dan kwitansi telah dicetak.",
      })

      setBayarOpen(false)
      setNewPembayaran({ nominal_bayar: "", catatan: "" })
      fetchAllData()

      // Automatically open receipt PDF if generated
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const baseUrl = apiUrl.replace(/\/api\/?$/, '')
      if (result.data?.file_path_pdf || result.file_path_pdf) {
        const path = result.data?.file_path_pdf || result.file_path_pdf
        window.open(`${baseUrl}/storage/${path}`, "_blank")
      }
    } catch (error: any) {
      toast({
        title: "Gagal",
        description: error.response?.data?.message || error.message || "Gagal mencatat pembayaran.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Action: Delete Tagihan
  const handleDeleteTagihan = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus tagihan ini? Seluruh riwayat pembayaran juga akan dihapus.")) return

    setActionLoading(true)
    try {
      await api.delete(`/administrasi/bebas/${id}`)

      toast({
        title: "Dihapus",
        description: "Tagihan telah berhasil dihapus dari sistem.",
      })
      fetchAllData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Upper header with action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Administrasi Bebas</h1>
          <p className="text-sm text-muted-foreground">
            Kelola tagihan non-SPP seperti uang seragam, gedung, infak, dll., beserta sistem pembayaran cicilan.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAllData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="bg-primary hover:bg-primary/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Tagihan Baru
          </Button>
        </div>
      </div>

      {/* Modern metrics visual system */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50 relative overflow-hidden bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Layers className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Target Dana</p>
              <p className="text-xl font-bold text-foreground mt-1">{formatCurrency(metrics.total)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 relative overflow-hidden bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Terbayar</p>
              <p className="text-xl font-bold text-emerald-500 mt-1">{formatCurrency(metrics.paid)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 relative overflow-hidden bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Tunggakan</p>
              <p className="text-xl font-bold text-red-500 mt-1">{formatCurrency(metrics.remaining)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collapsible Filter Bar */}
      <Card className="border">
        <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="h-14 w-full justify-between rounded-none bg-white px-5 text-base font-semibold text-foreground shadow-none hover:bg-white hover:text-foreground animate-none"
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label>Kata Kunci</Label>
                  <Input
                    placeholder="Cari nama, NIS, atau tagihan..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pilih Unit/Jenjang</Label>
                  <Select value={filterUnit} onValueChange={setFilterUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Jenjang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Jenjang</SelectItem>
                      {filterUnitOptions.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Pilih Kelas</Label>
                  <Select value={filterKelas} onValueChange={setFilterKelas}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kelas</SelectItem>
                      {filterKelasOptions.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status Pembayaran</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="lunas">Lunas</SelectItem>
                      <SelectItem value="belum_lunas">Belum Lunas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleApplyFilter}>
                  Terapkan Filter
                </Button>
                <Button variant="outline" onClick={handleResetFilter}>
                  Reset Filter
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Main card with high fidelity table */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Daftar Administrasi Bebas</CardTitle>
              <CardDescription>Menampilkan tagihan mandiri dan iuran non-bulanan santri.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Santri</TableHead>
                  <TableHead>NIS</TableHead>
                  <TableHead>Nama Tagihan</TableHead>
                  <TableHead className="text-right">Nominal Tagihan</TableHead>
                  <TableHead className="text-right">Sudah Dibayar</TableHead>
                  <TableHead className="text-right">Sisa Tagihan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                      Sedang memuat data tagihan...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      Tidak ada data tagihan bebas yang ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((item) => {
                    const sisa = Number(item.nominal_tagihan) - Number(item.nominal_bayar)
                    return (
                      <TableRow key={item.id_bebas} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">{item.santri?.nama_lengkap_santri || "-"}</TableCell>
                        <TableCell className="font-mono text-sm">{item.santri?.nomor_induk || "-"}</TableCell>
                        <TableCell>{item.nama_tagihan}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.nominal_tagihan)}</TableCell>
                        <TableCell className="text-right text-emerald-500 font-medium">{formatCurrency(item.nominal_bayar)}</TableCell>
                        <TableCell className={`text-right font-medium ${sisa > 0 ? "text-red-500" : "text-muted-foreground"}`}>
                          {formatCurrency(sisa)}
                        </TableCell>
                        <TableCell>
                          {item.status_lunas === "lunas" ? (
                            <Badge className="bg-emerald-500/15 text-emerald-600 border-0 font-medium">Lunas</Badge>
                          ) : (
                            <Badge className="bg-red-500/15 text-red-600 border-0 font-medium">Belum Lunas</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setSelectedTagihan(item)
                                setDetailOpen(true)
                              }}
                              title="Detail & Riwayat"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {item.status_lunas !== "lunas" && (
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => {
                                  setSelectedTagihan(item)
                                  setBayarOpen(true)
                                }}
                              >
                                <DollarSign className="w-3.5 h-3.5 mr-1" /> Bayar
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteTagihan(item.id_bebas)}
                              disabled={actionLoading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog: Create Tagihan */}
      <Dialog open={createOpen} onOpenChange={(open) => {
        setCreateOpen(open)
        if (!open) {
          setSelectedJenjang("")
          setSelectedKelas("")
          setSelectedGender("")
          setClasses([])
          setStudents([])
          setNewTagihan({ id_santri: "", nama_tagihan: "", nominal_tagihan: "" })
        }
      }}>
        <DialogContent suppressHydrationWarning>
          <form onSubmit={handleCreateTagihan}>
            <DialogHeader>
              <DialogTitle>Buat Tagihan Bebas Baru</DialogTitle>
              <DialogDescription>Menerbitkan tagihan non-rutin/non-SPP untuk santri aktif.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <Label htmlFor="jenjang">Pilih Jenjang *</Label>
                <Select
                  value={selectedJenjang}
                  onValueChange={handleJenjangChange}
                >
                  <SelectTrigger id="jenjang">
                    <SelectValue placeholder="Pilih jenjang..." />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u.id_unit || u.kode_unit} value={u.kode_unit}>
                        {u.nama_unit} ({u.kode_unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="kelas">Pilih Kelas *</Label>
                <Select
                  value={selectedKelas}
                  onValueChange={handleKelasChange}
                  disabled={!selectedJenjang}
                >
                  <SelectTrigger id="kelas">
                    <SelectValue placeholder={selectedJenjang ? "Pilih kelas..." : "Pilih jenjang terlebih dahulu"} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id_kelas || c.kode_kelas} value={c.kode_kelas}>
                        {c.nama_kelas}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="gender">Kategori Putra/Putri *</Label>
                <Select
                  value={selectedGender}
                  onValueChange={handleGenderChange}
                  disabled={!selectedKelas}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder={selectedKelas ? "Pilih kategori..." : "Pilih kelas terlebih dahulu"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Putra (Laki-laki)</SelectItem>
                    <SelectItem value="P">Putri (Perempuan)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="santri">Pilih Santri *</Label>
                <Select
                  value={newTagihan.id_santri}
                  onValueChange={(val) => setNewTagihan({ ...newTagihan, id_santri: val })}
                  disabled={!selectedGender || students.length === 0}
                >
                  <SelectTrigger id="santri">
                    <SelectValue placeholder={
                      !selectedGender 
                        ? "Pilih kategori terlebih dahulu" 
                        : students.length === 0 
                          ? "Tidak ada santri di filter ini" 
                          : "Pilih nama santri..."
                    } />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {students.map((s) => (
                      <SelectItem key={s.id_santri} value={s.id_santri.toString()}>
                        {s.nama_lengkap_santri} ({s.nomor_induk})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="nama_tagihan">Nama Tagihan *</Label>
                <Input
                  id="nama_tagihan"
                  placeholder="Misal: Uang Seragam, Buku Paket Genap, Iuran Gedung"
                  value={newTagihan.nama_tagihan}
                  onChange={(e) => setNewTagihan({ ...newTagihan, nama_tagihan: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="nominal_tagihan">Nominal Tagihan (Rp) *</Label>
                <Input
                  id="nominal_tagihan"
                  type="number"
                  placeholder="250000"
                  value={newTagihan.nominal_tagihan}
                  onChange={(e) => setNewTagihan({ ...newTagihan, nominal_tagihan: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Terbitkan Tagihan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Bayar Cicilan */}
      <Dialog open={bayarOpen} onOpenChange={setBayarOpen}>
        <DialogContent suppressHydrationWarning>
          <form onSubmit={handleAddPembayaran}>
            <DialogHeader>
              <DialogTitle>Catat Pembayaran Cicilan</DialogTitle>
              <DialogDescription>
                Mencatat cicilan/angsuran pembayaran tagihan *{selectedTagihan?.nama_tagihan}* untuk *{selectedTagihan?.santri?.nama_lengkap_santri}*.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-muted/40 p-3 space-y-1.5 text-sm border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Tagihan:</span>
                  <span className="font-semibold text-foreground">{formatCurrency(selectedTagihan?.nominal_tagihan || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sudah Dibayar:</span>
                  <span className="font-semibold text-emerald-500">{formatCurrency(selectedTagihan?.nominal_bayar || 0)}</span>
                </div>
                <div className="flex justify-between border-t pt-1.5 mt-1">
                  <span className="text-muted-foreground font-medium">Sisa Tagihan:</span>
                  <span className="font-bold text-red-500">
                    {formatCurrency((selectedTagihan?.nominal_tagihan || 0) - (selectedTagihan?.nominal_bayar || 0))}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="nominal_bayar">Nominal Bayar (Rp) *</Label>
                <Input
                  id="nominal_bayar"
                  type="number"
                  placeholder="Ketik nominal cicilan..."
                  max={(selectedTagihan?.nominal_tagihan || 0) - (selectedTagihan?.nominal_bayar || 0)}
                  value={newPembayaran.nominal_bayar}
                  onChange={(e) => setNewPembayaran({ ...newPembayaran, nominal_bayar: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="catatan">Catatan / Keterangan (Opsional)</Label>
                <Input
                  id="catatan"
                  placeholder="Misal: Cicilan ke-1, Pembayaran lunas via transfer Bank Syariah"
                  value={newPembayaran.catatan}
                  onChange={(e) => setNewPembayaran({ ...newPembayaran, catatan: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBayarOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={actionLoading}>
                {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Simpan Pembayaran
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detail & Riwayat Cicilan */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[600px]" suppressHydrationWarning>
          <DialogHeader>
            <DialogTitle>Detail Tagihan & Riwayat Pembayaran</DialogTitle>
            <DialogDescription>Profil santri dan riwayat angsuran lengkap.</DialogDescription>
          </DialogHeader>

          {selectedTagihan && (
            <div className="space-y-6 py-2 text-sm">
              {/* Profil Santri */}
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">Profil Santri</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-muted/20 p-3 rounded-lg border">
                  <div>
                    <Label className="text-xs text-muted-foreground">Nama Lengkap</Label>
                    <p className="font-medium text-foreground">{selectedTagihan.santri?.nama_lengkap_santri}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Nomor Induk</Label>
                    <p className="font-medium text-foreground font-mono">{selectedTagihan.santri?.nomor_induk || "-"}</p>
                  </div>
                  <div className="mt-1">
                    <Label className="text-xs text-muted-foreground">Kelas</Label>
                    <p className="font-medium text-foreground">{selectedTagihan.santri?.kode_kelas || "-"}</p>
                  </div>
                  <div className="mt-1">
                    <Label className="text-xs text-muted-foreground">Nama Tagihan</Label>
                    <p className="font-medium text-primary font-medium">{selectedTagihan.nama_tagihan}</p>
                  </div>
                </div>
              </div>

              {/* Status & Angka Keuangan */}
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">Informasi Keuangan</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted/10 p-2.5 rounded border text-center">
                    <span className="text-[10px] text-muted-foreground uppercase">Target</span>
                    <p className="font-bold text-foreground mt-0.5">{formatCurrency(selectedTagihan.nominal_tagihan)}</p>
                  </div>
                  <div className="bg-emerald-500/5 p-2.5 rounded border border-emerald-500/10 text-center">
                    <span className="text-[10px] text-emerald-600 uppercase">Sudah Dibayar</span>
                    <p className="font-bold text-emerald-500 mt-0.5">{formatCurrency(selectedTagihan.nominal_bayar)}</p>
                  </div>
                  <div className="bg-red-500/5 p-2.5 rounded border border-red-500/10 text-center">
                    <span className="text-[10px] text-red-600 uppercase">Sisa Tagihan</span>
                    <p className="font-bold text-red-500 mt-0.5">
                      {formatCurrency(Number(selectedTagihan.nominal_tagihan) - Number(selectedTagihan.nominal_bayar))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Daftar Riwayat Cicilan */}
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">Riwayat Pembayaran Cicilan</p>
                {(!selectedTagihan.pembayaran || selectedTagihan.pembayaran.length === 0) ? (
                  <p className="text-muted-foreground italic text-xs py-2">Belum ada cicilan yang dibayarkan.</p>
                ) : (
                  <div className="rounded-lg border divide-y overflow-hidden max-h-48 overflow-y-auto">
                    {selectedTagihan.pembayaran.map((p, idx) => (
                      <div key={p.id_pembayaran_bebas || idx} className="flex justify-between items-center p-3 hover:bg-muted/20">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-foreground">{formatCurrency(p.nominal_bayar)}</span>
                            {p.catatan && <span className="text-[10px] text-muted-foreground">({p.catatan})</span>}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(p.tanggal_bayar).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                          </div>
                        </div>
                        {p.file_path_pdf && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-xs text-primary border-primary/20 hover:bg-primary/5"
                            onClick={() => window.open(`http://localhost:8000/storage/${p.file_path_pdf}`, "_blank")}
                          >
                            <FileDown className="w-3.5 h-3.5 mr-1" />
                            Kwitansi
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter suppressHydrationWarning>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
