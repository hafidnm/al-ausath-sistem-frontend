"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { NilaiAkhlakItem } from "@/lib/services/nilai-akhlak.service"

interface NilaiAkhlakTableProps {
  items: NilaiAkhlakItem[]
  isLoading?: boolean
  error?: string
}

export function NilaiAkhlakTable({ items, isLoading = false, error }: NilaiAkhlakTableProps) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Daftar Nilai Akhlak</CardTitle>
        <CardDescription>Hasil nilai akhlak per santri berdasarkan tahun ajaran dan semester</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Nomor Induk</TableHead>
                <TableHead>Nama Santri</TableHead>
                <TableHead>Tahun Ajaran</TableHead>
                <TableHead className="text-center">Semester</TableHead>
                <TableHead className="text-center">Nilai Angka</TableHead>
                <TableHead>Aspek</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Diperbarui</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                    Memuat data nilai akhlak...
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && error && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-destructive py-10">
                    {error}
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && !error && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                    Data nilai akhlak tidak ditemukan
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && !error && items.map((item, index) => {
                const rowKey = Number.isFinite(item.id) && item.id > 0
                  ? `akhlak-${item.id}`
                  : `akhlak-fallback-${item.nomor_induk}-${item.tahun_ajaran}-${item.semester}-${index}`

                return (
                  <TableRow key={rowKey} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{item.nomor_induk || "-"}</TableCell>
                    <TableCell>{item.nama_santri || "-"}</TableCell>
                    <TableCell>{item.tahun_ajaran || "-"}</TableCell>
                    <TableCell className="text-center">{item.semester || "-"}</TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-primary/10 text-primary border-0">{item.nilai_angka}</Badge>
                    </TableCell>
                    <TableCell>{item.aspek || "AKHLAK"}</TableCell>
                    <TableCell className="max-w-64 truncate">{item.deskripsi || "-"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{item.updatedAt || "-"}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
