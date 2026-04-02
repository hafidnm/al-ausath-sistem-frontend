"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertTriangle,
  XCircle,
} from "lucide-react"
import { pendingSantriPresensi } from "../../utils/constants"

interface RejectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedItem: typeof pendingSantriPresensi[0] | null
  rejectNote: string
  onRejectNoteChange: (value: string) => void
  onSubmit: () => void
}

export function RejectDialog({
  open,
  onOpenChange,
  selectedItem,
  rejectNote,
  onRejectNoteChange,
  onSubmit,
}: RejectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Tolak Presensi
          </DialogTitle>
          <DialogDescription>
            Masukkan alasan penolakan presensi ini
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">Data yang akan ditolak:</p>
            <p className="font-medium text-foreground">{selectedItem?.mapel} - {selectedItem?.kelas}</p>
            <p className="text-sm text-muted-foreground">oleh {selectedItem?.guru}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reject-note">Catatan/Alasan Penolakan</Label>
            <Textarea 
              id="reject-note"
              placeholder="Masukkan alasan penolakan..."
              value={rejectNote}
              onChange={(e) => onRejectNoteChange(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="bg-transparent" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button 
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onSubmit}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Tolak Presensi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
