"use client"

import { useState } from "react"
import { AlertCircle, CheckCircle2, Loader2, RotateCcw, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { RaporDetail, RaporItem } from "@/lib/services/rapor.service"
import { ReportStatusBadge } from "./report-status-badge"

interface RaporPublishCardProps {
  detail: RaporDetail | null
  selected: RaporItem | null
  isReportReady: boolean
  isPublishedReport: boolean
  isPublishing: boolean
  isWithdrawing: boolean
  onPublish: () => void
  onWithdraw: () => void
}

export function RaporPublishCard({
  detail,
  selected,
  isReportReady,
  isPublishedReport,
  isPublishing,
  isWithdrawing,
  onPublish,
  onWithdraw,
}: RaporPublishCardProps) {
  const [pendingAction, setPendingAction] = useState<"publish" | "withdraw" | null>(null)

  const canPublish = isReportReady && !isPublishedReport && !isPublishing && !isWithdrawing
  const canWithdraw = isReportReady && isPublishedReport && !isPublishing && !isWithdrawing
  const actionLabel = pendingAction === "publish" ? "Terbitkan Rapor" : "Tarik Rapor"

  const handleConfirmAction = () => {
    if (pendingAction === "publish") {
      onPublish()
    }

    if (pendingAction === "withdraw") {
      onWithdraw()
    }

    setPendingAction(null)
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Terbitkan Rapor</CardTitle>
        <CardDescription>Ubah status rapor dari DRAFT menjadi TERBIT</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Info */}
        <div className="rounded-lg bg-muted/30 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Santri</p>
              <p className="mt-1 font-medium text-foreground">
                {detail?.nama_santri || selected?.nama_santri || "Belum dipilih"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Status Rapor</p>
              <div className="mt-1">
                <ReportStatusBadge status={detail?.status || selected?.status} />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Tahun Ajaran</p>
              <p className="mt-1 font-medium text-foreground">{selected?.tahun_ajaran || "-"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Kelas</p>
              <p className="mt-1 font-medium text-foreground">{selected?.kode_kelas || "-"}</p>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {!isReportReady && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Generate rapor terlebih dahulu sebelum dapat menerbitkan</AlertDescription>
          </Alert>
        )}

        {isPublishedReport && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>Rapor sudah diterbitkan. Status tidak dapat diubah kembali ke DRAFT</AlertDescription>
          </Alert>
        )}

        {isReportReady && !isPublishedReport && (
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              Pastikan semua data dan catatan wali sudah benar sebelum menerbitkan rapor
            </AlertDescription>
          </Alert>
        )}

        {/* Publish Button */}
        <Button
          onClick={() => setPendingAction("publish")}
          disabled={!canPublish}
          className="w-full"
          size="lg"
        >
          {isPublishing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sedang Menerbitkan...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Terbitkan Rapor
            </>
          )}
        </Button>

        {/* Withdraw Button */}
        <Button
          onClick={() => setPendingAction("withdraw")}
          disabled={!canWithdraw}
          variant="destructive"
          className="w-full"
          size="lg"
        >
          {isWithdrawing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sedang Menarik...
            </>
          ) : (
            <>
              <RotateCcw className="mr-2 h-4 w-4" />
              Tarik Rapor
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          {isPublishedReport
            ? "✓ Rapor telah diterbitkan. Klik 'Tarik Rapor' untuk mengembalikan ke DRAFT"
            : "Klik tombol di atas untuk mengubah status rapor menjadi TERBIT"}
        </p>

        <AlertDialog open={pendingAction !== null} onOpenChange={(open) => !open && setPendingAction(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {pendingAction === "publish"
                  ? "Konfirmasi Terbitkan Rapor"
                  : "Konfirmasi Tarik Rapor"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {pendingAction === "publish"
                  ? "Pastikan semua nilai dan catatan wali sudah benar. Setelah diterbitkan, status rapor akan berubah menjadi TERBIT."
                  : "Rapor akan dikembalikan ke status DRAFT. Gunakan ini hanya jika perlu memperbaiki data sebelum diterbitkan kembali."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmAction}>{actionLabel}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
