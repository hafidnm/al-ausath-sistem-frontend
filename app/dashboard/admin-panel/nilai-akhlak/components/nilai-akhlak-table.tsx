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
import { MoreHorizontal, Trash2, Edit, Save, Loader2 } from "lucide-react"
import { NilaiAkhlakItem, nilaiAkhlakService } from "@/lib/services/nilai-akhlak.service"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface NilaiAkhlakTableProps {
  items: NilaiAkhlakItem[]
  isLoading?: boolean
  error?: string
  onDelete?: (id: number) => void
  onUpdate?: () => void
}

export function NilaiAkhlakTable({ items, isLoading = false, error, onDelete, onUpdate }: NilaiAkhlakTableProps) {
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editing, setEditing] = useState<NilaiAkhlakItem | null>(null)
  const [nilaiInput, setNilaiInput] = useState<string>("")
  const [deskripsiInput, setDeskripsiInput] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)

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
                  <TableHead>Tahun</TableHead>
                  <TableHead className="text-center">Semester</TableHead>
                  <TableHead className="text-center">Nilai Angka</TableHead>
                  <TableHead>Aspek</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Diperbarui</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                      Memuat data nilai akhlak...
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
                      Data nilai akhlak tidak ditemukan
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && !error && items.map((item, index) => {
                  const hasValidId = Number.isFinite(item.id) && item.id > 0
                  const tahunDisplay = item.tahun_ajaran?.trim() || "-"
                  const rowKey = hasValidId
                    ? `akhlak-${item.id}`
                    : `akhlak-fallback-${item.nomor_induk}-${item.tahun_ajaran}-${item.semester}-${index}`

                  return (
                    <TableRow key={rowKey} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{item.nomor_induk || "-"}</TableCell>
                      <TableCell>{item.nama_santri || "-"}</TableCell>
                      <TableCell>{tahunDisplay}</TableCell>
                      <TableCell className="text-center">{item.semester || "-"}</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-primary/10 text-primary border-0">{item.nilai_angka}</Badge>
                      </TableCell>
                      <TableCell>{item.aspek || "AKHLAK"}</TableCell>
                      <TableCell className="max-w-64 truncate">{item.deskripsi || "-"}</TableCell>
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
                              onClick={() => {
                                if (!hasValidId) return
                                setEditing(item)
                                setNilaiInput(String(item.nilai_angka ?? ""))
                                setDeskripsiInput(String(item.deskripsi ?? ""))
                                setIsEditOpen(true)
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
            <AlertDialogTitle>Hapus nilai akhlak?</AlertDialogTitle>
            <AlertDialogDescription>
              Data nilai akhlak yang dihapus tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel className="bg-transparent">Batal</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
            Hapus
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEditOpen} onOpenChange={(open) => setIsEditOpen(open)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Nilai Akhlak</DialogTitle>
            <DialogDescription>Perbarui nilai dan deskripsi untuk santri ini.</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-2">
              <div>
                <Label>Santri</Label>
                <div className="text-sm font-medium">{editing.nama_santri} — {editing.nomor_induk}</div>
              </div>
              <div>
                <Label>Nilai (0-100)</Label>
                <Input type="number" min={0} max={100} value={nilaiInput} onChange={(e) => setNilaiInput(e.target.value)} />
              </div>
              <div>
                <Label>Deskripsi</Label>
                <Input value={deskripsiInput} onChange={(e) => setDeskripsiInput(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
            <Button onClick={async () => {
              if (!editing) return
              setIsSaving(true)
              try {
                await nilaiAkhlakService.upsert({
                  nomor_induk: editing.nomor_induk,
                  tahun_ajaran: editing.tahun_ajaran,
                  semester: editing.semester,
                  nilai_angka: Number(nilaiInput || 0),
                  deskripsi: deskripsiInput || undefined,
                  aspek: editing.aspek,
                })
                setIsEditOpen(false)
                setEditing(null)
                setNilaiInput("")
                setDeskripsiInput("")
                // refresh parent list if provided
                if (typeof onUpdate === 'function') {
                  onUpdate()
                } else {
                  window.location.reload()
                }
              } catch (err) {
                // silent
              } finally {
                setIsSaving(false)
              }
            }} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  )
}
