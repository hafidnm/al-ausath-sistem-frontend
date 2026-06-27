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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, AlertCircle } from "lucide-react"
import { NilaiMapelItem } from "@/lib/services/nilai-mapel.service"
import { useNilaiMapelSantri } from "@/hooks/use-nilai-mapel-santri"

interface NilaiMapelListProps {
  tahunAjaran?: string
  semester?: number
}

const getStatusBadge = (status?: string) => {
  if (!status) return null

  const lowerStatus = status.toLowerCase()

  if (lowerStatus.includes("tuntas")) {
    return <Badge className="bg-primary/10 text-primary border-0">Tuntas</Badge>
  }

  if (lowerStatus.includes("belum") || lowerStatus.includes("tidak")) {
    return <Badge className="bg-destructive/10 text-destructive border-0">Belum Tuntas</Badge>
  }

  return <Badge variant="outline">{status}</Badge>
}

const getValueDisplay = (value?: number | string) => {
  if (value == null) return "-"
  if (typeof value === "number") return value.toFixed(2)
  return value
}

export function NilaiMapelList({ tahunAjaran, semester }: NilaiMapelListProps) {
  const { data, loading: isLoading, error } = useNilaiMapelSantri({ tahunAjaran, semester })

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Nilai Per Mata Pelajaran
          </CardTitle>
          <CardDescription>Daftar nilai untuk setiap mata pelajaran</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert className="border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">{error}</AlertDescription>
      </Alert>
    )
  }

  if (data.length === 0) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Tidak ada data nilai mapel untuk ditampilkan.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg text-foreground flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Nilai Per Mata Pelajaran
        </CardTitle>
        <CardDescription>Daftar nilai untuk setiap mata pelajaran ({data.length} mapel)</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Mata Pelajaran</TableHead>
                <TableHead className="text-center w-28">Nilai Akhir</TableHead>
                <TableHead className="text-center w-28">Nilai Rapor</TableHead>
                <TableHead className="text-center w-36">Status Ketuntasan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, idx) => (
                <TableRow key={idx} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-foreground">{item.mapel || item.kode_mapel}</TableCell>
                  <TableCell className="text-center font-medium">{getValueDisplay(item.nilai_akhir_mapel)}</TableCell>
                  <TableCell className="text-center font-medium text-primary">{getValueDisplay(item.nilai_rapor_tampil)}</TableCell>
                  <TableCell className="text-center">{getStatusBadge(item.status_ketuntasan)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
