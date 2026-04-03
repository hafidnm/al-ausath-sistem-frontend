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
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle } from "lucide-react"
import { semesterOptions, tahunAjaranOptions } from "../utils/constants"
import { isValidKkm } from "../utils/helpers"

interface KkmFormPayload {
  kode_mapel: string
  tahun_ajaran: string
  semester: number
  nilai_kkm: number
  kode_unit?: string
  keterangan?: string
}

interface KkmFormProps {
  isEdit?: boolean
  initialData?: KkmFormPayload
  submitError?: string
  onSubmit?: (data: KkmFormPayload) => Promise<void> | void
  onCancel?: () => void
}

export function KkmForm({ isEdit = false, initialData, submitError, onSubmit, onCancel }: KkmFormProps) {
  const [kodeMapel, setKodeMapel] = useState(initialData?.kode_mapel ?? "")
  const [tahunAjaran, setTahunAjaran] = useState(initialData?.tahun_ajaran ?? "")
  const [semester, setSemester] = useState(String(initialData?.semester ?? ""))
  const [nilaiKkm, setNilaiKkm] = useState(initialData?.nilai_kkm ?? 75)
  const [kodeUnit, setKodeUnit] = useState(initialData?.kode_unit ?? "")
  const [keterangan, setKeterangan] = useState(initialData?.keterangan ?? "")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!initialData) return

    setKodeMapel(initialData.kode_mapel)
    setTahunAjaran(initialData.tahun_ajaran)
    setSemester(String(initialData.semester))
    setNilaiKkm(initialData.nilai_kkm)
    setKodeUnit(initialData.kode_unit ?? "")
    setKeterangan(initialData.keterangan ?? "")
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const normalizedKodeMapel = kodeMapel.trim().toUpperCase()
    const normalizedUnit = kodeUnit.trim().toUpperCase()

    if (!normalizedKodeMapel || !tahunAjaran || !semester) {
      setError("Field wajib belum lengkap")
      return
    }

    if (!isValidKkm(nilaiKkm)) {
      setError("Nilai KKM harus di antara 0 sampai 100")
      return
    }

    try {
      setIsSubmitting(true)
      setError("")

      await onSubmit?.({
        kode_mapel: normalizedKodeMapel,
        tahun_ajaran: tahunAjaran,
        semester: Number(semester),
        nilai_kkm: nilaiKkm,
        kode_unit: normalizedUnit || undefined,
        keterangan,
      })
    } catch {
      // Error API ditangani oleh parent melalui submitError.
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">{isEdit ? "Edit KKM" : "Tambah KKM"}</CardTitle>
        <CardDescription>Isi data KKM mapel sesuai semester dan tahun ajaran</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <Alert className="bg-destructive/10 border-destructive/30">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <AlertDescription className="text-destructive ml-2">{error}</AlertDescription>
            </Alert>
          )}

          {!error && submitError && (
            <Alert className="bg-destructive/10 border-destructive/30">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <AlertDescription className="text-destructive ml-2">{submitError}</AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kode Mapel</Label>
              <Input
                value={kodeMapel}
                onChange={(e) => { setKodeMapel(e.target.value); setError("") }}
                placeholder="Contoh: MATH-01"
              />
            </div>

            <div className="space-y-2">
              <Label>Tahun Ajaran</Label>
              <Select value={tahunAjaran} onValueChange={(v) => { setTahunAjaran(v); setError("") }}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tahun ajaran" />
                </SelectTrigger>
                <SelectContent>
                  {tahunAjaranOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Semester</Label>
              <Select value={semester} onValueChange={(v) => { setSemester(v); setError("") }}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesterOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nilai KKM</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={nilaiKkm}
                onChange={(e) => { setNilaiKkm(Number(e.target.value)); setError("") }}
              />
            </div>

            <div className="space-y-2">
              <Label>Kode Unit (opsional, kosongkan untuk global)</Label>
              <Input
                value={kodeUnit}
                onChange={(e) => { setKodeUnit(e.target.value); setError("") }}
                placeholder="Contoh: U01"
              />
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
            <Button type="submit" disabled={isSubmitting}>{isEdit ? "Simpan Perubahan" : "Simpan KKM"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
