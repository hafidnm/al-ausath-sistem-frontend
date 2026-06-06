"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BookOpen, AlertCircle } from "lucide-react"
import { SubjectScore } from "@/lib/services/analytics-santri.service"

interface SubjectScoresTableProps {
  data: SubjectScore[]
  loading: boolean
  error: string | null
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  if (s.includes("tuntas") && !s.includes("belum"))
    return <Badge className="bg-emerald-100 text-emerald-700 border-0 font-medium">Tuntas</Badge>
  return <Badge className="bg-red-100 text-red-700 border-0 font-medium">Belum Tuntas</Badge>
}

function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const num = Number(value) || 0
  const pct = Math.min((num / max) * 100, 100)
  const color = num >= 75 ? "bg-emerald-500" : num >= 60 ? "bg-amber-400" : "bg-red-400"
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold tabular-nums w-10 text-right">{num.toFixed(1)}</span>
    </div>
  )
}

export function SubjectScoresTable({ data, loading, error }: SubjectScoresTableProps) {
  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Nilai Per Mata Pelajaran
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
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
        <AlertDescription className="text-blue-700">Belum ada data nilai untuk semester ini.</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Nilai Per Mata Pelajaran
        </CardTitle>
        <CardDescription>{data.length} mata pelajaran</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="pl-6">Mata Pelajaran</TableHead>
                <TableHead className="text-right">Harian</TableHead>
                <TableHead className="text-right">UTS</TableHead>
                <TableHead className="text-right">UAS</TableHead>
                <TableHead>Nilai Akhir</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, idx) => (
                <TableRow key={idx} className="hover:bg-muted/30">
                  <TableCell className="pl-6 font-medium text-foreground">{item.nama_mapel}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{Number(item.nilai_harian).toFixed(1)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{Number(item.nilai_uts).toFixed(1)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{Number(item.nilai_uas).toFixed(1)}</TableCell>
                  <TableCell><ScoreBar value={Number(item.nilai_rapor_tampil)} /></TableCell>
                  <TableCell><StatusBadge status={item.status_ketuntasan} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
