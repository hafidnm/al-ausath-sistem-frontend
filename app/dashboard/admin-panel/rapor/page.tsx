"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Download, Eye, FileText, Loader2, RefreshCw, Save, Search, Sparkles, UserSearch } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { raporService, type RaporDetail, type RaporItem } from "@/lib/services/rapor.service"
import { santriService } from "@/lib/services/santri.service"

type CatatanFormState = {
  nomor_induk: string
  kode_kelas: string
  tahun_ajaran: string
  semester: string
  catatan_wali: string
  id_wali_kelas: string
  keseharian_kebersihan: string
  keseharian_kerapian: string
  keseharian_keterampilan: string
}

const initialCatatanForm: CatatanFormState = {
  nomor_induk: "",
  kode_kelas: "",
  tahun_ajaran: "2025/2026",
  semester: "1",
  catatan_wali: "",
  id_wali_kelas: "",
  keseharian_kebersihan: "",
  keseharian_kerapian: "",
  keseharian_keterampilan: "",
}

const reportStatusBadge = (status?: string) => {
  const normalized = (status || "DRAFT").toUpperCase()

  if (normalized === "TERBIT") {
    return <Badge className="bg-primary/10 text-primary border-0">TERBIT</Badge>
  }

  return <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 border-0">DRAFT</Badge>
}

const firstNonEmpty = (...values: Array<string | number | null | undefined>) => {
  for (const value of values) {
    if (value == null) continue
    const text = String(value).trim()
    if (text) return text
  }

  return ""
}

const getRaporIdentity = (item: RaporItem) => {
  if (item.id > 0) return `id:${item.id}`

  return [
    item.nomor_induk || "-",
    item.kode_kelas || "-",
    item.tahun_ajaran || "-",
    String(item.semester ?? "-"),
  ].join("|")
}

