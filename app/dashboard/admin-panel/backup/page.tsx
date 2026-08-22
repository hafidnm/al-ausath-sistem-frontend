"use client"

import { useState, useCallback } from "react"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Database,
  Download,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Trash2,
  HardDrive,
  FileArchive,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { backupService, type BackupFile } from "@/lib/services/backup.service"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export default function BackupPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null)

  // ─── Fetch daftar backup ────────────────────────────────────────────────────
  const {
    data: backupData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["backups"],
    queryFn: () => backupService.list(),
    staleTime: 30_000,
    retry: 1,
  })

  const backups = backupData?.data ?? []

  // Ambil pesan error dari axios response
  const errorMessage = isError
    ? (error as any)?.response?.status === 401
      ? "Sesi telah berakhir. Silakan login kembali."
      : (error as any)?.response?.status === 403
      ? "Anda tidak memiliki akses ke fitur ini."
      : (error as any)?.message ?? "Gagal memuat data backup."
    : null

  // ─── Buat backup baru ───────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () => backupService.create(true),
    onSuccess: (data) => {
      toast({
        title: "✅ Backup berhasil dibuat",
        description: `${data.data.filename} (${data.data.size_label})`,
      })
      queryClient.invalidateQueries({ queryKey: ["backups"] })
    },
    onError: (err: any) => {
      toast({
        title: "Backup gagal",
        description:
          err?.response?.data?.message ?? err?.message ?? "Terjadi kesalahan saat backup.",
        variant: "destructive",
      })
    },
  })

  // ─── Download backup ────────────────────────────────────────────────────────
  const handleDownload = useCallback(
    async (filename: string) => {
      setDownloadingFile(filename)
      try {
        await backupService.download(filename)
        toast({
          title: "Download dimulai",
          description: filename,
        })
      } catch (err: any) {
        toast({
          title: "Download gagal",
          description: err?.response?.data?.message ?? err?.message ?? "Terjadi kesalahan.",
          variant: "destructive",
        })
      } finally {
        setDownloadingFile(null)
      }
    },
    [toast]
  )

  // ─── Hapus backup ───────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (filename: string) => backupService.delete(filename),
    onSuccess: (_data, filename) => {
      toast({
        title: "File backup dihapus",
        description: filename,
      })
      queryClient.invalidateQueries({ queryKey: ["backups"] })
    },
    onError: (err: any) => {
      toast({
        title: "Hapus gagal",
        description: err?.response?.data?.message ?? err?.message ?? "Terjadi kesalahan.",
        variant: "destructive",
      })
    },
  })

  // ─── Format tanggal ─────────────────────────────────────────────────────────
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }).format(d)
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            Backup Database
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola backup database sistem SIAKAD Al-Ausath
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            id="btn-refresh-backup"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            id="btn-create-backup"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="gap-2"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <HardDrive className="w-4 h-4" />
            )}
            {createMutation.isPending ? "Sedang Backup..." : "Backup Sekarang"}
          </Button>
        </div>
      </div>

      {/* ── Info Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileArchive className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Backup</p>
                <p className="text-2xl font-bold">{backups.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Backup Terakhir</p>
                <p className="text-sm font-semibold">
                  {backups.length > 0
                    ? formatDate(backups[0].created_at)
                    : "Belum ada backup"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Ukuran</p>
                <p className="text-sm font-semibold">
                  {backups.length > 0
                    ? formatBytes(backups.reduce((acc, b) => acc + b.size, 0))
                    : "0 B"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Panduan ─────────────────────────────────────────────────────────── */}
      <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10">
        <CardContent className="pt-5 pb-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-semibold">Panduan Backup</p>
              <ul className="list-disc list-inside space-y-0.5 text-amber-700 dark:text-amber-400">
                <li>Klik <strong>Backup Sekarang</strong> untuk membuat backup database saat ini</li>
                <li>File backup tersimpan dalam format <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">.sql.gz</code> (terkompresi)</li>
                <li>Simpan file backup di tempat yang aman setelah download</li>
                <li>Disarankan melakukan backup secara rutin sebelum perubahan data besar</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Tabel Daftar Backup ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Riwayat Backup</CardTitle>
          <CardDescription>
            {backups.length > 0
              ? `${backups.length} file backup tersimpan`
              : "Belum ada file backup yang tersimpan"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <div className="p-4 bg-destructive/10 rounded-full">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <p className="font-medium text-destructive">Gagal memuat data</p>
                <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Coba Lagi
              </Button>
            </div>
          ) : backups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <div className="p-4 bg-muted rounded-full">
                <Database className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Belum ada backup</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Klik tombol <strong>Backup Sekarang</strong> untuk membuat backup pertama
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama File</TableHead>
                  <TableHead>Tanggal Dibuat</TableHead>
                  <TableHead>Ukuran</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => (
                  <BackupRow
                    key={backup.filename}
                    backup={backup}
                    isDownloading={downloadingFile === backup.filename}
                    isDeleting={deleteMutation.isPending && deleteMutation.variables === backup.filename}
                    onDownload={() => handleDownload(backup.filename)}
                    onDelete={() => deleteMutation.mutate(backup.filename)}
                    formatDate={formatDate}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Loading overlay saat backup sedang berjalan ─────────────────────── */}
      {createMutation.isPending && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-80 text-center shadow-xl">
            <CardContent className="pt-8 pb-8 space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-primary/20" />
                  <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                  <Database className="absolute inset-0 m-auto w-6 h-6 text-primary" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-lg">Sedang Backup...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Proses ini mungkin memakan waktu beberapa detik. Harap tunggu.
                </p>
              </div>
              <div className="flex justify-center gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// ── Komponen baris backup ──────────────────────────────────────────────────────
function BackupRow({
  backup,
  isDownloading,
  isDeleting,
  onDownload,
  onDelete,
  formatDate,
}: {
  backup: BackupFile
  isDownloading: boolean
  isDeleting: boolean
  onDownload: () => void
  onDelete: () => void
  formatDate: (d: string) => string
}) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <FileArchive className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="font-mono text-xs break-all">{backup.filename}</span>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
        {formatDate(backup.created_at)}
      </TableCell>
      <TableCell>
        <span className="font-medium text-sm">{backup.size_label}</span>
      </TableCell>
      <TableCell>
        <Badge variant={backup.compressed ? "default" : "secondary"} className="text-xs">
          {backup.compressed ? (
            <>
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Compressed
            </>
          ) : (
            "Plain SQL"
          )}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          {/* Download */}
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            disabled={isDownloading}
            id={`btn-download-${backup.filename}`}
            className="gap-1.5"
          >
            {isDownloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Download
          </Button>

          {/* Hapus */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isDeleting}
                id={`btn-delete-${backup.filename}`}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus File Backup?</AlertDialogTitle>
                <AlertDialogDescription>
                  File <span className="font-mono text-sm font-semibold">{backup.filename}</span>{" "}
                  akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Ya, Hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  )
}

// ── Helper ─────────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  let i = 0
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024
    i++
  }
  return `${bytes.toFixed(2)} ${units[i]}`
}
