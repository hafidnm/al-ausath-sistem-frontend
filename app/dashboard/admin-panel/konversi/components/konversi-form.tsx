"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle } from "lucide-react"

interface KonversiFormPayload {
  nilai_min: number
  nilai_max: number
  nilai_huruf: string
  predikat: string
  kode_unit?: string
  keterangan?: string
  is_active?: boolean
}

interface KonversiFormProps {
  isEdit?: boolean
  initialData?: KonversiFormPayload
  onSubmit?: (data: KonversiFormPayload) => Promise<void> | void
  onCancel?: () => void
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

  return "Gagal menyimpan data konversi"
}

export function KonversiForm({ isEdit = false, initialData, onSubmit, onCancel }: KonversiFormProps) {
  const [nilaiMin, setNilaiMin] = useState(initialData?.nilai_min ?? 0)
  const [nilaiMax, setNilaiMax] = useState(initialData?.nilai_max ?? 100)
  const [nilaiHuruf, setNilaiHuruf] = useState(initialData?.nilai_huruf ?? "")
  const [predikat, setPredikat] = useState(initialData?.predikat ?? "")
  const [kodeUnit, setKodeUnit] = useState(initialData?.kode_unit ?? "global")
  const [keterangan, setKeterangan] = useState(initialData?.keterangan ?? "")
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!initialData) return

    setNilaiMin(initialData.nilai_min)
    setNilaiMax(initialData.nilai_max)
    setNilaiHuruf(initialData.nilai_huruf)
    setPredikat(initialData.predikat)
    setKodeUnit(initialData.kode_unit ?? "global")
    setKeterangan(initialData.keterangan ?? "")
    setIsActive(initialData.is_active ?? true)
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nilaiHuruf.trim() || !predikat.trim()) {
      setError("Nilai huruf dan predikat wajib diisi")
      return
    }

    if (nilaiMin < 0 || nilaiMax > 100) {
      setError("Rentang nilai harus berada di antara 0 sampai 100")
      return
    }

    if (nilaiMin > nilaiMax) {
      setError("Nilai minimum tidak boleh lebih besar dari nilai maksimum")
      return
    }

    try {
      setIsSubmitting(true)
      setError("")

      await onSubmit?.({
        nilai_min: nilaiMin,
        nilai_max: nilaiMax,
        nilai_huruf: nilaiHuruf.trim().toUpperCase(),
        predikat: predikat.trim(),
        kode_unit: kodeUnit === "global" ? undefined : kodeUnit,
        keterangan: keterangan.trim() || undefined,
        is_active: isActive,
      })
    } catch (err) {
      setError(toErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">{isEdit ? "Edit Konversi" : "Tambah Konversi"}</CardTitle>
        <CardDescription>Atur rentang nilai numerik menjadi huruf dan predikat</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <Alert className="bg-destructive/10 border-destructive/30">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <AlertDescription className="text-destructive ml-2">{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nilai Minimum</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={nilaiMin}
                onChange={(e) => {
                  setNilaiMin(Number(e.target.value))
                  setError("")
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Nilai Maksimum</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={nilaiMax}
                onChange={(e) => {
                  setNilaiMax(Number(e.target.value))
                  setError("")
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Nilai Huruf</Label>
              <Input
                value={nilaiHuruf}
                placeholder="A"
                maxLength={2}
                onChange={(e) => {
                  setNilaiHuruf(e.target.value)
                  setError("")
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Predikat</Label>
              <Input
                value={predikat}
                placeholder="Sangat Baik"
                onChange={(e) => {
                  setPredikat(e.target.value)
                  setError("")
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Kode Unit (opsional)</Label>
              <Select value={kodeUnit} onValueChange={setKodeUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global (semua unit)</SelectItem>
                  <SelectItem value="MTQ">MTQ</SelectItem>
                  <SelectItem value="MTS">MTS</SelectItem>
                  <SelectItem value="ALY">Aliyah</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status Aktif</Label>
              <div className="h-10 px-3 border rounded-md flex items-center justify-between">
                <span className="text-sm text-foreground">{isActive ? "Aktif" : "Nonaktif"}</span>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Keterangan (opsional)</Label>
            <Textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Catatan tambahan"
            />
          </div>

          <div className="flex gap-2 pt-4 border-t border-border/50">
            <div className="flex-1" />
            <Button type="button" variant="outline" className="bg-transparent" onClick={onCancel}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Konversi"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