export default function AdminPanelRaporPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [kodeKelas, setKodeKelas] = useState("all")
  const [tahunAjaran, setTahunAjaran] = useState("2025/2026")
  const [semester, setSemester] = useState("1")
  const [status, setStatus] = useState("all")
  const [perPage, setPerPage] = useState("10")
  const [items, setItems] = useState<RaporItem[]>([])
  const [selected, setSelected] = useState<RaporItem | null>(null)
  const [detail, setDetail] = useState<RaporDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSelecting, setIsSelecting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [catatanForm, setCatatanForm] = useState<CatatanFormState>(initialCatatanForm)
  const [santriNameByNomorInduk, setSantriNameByNomorInduk] = useState<Record<string, string>>({})
  const [santriSearch, setSantriSearch] = useState("")
  const [isSearchingSantri, setIsSearchingSantri] = useState(false)
  const [santriOptions, setSantriOptions] = useState<Array<{ nomor_induk: string; nama_lengkap?: string; kode_kelas?: string }>>([])
  const selectedIdentity = selected ? getRaporIdentity(selected) : null

  const selectedParams = useMemo(() => {
    const nomorInduk = selected?.nomor_induk || catatanForm.nomor_induk.trim()

    return {
      nomor_induk: nomorInduk,
      kode_kelas: selected?.kode_kelas || catatanForm.kode_kelas,
      tahun_ajaran: selected?.tahun_ajaran || catatanForm.tahun_ajaran,
      semester: Number(selected?.semester || catatanForm.semester || 1),
    }
  }, [catatanForm.kode_kelas, catatanForm.nomor_induk, catatanForm.semester, catatanForm.tahun_ajaran, selected])

  const isReportReady = Boolean(detail || selected)

  const hydrateCatatanForm = useCallback((source: RaporDetail, catatan: Awaited<ReturnType<typeof raporService.getCatatanWali>>) => {
    setCatatanForm((current) => ({
      nomor_induk: firstNonEmpty(current.nomor_induk, source.nomor_induk),
      kode_kelas: firstNonEmpty(current.kode_kelas, source.kode_kelas),
      tahun_ajaran: firstNonEmpty(current.tahun_ajaran, source.tahun_ajaran) || "2025/2026",
      semester: firstNonEmpty(current.semester, source.semester) || "1",
      catatan_wali: firstNonEmpty(current.catatan_wali, catatan.catatan_wali, source.catatan_wali),
      id_wali_kelas: firstNonEmpty(current.id_wali_kelas, catatan.id_wali_kelas, source.id_wali_kelas),
      keseharian_kebersihan: firstNonEmpty(current.keseharian_kebersihan, catatan.keseharian_kebersihan, source.keseharian_kebersihan),
      keseharian_kerapian: firstNonEmpty(current.keseharian_kerapian, catatan.keseharian_kerapian, source.keseharian_kerapian),
      keseharian_keterampilan: firstNonEmpty(current.keseharian_keterampilan, catatan.keseharian_keterampilan, source.keseharian_keterampilan),
    }))
  }, [])

  const loadReportDetail = useCallback(async (item: RaporItem) => {
    try {
      setIsSelecting(true)
      setError("")
      setSuccess("")

      setSelected(item)
      setCatatanForm((current) => ({
        ...current,
        nomor_induk: item.nomor_induk,
        kode_kelas: item.kode_kelas,
        tahun_ajaran: item.tahun_ajaran,
        semester: String(item.semester),
      }))

      const [reportDetail, catatan] = await Promise.all([
        raporService.getShow({
          nomor_induk: item.nomor_induk,
          tahun_ajaran: item.tahun_ajaran,
          semester: item.semester,
        }),
        raporService.getCatatanWali({
          nomor_induk: item.nomor_induk,
          tahun_ajaran: item.tahun_ajaran,
          semester: item.semester,
        }),
      ])

      setDetail(reportDetail)
      hydrateCatatanForm(reportDetail, catatan)
    } catch (err: any) {
      setDetail(null)
      setError(err?.response?.data?.message || "Gagal memuat detail rapor")
    } finally {
      setIsSelecting(false)
    }
  }, [hydrateCatatanForm])

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true)
      setError("")
      setSuccess("")

      const searchText = query.trim()
      const includeNilaiMapel = status === "TERBIT"

      const data = await raporService.getAll({
        q: searchText || undefined,
        nama: searchText || undefined,
        nomor_induk: searchText || undefined,
        kode_kelas: kodeKelas === "all" ? undefined : kodeKelas,
        tahun_ajaran: tahunAjaran || undefined,
        semester: semester === "all" ? undefined : semester,
        status: status === "all" ? undefined : status,
        per_page: perPage,
        include_nilai_mapel: includeNilaiMapel,
      })

      const missingNomorInduk = Array.from(
        new Set(
          data
            .filter((item) => !firstNonEmpty(item.nama_santri, santriNameByNomorInduk[item.nomor_induk]) && item.nomor_induk)
            .map((item) => item.nomor_induk),
        ),
      )

      const fetchedNameMap: Record<string, string> = {}

      if (missingNomorInduk.length > 0) {
        const resolved = await Promise.all(
          missingNomorInduk.map(async (nomorInduk) => {
            try {
              const santriRows = await santriService.getAll({
                q: nomorInduk,
                per_page: "1",
              })

              const matched = santriRows.find((row) => row.nomor_induk === nomorInduk) ?? santriRows[0]
              return {
                nomorInduk,
                nama: matched?.nama_lengkap?.trim() || "",
              }
            } catch {
              return {
                nomorInduk,
                nama: "",
              }
            }
          }),
        )

        for (const item of resolved) {
          if (item.nama) {
            fetchedNameMap[item.nomorInduk] = item.nama
          }
        }
      }

      if (Object.keys(fetchedNameMap).length > 0) {
        setSantriNameByNomorInduk((current) => ({ ...current, ...fetchedNameMap }))
      }

      const nextItems = data.map((item) => ({
        ...item,
        nama_santri: firstNonEmpty(item.nama_santri, fetchedNameMap[item.nomor_induk], santriNameByNomorInduk[item.nomor_induk]) || undefined,
      }))

      setItems(nextItems)

      if (selectedIdentity && !nextItems.some((item) => getRaporIdentity(item) === selectedIdentity)) {
        setSelected(null)
        setDetail(null)
        setCatatanForm(initialCatatanForm)
      }
    } catch (err: any) {
      setItems([])
      setError(err?.response?.data?.message || "Gagal memuat daftar rapor")
    } finally {
      setIsLoading(false)
    }
  }, [kodeKelas, perPage, query, santriNameByNomorInduk, selectedIdentity, semester, status, tahunAjaran])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl)
      }
    }
  }, [pdfPreviewUrl])

  useEffect(() => {
    const keyword = santriSearch.trim()

    if (keyword.length < 2) {
      setSantriOptions([])
      setIsSearchingSantri(false)
      return
    }

    const timer = window.setTimeout(async () => {
      try {
        setIsSearchingSantri(true)
        const rows = await santriService.search(keyword, 10)
        setSantriOptions(rows)
      } catch {
        setSantriOptions([])
      } finally {
        setIsSearchingSantri(false)
      }
    }, 300)

    return () => {
      window.clearTimeout(timer)
    }
  }, [santriSearch])

  const handleReset = () => {
    setQuery("")
    setKodeKelas("all")
    setTahunAjaran("2025/2026")
    setSemester("1")
    setStatus("all")
    setPerPage("10")
    setSelected(null)
    setDetail(null)
    setCatatanForm(initialCatatanForm)
  }

  const handleGenerate = async () => {
    if (!selectedParams.nomor_induk || !selectedParams.kode_kelas || !selectedParams.tahun_ajaran || !selectedParams.semester) {
      setError("Nomor induk, kode kelas, tahun ajaran, dan semester wajib diisi untuk generate rapor")
      return
    }

    try {
      setIsGenerating(true)
      setError("")
      setSuccess("")

      const generated = await raporService.generate(selectedParams)
      const [reportDetail, catatan] = await Promise.all([
        raporService.getShow({
          nomor_induk: generated.nomor_induk,
          tahun_ajaran: generated.tahun_ajaran,
          semester: generated.semester,
        }),
        raporService.getCatatanWali({
          nomor_induk: generated.nomor_induk,
          tahun_ajaran: generated.tahun_ajaran,
          semester: generated.semester,
        }),
      ])

      setSelected(generated)
      setDetail(reportDetail)
      hydrateCatatanForm(reportDetail, catatan)
      setSuccess("Rapor berhasil di-generate")
      await fetchReports()
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal generate rapor")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveCatatan = async () => {
    if (!isReportReady) {
      setError("Generate rapor dulu sebelum mengisi catatan wali")
      return
    }

    if (!catatanForm.nomor_induk.trim() || !catatanForm.kode_kelas.trim() || !catatanForm.tahun_ajaran.trim() || !catatanForm.semester.trim() || !catatanForm.catatan_wali.trim()) {
      setError("Nomor induk, kode kelas, tahun ajaran, semester, dan catatan wali wajib diisi")
      return
    }

    try {
      setIsSaving(true)
      setError("")
      setSuccess("")

      const saved = await raporService.upsertCatatanWali({
        nomor_induk: catatanForm.nomor_induk.trim(),
        kode_kelas: catatanForm.kode_kelas.trim(),
        tahun_ajaran: catatanForm.tahun_ajaran.trim(),
        semester: Number(catatanForm.semester),
        catatan_wali: catatanForm.catatan_wali.trim(),
        id_wali_kelas: catatanForm.id_wali_kelas.trim() ? Number(catatanForm.id_wali_kelas) : undefined,
        keseharian_kebersihan: catatanForm.keseharian_kebersihan.trim() || undefined,
        keseharian_kerapian: catatanForm.keseharian_kerapian.trim() || undefined,
        keseharian_keterampilan: catatanForm.keseharian_keterampilan.trim() || undefined,
      })

      setDetail(saved)
      setSuccess("Catatan wali berhasil disimpan")
      await fetchReports()
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal menyimpan catatan wali")
    } finally {
      setIsSaving(false)
    }
  }

  const openPdfPreview = async () => {
    if (!isReportReady) {
      setError("Preview PDF hanya tersedia setelah rapor di-generate")
      return
    }

    try {
      setError("")
      const blob = await raporService.downloadPdf(selectedParams)
      const url = URL.createObjectURL(blob)

      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl)
      }

      setPdfPreviewUrl(url)
      setIsPreviewOpen(true)
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal membuka preview PDF rapor")
    }
  }

  const downloadPdf = async () => {
    if (!isReportReady) {
      setError("Download PDF hanya tersedia setelah rapor di-generate")
      return
    }

    try {
      setError("")
      const blob = await raporService.downloadPdf(selectedParams)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `rapor-${selectedParams.nomor_induk}-${selectedParams.tahun_ajaran.replaceAll("/", "-")}-s${selectedParams.semester}.pdf`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal mengunduh PDF rapor")
    }
  }

  const totalTerbit = items.filter((item) => (item.status || "").toUpperCase() === "TERBIT").length
  const totalDraft = items.length - totalTerbit

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rapor Operasional</h1>
          <p className="text-muted-foreground">Cari santri, generate rapor, preview PDF, dan isi catatan wali dalam satu halaman</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="bg-transparent" onClick={fetchReports}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="bg-transparent" onClick={() => router.push("/dashboard/admin-panel") }>
            <FileText className="mr-2 h-4 w-4" />
            Panel Admin
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Rapor</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{items.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Rapor Terbit</p>
            <p className="mt-1 text-3xl font-bold text-primary">{totalTerbit}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Rapor Draft</p>
            <p className="mt-1 text-3xl font-bold text-amber-600">{totalDraft}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Filter Pencarian</CardTitle>
          <CardDescription>Gunakan nama atau nomor induk untuk mencari data rapor yang sudah ada</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Label htmlFor="search-rapor">Cari nama / nomor induk</Label>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search-rapor"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Contoh: Ahmad Fauzi atau 2025001"
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="tahun-ajaran">Tahun ajaran</Label>
              <Input id="tahun-ajaran" className="mt-2" value={tahunAjaran} onChange={(event) => setTahunAjaran(event.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label>Kelas</Label>
              <Input className="mt-2" value={kodeKelas} onChange={(event) => setKodeKelas(event.target.value)} placeholder="Kode kelas / all" />
            </div>
            <div>
              <Label>Semester</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="DRAFT">DRAFT</SelectItem>
                  <SelectItem value="TERBIT">TERBIT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Per halaman</Label>
              <Select value={perPage} onValueChange={setPerPage}>
                <SelectTrigger className="mt8-2">
                  <SelectValue placeholder="Per halaman" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={fetchReports} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Cari
            </Button>
            <Button variant="outline" className="bg-transparent" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {(error || success) && (
        <div className={`rounded-lg border p-4 ${error ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-primary/30 bg-primary/5 text-primary"}`}>
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <p className="text-sm">{error || success}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,1fr)]">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Daftar Rapor</CardTitle>
            <CardDescription>Hasil pencarian laporan santri berdasarkan filter yang dipilih</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Santri</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Rata-rata</TableHead>
                    <TableHead className="text-center">Ranking</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                        Memuat data rapor...
                      </TableCell>
                    </TableRow>
                  )}

                  {!isLoading && !error && items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                        Data rapor tidak ditemukan
                      </TableCell>
                    </TableRow>
                  )}

                  {!isLoading && !error && items.map((item, index) => {
                    const rowIdentity = getRaporIdentity(item)
                    const isSelected = selectedIdentity === rowIdentity
                    const rowKey = `${rowIdentity}-${index}`

                    return (
                      <TableRow key={rowKey} className={isSelected ? "bg-primary/5" : undefined}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{item.nama_santri || "-"}</p>
                            <p className="text-xs text-muted-foreground">{item.nomor_induk}</p>
                          </div>
                        </TableCell>
                        <TableCell>{item.kode_kelas || "-"}</TableCell>
                        <TableCell>{item.semester} / {item.tahun_ajaran}</TableCell>
                        <TableCell>{reportStatusBadge(item.status)}</TableCell>
                        <TableCell className="text-center font-semibold text-primary">{item.nilai_rata ?? "-"}</TableCell>
                        <TableCell className="text-center">{item.ranking ? `#${item.ranking}` : "-"}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="bg-transparent" onClick={() => loadReportDetail(item)} disabled={isSelecting}>
                              <UserSearch className="mr-2 h-4 w-4" />
                              Pilih
                            </Button>
                            <Button variant="outline" size="sm" className="bg-transparent" onClick={() => loadReportDetail(item)} disabled={isSelecting}>
                              <Eye className="mr-2 h-4 w-4" />
                              Detail
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Generate & Preview</CardTitle>
              <CardDescription>Gunakan panel ini untuk generate rapor dan membuka PDF</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Nomor induk</Label>
                  <Input
                    className="mt-2"
                    value={catatanForm.nomor_induk}
                    onChange={(event) => {
                      const value = event.target.value
                      setCatatanForm((current) => ({ ...current, nomor_induk: value }))
                      setSantriSearch(value)
                    }}
                    placeholder="Cari nama santri atau nomor induk"
                  />

                  {(isSearchingSantri || santriOptions.length > 0) && (
                    <div className="mt-2 rounded-md border border-border bg-background">
                      {isSearchingSantri && (
                        <p className="px-3 py-2 text-xs text-muted-foreground">Mencari santri...</p>
                      )}

                      {!isSearchingSantri && santriOptions.length > 0 && (
                        <div className="max-h-44 overflow-y-auto">
                          {santriOptions.map((option) => (
                            <button
                              key={`${option.nomor_induk}-${option.kode_kelas || "kelas"}`}
                              type="button"
                              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-muted/50"
                              onClick={() => {
                                setCatatanForm((current) => ({
                                  ...current,
                                  nomor_induk: option.nomor_induk,
                                  kode_kelas: current.kode_kelas || option.kode_kelas || "",
                                }))

                                if (option.nama_lengkap) {
                                  setSantriNameByNomorInduk((current) => ({
                                    ...current,
                                    [option.nomor_induk]: option.nama_lengkap || "",
                                  }))
                                }

                                setSantriOptions([])
                                setSantriSearch("")
                              }}
                            >
                              <span className="text-sm text-foreground">{option.nama_lengkap || "Tanpa nama"}</span>
                              <span className="text-xs text-muted-foreground">{option.nomor_induk}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <Label>Kode kelas</Label>
                  <Input className="mt-2" value={catatanForm.kode_kelas} onChange={(event) => setCatatanForm((current) => ({ ...current, kode_kelas: event.target.value }))} />
                </div>
                <div>
                  <Label>Tahun ajaran</Label>
                  <Input className="mt-2" value={catatanForm.tahun_ajaran} onChange={(event) => setCatatanForm((current) => ({ ...current, tahun_ajaran: event.target.value }))} />
                </div>
                <div>
                  <Label>Semester</Label>
                  <Select value={catatanForm.semester} onValueChange={(value) => setCatatanForm((current) => ({ ...current, semester: value }))}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Generate Rapor
                </Button>
                <Button variant="outline" className="bg-transparent" onClick={openPdfPreview} disabled={!isReportReady}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview PDF
                </Button>
                <Button variant="outline" className="bg-transparent" onClick={downloadPdf} disabled={!isReportReady}>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                Catatan wali baru bisa diisi setelah rapor berhasil di-generate.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Panel Catatan Wali</CardTitle>
              <CardDescription>Catatan wali, keseharian, dan status rapor aktif</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Santri</p>
                  <p className="mt-1 font-medium text-foreground">{detail?.nama_santri || selected?.nama_santri || "Belum dipilih"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                  <div className="mt-1">{reportStatusBadge(detail?.status || selected?.status)}</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label htmlFor="catatan-wali">Catatan wali</Label>
                  <Textarea
                    id="catatan-wali"
                    className="mt-2 min-h-30"
                    value={catatanForm.catatan_wali}
                    onChange={(event) => setCatatanForm((current) => ({ ...current, catatan_wali: event.target.value }))}
                    disabled={!isReportReady}
                    placeholder={isReportReady ? "Tulis catatan pengembangan diri, akhlak, akademis, dan pesan wali kelas" : "Generate rapor dulu untuk mengisi catatan wali"}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label>Kebersihan</Label>
                    <Input className="mt-2" value={catatanForm.keseharian_kebersihan} onChange={(event) => setCatatanForm((current) => ({ ...current, keseharian_kebersihan: event.target.value }))} disabled={!isReportReady} placeholder="A/B/C/D" />
                  </div>
                  <div>
                    <Label>Kerapian</Label>
                    <Input className="mt-2" value={catatanForm.keseharian_kerapian} onChange={(event) => setCatatanForm((current) => ({ ...current, keseharian_kerapian: event.target.value }))} disabled={!isReportReady} placeholder="A/B/C/D" />
                  </div>
                  <div>
                    <Label>Keterampilan</Label>
                    <Input className="mt-2" value={catatanForm.keseharian_keterampilan} onChange={(event) => setCatatanForm((current) => ({ ...current, keseharian_keterampilan: event.target.value }))} disabled={!isReportReady} placeholder="A/B/C/D" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>ID wali kelas</Label>
                    <Input className="mt-2" value={catatanForm.id_wali_kelas} onChange={(event) => setCatatanForm((current) => ({ ...current, id_wali_kelas: event.target.value }))} disabled={!isReportReady} placeholder="Opsional" />
                  </div>
                  <div>
                    <Label>Semester aktif</Label>
                    <Input className="mt-2" value={catatanForm.semester} disabled />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSaveCatatan} disabled={!isReportReady || isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Simpan Catatan
                </Button>
                <Button variant="outline" className="bg-transparent" onClick={() => selected && loadReportDetail(selected)} disabled={!selected || isSelecting}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Muat Ulang Detail
                </Button>
              </div>

              {!isReportReady && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700">
                  Generate rapor dulu sebelum catatan wali bisa diinput.
                </div>
              )}

              {detail?.nilai_mapel?.length ? (
                <div className="space-y-3">
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Preview Nilai Mapel</h3>
                    <p className="text-xs text-muted-foreground">Detail ringkas nilai mapel untuk rapor yang dipilih</p>
                  </div>
                  <div className="max-h-64 overflow-auto rounded-lg border border-border/50">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Mapel</TableHead>
                          <TableHead className="text-center">Nilai</TableHead>
                          <TableHead className="text-center">Predikat</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.nilai_mapel.map((item, index) => (
                          <TableRow key={`${item.kode_mapel || "mapel"}-${index}`}>
                            <TableCell>{item.mapel || item.kode_mapel || "-"}</TableCell>
                            <TableCell className="text-center">{item.nilai ?? "-"}</TableCell>
                            <TableCell className="text-center">{item.predikat || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Preview PDF Rapor</DialogTitle>
            <DialogDescription>
              {selected?.nama_santri || detail?.nama_santri || "Santri belum dipilih"}
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
    </div>
  )
}