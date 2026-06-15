"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BookMarked } from "lucide-react"
import { AnalyticsQuery } from "@/lib/services/analytics-pengajar.service"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"
import { Input } from "@/components/ui/input"

interface FiltersProps {
  onFilterChange: (query: AnalyticsQuery) => void
  loading?: boolean
}

export function AnalitikPengajarFilters({ onFilterChange, loading }: FiltersProps) {
  const { selectedTahunAjaran } = useTahunAjaran()
  const [semester, setSemester] = useState<string>("")
  const [kodeKelas, setKodeKelas] = useState<string>("")

  const handleFilter = () => {
    const query: AnalyticsQuery = {}
    if (selectedTahunAjaran?.nama_tahun) query.tahun_ajaran = selectedTahunAjaran.nama_tahun
    if (semester) query.semester = parseInt(semester)
    if (kodeKelas) query.kode_kelas = kodeKelas
    onFilterChange(query)
  }

  const handleReset = () => {
    setSemester("")
    setKodeKelas("")
    onFilterChange(selectedTahunAjaran?.nama_tahun ? { tahun_ajaran: selectedTahunAjaran.nama_tahun } : {})
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filter Data</CardTitle>
        <CardDescription>Saring data berdasarkan tahun ajaran, semester, dan kelas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          {/* Tahun Ajaran */}
          <div className="space-y-2">
            <Label htmlFor="tahun-ajaran">Tahun Ajaran</Label>
            <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm">
              <BookMarked className="w-4 h-4 text-primary shrink-0" />
              <span className="flex-1 truncate text-foreground">{selectedTahunAjaran?.nama_tahun || "Belum dipilih"}</span>
              <Badge variant="secondary" className="text-xs shrink-0">Dari Header</Badge>
            </div>
          </div>

          {/* Semester */}
          <div className="space-y-2">
            <Label htmlFor="semester">Semester</Label>
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger id="semester">
                <SelectValue placeholder="Pilih semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Semester 1</SelectItem>
                <SelectItem value="2">Semester 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Kode Kelas */}
          <div className="space-y-2">
            <Label htmlFor="kode-kelas">Kode Kelas</Label>
            <Input
              id="kode-kelas"
              placeholder="Cth: 9-PA"
              value={kodeKelas}
              onChange={(e) => setKodeKelas(e.target.value)}
            />
          </div>

          {/* Buttons */}
          <div className="flex items-end gap-2">
            <Button onClick={handleFilter} disabled={loading} className="flex-1">
              Terapkan
            </Button>
            <Button
              onClick={handleReset}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
