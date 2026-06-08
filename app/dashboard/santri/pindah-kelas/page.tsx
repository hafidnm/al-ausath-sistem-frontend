"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
import { useToast } from "@/hooks/use-toast"
import { dataMasterService } from "@/lib/services/data-master.service"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"
import { ArrowLeft, CheckCircle2 } from "lucide-react"

type SantriRow = {
  id: number
  nomorInduk: string
  namaLengkap: string
  jenisKelamin: string
  status: string
}

type KelasOption = {
  value: string
  label: string
  kodeUnit: string
  tahunAjaran: string
}

type UnitOption = {
  value: string
  label: string
}

type TahunAjaranOption = {
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

const formatGender = (gender: string): string => {
  if (gender === "L") return "Laki-Laki"
  if (gender === "P") return "Perempuan"
  return "-"
}

const formatStatus = (status: string): string => {
  const normalized = status.toUpperCase()
  if (normalized === "AKTIF") return "Aktif"
  if (normalized === "CUTI") return "Cuti"
  if (normalized === "LULUS") return "Lulus"
  if (normalized === "KELUAR") return "Keluar"
  return status
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

export default function SantriPindahKelasPage() {
  const { toast } = useToast()

  const [kelasOptions, setKelasOptions] = useState<KelasOption[]>([])
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([])
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState<TahunAjaranOption[]>([])

  const { selectedKodeTahun } = useTahunAjaran()

  const [selectedUnitAsal, setSelectedUnitAsal] = useState("all")
  const [selectedTahunAjaranAsal, setSelectedTahunAjaranAsal] = useState("all")
  const [selectedKelasAsal, setSelectedKelasAsal] = useState("")

  const [selectedUnitTujuan, setSelectedUnitTujuan] = useState("all")
  const [selectedTahunAjaranTujuan, setSelectedTahunAjaranTujuan] = useState("all")
  const [selectedKelasTujuan, setSelectedKelasTujuan] = useState("")

  const [rows, setRows] = useState<SantriRow[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isAllChecked = rows.length > 0 && rows.every((row) => selectedIds.includes(row.id))

  const selectedCount = useMemo(() => selectedIds.length, [selectedIds])

  const loadInitData = async () => {
    try {
      const initData = await dataMasterService.getInitOptions()
      
      const mappedUnit: UnitOption[] = (initData.unit || []).map((u: any) => ({
        value: u.kode_unit,
        label: u.nama_unit || u.kode_unit
      }))
      
      const mappedTahun: TahunAjaranOption[] = (initData.tahun_ajaran || [])
        .filter((t: any) => t.status === "AKTIF")
        .map((t: any) => ({
          value: t.kode_tahun,
          label: t.nama_tahun || t.kode_tahun
        }))

      const mappedKelas: KelasOption[] = (initData.kelas || [])
        .filter((k: any) => k.status === "AKTIF")
        .map((k: any) => ({
          value: k.kode_kelas,
          label: k.nama_kelas || k.kode_kelas,
          kodeUnit: k.kode_unit,
          tahunAjaran: k.tahun_ajaran
        }))

      setUnitOptions(mappedUnit)
      setTahunAjaranOptions(mappedTahun)
      setKelasOptions(mappedKelas)

      if (selectedKodeTahun) {
        setSelectedTahunAjaranAsal(selectedKodeTahun)
        setSelectedTahunAjaranTujuan(selectedKodeTahun)
      }
    } catch {
      setKelasOptions([])
    }
  }

  const kelasAsalOptionsFiltered = useMemo(() => {
    let filtered = kelasOptions
    if (selectedUnitAsal !== "all") {
      filtered = filtered.filter(opt => opt.kodeUnit === selectedUnitAsal)
    }
    if (selectedTahunAjaranAsal !== "all") {
      filtered = filtered.filter(opt => opt.tahunAjaran === selectedTahunAjaranAsal)
    }
    return filtered
  }, [kelasOptions, selectedUnitAsal, selectedTahunAjaranAsal])

  const kelasTujuanOptionsFiltered = useMemo(() => {
    let filtered = kelasOptions.filter(option => option.value !== selectedKelasAsal)
    if (selectedUnitTujuan !== "all") {
      filtered = filtered.filter(opt => opt.kodeUnit === selectedUnitTujuan)
    }
    if (selectedTahunAjaranTujuan !== "all") {
      filtered = filtered.filter(opt => opt.tahunAjaran === selectedTahunAjaranTujuan)
    }
    return filtered
  }, [kelasOptions, selectedKelasAsal, selectedUnitTujuan, selectedTahunAjaranTujuan])

  const loadSantriByKelasAsal = async (kodeKelas: string) => {
    if (!kodeKelas) {
      setRows([])
      return
    }

    setIsLoading(true)
    try {
      const result = await dataSantriService.getAll({ page: 1, per_page: 300, kode_kelas: kodeKelas })
      const mapped = result.data
        .map((item) => ({
          id: toNumber(item.id_santri ?? item.id, -1),
          nomorInduk: toText(item.nomor_induk),
          namaLengkap: toText(item.nama_lengkap_santri),
          jenisKelamin: toText(item.jenis_kelamin).toUpperCase(),
          status: toText(item.status).toUpperCase(),
        }))
        .filter((item) => item.id > 0)

      setRows(mapped)
    } catch (error) {
      toast({
        title: "Gagal Memuat Data",
        description: getErrorMessage(error, "Daftar santri gagal dimuat."),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadInitData()
  }, [])

  useEffect(() => {
    setSelectedKelasAsal("")
  }, [selectedUnitAsal, selectedTahunAjaranAsal])

  useEffect(() => {
    setSelectedKelasTujuan("")
  }, [selectedUnitTujuan, selectedTahunAjaranTujuan])

  useEffect(() => {
    setSelectedIds([])
    if (selectedKelasTujuan === selectedKelasAsal) {
      setSelectedKelasTujuan("")
    }
    void loadSantriByKelasAsal(selectedKelasAsal)
  }, [selectedKelasAsal])

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(rows.map((row) => row.id))
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

  const handleSubmit = async () => {
    if (!selectedKelasAsal) {
      toast({
        title: "Kelas Asal Belum Dipilih",
        description: "Pilih kelas asal terlebih dahulu.",
        variant: "destructive",
      })
      return
    }

    if (!selectedKelasTujuan) {
      toast({
        title: "Kelas Tujuan Belum Dipilih",
        description: "Pilih kelas tujuan perpindahan.",
        variant: "destructive",
      })
      return
    }

    if (selectedKelasAsal === selectedKelasTujuan) {
      toast({
        title: "Kelas Tidak Valid",
        description: "Kelas tujuan harus berbeda dari kelas asal.",
        variant: "destructive",
      })
      return
    }

    if (selectedIds.length === 0) {
      toast({
        title: "Santri Belum Dipilih",
        description: "Pilih minimal satu santri.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await dataSantriService.pindahKelas({
        ids: selectedIds,
        kode_kelas: selectedKelasTujuan,
      })

      toast({
        title: "Berhasil",
        description: result.message || "Perpindahan kelas berhasil diproses.",
      })

      setSelectedIds([])
      void loadSantriByKelasAsal(selectedKelasAsal)
    } catch (error) {
      toast({
        title: "Gagal Memproses",
        description: getErrorMessage(error, "Perpindahan kelas gagal diproses."),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold uppercase tracking-wide text-foreground">Pindah Kelas</h1>
        <Link href="/dashboard/santri">
          <Button className="h-11 w-14 p-0" variant="default">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="space-y-8 p-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4 rounded-xl border p-4 bg-muted/20">
              <h3 className="text-xl font-medium text-foreground border-b pb-2">Asal</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Tahun Ajaran</p>
                  <Select value={selectedTahunAjaranAsal} onValueChange={setSelectedTahunAjaranAsal}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Tahun" />
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
                  <p className="text-sm font-medium">Unit</p>
                  <Select value={selectedUnitAsal} onValueChange={setSelectedUnitAsal}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Unit" />
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
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Pilih Kelas Asal</p>
                <Select value={selectedKelasAsal} onValueChange={setSelectedKelasAsal}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Pilih Kelas Asal" />
                  </SelectTrigger>
                  <SelectContent>
                    {kelasAsalOptionsFiltered.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border p-4 bg-muted/20">
              <h3 className="text-xl font-medium text-foreground border-b pb-2">Tujuan</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Tahun Ajaran</p>
                  <Select value={selectedTahunAjaranTujuan} onValueChange={setSelectedTahunAjaranTujuan}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Tahun" />
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
                  <p className="text-sm font-medium">Unit</p>
                  <Select value={selectedUnitTujuan} onValueChange={setSelectedUnitTujuan}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Unit" />
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
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Pilih Kelas Tujuan</p>
                <Select value={selectedKelasTujuan} onValueChange={setSelectedKelasTujuan}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Pilih Kelas Tujuan" />
                  </SelectTrigger>
                  <SelectContent>
                    {kelasTujuanOptionsFiltered.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-3xl font-medium text-foreground">Pilih Daftar Santri</p>
            <div className="overflow-x-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-[60px]">
                      <Checkbox
                        checked={isAllChecked}
                        onCheckedChange={(value) => handleToggleAll(value === true)}
                        aria-label="Pilih semua"
                      />
                    </TableHead>
                    <TableHead className="w-[70px]">#</TableHead>
                    <TableHead>Nomor Induk</TableHead>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>Jenis Kelamin</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : !selectedKelasAsal ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        Pilih kelas asal untuk menampilkan daftar santri.
                      </TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        Tidak ada santri pada kelas asal yang dipilih.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(row.id)}
                            onCheckedChange={(value) => handleToggleRow(row.id, value === true)}
                            aria-label={`Pilih ${row.namaLengkap}`}
                          />
                        </TableCell>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{row.nomorInduk || "-"}</TableCell>
                        <TableCell className="font-medium">{row.namaLengkap || "-"}</TableCell>
                        <TableCell>{formatGender(row.jenisKelamin)}</TableCell>
                        <TableCell>{formatStatus(row.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="border-t pt-6">
            <Button
              className="h-12 w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isSubmitting}
              onClick={handleSubmit}
            >
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Proses Perpindahan{selectedCount > 0 ? ` (${selectedCount})` : ""}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
