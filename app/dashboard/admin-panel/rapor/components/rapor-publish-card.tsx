"use client"

import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { RaporDetail, RaporItem } from "@/lib/services/rapor.service"
import { ReportStatusBadge } from "./report-status-badge"

interface RaporPublishCardProps {
  detail: RaporDetail | null
  selected: RaporItem | null
  isReportReady: boolean
  isPublishedReport: boolean
  isPublishing: boolean
  onPublish: () => void
}

export function RaporPublishCard({
  detail,
  selected,
  isReportReady,
  isPublishedReport,
  isPublishing,
  onPublish,
}: RaporPublishCardProps) {
  const canPublish = isReportReady && !isPublishedReport && !isPublishing

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
          onClick={onPublish}
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

        <p className="text-xs text-muted-foreground">
          {isPublishedReport
            ? "✓ Rapor telah diterbitkan dan dapat diakses santri"
            : "Klik tombol di atas untuk mengubah status rapor menjadi TERBIT"}
        </p>
      </CardContent>
    </Card>
  )
}
