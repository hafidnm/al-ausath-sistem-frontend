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

interface NilaiAkhlakFormPayload {
  nomor_induk: string
  tahun_ajaran: string
  semester: number
  nilai_angka: number
  aspek?: string
  deskripsi?: string
}

interface NilaiAkhlakFormProps {
  initialData?: Partial<NilaiAkhlakFormPayload>
  onSubmit?: (data: NilaiAkhlakFormPayload) => Promise<void> | void
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

  return "Gagal menyimpan nilai akhlak"
}

export function NilaiAkhlakForm({ initialData, onSubmit, onCancel }: NilaiAkhlakFormProps) {
  const [nomorInduk, setNomorInduk] = useState(initialData?.nomor_induk ?? "")
  const [tahunAjaran, setTahunAjaran] = useState(initialData?.tahun_ajaran ?? "")
  const [semester, setSemester] = useState(String(initialData?.semester ?? ""))
  const [nilaiAngka, setNilaiAngka] = useState(initialData?.nilai_angka ?? 80)
  const [aspek, setAspek] = useState(initialData?.aspek ?? "AKHLAK")
  const [deskripsi, setDeskripsi] = useState(initialData?.deskripsi ?? "")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!initialData) return

    setNomorInduk(initialData.nomor_induk ?? "")
    setTahunAjaran(initialData.tahun_ajaran ?? "")
    setSemester(String(initialData.semester ?? ""))
    setNilaiAngka(initialData.nilai_angka ?? 80)
    setAspek(initialData.aspek ?? "AKHLAK")
    setDeskripsi(initialData.deskripsi ?? "")
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nomorInduk.trim() || !tahunAjaran || !semester) {
      setError("Nomor induk, tahun ajaran, dan semester wajib diisi")
      return
    }

    if (nilaiAngka < 0 || nilaiAngka > 100) {
      setError("Nilai angka harus di antara 0 sampai 100")
      return
    }

    try {
      setIsSubmitting(true)
      setError("")

      await onSubmit?.({
        nomor_induk: nomorInduk.trim(),
        tahun_ajaran: tahunAjaran,
        semester: Number(semester),
        nilai_angka: nilaiAngka,
        aspek: aspek || "AKHLAK",
        deskripsi: deskripsi.trim() || undefined,
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
        <CardTitle className="text-lg text-foreground">Input Nilai Akhlak</CardTitle>
        <CardDescription>Form sederhana nilai akhlak berbasis angka tanpa komponen turunan</CardDescription>
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
              <Label>Nomor Induk</Label>
              <Input
                value={nomorInduk}
                onChange={(e) => {
                  setNomorInduk(e.target.value)
                  setError("")
                }}
                placeholder="Contoh: 2024001"
              />
            </div>

            <div className="space-y-2">
              <Label>Tahun Ajaran</Label>
              <Select value={tahunAjaran} onValueChange={setTahunAjaran}>
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
              <Select value={semester} onValueChange={setSemester}>
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
              <Label>Nilai Angka</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={nilaiAngka}
                onChange={(e) => {
                  setNilaiAngka(Number(e.target.value))
                  setError("")
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Aspek</Label>
              <Input value={aspek} onChange={(e) => setAspek(e.target.value)} placeholder="AKHLAK" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Deskripsi (opsional)</Label>
            <Textarea
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Catatan singkat terkait nilai akhlak"
            />
          </div>

          <div className="flex gap-2 pt-4 border-t border-border/50">
            <div className="flex-1" />
            <Button type="button" variant="outline" className="bg-transparent" onClick={onCancel}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Nilai"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
