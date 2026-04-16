"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { raporService, type RaporDetail, type RaporItem } from "@/lib/services/rapor.service"
import { santriService } from "@/lib/services/santri.service"
import { RaporCatatanCard } from "./components/rapor-catatan-card"
import { RaporFeedbackAlert } from "./components/rapor-feedback-alert"
import { RaporFiltersCard } from "./components/rapor-filters-card"
import { RaporGenerateCard } from "./components/rapor-generate-card"
import { RaporHeader } from "./components/rapor-header"
import RaporPreviewDialog from "./components/rapor-preview-dialog"
import { RaporSummaryCards } from "./components/rapor-summary-cards"
import { RaporTable } from "./components/rapor-table"

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

  const fetchReports = useCallback(async (searchOverride?: string) => {
    try {
      setIsLoading(true)
      setError("")
      setSuccess("")

      const searchText = (searchOverride ?? query).trim()
      const searchIsNomorInduk = /^\d+$/.test(searchText)
      const includeNilaiMapel = status === "TERBIT"

      const data = await raporService.getAll({
        q: searchText || undefined,
        nama: searchIsNomorInduk ? undefined : searchText || undefined,
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
    setError("")
    setSuccess("")
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
      <RaporHeader onRefresh={fetchReports} onBackToAdmin={() => router.push("/dashboard/admin-panel")} />

      <RaporSummaryCards total={items.length} totalTerbit={totalTerbit} totalDraft={totalDraft} />

      <RaporFiltersCard
        query={query}
        onQueryChange={setQuery}
        tahunAjaran={tahunAjaran}
        onTahunAjaranChange={setTahunAjaran}
        kodeKelas={kodeKelas}
        onKodeKelasChange={setKodeKelas}
        semester={semester}
        onSemesterChange={setSemester}
        status={status}
        onStatusChange={setStatus}
        perPage={perPage}
        onPerPageChange={setPerPage}
        isLoading={isLoading}
        onSearch={fetchReports}
        onReset={handleReset}
      />

      <RaporFeedbackAlert error={error} success={success} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,1fr)]">
        <RaporTable
          items={items}
          isLoading={isLoading}
          error={error}
          isSelecting={isSelecting}
          selectedIdentity={selectedIdentity}
          getIdentity={getRaporIdentity}
          onSelect={loadReportDetail}
        />

        <div className="space-y-6">
          <RaporGenerateCard
            catatanForm={catatanForm}
            onCatatanFormChange={setCatatanForm}
            isSearchingSantri={isSearchingSantri}
            santriOptions={santriOptions}
            onNomorIndukSearchChange={setSantriSearch}
            onSantriOptionPick={(option) => {
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
            isGenerating={isGenerating}
            isReportReady={isReportReady}
            onGenerate={handleGenerate}
            onPreviewPdf={openPdfPreview}
            onDownloadPdf={downloadPdf}
          />

          <RaporCatatanCard
            detail={detail}
            selected={selected}
            catatanForm={catatanForm}
            isReportReady={isReportReady}
            isSaving={isSaving}
            isSelecting={isSelecting}
            onCatatanFormChange={setCatatanForm}
            onSaveCatatan={handleSaveCatatan}
            onReloadDetail={() => selected && loadReportDetail(selected)}
          />
        </div>
      </div>

      <RaporPreviewDialog
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        pdfPreviewUrl={pdfPreviewUrl}
        namaSantri={selected?.nama_santri || detail?.nama_santri}
      />
    </div>
  )
}
