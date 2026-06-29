"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { DataKelasMapelImportSummary, dataKelasMapelService } from "@/lib/services/kelas-mapel.service"
import { ArrowLeft, CircleCheck, Download, Upload } from "lucide-react"

type PreviewRow = {
  kode_kelas: string
  kode_mapel: string
  nama_petugas: string
  tahun_ajaran: string
  semester: string
  buku_acuan: string
  status: string
}

const SUPPORTED_IMPORT_EXTENSIONS = ["csv", "txt"] as const

const getFileExtension = (filename: string): string => filename.split(".").pop()?.toLowerCase() || ""

const isSupportedImportExtension = (extension: string): boolean =>
  SUPPORTED_IMPORT_EXTENSIONS.includes(extension as (typeof SUPPORTED_IMPORT_EXTENSIONS)[number])

const normalizeHeader = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s\-/]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")

const parseCsvText = (content: string): PreviewRow[] => {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length <= 1) return []

  const headers = lines[0].split(",").map((cell) => normalizeHeader(cell))
  const rows = lines.slice(1)

  return rows.map((line) => {
    const cells = line.split(",").map((cell) => cell.trim())
    const rowObj: Record<string, string> = {}

    headers.forEach((header, index) => {
      rowObj[header] = cells[index] ?? ""
    })

    return {
      kode_kelas: rowObj.kode_kelas || "",
      kode_mapel: rowObj.kode_mapel || "",
      nama_petugas: rowObj.nama_petugas || "",
      tahun_ajaran: rowObj.tahun_ajaran || "",
      semester: rowObj.semester || "",
      buku_acuan: rowObj.buku_acuan || "",
      status: rowObj.status || "",
    }
  })
}

const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (!error || typeof error !== "object") return fallback

  const err = error as {
    response?: {
      data?: {
        message?: string
      }
    }
    message?: string
  }

  return err.response?.data?.message || err.message || fallback
}

export default function MapelImportPage() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [importSummary, setImportSummary] = useState<DataKelasMapelImportSummary | null>(null)

  const canProcess = useMemo(() => !!file && !isLoading, [file, isLoading])

  const handleDownloadTemplate = () => {
    const run = async () => {
      try {
        const blob = await dataKelasMapelService.downloadImportTemplate()
        downloadBlob(blob, "template-import-kelas-mapel.csv")
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal mengunduh template impor data kelas mapel."),
          variant: "destructive",
        })
      }
    }

    void run()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null

    if (!selectedFile) {
      setFile(null)
      setPreviewRows([])
      setImportSummary(null)
      return
    }

    const extension = getFileExtension(selectedFile.name)

    if (!isSupportedImportExtension(extension)) {
      setFile(null)
      setPreviewRows([])
      setImportSummary(null)
      event.target.value = ""
      toast({
        title: "Format berkas tidak didukung",
        description: "Gunakan file dengan ekstensi .csv atau .txt.",
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)
    setImportSummary(null)

    try {
      const text = await selectedFile.text()
      setPreviewRows(parseCsvText(text))
    } catch {
      setPreviewRows([])
      toast({
        title: "Gagal Membaca Berkas",
        description: "Pratinjau file tidak bisa dibaca, tapi Anda masih bisa coba proses impor.",
        variant: "destructive",
      })
    }
  }

  const handleProcessImport = () => {
    const run = async () => {
      if (!file) return

      const extension = getFileExtension(file.name)
      if (!isSupportedImportExtension(extension)) {
        toast({
          title: "Format berkas tidak didukung",
          description: "Gunakan file dengan ekstensi .csv atau .txt.",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)
      try {
        const result = await dataKelasMapelService.importFile(file)
        const summary = result.data
        setImportSummary(summary)

        const hasFailures = (summary.failed ?? 0) > 0

        toast({
          title: hasFailures ? "Import Selesai dengan Catatan" : "Import Selesai",
          description: `Inserted: ${summary.inserted ?? 0}, Updated: ${summary.updated ?? 0}, Failed: ${summary.failed ?? 0}`,
          variant: hasFailures ? "destructive" : "default",
        })
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal memproses impor data kelas mapel."),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">IMPOR DATA KELAS MAPEL</h1>
        <Link href="/dashboard/kelas-mapel">
          <Button className="h-11 w-14 p-0" variant="default">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="space-y-8 p-6">
          <div className="space-y-4">
            <p className="text-2xl text-foreground">Silakan unduh template CSV impor data kelas mapel:</p>
            <Button className="h-11 gap-2 px-5" onClick={handleDownloadTemplate}>
              <Download className="h-5 w-5" />
              Unduh Templat
            </Button>
          </div>

          <div className="space-y-4">
            <p className="text-2xl text-foreground">Pilih Berkas Impor</p>
            <div className="flex flex-wrap items-center gap-3">
              <Input type="file" accept=".csv,.txt,text/csv" className="max-w-xl" onChange={handleFileChange} />
              <Button className="h-11 gap-2 px-6" disabled={!file || isLoading} onClick={handleProcessImport}>
                <Upload className="h-5 w-5" />
                Unggah
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle className="text-3xl font-semibold text-foreground">PRATINJAU DATA IMPOR</CardTitle>
          <Button className="h-11 gap-2 px-6" disabled={!canProcess} onClick={handleProcessImport}>
            <CircleCheck className="h-5 w-5" />
            Proses Impor Data
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>#</TableHead>
                <TableHead>KODE KELAS</TableHead>
                <TableHead>KODE MAPEL</TableHead>
                <TableHead>NAMA PETUGAS</TableHead>
                <TableHead>TAHUN AJARAN</TableHead>
                <TableHead>SEMESTER</TableHead>
                <TableHead>BUKU ACUAN</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>AKSI IMPOR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    Belum ada data untuk dipratinjau.
                  </TableCell>
                </TableRow>
              ) : (
                previewRows.map((row, index) => (
                  <TableRow key={`${row.kode_kelas}-${row.kode_mapel}-${index}`}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{row.kode_kelas || "-"}</TableCell>
                    <TableCell>{row.kode_mapel || "-"}</TableCell>
                    <TableCell>{row.nama_petugas || "-"}</TableCell>
                    <TableCell>{row.tahun_ajaran || "-"}</TableCell>
                    <TableCell>{row.semester || "-"}</TableCell>
                    <TableCell>{row.buku_acuan || "-"}</TableCell>
                    <TableCell>{row.status || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-primary/15 text-primary">
                        Siap
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {importSummary && (
        <Card>
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-2xl font-semibold text-foreground">HASIL IMPORT</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Inserted</p>
                <p className="text-2xl font-semibold">{importSummary.inserted ?? 0}</p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Updated</p>
                <p className="text-2xl font-semibold">{importSummary.updated ?? 0}</p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-semibold text-destructive">{importSummary.failed ?? 0}</p>
              </div>
            </div>

            {(importSummary.error_rows?.length ?? 0) > 0 && (
              <div className="space-y-3">
                <p className="text-lg font-semibold text-foreground">Detail Error Baris</p>
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead>BARIS</TableHead>
                        <TableHead>ERROR</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importSummary.error_rows?.map((row, index) => (
                        <TableRow key={`${row.line}-${index}`}>
                          <TableCell className="font-medium">{row.line}</TableCell>
                          <TableCell>
                            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                              {row.errors.map((message, errorIndex) => (
                                <li key={`${row.line}-${errorIndex}`}>{message}</li>
                              ))}
                            </ul>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
