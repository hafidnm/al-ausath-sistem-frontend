"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ClassStatistics } from "@/lib/services/analytics-pengajar.service"
import { TrendingUp, TrendingDown } from "lucide-react"

interface ClassStatisticsProps {
  data: ClassStatistics[]
  loading: boolean
}

export function ClassStatisticsSection({ data, loading }: ClassStatisticsProps) {
  const formatScore = (score: number | undefined) => {
    return score ? score.toFixed(2) : "-"
  }

  const getValueStatusColor = (value: number | undefined) => {
    if (!value) return "bg-gray-100 text-gray-800"
    if (value >= 80) return "bg-green-100 text-green-800"
    if (value >= 70) return "bg-blue-100 text-blue-800"
    if (value >= 60) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const getScoreTrend = (avg: number | undefined, min: number | undefined, max: number | undefined) => {
    if (!avg || !min || !max) return "neutral"
    const range = max - min
    const position = avg - min
    const percentage = (position / range) * 100
    if (percentage >= 70) return "trending-up"
    if (percentage <= 30) return "trending-down"
    return "neutral"
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistik Nilai Kelas</CardTitle>
          <CardDescription>Rata-rata nilai per kelas dan mata pelajaran</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistik Nilai Kelas</CardTitle>
        <CardDescription>
          Rata-rata nilai per kelas dan mata pelajaran yang Anda ajar
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            Tidak ada data yang ditemukan
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Mata Pelajaran</TableHead>
                  <TableHead className="text-right">Rata-rata</TableHead>
                  <TableHead className="text-right">Tertinggi</TableHead>
                  <TableHead className="text-right">Terendah</TableHead>
                  <TableHead className="text-center">Jumlah Santri</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, idx) => {
                  const trend = getScoreTrend(item.rata_rata, item.terendah, item.tertinggi)
                  const statusColor = getValueStatusColor(item.rata_rata)

                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">{item.kode_kelas}</Badge>
                        <div className="text-xs text-muted-foreground mt-1">{item.nama_kelas}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{item.nama_mapel}</div>
                        <div className="text-xs text-muted-foreground">{item.kode_mapel}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={statusColor}>
                          {formatScore(item.rata_rata)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          <span className="font-medium">{item.tertinggi}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <TrendingDown className="h-3 w-3 text-red-600" />
                          <span className="font-medium">{item.terendah}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{item.jumlah_santri}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {trend === "trending-up" && (
                          <Badge className="bg-green-100 text-green-800">Baik</Badge>
                        )}
                        {trend === "neutral" && (
                          <Badge className="bg-blue-100 text-blue-800">Normal</Badge>
                        )}
                        {trend === "trending-down" && (
                          <Badge className="bg-red-100 text-red-800">Perlu Perhatian</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
