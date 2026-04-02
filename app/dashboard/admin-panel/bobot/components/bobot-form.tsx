"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Check } from "lucide-react"
import { validateBobotTotal } from "../utils/helpers"

interface BobotFormProps {
  isEdit?: boolean
  initialData?: {
    tugas: number
    ulangan: number
    ujianAkhir: number
  }
  onSubmit?: (data: { tugas: number; ulangan: number; ujianAkhir: number }) => void
  onCancel?: () => void
}

export function BobotForm({ isEdit = false, initialData, onSubmit, onCancel }: BobotFormProps) {
  const [tugas, setTugas] = useState(initialData?.tugas ?? 20)
  const [ulangan, setUlangan] = useState(initialData?.ulangan ?? 30)
  const [ujianAkhir, setUjianAkhir] = useState(initialData?.ujianAkhir ?? 50)
  const [error, setError] = useState("")

  const total = tugas + ulangan + ujianAkhir
  const isValid = validateBobotTotal(tugas, ulangan, ujianAkhir)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isValid) {
      setError("Total bobot harus sama dengan 100%")
      return
    }

    onSubmit?.({ tugas, ulangan, ujianAkhir })
  }

  const setDefault = () => {
    setTugas(20)
    setUlangan(30)
    setUjianAkhir(50)
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
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tugas" className="text-foreground">
                Tugas (%)
              </Label>
              <Input
                id="tugas"
                type="number"
                min="0"
                max="100"
                value={tugas}
                onChange={(e) => {
                  setTugas(Number(e.target.value))
                  setError("")
                }}
                className="border-border/50"
              />
              <p className="text-xs text-muted-foreground">Bobot tugas/PR</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ulangan" className="text-foreground">
                Ulangan (%)
              </Label>
              <Input
                id="ulangan"
                type="number"
                min="0"
                max="100"
                value={ulangan}
                onChange={(e) => {
                  setUlangan(Number(e.target.value))
                  setError("")
                }}
                className="border-border/50"
              />
              <p className="text-xs text-muted-foreground">Bobot ulangan</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ujianAkhir" className="text-foreground">
                Ujian Akhir (%)
              </Label>
              <Input
                id="ujianAkhir"
                type="number"
                min="0"
                max="100"
                value={ujianAkhir}
                onChange={(e) => {
                  setUjianAkhir(Number(e.target.value))
                  setError("")
                }}
                className="border-border/50"
              />
              <p className="text-xs text-muted-foreground">Bobot ujian akhir</p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-primary/10 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">{tugas}%</p>
              <p className="text-xs text-muted-foreground">Tugas</p>
            </div>
            <div className="p-3 bg-accent/20 rounded-lg text-center">
              <p className="text-2xl font-bold text-accent">{ulangan}%</p>
              <p className="text-xs text-muted-foreground">Ulangan</p>
            </div>
            <div className="p-3 bg-chart-4/20 rounded-lg text-center">
              <p className="text-2xl font-bold text-chart-4">{ujianAkhir}%</p>
              <p className="text-xs text-muted-foreground">Ujian Akhir</p>
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
            >
              Batal
            </Button>
            <Button type="submit" disabled={!isValid}>
              {isEdit ? "Simpan Perubahan" : "Buat Bobot"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
