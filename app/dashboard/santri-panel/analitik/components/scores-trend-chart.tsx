"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, AlertCircle } from "lucide-react"
import { ScoreTrendItem } from "@/lib/services/analytics-santri.service"

interface ScoresTrendChartProps {
  data: ScoreTrendItem[]
  loading: boolean
  error: string | null
}

// Warna per mapel (siklus)
const LINE_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6",
  "#8b5cf6", "#14b8a6", "#f97316", "#ec4899", "#84cc16",
]

export function ScoresTrendChart({ data, loading, error }: ScoresTrendChartProps) {
  const [selected, setSelected] = useState<string>("all")

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Tren Nilai Semester
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-500" />
        <AlertDescription className="text-red-700">{error}</AlertDescription>
      </Alert>
    )
  }

  if (data.length === 0) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-700">Belum ada data tren nilai.</AlertDescription>
      </Alert>
    )
  }

  // Tampil semua atau hanya 1 mapel
  const displayed = selected === "all" ? data : data.filter((d) => d.kode_mapel === selected)

  // Gabungkan semua semester menjadi sumbu X
  const allLabels = Array.from(
    new Set(
      data.flatMap((d) => d.trend.map((t) => `Smt ${t.semester} (${t.tahun_ajaran})`))
    )
  )

  // Bentuk chartData: [{label, mapel1: 80, mapel2: 75, ...}]
  const chartData = allLabels.map((label) => {
    const point: Record<string, string | number> = { label }
    displayed.forEach((mapel) => {
      const match = mapel.trend.find(
        (t) => `Smt ${t.semester} (${t.tahun_ajaran})` === label
      )
      point[mapel.nama_mapel] = match ? match.nilai_akhir : 0
    })
    return point
  })

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Tren Nilai Semester
            </CardTitle>
            <CardDescription>Perkembangan nilai akhir dari semester ke semester</CardDescription>
          </div>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Pilih Mapel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Mapel</SelectItem>
              {data.map((d) => (
                <SelectItem key={d.kode_mapel} value={d.kode_mapel}>
                  {d.nama_mapel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {displayed.map((mapel, i) => (
              <Line
                key={mapel.kode_mapel}
                type="monotone"
                dataKey={mapel.nama_mapel}
                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
