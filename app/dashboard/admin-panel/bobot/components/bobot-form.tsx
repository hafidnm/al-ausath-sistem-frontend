"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Check } from "lucide-react"
import { validateBobotTotal } from "../utils/helpers"

export interface BobotFormValues {
  tahunAjaran: string
  semester: number
  bobotHarian: number
  bobotUts: number
  bobotUas: number
}

interface BobotFormProps {
  isEdit?: boolean
  isSubmitting?: boolean
  initialData?: BobotFormValues
  onSubmit?: (data: BobotFormValues) => void
  onCancel?: () => void
}

export function BobotForm({ isEdit = false, isSubmitting = false, initialData, onSubmit, onCancel }: BobotFormProps) {
  const [tahunAjaran, setTahunAjaran] = useState(initialData?.tahunAjaran ?? "2025/2026")
  const [semester, setSemester] = useState(initialData?.semester ?? 1)
  const [bobotHarian, setBobotHarian] = useState(initialData?.bobotHarian ?? 20)
  const [bobotUts, setBobotUts] = useState(initialData?.bobotUts ?? 30)
  const [bobotUas, setBobotUas] = useState(initialData?.bobotUas ?? 50)
  const [error, setError] = useState("")

  const total = bobotHarian + bobotUts + bobotUas
  const isValid = validateBobotTotal(bobotHarian, bobotUts, bobotUas)
  const isSemesterValid = semester === 1 || semester === 2
  const isFormValid = Boolean(tahunAjaran.trim()) && isSemesterValid && isValid

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!tahunAjaran.trim()) {
      setError("Tahun ajaran wajib diisi")
      return
    }

    if (!isSemesterValid) {
      setError("Semester hanya boleh 1 atau 2")
      return
    }

    if (!isValid) {
      setError("Total bobot harus sama dengan 100%")
      return
    }

    onSubmit?.({
      tahunAjaran: tahunAjaran.trim(),
      semester,
      bobotHarian,
      bobotUts,
      bobotUas,
    })
  }

  const setDefault = () => {
    setBobotHarian(20)
    setBobotUts(30)
    setBobotUas(50)
    setError("")
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">
          {isEdit ? "Edit Bobot Nilai" : "Tambah Bobot Nilai"}
        </CardTitle>
        <CardDescription>
          Atur persentase bobot untuk tugas, ulangan, dan ujian akhir (total = 100%)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert className="bg-destructive/10 border-destructive/30">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <AlertDescription className="text-destructive ml-2">{error}</AlertDescription>
            </Alert>
          )}

          {/* Total Progress */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-foreground">Total Bobot</p>
              <span className={`text-2xl font-bold ${isValid ? "text-primary" : "text-destructive"}`}>
                {total}%
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${isValid ? "bg-primary" : "bg-destructive"}`}
                style={{ width: `${Math.min(total, 100)}%` }}
              />
            </div>
            {isValid && (
              <p className="text-xs text-primary mt-2 flex items-center gap-1">
                <Check className="w-3 h-3" /> Valid - Total 100%
              </p>
            )}
          </div>

          {/* Input Fields */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tahun_ajaran" className="text-foreground">
                Tahun Ajaran
              </Label>
              <Input
                id="tahun_ajaran"
                type="text"
                placeholder="2025/2026"
                value={tahunAjaran}
                onChange={(e) => {
                  setTahunAjaran(e.target.value)
                  setError("")
                }}
                className="border-border/50"
              />
              <p className="text-xs text-muted-foreground">Format contoh: 2025/2026</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester" className="text-foreground">
                Semester
              </Label>
              <Input
                id="semester"
                type="number"
                min="1"
                max="2"
                value={semester}
                onChange={(e) => {
                  setSemester(Number(e.target.value))
                  setError("")
                }}
                className="border-border/50"
              />
              <p className="text-xs text-muted-foreground">Hanya 1 atau 2</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="bobot_harian" className="text-foreground">
                Bobot Harian (%)
              </Label>
              <Input
                id="bobot_harian"
                type="number"
                min="0"
                max="100"
                value={bobotHarian}
                onChange={(e) => {
                  setBobotHarian(Number(e.target.value))
                  setError("")
                }}
                className="border-border/50"
              />
              <p className="text-xs text-muted-foreground">Bobot penilaian harian</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bobot_uts" className="text-foreground">
                Bobot UTS (%)
              </Label>
              <Input
                id="bobot_uts"
                type="number"
                min="0"
                max="100"
                value={bobotUts}
                onChange={(e) => {
                  setBobotUts(Number(e.target.value))
                  setError("")
                }}
                className="border-border/50"
              />
              <p className="text-xs text-muted-foreground">Bobot ujian tengah semester</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bobot_uas" className="text-foreground">
                Bobot UAS (%)
              </Label>
              <Input
                id="bobot_uas"
                type="number"
                min="0"
                max="100"
                value={bobotUas}
                onChange={(e) => {
                  setBobotUas(Number(e.target.value))
                  setError("")
                }}
                className="border-border/50"
              />
              <p className="text-xs text-muted-foreground">Bobot ujian akhir semester</p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-primary/10 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">{bobotHarian}%</p>
              <p className="text-xs text-muted-foreground">Harian</p>
            </div>
            <div className="p-3 bg-accent/20 rounded-lg text-center">
              <p className="text-2xl font-bold text-accent">{bobotUts}%</p>
              <p className="text-xs text-muted-foreground">UTS</p>
            </div>
            <div className="p-3 bg-chart-4/20 rounded-lg text-center">
              <p className="text-2xl font-bold text-chart-4">{bobotUas}%</p>
              <p className="text-xs text-muted-foreground">UAS</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              className="bg-transparent"
              onClick={setDefault}
            >
              Set Default (20-30-50)
            </Button>
            <div className="flex-1" />
            <Button
              type="button"
              variant="outline"
              className="bg-transparent"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={!isFormValid || isSubmitting}>
              {isEdit ? "Simpan Perubahan" : "Buat Bobot"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
