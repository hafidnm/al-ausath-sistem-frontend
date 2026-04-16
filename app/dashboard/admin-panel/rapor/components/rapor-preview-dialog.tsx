"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface RaporPreviewDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  pdfPreviewUrl: string | null
  namaSantri?: string
}

export function RaporPreviewDialog({
  isOpen,
  onOpenChange,
  pdfPreviewUrl,
  namaSantri,
}: RaporPreviewDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Preview PDF Rapor</DialogTitle>
          <DialogDescription>
            {namaSantri || "Santri belum dipilih"}
          </DialogDescription>
        </DialogHeader>
        <div className="h-[75vh] overflow-hidden rounded-lg border border-border">
          {pdfPreviewUrl ? (
            <iframe title="Preview PDF Rapor" src={pdfPreviewUrl} className="h-full w-full" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Memuat preview PDF...</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
