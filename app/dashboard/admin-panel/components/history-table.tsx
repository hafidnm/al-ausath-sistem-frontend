"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getValidationBadge } from "../utils/helpers"
import { validationHistory } from "../utils/constants"

export function HistoryTable() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Riwayat Validasi</CardTitle>
        <CardDescription>Daftar presensi yang sudah divalidasi</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Tanggal</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Guru</TableHead>
                <TableHead>Mata Pelajaran</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validationHistory.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-foreground">{item.tanggal}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-transparent capitalize">{item.tipe}</Badge>
                  </TableCell>
                  <TableCell className="text-foreground">{item.guru}</TableCell>
                  <TableCell className="text-foreground">{item.mapel}</TableCell>
                  <TableCell className="text-foreground">{item.kelas}</TableCell>
                  <TableCell>{getValidationBadge(item.status)}</TableCell>
                  <TableCell className="text-muted-foreground">{item.admin}</TableCell>
                  <TableCell className="text-muted-foreground">{item.waktu}</TableCell>
                  <TableCell className="text-muted-foreground max-w-32 truncate">
                    {item.catatan || "-"}
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
