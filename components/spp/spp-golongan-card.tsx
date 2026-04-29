"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Plus, Users, Edit, Trash2, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type {
  CreateSppGolonganRequest,
  SppGolongan,
  UpdateSppGolonganRequest,
} from "@/lib/services/spp.service"

type GolonganFormState = {
  namaGolongan: string
  jenjang: string
  nominal: string
  aktif: "true" | "false"
  keterangan: string
}

const emptyGolonganForm: GolonganFormState = {
  namaGolongan: "",
  jenjang: "",
  nominal: "",
  aktif: "true",
  keterangan: "",
}

const parseNominalInput = (value: string) => {
  const normalized = value.replace(/[^\d]/g, "")
  if (!normalized) return 0

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

const formatNominal = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

interface SppGolonganCardProps {
  data: SppGolongan[]
  jenjangOptions: string[]
  loading: boolean
  processing: boolean
  onCreate: (payload: CreateSppGolonganRequest) => Promise<void>
  onUpdate: (id: string, payload: UpdateSppGolonganRequest) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function SppGolonganCard({
  data,
  jenjangOptions,
  loading,
  processing,
  onCreate,
  onUpdate,
  onDelete,
}: SppGolonganCardProps) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedGolongan, setSelectedGolongan] = useState<SppGolongan | null>(null)
  const [form, setForm] = useState<GolonganFormState>(emptyGolonganForm)

  const availableJenjang = useMemo(() => {
    const fromProps = jenjangOptions
      .map((item) => item.trim().toUpperCase())
      .filter((item) => item.length > 0)

    if (fromProps.length > 0) return Array.from(new Set(fromProps)).sort()

    const fromData = data
      .map((item) => (item.jenjang || "").trim().toUpperCase())
      .filter((item) => item.length > 0)

    return Array.from(new Set(fromData)).sort()
  }, [data, jenjangOptions])

  useEffect(() => {
    if (!isEditOpen || !selectedGolongan) return

    setForm({
      namaGolongan: selectedGolongan.namaGolongan,
      jenjang: selectedGolongan.jenjang || "",
      nominal: selectedGolongan.nominal ? selectedGolongan.nominal.toString() : "",
      aktif: selectedGolongan.aktif ? "true" : "false",
      keterangan: selectedGolongan.keterangan || "",
    })
  }, [isEditOpen, selectedGolongan])

  const handleAdd = async () => {
    if (!form.namaGolongan.trim() || !form.jenjang.trim() || parseNominalInput(form.nominal) <= 0) {
      alert("Nama golongan, jenjang, dan nominal wajib diisi")
      return
    }

    await onCreate({
      namaGolongan: form.namaGolongan.trim(),
      jenjang: form.jenjang.trim().toUpperCase(),
      nominal: parseNominalInput(form.nominal),
      aktif: form.aktif === "true",
      keterangan: form.keterangan.trim() || undefined,
    })

    setIsAddOpen(false)
    setForm(emptyGolonganForm)
  }

  const handleEdit = async () => {
    if (!selectedGolongan) return

    if (!form.namaGolongan.trim() || !form.jenjang.trim() || parseNominalInput(form.nominal) <= 0) {
      alert("Nama golongan, jenjang, dan nominal wajib diisi")
      return
    }

    await onUpdate(selectedGolongan.id, {
      namaGolongan: form.namaGolongan.trim(),
      jenjang: form.jenjang.trim().toUpperCase(),
      nominal: parseNominalInput(form.nominal),
      aktif: form.aktif === "true",
      keterangan: form.keterangan.trim() || undefined,
    })

    setIsEditOpen(false)
    setSelectedGolongan(null)
    setForm(emptyGolonganForm)
  }

  const handleDelete = async (item: SppGolongan) => {
    if (!confirm(`Hapus golongan ${item.namaGolongan}?`)) return
    await onDelete(item.id)
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Golongan SPP
            </CardTitle>
            <CardDescription>
              Kelola golongan SPP berdasarkan jenjang dari data kelas agar struktur setting lebih rapi.
            </CardDescription>
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Golongan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[560px]">
              <DialogHeader>
                <DialogTitle>Tambah Golongan SPP</DialogTitle>
                <DialogDescription>
                  Pilih jenjang dari data kelas yang tersedia, lalu isi nominal golongan.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Nama Golongan</Label>
                    <Input
                      placeholder="Contoh: Reguler A"
                      value={form.namaGolongan}
                      onChange={(e) => setForm((prev) => ({ ...prev, namaGolongan: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Jenjang</Label>
                    <Select
                      value={form.jenjang}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, jenjang: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenjang" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableJenjang.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nominal SPP</Label>
                    <Input
                      placeholder="Contoh: 450000"
                      value={form.nominal}
                      onChange={(e) => setForm((prev) => ({ ...prev, nominal: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={form.aktif}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, aktif: value as "true" | "false" }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Aktif</SelectItem>
                        <SelectItem value="false">Nonaktif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Keterangan</Label>
                    <Input
                      placeholder="Opsional"
                      value={form.keterangan}
                      onChange={(e) => setForm((prev) => ({ ...prev, keterangan: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Batal</Button>
                <Button onClick={() => void handleAdd()} disabled={processing}>
                  {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Simpan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Golongan</TableHead>
                <TableHead>Jenjang</TableHead>
                <TableHead>Nominal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memuat golongan SPP...
                    </span>
                  </TableCell>
                </TableRow>
              ) : null}

              {!loading && data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.namaGolongan}</TableCell>
                  <TableCell>{item.jenjang || "-"}</TableCell>
                  <TableCell>{formatNominal(item.nominal)}</TableCell>
                  <TableCell>
                    {item.aktif ? (
                      <Badge className="bg-primary/10 text-primary border-0">Aktif</Badge>
                    ) : (
                      <Badge variant="outline">Nonaktif</Badge>
                    )}
                  </TableCell>
                  <TableCell>{item.keterangan || "-"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedGolongan(item)
                            setIsEditOpen(true)
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Golongan
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => void handleDelete(item)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Hapus Golongan
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}

              {!loading && data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Belum ada golongan SPP.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Edit Golongan SPP</DialogTitle>
            <DialogDescription>Perbarui data golongan SPP sesuai jenjang data kelas.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Nama Golongan</Label>
                <Input
                  value={form.namaGolongan}
                  onChange={(e) => setForm((prev) => ({ ...prev, namaGolongan: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Jenjang</Label>
                <Select
                  value={form.jenjang}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, jenjang: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenjang" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableJenjang.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nominal SPP</Label>
                <Input
                  value={form.nominal}
                  onChange={(e) => setForm((prev) => ({ ...prev, nominal: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.aktif}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, aktif: value as "true" | "false" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Aktif</SelectItem>
                    <SelectItem value="false">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Keterangan</Label>
                <Input
                  value={form.keterangan}
                  onChange={(e) => setForm((prev) => ({ ...prev, keterangan: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
            <Button onClick={() => void handleEdit()} disabled={processing}>
              {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
