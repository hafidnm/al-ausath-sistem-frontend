"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Edit, MoreHorizontal, Play, Trash2 } from "lucide-react"
import { BobotNilaiItem } from "@/lib/services/bobot-nilai.service"

interface BobotTableProps {
  items: BobotNilaiItem[]
  isLoading?: boolean
  error?: string | null
  onEdit?: (id: number) => void
  onDelete?: (id: number) => void
  onSetDefault?: (item: BobotNilaiItem) => void
}

export function BobotTable({ items, isLoading = false, error, onEdit, onDelete, onSetDefault }: BobotTableProps) {
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const handleDeleteConfirm = () => {
    if (deleteId) {
      onDelete?.(deleteId)
      setIsDeleteOpen(false)
      setDeleteId(null)
    }
  }

  return (
    <>
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg text-foreground">Daftar Bobot Nilai</CardTitle>
              <CardDescription>Kelola bobot penilaian per tahun ajaran dan semester</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>ID</TableHead>
                  <TableHead>Tahun Ajaran</TableHead>
                  <TableHead className="text-center">Semester</TableHead>
                  <TableHead className="text-center">Harian (%)</TableHead>
                  <TableHead className="text-center">UTS (%)</TableHead>
                  <TableHead className="text-center">UAS (%)</TableHead>
                  <TableHead className="text-center">Total (%)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Diperbarui</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-10">
                      Memuat data bobot...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && error && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-destructive py-10">
                      {error}
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && !error && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-10">
                      Data bobot belum tersedia
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && !error && items.map((item, index) => {
                  const hasValidId = Number.isFinite(item.id) && item.id > 0
                  const rowKey = hasValidId
                    ? `bobot-${item.id}`
                    : `bobot-fallback-${item.tahun_ajaran}-${item.semester}-${index}`
                  const total = item.bobot_harian + item.bobot_uts + item.bobot_uas

                  return (
                    <TableRow key={rowKey} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-foreground">{hasValidId ? item.id : "-"}</TableCell>
                      <TableCell>{item.tahun_ajaran || "-"}</TableCell>
                      <TableCell className="text-center">{item.semester || "-"}</TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-primary">{item.bobot_harian}%</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-accent">{item.bobot_uts}%</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-chart-4">{item.bobot_uas}%</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${total === 100 ? "text-foreground" : "text-destructive"}`}>{total}%</span>
                      </TableCell>
                      <TableCell>
                        {item.is_default ? (
                          <Badge className="bg-primary/10 text-primary border-0">Default</Badge>
                        ) : (
                          <Badge className="bg-muted text-muted-foreground border-0">Tersimpan</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{item.updated_at || item.created_at || "-"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              disabled={!hasValidId}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => hasValidId && onEdit?.(item.id)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => hasValidId && onSetDefault?.(item)}>
                              <Play className="w-4 h-4 mr-2" />
                              Set Default
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Hapus Bobot Nilai?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data bobot nilai ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel className="bg-transparent">Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Hapus
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
