"use client"

import { useState } from "react"
import { Eye, UserSearch, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { RaporItem } from "@/lib/services/rapor.service"
import { ReportStatusBadge } from "./report-status-badge"

interface RaporTableProps {
  items: RaporItem[]
  isLoading: boolean
  error: string
  isSelecting: boolean
  selectedIdentity: string | null
  getIdentity: (item: RaporItem) => string
  onSelect: (item: RaporItem) => void
  onRefresh?: () => Promise<void> | void
}

export function RaporTable({
  items,
  isLoading,
  error,
  isSelecting,
  selectedIdentity,
  getIdentity,
  onSelect,
  onRefresh,
}: RaporTableProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh?.()
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg text-foreground">Daftar Rapor</CardTitle>
          <CardDescription>Hasil pencarian laporan santri berdasarkan filter yang dipilih</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="bg-transparent"
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Santri</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Nilai Rata-rata Rapor</TableHead>
                <TableHead className="text-center">Ranking</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Memuat data rapor...
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && !error && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Data rapor tidak ditemukan
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && !error && items.map((item, index) => {
                const rowIdentity = getIdentity(item)
                const isSelected = selectedIdentity === rowIdentity
                const rowKey = `${rowIdentity}-${index}`

                return (
                  <TableRow key={rowKey} className={isSelected ? "bg-primary/5" : undefined}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{item.nama_santri || "-"}</p>
                        <p className="text-xs text-muted-foreground">{item.nomor_induk}</p>
                      </div>
                    </TableCell>
                    <TableCell>{item.kode_kelas || "-"}</TableCell>
                    <TableCell>{item.semester} / {item.tahun_ajaran}</TableCell>
                    <TableCell><ReportStatusBadge status={item.status} /></TableCell>
                    <TableCell className="text-center font-semibold text-primary">
                      {item.nilai_rata != null ? item.nilai_rata.toFixed(2) : "-"}
                    </TableCell>
                    <TableCell className="text-center">{item.ranking ? `#${item.ranking}` : "-"}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="bg-transparent" onClick={() => onSelect(item)} disabled={isSelecting}>
                          <UserSearch className="mr-2 h-4 w-4" />
                          Pilih
                        </Button>
                        <Button variant="outline" size="sm" className="bg-transparent" onClick={() => onSelect(item)} disabled={isSelecting}>
                          <Eye className="mr-2 h-4 w-4" />
                          Detail
                        </Button>
                      </div>
                    </TableCell>
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
