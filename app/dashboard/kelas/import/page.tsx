"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { DataKelasImportSummary, dataKelasService } from "@/lib/services/kelas.service"
import { ArrowLeft, CircleCheck, Download, Upload } from "lucide-react"

type PreviewRow = {
  kode_unit: string
  kode_kelas: string
  nama_kelas: string
  nama_jurusan: string
  tahun_ajaran: string
  status: string
  status_ppdb: string
}

const SUPPORTED_IMPORT_EXTENSIONS = ["csv", "txt", "xlsx", "xls"] as const

const getFileExtension = (filename: string): string => filename.split(".").pop()?.toLowerCase() || ""

const isSupportedImportExtension = (extension: string): boolean =>
  SUPPORTED_IMPORT_EXTENSIONS.includes(extension as (typeof SUPPORTED_IMPORT_EXTENSIONS)[number])

const parseCsvText = (content: string): PreviewRow[] => {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length <= 1) return []

  const headers = lines[0].split(",").map((cell) => cell.trim().toLowerCase())
  const rows = lines.slice(1)

  return rows.map((line) => {
    const cells = line.split(",").map((cell) => cell.trim())
    const rowObj: Record<string, string> = {}

    headers.forEach((header, index) => {
      rowObj[header] = cells[index] ?? ""
    })

    return {
      kode_unit: rowObj.kode_unit || "",
      kode_kelas: rowObj.kode_kelas || "",
      nama_kelas: rowObj.nama_kelas || "",
      nama_jurusan: rowObj.nama_jurusan || "",
      tahun_ajaran: rowObj.tahun_ajaran || "",
      status: rowObj.status || "",
      status_ppdb: rowObj.status_ppdb || "",
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

export default function KelasImportPage() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([])
  const [isPreviewAvailable, setIsPreviewAvailable] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [importSummary, setImportSummary] = useState<DataKelasImportSummary | null>(null)

  const canProcess = useMemo(() => !!file && !isLoading, [file, isLoading])

  const handleDownloadTemplate = () => {
    const run = async () => {
      try {
        const blob = await dataKelasService.downloadImportTemplate()
        downloadBlob(blob, "template-import-kelas.csv")
      } catch (error) {
        const err = error as { response?: { data?: { message?: string } } }
        toast({
          title: "Gagal",
          description: err.response?.data?.message || "Gagal mengunduh template impor kelas.",
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

    if (extension !== "csv" && extension !== "txt") {
      setPreviewRows([])
      setIsPreviewAvailable(false)
      return
    }

    setIsPreviewAvailable(true)
    const text = await selectedFile.text()
    setPreviewRows(parseCsvText(text))
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
        const result = await dataKelasService.importFile(file)
        const summary = result.data
        setImportSummary(summary)

        const hasFailures = (summary.failed ?? 0) > 0

        toast({
          title: hasFailures ? "Import Selesai dengan Catatan" : "Import Selesai",
          description: `Inserted: ${summary.inserted ?? 0}, Updated: ${summary.updated ?? 0}, Failed: ${summary.failed ?? 0}`,
          variant: hasFailures ? "destructive" : "default",
        })
      } catch (error) {
        const err = error as { response?: { data?: { message?: string } } }
        toast({
          title: "Gagal",
          description: err.response?.data?.message || "Gagal memproses impor data kelas.",
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
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">IMPOR DATA KELAS</h1>
        <Link href="/dashboard/kelas">
          <Button className="h-11 w-14 p-0" variant="default">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="space-y-8 p-6">
          <div className="space-y-4">
            <p className="text-2xl text-foreground">Silahkan unduh templat excel impor data kelas berikut:</p>
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
                Pratinjau hanya tersedia untuk CSV/TXT. File Excel tetap bisa langsung diproses impor.
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
                <TableHead>KODE UNIT</TableHead>
                <TableHead>KODE KELAS</TableHead>
                <TableHead>NAMA KELAS</TableHead>
                <TableHead>NAMA JURUSAN</TableHead>
                <TableHead>TAHUN AJARAN</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>STATUS PPDB</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isPreviewAvailable ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    Pratinjau tidak tersedia untuk file Excel. Klik Proses Impor Data untuk melanjutkan.
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
                  <TableRow key={`${row.kode_kelas}-${index}`}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{row.kode_unit || "-"}</TableCell>
                    <TableCell>{row.kode_kelas || "-"}</TableCell>
                    <TableCell>{row.nama_kelas || "-"}</TableCell>
                    <TableCell>{row.nama_jurusan || "-"}</TableCell>
                    <TableCell>{row.tahun_ajaran || "-"}</TableCell>
                    <TableCell>{row.status || "-"}</TableCell>
                    <TableCell>{row.status_ppdb || "-"}</TableCell>
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
