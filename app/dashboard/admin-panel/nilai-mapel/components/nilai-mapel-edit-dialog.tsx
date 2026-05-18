"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, Plus } from "lucide-react"
import {
  NilaiMapelItem,
  NilaiMapelTugasItem,
  NilaiMapelUlanganItem,
  UpsertNilaiMapelPayload,
} from "@/lib/services/nilai-mapel.service"
import { authService } from "@/lib/services/auth.service"
import { jenisTugasOptions } from "../utils/constants"

interface NilaiMapelEditDialogProps {
  item: NilaiMapelItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: UpsertNilaiMapelPayload) => Promise<void>
  isLoading?: boolean
}

type TugasFormItem = Omit<NilaiMapelTugasItem, "nilai"> & { nilai: string }
type UlanganFormItem = Omit<NilaiMapelUlanganItem, "nilai"> & { nilai: string }

const extractPetugasInputId = (me: any): number | undefined => {
  const candidates = [
    me?.user?.id_petugas,
    me?.user?.petugas_id,
    me?.user?.idDataPetugas,
    me?.user?.data_petugas?.id,
    me?.id_petugas,
    me?.petugas_id,
    me?.idDataPetugas,
    me?.data_petugas?.id,
    me?.user?.id,
    me?.id,
  ]

  for (const candidate of candidates) {
    const id = Number(candidate)
    if (Number.isFinite(id) && id > 0) {
      return id
    }
  }

  return undefined
}

const normalizeNilaiInput = (value: string): number => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.min(100, parsed))
}

const toErrorMessage = (error: any): string => {
  const message = error?.response?.data?.message
  const errors = error?.response?.data?.errors

  if (typeof message === "string" && message) return message

  if (errors && typeof errors === "object") {
    const firstField = Object.keys(errors)[0]
    const firstValue = errors[firstField]

    if (Array.isArray(firstValue) && firstValue.length > 0) {
      return String(firstValue[0])
    }

    if (typeof firstValue === "string") {
      return firstValue
    }
  }

  return "Gagal memperbarui nilai mapel"
}

