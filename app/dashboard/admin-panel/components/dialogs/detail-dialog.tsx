"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CheckCircle,
  XCircle,
} from "lucide-react"
import { getStatusBadge } from "../../utils/helpers"
import { pendingSantriPresensi, sampleStudentList } from "../../utils/constants"

interface DetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedItem: typeof pendingSantriPresensi[0] | null
}

export function DetailDialog({ open, onOpenChange, selectedItem }: DetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">Detail Presensi</DialogTitle>
          <DialogDescription>
            {selectedItem?.mapel} - {selectedItem?.kelas} ({selectedItem?.tanggal})
          </DialogDescription>
        </DialogHeader>
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Guru Pengampu</p>
                <p className="font-medium text-foreground">{selectedItem.guru}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Waktu Input</p>
                <p className="font-medium text-foreground">{selectedItem.waktuInput}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mata Pelajaran</p>
                <p className="font-medium text-foreground">{selectedItem.mapel}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kelas</p>
                <p className="font-medium text-foreground">{selectedItem.kelas} ({selectedItem.jenjang})</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <p className="text-2xl font-bold text-primary">{selectedItem.hadir}</p>
                <p className="text-sm text-muted-foreground">Hadir</p>
              </div>
              <div className="text-center p-4 bg-chart-3/20 rounded-lg">
                <p className="text-2xl font-bold text-chart-4">{selectedItem.sakit}</p>
                <p className="text-sm text-muted-foreground">Sakit</p>
              </div>
              <div className="text-center p-4 bg-accent/20 rounded-lg">
                <p className="text-2xl font-bold text-accent">{selectedItem.izin}</p>
                <p className="text-sm text-muted-foreground">Izin</p>
              </div>
              <div className="text-center p-4 bg-destructive/10 rounded-lg">
                <p className="text-2xl font-bold text-destructive">{selectedItem.alpha}</p>
                <p className="text-sm text-muted-foreground">Alpha</p>
              </div>
            </div>

            {/* Sample student list */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Nama Santri</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleStudentList.map((s) => (
                    <TableRow key={s.no}>
                      <TableCell className="text-muted-foreground">{s.no}</TableCell>
                      <TableCell className="font-medium text-foreground">{s.name}</TableCell>
                      <TableCell className="text-center">{getStatusBadge(s.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" className="bg-transparent" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          <Button variant="outline" className="bg-transparent text-destructive border-destructive hover:bg-destructive/10">
            <XCircle className="w-4 h-4 mr-2" />
            Tolak
          </Button>
          <Button className="bg-primary text-primary-foreground">
            <CheckCircle className="w-4 h-4 mr-2" />
            Setujui
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
