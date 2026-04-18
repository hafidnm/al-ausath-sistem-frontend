"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { dataUnitService, DataUnitApiItem } from "@/lib/services/unit.service"
import { ArrowLeft, CircleCheck, Download, Upload } from "lucide-react"

type PreviewRow = {
  kode_unit: string
  nama_unit: string
  nomor_urut: string
  keterangan: string
  status: string
  status_ppdb: string
  jumlah_kelas: string
  jumlah_santri: string
}

const TEMPLATE_HEADERS = [
  "kode_unit",
  "nama_unit",
  "nomor_urut",
  "keterangan",
  "status",
  "status_ppdb",
]

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

const toText = (value: unknown): string => {
  if (value == null) return ""
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return ""
}

const toNumber = (value: unknown): number => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const mapAffectedUnitsToPreview = (units: DataUnitApiItem[]): PreviewRow[] => {
  return units.map((unit) => ({
    kode_unit: toText(unit.kode_unit),
    nama_unit: toText(unit.nama_unit),
    nomor_urut: toText(unit.nomor_urut),
    keterangan: toText(unit.keterangan),
    status: toText(unit.status),
    status_ppdb: toText(unit.status_ppdb),
    jumlah_kelas: String(toNumber(unit.jumlah_kelas ?? unit.kelas_count)),
    jumlah_santri: String(toNumber(unit.jumlah_santri ?? unit.santri_count)),
  }))
}

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
      kode_unit: rowObj.kode_unit || "",
      nama_unit: rowObj.nama_unit || "",
      nomor_urut: rowObj.nomor_urut || "",
      keterangan: rowObj.keterangan || "",
      status: rowObj.status || "",
      status_ppdb: rowObj.status_ppdb || "",
      jumlah_kelas: "-",
      jumlah_santri: "-",
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
      kode_unit: rowObj.kode_unit || "",
      nama_unit: rowObj.nama_unit || "",
      nomor_urut: rowObj.nomor_urut || "",
      keterangan: rowObj.keterangan || "",
      status: rowObj.status || "",
      status_ppdb: rowObj.status_ppdb || "",
      jumlah_kelas: "-",
      jumlah_santri: "-",
    }
  })
}

export default function UnitImportPage() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isPreviewAvailable, setIsPreviewAvailable] = useState(true)

  const canProcess = useMemo(() => !!file && !isLoading, [file, isLoading])

  const handleDownloadTemplate = () => {
    const templateRows = [
      TEMPLATE_HEADERS.join(","),
      "PAUD,PAUD,1,Jenjang PAUD,AKTIF,AKTIF",
      "TK,TK,2,Jenjang TK,AKTIF,AKTIF",
    ]

    const blob = new Blob([templateRows.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "template-import-data-unit.csv"
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null

    if (!selectedFile) {
      setFile(null)
      setPreviewRows([])
      setIsPreviewAvailable(true)
      return
    }

    const extension = getFileExtension(selectedFile.name)

    if (!isSupportedImportExtension(extension)) {
      setFile(null)
      setPreviewRows([])
      setIsPreviewAvailable(true)
      event.target.value = ""
      toast({
        title: "Format berkas tidak didukung",
        description: "Gunakan file dengan ekstensi .csv, .txt, .xlsx, atau .xls.",
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)

    try {
      let rows: PreviewRow[] = []

      if (extension === "csv" || extension === "txt") {
        const text = await selectedFile.text()
        rows = parseCsvText(text)
      } else {
        rows = await parseExcelRows(selectedFile)
      }

      setPreviewRows(rows)
      setIsPreviewAvailable(true)
    } catch {
      setPreviewRows([])
      setIsPreviewAvailable(false)
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
          description: "Gunakan file dengan ekstensi .csv, .txt, .xlsx, atau .xls.",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)
      try {
        const result = await dataUnitService.importFile(file)
        const summary = result.data

        if (Array.isArray(summary.affected_units)) {
          setPreviewRows(mapAffectedUnitsToPreview(summary.affected_units))
          setIsPreviewAvailable(true)
        }

        toast({
          title: "Import Selesai",
          description: `Inserted: ${summary.inserted}, Updated: ${summary.updated}, Failed: ${summary.failed}`,
        })
      } catch (error) {
        const err = error as { response?: { data?: { message?: string } } }
        toast({
          title: "Gagal",
          description: err.response?.data?.message || "Gagal memproses impor data unit.",
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
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">IMPOR DATA</h1>
        <Link href="/dashboard/unit">
          <Button className="h-11 w-14 p-0" variant="default">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="space-y-8 p-6">
          <div className="space-y-4">
            <p className="text-2xl text-foreground">Silahkan unduh templat excel impor data unit berikut:</p>
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
                <TableHead>KODE UNIT</TableHead>
                <TableHead>NAMA UNIT</TableHead>
                <TableHead>NOMOR URUT</TableHead>
                <TableHead>KETERANGAN</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>STATUS PPDB</TableHead>
                <TableHead>JUMLAH KELAS</TableHead>
                <TableHead>JUMLAH SANTRI</TableHead>
                <TableHead>AKSI IMPOR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isPreviewAvailable ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-10 text-center text-muted-foreground">
                    Pratinjau tidak tersedia. Klik Proses Impor Data untuk melanjutkan.
                  </TableCell>
                </TableRow>
              ) : previewRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-10 text-center text-muted-foreground">
                    Belum ada data untuk dipratinjau.
                  </TableCell>
                </TableRow>
              ) : (
                previewRows.map((row, index) => (
                  <TableRow key={`${row.kode_unit}-${index}`}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{row.kode_unit || "-"}</TableCell>
                    <TableCell>{row.nama_unit || "-"}</TableCell>
                    <TableCell>{row.nomor_urut || "-"}</TableCell>
                    <TableCell>{row.keterangan || "-"}</TableCell>
                    <TableCell>{row.status || "-"}</TableCell>
                    <TableCell>{row.status_ppdb || "-"}</TableCell>
                    <TableCell>{row.jumlah_kelas || "0"}</TableCell>
                    <TableCell>{row.jumlah_santri || "0"}</TableCell>
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
    </div>
  )
}
