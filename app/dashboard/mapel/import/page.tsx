"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { dataMataPelajaranService } from "@/lib/services/mata-pelajaran.service"
import { ArrowLeft, CircleCheck, Download, Upload } from "lucide-react"

type PreviewRow = {
  kode_mapel: string
  nama_mapel: string
  kode_unit: string
  kelompok_mapel: string
  keterangan: string
  status: string
}

type ErrorRow = {
  line: number
  errors: string[]
}

const SUPPORTED_IMPORT_EXTENSIONS = ["csv", "txt", "xlsx", "xls"] as const

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
      kode_mapel: rowObj.kode_mapel || "",
      nama_mapel: rowObj.nama_mapel || "",
      kode_unit: rowObj.kode_unit || "",
      kelompok_mapel: rowObj.kelompok_mapel || "",
      keterangan: rowObj.keterangan || "",
      status: rowObj.status || "",
    }
  })
}

const parseExcelRows = async (file: File): Promise<PreviewRow[]> => {
  const XLSX = await import("xlsx")
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: "array" })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) return []

  const worksheet = workbook.Sheets[firstSheetName]
  const rows = XLSX.utils.sheet_to_json<Array<string | number | null>>(worksheet, {
    header: 1,
    blankrows: false,
    defval: "",
    raw: false,
  })

  if (rows.length <= 1) return []

  const headers = (rows[0] || []).map((cell) => normalizeHeader(String(cell ?? "")))

  return rows.slice(1).map((row) => {
    const rowObj: Record<string, string> = {}

    headers.forEach((header, index) => {
      rowObj[header] = String(row[index] ?? "").trim()
    })

    return {
      kode_mapel: rowObj.kode_mapel || "",
      nama_mapel: rowObj.nama_mapel || "",
      kode_unit: rowObj.kode_unit || "",
      kelompok_mapel: rowObj.kelompok_mapel || "",
      keterangan: rowObj.keterangan || "",
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
        errors?: Record<string, string[]>
      }
    }
    message?: string
  }

  const firstFieldError = err.response?.data?.errors
    ? Object.values(err.response.data.errors).flat().find(Boolean)
    : undefined

  return firstFieldError || err.response?.data?.message || err.message || fallback
}

export default function MapelImportPage() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([])
  const [isPreviewAvailable, setIsPreviewAvailable] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [importSummary, setImportSummary] = useState<{
    inserted: number
    updated: number
    failed: number
    error_rows: ErrorRow[]
  } | null>(null)

  const canProcess = useMemo(() => !!file && !isLoading, [file, isLoading])

  const handleDownloadTemplate = () => {
    const run = async () => {
      try {
        const blob = await dataMataPelajaranService.downloadImportTemplate()
        downloadBlob(blob, "template-import-mata-pelajaran.csv")
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal mengunduh template impor mata pelajaran."),
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
      setIsPreviewAvailable(true)
      setImportSummary(null)
      return
    }

    const extension = getFileExtension(selectedFile.name)

    if (!isSupportedImportExtension(extension)) {
      setFile(null)
      setPreviewRows([])
      setIsPreviewAvailable(true)
      setImportSummary(null)
      event.target.value = ""
      toast({
        title: "Format berkas tidak didukung",
        description: "Gunakan file dengan ekstensi .csv, .txt, .xlsx, atau .xls.",
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)
    setImportSummary(null)

    try {
      let nextPreviewRows: PreviewRow[] = []

      if (extension === "csv" || extension === "txt") {
        const text = await selectedFile.text()
        nextPreviewRows = parseCsvText(text)
      } else {
        nextPreviewRows = await parseExcelRows(selectedFile)
      }

      setPreviewRows(nextPreviewRows)
      setIsPreviewAvailable(true)
    } catch {
      setPreviewRows([])
      setIsPreviewAvailable(false)
      toast({
        title: "Gagal Membaca Berkas",
        description: "Pratinjau file tidak bisa dibaca, tapi Anda masih bisa lanjut proses impor.",
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
          description: "Gunakan file dengan ekstensi .csv, .txt, .xlsx, atau .xls.",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)
      try {
        const result = await dataMataPelajaranService.importFile(file)
        const summary = result.data

        setImportSummary({
          inserted: summary.inserted || 0,
          updated: summary.updated || 0,
          failed: summary.failed || 0,
          error_rows: summary.error_rows || [],
        })

        const hasFailures = (summary.failed ?? 0) > 0

        toast({
          title: hasFailures ? "Import Selesai dengan Catatan" : "Import Selesai",
          description: `Inserted: ${summary.inserted ?? 0}, Updated: ${summary.updated ?? 0}, Failed: ${summary.failed ?? 0}`,
          variant: hasFailures ? "destructive" : "default",
        })
      } catch (error) {
        toast({
          title: "Gagal",
          description: getErrorMessage(error, "Gagal memproses impor data mata pelajaran."),
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
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">IMPOR DATA MATA PELAJARAN</h1>
        <Link href="/dashboard/mapel">
          <Button className="h-11 w-14 p-0" variant="default">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="space-y-8 p-6">
          <div className="space-y-4">
            <p className="text-2xl text-foreground">Silahkan unduh templat impor data mata pelajaran berikut:</p>
            <Button className="h-11 gap-2 px-5" onClick={handleDownloadTemplate}>
              <Download className="h-5 w-5" />
              Unduh Templat
            </Button>
          </div>

          <div className="space-y-4">
            <p className="text-2xl text-foreground">Pilih Berkas Impor</p>
            <div className="flex flex-wrap items-center gap-3">
              <Input type="file" accept=".csv,.txt,.xlsx,.xls,text/csv" className="max-w-xl" onChange={handleFileChange} />
              <Button className="h-11 gap-2 px-6" disabled={!file || isLoading} onClick={handleProcessImport}>
                <Upload className="h-5 w-5" />
                Unggah
              </Button>
            </div>
            {!isPreviewAvailable && (
              <p className="text-sm text-muted-foreground">
                Pratinjau tidak tersedia untuk file ini. Anda masih bisa lanjut proses impor.
              </p>
            )}
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
                <TableHead>KODE MAPEL</TableHead>
                <TableHead>NAMA MAPEL</TableHead>
                <TableHead>KODE UNIT</TableHead>
                <TableHead>KELOMPOK MAPEL</TableHead>
                <TableHead>KETERANGAN</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>AKSI IMPOR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isPreviewAvailable ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    Pratinjau tidak tersedia. Klik Proses Impor Data untuk melanjutkan.
                  </TableCell>
                </TableRow>
              ) : previewRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    Belum ada data untuk dipratinjau.
                  </TableCell>
                </TableRow>
              ) : (
                previewRows.map((row, index) => (
                  <TableRow key={`${row.kode_mapel}-${index}`}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{row.kode_mapel || "-"}</TableCell>
                    <TableCell>{row.nama_mapel || "-"}</TableCell>
                    <TableCell>{row.kode_unit || "-"}</TableCell>
                    <TableCell>{row.kelompok_mapel || "-"}</TableCell>
                    <TableCell>{row.keterangan || "-"}</TableCell>
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
                <p className="text-2xl font-semibold">{importSummary.inserted}</p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Updated</p>
                <p className="text-2xl font-semibold">{importSummary.updated}</p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-semibold text-destructive">{importSummary.failed}</p>
              </div>
            </div>

            {importSummary.error_rows.length > 0 && (
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
                      {importSummary.error_rows.map((row, index) => (
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
