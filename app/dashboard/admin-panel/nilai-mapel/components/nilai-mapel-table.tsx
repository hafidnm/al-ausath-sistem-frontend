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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Eye, Trash2, Pencil } from "lucide-react"
import { NilaiMapelItem } from "@/lib/services/nilai-mapel.service"

interface NilaiMapelTableProps {
  items: NilaiMapelItem[]
  isLoading?: boolean
  error?: string
  onDetail?: (item: NilaiMapelItem) => void
  onEdit?: (item: NilaiMapelItem) => void
  onDelete?: (id: number) => void
}

export function NilaiMapelTable({ items, isLoading = false, error, onDetail, onEdit, onDelete }: NilaiMapelTableProps) {
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const handleDelete = () => {
    if (deleteId != null) {
      onDelete?.(deleteId)
      setDeleteId(null)
      setIsDeleteOpen(false)
    }
  }

  return (
    <>
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Daftar Nilai Mapel</CardTitle>
          <CardDescription>List nilai mapel per santri</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nomor Induk</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kode Mapel</TableHead>
                  <TableHead>Mapel</TableHead>
                  <TableHead>Kode Kelas</TableHead>
                  <TableHead className="text-center">Semester</TableHead>
                  <TableHead className="text-center">Ujian Akhir</TableHead>
                  <TableHead className="text-center">Nilai Rapor</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                      Memuat data nilai mapel...
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && error && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-destructive py-10">
                      {error}
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && !error && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                      Data nilai mapel tidak ditemukan
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && !error && items.map((item, index) => {
                  const hasValidKodeMapel = Boolean(item.kode_mapel)
                  const hasValidId = Number.isFinite(item.id) && item.id > 0
                  const rowKey = item.id > 0 ? `nilai-mapel-${item.id}` : `nilai-mapel-${item.nomor_induk}-${item.kode_mapel}-${index}`

                  return (
                    <TableRow key={rowKey} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{item.nomor_induk || "-"}</TableCell>
                      <TableCell>{item.nama_santri || "-"}</TableCell>
                      <TableCell>{item.kode_mapel || "-"}</TableCell>
                      <TableCell>{item.mapel || "-"}</TableCell>
                      <TableCell>{item.kode_kelas || "-"}</TableCell>
                      <TableCell className="text-center">{item.semester || "-"}</TableCell>
                      <TableCell className="text-center">{item.ujian_akhir || "-"}</TableCell>
                      <TableCell className="text-center">
                        {item.nilai_rapor_tampil != null ? (
                          <Badge className={item.flag_warna_rapor ? "bg-destructive/10 text-destructive border-0" : "bg-primary/10 text-primary border-0"}>
                            {item.nilai_rapor_tampil}
                          </Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-transparent"
                            disabled={!hasValidKodeMapel}
                            onClick={() => onDetail?.(item)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Detail
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-transparent"
                            disabled={!hasValidId}
                            onClick={() => onEdit?.(item)}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-transparent text-destructive border-destructive/30 hover:text-destructive"
                            disabled={!hasValidId}
                            onClick={() => {
                              if (!hasValidId) return
                              setDeleteId(item.id)
                              setIsDeleteOpen(true)
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Hapus
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

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus nilai mapel?</AlertDialogTitle>
            <AlertDialogDescription>
              Data nilai mapel yang dihapus tidak dapat dikembalikan.
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