export function NilaiMapelEditDialog({
  item,
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: NilaiMapelEditDialogProps) {
  const [ujianAkhir, setUjianAkhir] = useState("")
  const [tugas, setTugas] = useState<TugasFormItem[]>([])
  const [ulangan, setUlangan] = useState<UlanganFormItem[]>([])
  const [keterangan, setKeterangan] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [petugasInputId, setPetugasInputId] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (item && open) {
      setUjianAkhir(String(item.ujian_akhir || 0))
      setTugas(
        item.tugas.length > 0
          ? item.tugas.map((t) => ({ ...t, nilai: String(t.nilai) }))
          : [
              { nilai: "", jenis: "PR" },
              { nilai: "", jenis: "TUGAS_PENGGANTI" },
              { nilai: "", jenis: "MODUL_KOMPETENSI" },
            ]
      )
      setUlangan(
        item.ulangan.length > 0
          ? item.ulangan.map((u) => ({ ...u, nilai: String(u.nilai) }))
          : [
              { nilai: "", soal_disusun_pengajar: true, diawasi_pengajar: true },
              { nilai: "", soal_disusun_pengajar: true, diawasi_pengajar: true },
              { nilai: "", soal_disusun_pengajar: true, diawasi_pengajar: true },
            ]
      )
      setKeterangan(item.keterangan || "")
      setError("")
    }
  }, [item, open])

  useEffect(() => {
    const loadUser = async () => {
      const me = await authService.me()
      const id = extractPetugasInputId(me)
      setPetugasInputId(id)
    }

    loadUser()
  }, [])

  const handleAddTugas = () => {
    setTugas([...tugas, { nilai: "", jenis: "PR" }])
  }

  const handleRemoveTugas = (index: number) => {
    setTugas(tugas.filter((_, i) => i !== index))
  }

  const handleTugasChange = (index: number, field: keyof TugasFormItem, value: any) => {
    const newTugas = [...tugas]
    newTugas[index] = { ...newTugas[index], [field]: value }
    setTugas(newTugas)
  }

  const handleAddUlangan = () => {
    setUlangan([...ulangan, { nilai: "", soal_disusun_pengajar: true, diawasi_pengajar: true }])
  }

  const handleRemoveUlangan = (index: number) => {
    setUlangan(ulangan.filter((_, i) => i !== index))
  }

  const handleUlanganChange = (index: number, field: keyof UlanganFormItem, value: any) => {
    const newUlangan = [...ulangan]
    newUlangan[index] = { ...newUlangan[index], [field]: value }
    setUlangan(newUlangan)
  }

  const handleSubmit = async () => {
    if (!item) return

    try {
      setError("")
      setIsSubmitting(true)

      const payload: UpsertNilaiMapelPayload = {
        nomor_induk: item.nomor_induk,
        kode_mapel: item.kode_mapel,
        kode_kelas: item.kode_kelas,
        tahun_ajaran: item.tahun_ajaran,
        semester: item.semester,
        id_petugas_input: petugasInputId,
        keterangan,
        tugas: tugas.map((t) => ({
          nilai: normalizeNilaiInput(t.nilai),
          jenis: t.jenis,
        })),
        ulangan: ulangan.map((u) => ({
          nilai: normalizeNilaiInput(u.nilai),
          soal_disusun_pengajar: u.soal_disusun_pengajar,
          diawasi_pengajar: u.diawasi_pengajar,
        })),
        ujian_akhir: normalizeNilaiInput(ujianAkhir),
      }

      await onSubmit(payload)
      onOpenChange(false)
    } catch (err) {
      setError(toErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Nilai Mapel</DialogTitle>
          <DialogDescription>
            {item?.nama_santri} ({item?.nomor_induk}) - {item?.mapel} ({item?.kode_mapel})
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert className="bg-destructive/10 border-destructive/30 text-destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center text-muted-foreground">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
              <p>Memuat data nilai mapel...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
          {/* Tugas Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Tugas</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTugas}
                className="bg-transparent"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah
              </Button>
            </div>

            <div className="space-y-2 bg-muted/50 p-3 rounded-md">
              {tugas.map((item, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Jenis</Label>
                    <select
                      value={item.jenis}
                      onChange={(e) =>
                        handleTugasChange(index, "jenis", e.target.value as NilaiMapelTugasItem["jenis"])
                      }
                      className="w-full px-2 py-2 border border-border rounded-md text-sm bg-background"
                    >
                      {jenisTugasOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Nilai</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={item.nilai}
                      onChange={(e) => handleTugasChange(index, "nilai", e.target.value)}
                      placeholder="0"
                      className="h-9"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveTugas(index)}
                    className="text-destructive hover:text-destructive h-9 w-9 p-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Ulangan Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Ulangan</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddUlangan}
                className="bg-transparent"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah
              </Button>
            </div>

            <div className="space-y-3 bg-muted/50 p-3 rounded-md">
              {ulangan.map((item, index) => (
                <div key={index} className="space-y-2 pb-2 border-b border-border last:border-0 last:pb-0">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Nilai</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={item.nilai}
                        onChange={(e) => handleUlanganChange(index, "nilai", e.target.value)}
                        placeholder="0"
                        className="h-9"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveUlangan(index)}
                      className="text-destructive hover:text-destructive h-9 w-9 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`soal-${index}`}
                        checked={item.soal_disusun_pengajar}
                        onCheckedChange={(checked) =>
                          handleUlanganChange(index, "soal_disusun_pengajar", checked)
                        }
                      />
                      <Label htmlFor={`soal-${index}`} className="text-xs cursor-pointer">
                        Soal disusun pengajar
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`awasi-${index}`}
                        checked={item.diawasi_pengajar}
                        onCheckedChange={(checked) =>
                          handleUlanganChange(index, "diawasi_pengajar", checked)
                        }
                      />
                      <Label htmlFor={`awasi-${index}`} className="text-xs cursor-pointer">
                        Diawasi pengajar
                      </Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ujian Akhir */}
          <div className="space-y-2">
            <Label htmlFor="ujian-akhir">Ujian Akhir</Label>
            <Input
              id="ujian-akhir"
              type="number"
              min="0"
              max="100"
              value={ujianAkhir}
              onChange={(e) => setUjianAkhir(e.target.value)}
              placeholder="0"
            />
          </div>

          {/* Keterangan */}
          <div className="space-y-2">
            <Label htmlFor="keterangan">Keterangan</Label>
            <Textarea
              id="keterangan"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Catatan atau revisi..."
              rows={3}
            />
          </div>
        </div>
        )}

        <DialogFooter>
          <Button variant="outline" className="bg-transparent" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
