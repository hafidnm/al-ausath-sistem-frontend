"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { ScoreDistributionResponse } from "@/lib/services/analytics-pengajar.service"
import { BarChart3 } from "lucide-react"

interface ScoreDistributionProps {
  data: ScoreDistributionResponse
  loading: boolean
}

export function ScoreDistributionSection({ data, loading }: ScoreDistributionProps) {

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribusi Nilai Santri</CardTitle>
          <CardDescription>Persentase santri berdasarkan rentang nilai</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const items = data?.data ?? []
  const total = data?.total_santri ?? items.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Distribusi Nilai Santri
        </CardTitle>
        <CardDescription>
          Persentase santri berdasarkan rentang nilai yang diajar
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            Tidak ada data yang ditemukan
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">Total santri dianalisis: {total}</p>
              {data.filters && (
                <div className="text-sm text-muted-foreground">
                  {data.filters.tahun_ajaran ? `Tahun: ${data.filters.tahun_ajaran}` : 'Semua Tahun'} ·
                  {data.filters.semester ? ` Semester: ${data.filters.semester}` : ' Semua Semester'} ·
                  {data.filters.kode_kelas ? ` Kelas: ${data.filters.kode_kelas}` : ' Semua Kelas'} ·
                  {data.filters.kode_mapel ? ` Mapel: ${data.filters.kode_mapel}` : ' Semua Mapel'}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="rounded-xl border border-border p-4 bg-background">
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                    <div>
                      <p className="text-base font-semibold">{item.range}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.min} - {item.max}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Jumlah santri</p>
                      <p className="font-semibold">{item.count}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <Progress value={item.percentage} className="h-5 flex-1 bg-gray-200" />
                    <span className="w-16 text-right text-sm font-semibold">{item.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
