"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Edit, MoreHorizontal, Trash2 } from "lucide-react"
import { KonversiItem } from "@/lib/services/konversi.service"

interface KonversiTableProps {
  items: KonversiItem[]
  isLoading?: boolean
  error?: string
  onEdit?: (id: number) => void
  onDelete?: (id: number) => void
}

export function KonversiTable({ items, isLoading = false, error, onEdit, onDelete }: KonversiTableProps) {
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const handleDelete = () => {
    if (deleteId != null) {
      onDelete?.(deleteId)
      setIsDeleteOpen(false)
      setDeleteId(null)
    }
  }

  return (
    <>
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Daftar Konversi Nilai</CardTitle>
          <CardDescription>Range nilai numerik untuk render huruf dan predikat rapor</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Range Nilai</TableHead>
                  <TableHead>Huruf</TableHead>
                  <TableHead>Predikat</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>Diperbarui</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                      Memuat data konversi...
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
                      Data konversi tidak ditemukan
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && !error && items.map((item, index) => {
                  const hasValidId = Number.isFinite(item.id) && item.id > 0
                  const rowKey = hasValidId
                    ? `konversi-${item.id}`
                    : `konversi-fallback-${item.nilai_huruf}-${item.nilai_min}-${item.nilai_max}-${index}`

                  return (
                    <TableRow key={rowKey} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{item.nilai_min} - {item.nilai_max}</TableCell>
                      <TableCell>
                        <Badge className="bg-primary/10 text-primary border-0">{item.nilai_huruf || "-"}</Badge>
                      </TableCell>
                      <TableCell>{item.predikat || "-"}</TableCell>
                      <TableCell>{item.unit_nama || item.kode_unit || "Global"}</TableCell>
                      <TableCell>
                        <Badge variant={item.is_active === false ? "secondary" : "default"}>
                          {item.is_active === false ? "Nonaktif" : "Aktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-44 truncate">{item.keterangan || "-"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{item.updatedAt || "-"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              disabled={!hasValidId}
                              onClick={() => {
                                if (!hasValidId) return
                                onEdit?.(item.id)
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              disabled={!hasValidId}
                              onClick={() => {
                                if (!hasValidId) return
                                setDeleteId(item.id)
                                setIsDeleteOpen(true)
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data konversi?</AlertDialogTitle>
            <AlertDialogDescription>
              Data konversi yang dihapus tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel className="bg-transparent">Batal</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
            Hapus
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
