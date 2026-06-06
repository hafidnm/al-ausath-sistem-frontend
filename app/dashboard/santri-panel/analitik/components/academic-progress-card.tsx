"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { BarChart3, AlertCircle, TrendingUp, TrendingDown, Minus, Target, CheckCircle2, XCircle } from "lucide-react"
import { AcademicProgressItem, AcademicProgressSummary } from "@/lib/services/analytics-santri.service"

interface AcademicProgressCardProps {
  data: AcademicProgressItem[]
  summary: AcademicProgressSummary
  loading: boolean
  error: string | null
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "naik") return <TrendingUp className="w-4 h-4 text-emerald-500" />
  if (trend === "turun") return <TrendingDown className="w-4 h-4 text-red-500" />
  if (trend === "tetap") return <Minus className="w-4 h-4 text-muted-foreground" />
  return null
}

function SummaryRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold ${color ?? "text-foreground"}`}>{value}</span>
    </div>
  )
}

function SummaryPanel({ summary }: { summary: AcademicProgressSummary }) {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Ringkasan Ketuntasan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-primary">{summary.persentase_tuntas.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground mt-1">Tingkat Ketuntasan</div>
        </div>
        <Progress value={summary.persentase_tuntas} className="h-2" />
        <div className="space-y-1.5">
          <SummaryRow label="Total Mapel" value={summary.total_mapel} />
          <SummaryRow label="Tuntas" value={summary.tuntas} color="text-emerald-600" />
          <SummaryRow label="Belum Tuntas" value={summary.belum_tuntas} color="text-red-500" />
        </div>
      </CardContent>
    </Card>
  )
}

export function AcademicProgressCard({ data, summary, loading, error }: AcademicProgressCardProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-64" />
        <div className="lg:col-span-2 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      </div>
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
        <AlertDescription className="text-blue-700">Belum ada data progres akademik.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
      <SummaryPanel summary={summary} />

      <div className="lg:col-span-2">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Detail Progres Per Mapel
            </CardTitle>
            <CardDescription>Perbandingan nilai akhir dengan KKM dan perubahan dari semester lalu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {data.map((item, idx) => {
              const kkmPct = Math.min((item.nilai_akhir / 100) * 100, 100)
              const isNaik = item.perubahan.trend === "naik"
              const isTurun = item.perubahan.trend === "turun"
              return (
                <div
                  key={idx}
                  className="rounded-lg border border-border/50 p-3 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.tuntas ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <span className="font-medium text-sm text-foreground">{item.nama_mapel}</span>
                      <Badge
                        className={
                          item.tuntas
                            ? "bg-emerald-100 text-emerald-700 border-0 text-xs"
                            : "bg-red-100 text-red-700 border-0 text-xs"
                        }
                      >
                        {item.tuntas ? "Tuntas" : "Belum Tuntas"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <TrendIcon trend={item.perubahan.trend} />
                      {item.perubahan.selisih !== null && (
                        <span
                          className={`text-xs font-semibold ${
                            isNaik ? "text-emerald-600" : isTurun ? "text-red-500" : "text-muted-foreground"
                          }`}
                        >
                          {item.perubahan.selisih > 0 ? "+" : ""}
                          {item.perubahan.selisih.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-0.5">
                      <span>Nilai: <strong className="text-foreground">{item.nilai_akhir.toFixed(1)}</strong></span>
                      <span>KKM: <strong className="text-foreground">{item.kkm}</strong></span>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      {/* KKM marker */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
                        style={{ left: `${item.kkm}%` }}
                      />
                      {/* Score bar */}
                      <div
                        className={`h-full rounded-full transition-all ${
                          item.tuntas ? "bg-emerald-500" : "bg-red-400"
                        }`}
                        style={{ width: `${kkmPct}%` }}
                      />
                    </div>
                    {item.perubahan.nilai_sebelumnya !== null && (
                      <p className="text-xs text-muted-foreground">
                        Semester lalu: {item.perubahan.nilai_sebelumnya.toFixed(1)}
                        {item.perubahan.persentase_perubahan !== null && (
                          <span
                            className={`ml-1 ${
                              isNaik ? "text-emerald-600" : isTurun ? "text-red-500" : ""
                            }`}
                          >
                            ({item.perubahan.persentase_perubahan > 0 ? "+" : ""}
                            {item.perubahan.persentase_perubahan.toFixed(1)}%)
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
