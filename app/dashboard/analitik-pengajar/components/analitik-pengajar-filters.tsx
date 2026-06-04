"use client"

import { useState, useEffect } from "react"
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
import { AnalyticsQuery } from "@/lib/services/analytics-pengajar.service"
import { useMasterData } from "@/hooks/use-master-data"

interface FiltersProps {
  onFilterChange: (query: AnalyticsQuery) => void
  loading?: boolean
}

export function AnalitikPengajarFilters({ onFilterChange, loading }: FiltersProps) {
  const { tahunAjaran: tahunAjaranList } = useMasterData()
  const [tahunAjaran, setTahunAjaran] = useState<string>("")
  const [semester, setSemester] = useState<string>("")
  const [kodeKelas, setKodeKelas] = useState<string>("")

  const handleFilter = () => {
    const query: AnalyticsQuery = {}
    if (tahunAjaran) query.tahun_ajaran = tahunAjaran
    if (semester) query.semester = parseInt(semester)
    if (kodeKelas) query.kode_kelas = kodeKelas
    onFilterChange(query)
  }

  const handleReset = () => {
    setTahunAjaran("")
    setSemester("")
    setKodeKelas("")
    onFilterChange({})
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
            <Select value={tahunAjaran} onValueChange={setTahunAjaran}>
              <SelectTrigger id="tahun-ajaran">
                <SelectValue placeholder="Pilih tahun ajaran" />
              </SelectTrigger>
              <SelectContent>
                {tahunAjaranList?.map((ta) => (
                  <SelectItem key={ta.value} value={String(ta.value)}>
                    {ta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
