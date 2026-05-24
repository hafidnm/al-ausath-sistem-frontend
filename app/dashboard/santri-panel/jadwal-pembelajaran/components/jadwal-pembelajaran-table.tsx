"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AlertCircle, CalendarDays } from "lucide-react"
import type { DataJadwalPembelajaranApiItem } from "@/lib/services/jadwal-pembelajaran.service"

interface JadwalPembelajaranTableProps {
  data: DataJadwalPembelajaranApiItem[]
  loading: boolean
  error: string | null
}

const getMapelName = (item: DataJadwalPembelajaranApiItem) => (
  item.nama_mapel
  || item.mataPelajaran?.nama_mapel
  || item.mata_pelajaran?.nama_mapel
  || item.kelasMapel?.mataPelajaran?.nama_mapel
  || item.kelasMapel?.mata_pelajaran?.nama_mapel
  || item.mapel?.nama_mapel
  || item.kelasMapel?.mataPelajaran?.nama_mapel
  || item.kelasMapel?.mata_pelajaran?.nama_mapel
  || (item.kelasMapel as any)?.mataPelajaran?.nama_mapel
  || (item.kelasMapel as any)?.nama_mapel
  || item.kode_mapel
  || item.kelasMapel?.kode_mapel
  || item.kelas_mapel?.kode_mapel
  || "-"
)

const getKelasName = (item: DataJadwalPembelajaranApiItem) => (
  item.nama_kelas
  || item.kelas?.nama_kelas
  || item.kelasMapel?.kelas?.nama_kelas
  || item.kelas_mapel?.kelas?.nama_kelas
  || (item.kelasMapel as any)?.nama_kelas
  || item.kode_kelas
  || item.kelasMapel?.kode_kelas
  || item.kelas_mapel?.kode_kelas
  || "-"
)

const formatJam = (mulai?: string, selesai?: string) => {
  if (!mulai && !selesai) return "-"
  if (!mulai) return selesai ?? "-"
  if (!selesai) return mulai
  return `${mulai} - ${selesai}`
}

export function JadwalPembelajaranTable({ data, loading, error }: JadwalPembelajaranTableProps) {
  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
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
          Tidak ada jadwal pembelajaran untuk ditampilkan.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="border-border/50">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Hari</TableHead>
                <TableHead>Jam</TableHead>
                <TableHead>Mata Pelajaran</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Ruangan</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id_jadwal ?? item.id ?? `${item.hari}-${item.jam_mulai}-${item.kode_mapel}`}
                  className="hover:bg-muted/30"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-primary" />
                      {item.hari ?? "-"}
                    </div>
                  </TableCell>
                  <TableCell>{formatJam(item.jam_mulai, item.jam_selesai)}</TableCell>
                  <TableCell className="font-medium text-foreground">{getMapelName(item)}</TableCell>
                  <TableCell>{getKelasName(item)}</TableCell>
                  <TableCell>{item.ruangan ?? item.ruang ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={item.status === "AKTIF" ? "border-emerald-500/30 text-emerald-700" : "border-amber-500/30 text-amber-700"}>
                      {item.status ?? "-"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
