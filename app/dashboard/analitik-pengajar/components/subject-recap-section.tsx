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
import { SubjectRecap } from "@/lib/services/analytics-pengajar.service"
import { BookOpen } from "lucide-react"

interface SubjectRecapProps {
  data: SubjectRecap[]
  loading: boolean
}

export function SubjectRecapSection({ data, loading }: SubjectRecapProps) {
  const formatScore = (score: number | undefined) => {
    return score !== undefined && score !== null ? score.toFixed(2) : "-"
  }

  const getStatusColor = (score: number | undefined) => {
    if (!score) return "bg-gray-100 text-gray-800"
    if (score >= 80) return "bg-green-100 text-green-800"
    if (score >= 70) return "bg-blue-100 text-blue-800"
    if (score >= 60) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rekap Nilai Per Mapel</CardTitle>
          <CardDescription>Breakdown nilai harian, UTS, dan UAS</CardDescription>
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
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Rekap Nilai Per Mapel
        </CardTitle>
        <CardDescription>
          Breakdown Nilai Harian, UTS, dan UAS
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
                  <TableHead>Mata Pelajaran</TableHead>
                  <TableHead className="text-right">Rata-rata Harian</TableHead>
                  <TableHead className="text-right">Rata-rata UTS</TableHead>
                  <TableHead className="text-right">Rata-rata UAS</TableHead>
                  <TableHead className="text-right">Rata-rata Akhir</TableHead>
                  <TableHead className="text-center">Jumlah Santri</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, idx) => {
                  const statusColor = getStatusColor(item.rata_akhir)

                  return (
                    <TableRow key={idx}>
                      <TableCell>
                        <div className="font-medium">{item.nama_mapel}</div>
                        <div className="text-xs text-muted-foreground">{item.kode_mapel}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{formatScore(item.rata_harian)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{formatScore(item.rata_uts)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{formatScore(item.rata_uas)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={statusColor}>{formatScore(item.rata_akhir)}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{item.jumlah_santri}</Badge>
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
