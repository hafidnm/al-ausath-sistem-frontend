"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  Edit,
  Trash2,
  MoreHorizontal,
} from "lucide-react"
import { useState } from "react"
import { sampleBobotData } from "../utils/constants"

interface BobotTableProps {
  onEdit?: (id: number) => void
  onDelete?: (id: number) => void
  onSetDefault?: () => void
}

export function BobotTable({ onEdit, onDelete, onSetDefault }: BobotTableProps) {
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
              <CardDescription>Kelola bobot penilaian untuk tugas, ulangan, dan ujian akhir</CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="bg-transparent"
              onClick={onSetDefault}
            >
              Set Default (20-30-50)
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>ID</TableHead>
                  <TableHead className="text-center">Tugas (%)</TableHead>
                  <TableHead className="text-center">Ulangan (%)</TableHead>
                  <TableHead className="text-center">Ujian Akhir (%)</TableHead>
                  <TableHead className="text-center">Total (%)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleBobotData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-foreground">{item.id}</TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-primary">{item.tugas}%</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-accent">{item.ulangan}%</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-chart-4">{item.ujianAkhir}%</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-bold text-foreground">100%</span>
                    </TableCell>
                    <TableCell>
                      {item.aktif ? (
                        <Badge className="bg-primary/10 text-primary border-0">Aktif</Badge>
                      ) : (
                        <Badge className="bg-muted text-muted-foreground border-0">Nonaktif</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{item.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit?.(item.id)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
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
                ))}
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
