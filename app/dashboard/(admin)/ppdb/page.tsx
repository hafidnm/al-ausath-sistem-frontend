"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

import {
  usePpdbList,
  useCreatePpdb,
  useDeletePpdb,
  useUpdatePpdbTestResult,
  useUpdatePpdbVerification,
  useUploadPpdbFile,
} from "@/hooks/ppdb/admin"
import { ppdbAdminApi } from "@/lib/ppdb/admin-api"
import type { PpdbDetail, TesKonfigurasiJenjangKey, TestQuestion, UpdateTestResultRequest } from "@/types/ppdb/admin"
import { dataKelasService, type KelasItem } from "@/lib/services/kelas.service"

import { PpdbStatsCards } from "@/components/ppdb/admin/ppdb-stats-cards"
import { PpdbTesKonfigurasiCard } from "@/components/ppdb/admin/ppdb-tes-konfigurasi-card"
import { PpdbAddDialog } from "@/components/ppdb/admin/ppdb-add-dialog"
import { PpdbDetailDialog } from "@/components/ppdb/admin/ppdb-detail-dialog"
import { PpdbTable } from "@/components/ppdb/admin/ppdb-table"
import { PpdbRekapCard } from "@/components/ppdb/admin/ppdb-rekap-card"
import { PpdbPeriodsTab } from "@/components/ppdb/admin/ppdb-periods-tab"
import {
  PpdbFormState,
  emptyPendaftarForm,
  PpdbStatus,
} from "@/components/ppdb/admin/ppdb-form-fields"

// ─── Types ────────────────────────────────────────────────────────────────────

type TesConfigState = { fiturSoalAktif: boolean; soalTes: string; formSchema?: TestQuestion[]; bahasa?: 'id' | 'ar'; is_rtl?: boolean }
type TesConfigMap = Record<TesKonfigurasiJenjangKey, TesConfigState>

const emptyTesConfig: TesConfigMap = {
  MI: { fiturSoalAktif: false, soalTes: "", formSchema: [] },
  MTS: { fiturSoalAktif: false, soalTes: "", formSchema: [] },
  MA: { fiturSoalAktif: false, soalTes: "", formSchema: [] },
}

const normalizeTesJenjang = (value?: string | null): TesKonfigurasiJenjangKey | null => {
  const n = (value || "").replace(/[^a-z]/gi, "").toUpperCase()
  if (n === "MI") return "MI"
  if (n === "MTS") return "MTS"
  if (n === "MA") return "MA"
  return null
}

const normalizeClassText = (value?: string | null): string =>
  (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()

const hasGradeMarker = (value: string | null | undefined, grade: string): boolean => {
  const normalized = normalizeClassText(value)
  if (!normalized) return false

  const tokens = normalized.split(/\s+/).filter(Boolean)
  if (tokens.includes(grade)) return true

  const regexEscaped = grade.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
  return (
    new RegExp(`\\bkelas\\s*${regexEscaped}\\b`).test(normalized)
    || new RegExp(`\\btingkat\\s*${regexEscaped}\\b`).test(normalized)
    || new RegExp(`\\b${regexEscaped}\\s*(a|b|c|putra|putri)\\b`).test(normalized)
    || new RegExp(`^(mi|mts|ma)\\s*${regexEscaped}\\b`).test(normalized)
    || new RegExp(`^${regexEscaped}\\s*(mi|mts|ma)?\\b`).test(normalized)
  )
}

const classMatchesJenjang = (kelas: KelasItem, jenjang?: string): boolean => {
  const normalizedJenjang = (jenjang || "").replace(/[^a-z]/gi, "").toUpperCase()
  if (!normalizedJenjang) return true

  const kodeUnit = (kelas.kode_unit || "").replace(/[^a-z]/gi, "").toUpperCase()
  const combined = normalizeClassText(`${kelas.kode_kelas} ${kelas.nama_kelas}`)

  if (kodeUnit) return kodeUnit === normalizedJenjang
  return combined.split(/\s+/).includes(normalizedJenjang.toLowerCase())
}

// Filter untuk menampilkan hanya kelas penerimaan awal (Kelas 1 untuk MI, Kelas 7 untuk MTS, Kelas 10 untuk MA, PAUD, TK)
const isFirstYearClass = (kelas: KelasItem, jenjang?: string): boolean => {
  const normalizedJenjang = (jenjang || "").toUpperCase()

  // Untuk PAUD dan TK, tampilkan semua kelas yang cocok dengan jenjang
  if (normalizedJenjang === "PAUD" || normalizedJenjang === "TK") {
    return classMatchesJenjang(kelas, jenjang)
  }

  // Untuk MI: hanya tampilkan kelas 1
  if (normalizedJenjang === "MI") {
    return classMatchesJenjang(kelas, jenjang) && (
      hasGradeMarker(kelas.kode_kelas, "1") || hasGradeMarker(kelas.nama_kelas, "1")
    )
  }

  // Untuk MTS: hanya tampilkan kelas 7 (tingkat awal MTS)
  if (normalizedJenjang === "MTS") {
    return classMatchesJenjang(kelas, jenjang) && (
      hasGradeMarker(kelas.kode_kelas, "7") || hasGradeMarker(kelas.nama_kelas, "7")
    )
  }

  // Untuk MA: hanya tampilkan kelas 10 (tingkat awal MA)
  if (normalizedJenjang === "MA") {
    return classMatchesJenjang(kelas, jenjang) && (
      hasGradeMarker(kelas.kode_kelas, "10") || hasGradeMarker(kelas.nama_kelas, "10")
    )
  }

  // Fallback default jika jenjang tidak cocok
  return hasGradeMarker(kelas.kode_kelas, "1") || hasGradeMarker(kelas.nama_kelas, "1")
}

import { toErrorMessage } from "@/hooks/shared/react-query-helpers"

const getErrorMessage = (error: unknown, fallback: string) =>
  toErrorMessage(error, fallback)

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PpdbPage() {
  const router = useRouter()
  // Dialog state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isExportLoading, setIsExportLoading] = useState(false)
  const [isTagihanLoading, setIsTagihanLoading] = useState(false)
  const [isTerimaOpen, setIsTerimaOpen] = useState(false)
  const [terimaPendaftar, setTerimaPendaftar] = useState<PpdbDetail | null>(null)
  // integrasikanSantri selalu true — integrasi langsung wajib saat menerima santri
  // agar NIS tidak pernah berada di status 'Sedang Diproses'
  const [kodeKelasDiterima, setKodeKelasDiterima] = useState("")
  const [kelasList, setKelasList] = useState<KelasItem[]>([])
  const [kelasLoading, setKelasLoading] = useState(false)

  // State untuk opsi filter kelas di tabel (semua kelas aktif, tidak difilter per jenjang)
  const [kelasFilterOptions, setKelasFilterOptions] = useState<
    Array<{ kode_kelas: string; nama_kelas: string; tahun_ajaran?: string }>
  >([])

  // Selection & form state
  const [selectedPendaftar, setSelectedPendaftar] = useState<PpdbDetail | null>(null)
  const [newForm, setNewForm] = useState<PpdbFormState>(emptyPendaftarForm)

  // Table filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedProgram, setSelectedProgram] = useState("all")
  // Issue 6: Class and class status filters
  const [selectedKelas, setSelectedKelas] = useState("all")
  const [selectedStatusKelas, setSelectedStatusKelas] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)

  // Tes konfigurasi state
  const [selectedJenjangTes, setSelectedJenjangTes] = useState<TesKonfigurasiJenjangKey>("MI")
  const [tesConfigByJenjang, setTesConfigByJenjang] = useState<TesConfigMap>(emptyTesConfig)
  const [isTesConfigLoading, setIsTesConfigLoading] = useState(false)
  const [isTesConfigSaving, setIsTesConfigSaving] = useState(false)

  // Hooks
  const { data: ppdbData, meta: ppdbMeta, loading, error, fetchList, updateStatusByIds } = usePpdbList({
    page: currentPage,
    per_page: 15,
    q: searchQuery || undefined,
    status_verifikasi: selectedStatus === "all" ? undefined : selectedStatus.toLowerCase(),
    jenjang: selectedProgram === "all" ? undefined : selectedProgram,
    // Issue 6: Add class filters
    kelas: selectedKelas === "all" ? undefined : selectedKelas,
    status_kelas: selectedStatusKelas === "all" ? undefined : selectedStatusKelas,
  })
  const { create: createPendaftar, loading: createLoading } = useCreatePpdb()
  const { deleteItem: deletePendaftar, loading: deleteLoading } = useDeletePpdb()
  const { updateTestResult, loading: testResultLoading } = useUpdatePpdbTestResult()
  const { updateVerification, loading: verificationLoading } = useUpdatePpdbVerification()
  const { upload } = useUploadPpdbFile()

  const handleUploadFile = async (jenisBerkas: string, file: File) => {
    if (!selectedPendaftar) return
    try {
      await runActionWithIdFallback(selectedPendaftar, (id) => upload(id, file, jenisBerkas))
      alert('File berhasil diupload.')
      // Refresh detail data
      if (selectedPendaftar) {
        handleOpenDetail(selectedPendaftar)
      }
      fetchList()
    } catch (err) {
      alert(getErrorMessage(err, 'Gagal mengupload file'))
    }
  }

  // Derived
  const selectedPendaftarJenjang = normalizeTesJenjang(selectedPendaftar?.jenjang)
  const selectedPendaftarTesConfig = selectedPendaftarJenjang
    ? tesConfigByJenjang[selectedPendaftarJenjang]
    : null

  const programOptions = useMemo(() => {
    const defaultOptions = ['MI', 'MTS', 'MA']
    const set = new Set<string>(defaultOptions)
    ppdbData.forEach((item) => {
      const c = item.programPendaftaran || item.jenjang
      if (c?.trim()) set.add(c.toUpperCase())
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, "id"))
  }, [ppdbData])

  // ── Load tes konfigurasi ──────────────────────────────────────────────────
  const loadTesKonfigurasi = useCallback(async () => {
    setIsTesConfigLoading(true)
    try {
      const configs = await ppdbAdminApi.getTesKonfigurasiPerJenjang()
      setTesConfigByJenjang((prev) => {
        const next = { ...prev }
        configs.forEach((cfg) => {
          next[cfg.jenjang] = {
            fiturSoalAktif: Boolean(cfg.fiturSoalAktif),
            soalTes: cfg.soalTes || "",
            formSchema: cfg.formSchema,
          }
        })
        return next
      })
    } catch (err) {
      console.error("Error fetching tes configuration:", getErrorMessage(err, ""))
    } finally {
      setIsTesConfigLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchList()
    void loadTesKonfigurasi()
    // Load opsi kelas untuk filter tabel saat halaman pertama dimuat
    void (async () => {
      try {
        const result = await dataKelasService.getAll({ per_page: 500, status: "AKTIF" })
        const opts = result.data
          .filter(item => item.kode_kelas)
          .map(item => ({
            kode_kelas: item.kode_kelas ?? "",
            nama_kelas: item.nama_kelas ?? "",
            tahun_ajaran: item.tahun_ajaran ?? (item.tahunAjaranRelasi as any)?.tahun_ajaran ?? "",
          }))
          .sort((a, b) => a.kode_kelas.localeCompare(b.kode_kelas))
        setKelasFilterOptions(opts)
      } catch {
        // gagal load kelas filter — tidak kritis, abaikan
      }
    })()
  }, [fetchList, loadTesKonfigurasi])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const updateTesConfigDraft = (
    jenjang: TesKonfigurasiJenjangKey,
    patch: Partial<TesConfigState>,
  ) => {
    setTesConfigByJenjang((prev) => ({
      ...prev,
      [jenjang]: { ...prev[jenjang], ...patch },
    }))
  }

  const getIdCandidates = (p: PpdbDetail) => {
    const raw = p as unknown as Record<string, unknown>

    const rawIdPendaftaran =
      typeof raw.id_pendaftaran === "string" || typeof raw.id_pendaftaran === "number"
        ? String(raw.id_pendaftaran)
        : ""
    const rawPendaftaranId =
      typeof raw.pendaftaran_id === "string" || typeof raw.pendaftaran_id === "number"
        ? String(raw.pendaftaran_id)
        : ""
    const rawId = typeof raw.id === "string" || typeof raw.id === "number" ? String(raw.id) : ""

    const cleaned = Array.from(
      new Set(
        [
          p.pendaftaranId,
          rawIdPendaftaran,
          rawPendaftaranId,
          p.id,
          rawId,
          p.userId,
          p.noPendaftaran,
          p.noPendaftaranFinal,
        ]
          .map((id) => (id ?? "").trim())
          .filter(
            (id) =>
              id.length > 0
              && id !== "-"
              && id.toLowerCase() !== "null"
              && id.toLowerCase() !== "undefined",
          ),
      ),
    )

    const numeric = cleaned.filter((id) => /^\d+$/.test(id))
    return numeric.length > 0 ? Array.from(new Set([...numeric, ...cleaned])) : cleaned
  }

  const runActionWithIdFallback = async (
    p: PpdbDetail,
    action: (id: string) => Promise<unknown>,
  ) => {
    const ids = getIdCandidates(p)
    if (!ids.length) throw new Error("ID pendaftar tidak ditemukan")

    const shouldRetryWithNextId = (error: unknown) => {
      if (!error || typeof error !== "object") return false

      const errObj = error as {
        response?: { status?: number; data?: { message?: string } }
        message?: string
      }

      const status = errObj.response?.status
      if (status === 404 || status === 405) return true

      const message = (errObj.response?.data?.message || errObj.message || "").toLowerCase()
      return (
        message.includes("must be of type int")
        || message.includes("no query results")
        || message.includes("not found")
      )
    }

    let lastErr: unknown
    for (const id of ids) {
      try {
        return await action(id)
      } catch (e) {
        lastErr = e

        if (!shouldRetryWithNextId(e)) {
          throw e
        }
      }
    }
    throw lastErr
  }

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleAddPendaftar = async () => {
    if (!newForm.name || !newForm.jenjang) { alert("Harap lengkapi data sebelum menyimpan"); return }
    try {
      await createPendaftar({ ...newForm, status: newForm.status as PpdbStatus })
      setNewForm(emptyPendaftarForm)
      setIsAddOpen(false)
      await fetchList()
    } catch (err) { alert(getErrorMessage(err, "Gagal menambah pendaftar")) }
  }

  const handleOpenDetail = async (p: PpdbDetail) => {
    // Navigate to detail page using the pendaftar ID
    const idToUse = p.pendaftaranId || p.id
    if (idToUse) {
      router.push(`/dashboard/ppdb/${idToUse}`)
    }
  }

  const handleDeletePendaftar = async (p: PpdbDetail) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pendaftar ini?")) return
    try {
      await runActionWithIdFallback(p, (id) => deletePendaftar(id))
      await fetchList()
    } catch (err) { alert(getErrorMessage(err, "Gagal menghapus pendaftar")) }
  }

  const handleVerifikasi = async (p: PpdbDetail, status: "Diterima" | "Ditolak" | "Menunggu") => {
    if (status === "Diterima") {
      setTerimaPendaftar(p)
      setIsTerimaOpen(true)
      void loadKelasList(p)
      return
    }

    if (status === "Ditolak" && !confirm("Tolak pendaftar ini?")) return
    if (status === "Menunggu" && !confirm("Ubah status pendaftar menjadi Menunggu?")) return
    try {
      const targetIds = getIdCandidates(p)
      await runActionWithIdFallback(p, (id) => updateVerification(id, { status, keterangan: "" }))
      updateStatusByIds(targetIds, status)
      setSelectedPendaftar((prev) => {
        if (!prev) return prev
        const prevIds = getIdCandidates(prev)
        if (!prevIds.some((id) => targetIds.includes(id))) return prev
        return { ...prev, status }
      })
      void fetchList()
    } catch (err) { alert(getErrorMessage(err, "Gagal memperbarui verifikasi")) }
  }

  const loadKelasList = useCallback(async (pendaftar?: PpdbDetail | null) => {
    setKelasLoading(true)
    try {
      const kelasParams = {
        per_page: 500,
        status: "AKTIF" as const,
      } as Parameters<typeof dataKelasService.getAll>[0]

      const result = await dataKelasService.getAll(kelasParams)
      
      const mappedList = result.data
        .map(item => ({
          id: item.id_kelas ?? item.id ?? -1,
          kode_kelas: item.kode_kelas ?? "",
          nama_kelas: item.nama_kelas ?? "",
          kode_unit: item.kode_unit ?? item.unit?.kode_unit ?? "",
          status: item.status ?? undefined,
          tahun_ajaran: item.tahun_ajaran ?? (item.tahunAjaranRelasi as any)?.tahun_ajaran ?? (item.tahun_ajaran_relasi as any)?.tahun_ajaran ?? "",
        }))
        .filter(item => item.kode_kelas)
        .filter(item => !item.status || item.status === "AKTIF")
      
      setKelasList(mappedList)
    } catch (err) {
      console.error("Error loading kelas list:", err)
      setKelasList([])
    } finally {
      setKelasLoading(false)
    }
  }, [terimaPendaftar?.jenjang, terimaPendaftar?.programPendaftaran])

  const handleTerimaPendaftarSubmit = async () => {
    if (!terimaPendaftar) {
      alert("Data pendaftar tidak ditemukan")
      return
    }
    if (!kodeKelasDiterima) {
      alert("Pilih kode kelas terlebih dahulu sebelum menerima santri.")
      return
    }
    try {
      const targetIds = getIdCandidates(terimaPendaftar)
      await runActionWithIdFallback(terimaPendaftar, (id) =>
        updateVerification(id, { 
          status: "Diterima", 
          keterangan: "",
          // Selalu true — integrasi wajib agar NIS langsung digenerate
          // dan santri tidak pernah berada di state 'Sedang Diproses'
          integrasikanLangsungKeSantri: true,
          kodeKelasDiterima: kodeKelasDiterima
        }),
      )
      updateStatusByIds(targetIds, "Diterima")
      setSelectedPendaftar((prev) => {
        if (!prev) return prev
        const prevIds = getIdCandidates(prev)
        if (!prevIds.some((id) => targetIds.includes(id))) return prev
        return { ...prev, status: "Diterima" }
      })
      setIsTerimaOpen(false)
      setTerimaPendaftar(null)
      setKodeKelasDiterima("")
      void fetchList()
    } catch (err) { alert(getErrorMessage(err, "Gagal menerima pendaftar")) }
  }

  const handleExport = async () => {
    setIsExportLoading(true)
    try {
      const blob = await ppdbAdminApi.exportPendaftar({
        jenjang: selectedProgram === "all" ? undefined : selectedProgram,
        status_verifikasi: selectedStatus === "all" ? undefined : selectedStatus,
        q: searchQuery || undefined,
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const statusSuffix = selectedStatus === "all" ? "semua" : selectedStatus.toLowerCase()
      const programSuffix = selectedProgram === "all" ? "semua" : selectedProgram.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()
      a.download = `ppdb-export-${statusSuffix}-${programSuffix}-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a); a.click(); a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert(getErrorMessage(err, "Gagal export data pendaftar"))
    } finally { setIsExportLoading(false) }
  }

  const handleUpdateTesConfig = async (jenjang: TesKonfigurasiJenjangKey) => {
    const draft = tesConfigByJenjang[jenjang]
    const normalizedFormSchema = Array.isArray(draft.formSchema)
      ? draft.formSchema.filter((question) => (question.question || '').trim().length > 0)
      : []

    setIsTesConfigSaving(true)
    try {
      const updated = await ppdbAdminApi.updateTesKonfigurasiPerJenjang(jenjang, {
        fiturSoalAktif: draft.fiturSoalAktif,
        soalTes: draft.soalTes.trim(),
        formSchema: normalizedFormSchema,
        bahasa: draft.bahasa,
        is_rtl: draft.is_rtl,
      })
      updateTesConfigDraft(jenjang, {
        fiturSoalAktif: Boolean(updated.fiturSoalAktif),
        soalTes: updated.soalTes || "",
        formSchema: updated.formSchema || normalizedFormSchema,
        bahasa: updated.bahasa,
        is_rtl: updated.is_rtl,
      })
      alert(`Konfigurasi tes jenjang ${jenjang} berhasil diperbarui`)
    } catch (err) { alert(getErrorMessage(err, "Gagal memperbarui konfigurasi tes")) }
    finally { setIsTesConfigSaving(false) }
  }

  const handleSaveTesResult = async (payload: UpdateTestResultRequest) => {
    if (!selectedPendaftar) return

    try {
      await runActionWithIdFallback(selectedPendaftar, (id) => updateTestResult(id, payload))
      const refreshed = await runActionWithIdFallback(selectedPendaftar, (id) => ppdbAdminApi.getDetail(id))

      if (refreshed) {
        setSelectedPendaftar(refreshed as PpdbDetail)
      }

      void fetchList()
      alert("Koreksi tes berhasil disimpan")
    } catch (err) {
      alert(getErrorMessage(err, "Gagal menyimpan koreksi tes"))
    }
  }

  const handleCreateTagihan = async (p: PpdbDetail) => {
    if (!confirm(`Buat tagihan PPDB untuk ${p.name}?`)) return
    setIsTagihanLoading(true)
    try {
      await runActionWithIdFallback(p, (id) => ppdbAdminApi.createTagihanPpdb(id))
      alert("Tagihan PPDB berhasil dibuat")
    } catch (err) {
      alert(getErrorMessage(err, "Gagal membuat tagihan PPDB"))
    } finally {
      setIsTagihanLoading(false)
    }
  }

  const handleCreateTagihanInfaq = async (p: PpdbDetail) => {
    if (!confirm(`Buat tagihan infaq untuk ${p.name}?`)) return
    setIsTagihanLoading(true)
    try {
      await runActionWithIdFallback(p, (id) => ppdbAdminApi.createTagihanInfaq(id))
      alert("Tagihan infaq berhasil dibuat")
    } catch (err) {
      alert(getErrorMessage(err, "Gagal membuat tagihan infaq"))
    } finally {
      setIsTagihanLoading(false)
    }
  }

  /**
   * Integrasi ulang santri yang sudah Diterima tapi NIS belum pernah digenerate.
   * Terjadi karena admin sebelumnya tidak mencentang checkbox integrasi.
   * Sekarang checkbox dihapus dan integrasi selalu wajib, tapi untuk data lama
   * admin bisa trigger manual lewat menu ini.
   */
  const [integrasiLoading, setIntegrasiLoading] = useState(false)

  const handleIntegrasikanSantri = async (p: PpdbDetail) => {
    const kodeKelas = p.kodeKelasDiterima ||
      prompt(`Masukkan kode kelas yang diterima untuk ${p.name} (contoh: 10-PI):`)
    if (!kodeKelas?.trim()) {
      alert("Kode kelas wajib diisi untuk generate NIS.")
      return
    }
    if (!confirm(`Generate NIS dan integrasikan ${p.name} ke master santri dengan kelas ${kodeKelas}?`)) return

    setIntegrasiLoading(true)
    try {
      await runActionWithIdFallback(p, (id) =>
        updateVerification(id, {
          status: "Diterima",
          keterangan: "",
          integrasikanLangsungKeSantri: true,
          kodeKelasDiterima: kodeKelas.trim(),
        })
      )
      alert(`NIS berhasil digenerate untuk ${p.name}. Refresh halaman untuk melihat perubahan.`)
      void fetchList()
    } catch (err) {
      alert(getErrorMessage(err, "Gagal mengintegrasikan santri"))
    } finally {
      setIntegrasiLoading(false)
    }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  // Note: For true global stats across all pages, consider updating backend to provide global counters.
  // For now, these represent counts from the overall paginator (total) and the current page items.
  const totalPendaftar = ppdbMeta?.total ?? ppdbData.length
  const totalMenunggu = ppdbData.filter((i) => i.status === "Menunggu").length
  const totalDiterima = ppdbData.filter((i) => i.status === "Diterima").length
  const totalDitolak = ppdbData.filter((i) => i.status === "Ditolak").length

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">PPDB - Penerimaan Murid Baru</h1>
        <div className="text-destructive">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">PPDB - Penerimaan Murid Baru</h1>
          <p className="text-muted-foreground">Kelola pendaftaran, gelombang masuk, dan proses seleksi murid baru</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isExportLoading}>
            {isExportLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {isExportLoading ? "Exporting..." : "Export Excel"}
          </Button>
          <PpdbAddDialog
            open={isAddOpen}
            onOpenChange={setIsAddOpen}
            form={newForm}
            programOptions={programOptions}
            isLoading={createLoading}
            onFormChange={(patch) => setNewForm((prev) => ({ ...prev, ...patch }))}
            onSubmit={handleAddPendaftar}
          />
        </div>
      </div>

      <Tabs defaultValue="pendaftar" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-[500px]">
          <TabsTrigger value="pendaftar">Pendaftar</TabsTrigger>
          <TabsTrigger value="periods">Gelombang PPDB</TabsTrigger>
          <TabsTrigger value="konfigurasi-tes">Konfigurasi Tes</TabsTrigger>
        </TabsList>

        <TabsContent value="pendaftar" className="space-y-6">
          {/* Stats */}
          <PpdbStatsCards
            totalPendaftar={totalPendaftar}
            totalMenunggu={totalMenunggu}
            totalDiterima={totalDiterima}
            totalDitolak={totalDitolak}
          />

          {/* Tabel */}
          <PpdbTable
            data={ppdbData}
            meta={ppdbMeta}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            loading={loading}
            searchQuery={searchQuery}
            selectedStatus={selectedStatus}
            selectedProgram={selectedProgram}
            selectedKelas={selectedKelas}
            selectedStatusKelas={selectedStatusKelas}
            kelasOptions={kelasFilterOptions}
            programOptions={programOptions}
            verificationLoading={verificationLoading}
            deleteLoading={deleteLoading}
            onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1) }}
            onStatusChange={(val) => { setSelectedStatus(val); setCurrentPage(1) }}
            onProgramChange={(val) => { setSelectedProgram(val); setCurrentPage(1) }}
            onKelasChange={(val) => { setSelectedKelas(val); setCurrentPage(1) }}
            onStatusKelasChange={(val) => { setSelectedStatusKelas(val); setCurrentPage(1) }}
            onDetail={handleOpenDetail}
            onVerifikasi={handleVerifikasi}
            onDelete={handleDeletePendaftar}
            onCreateTagihan={handleCreateTagihan}
            onCreateTagihanInfaq={handleCreateTagihanInfaq}
            tagihanLoading={isTagihanLoading}
            onIntegrasikanSantri={handleIntegrasikanSantri}
            integrasiLoading={integrasiLoading}
          />

          {/* Rekap Diterima & Ditolak */}
          <PpdbRekapCard data={ppdbData} />
        </TabsContent>

        <TabsContent value="periods">
          <PpdbPeriodsTab />
        </TabsContent>

        <TabsContent value="konfigurasi-tes" className="space-y-6">
          {/* Tes Konfigurasi */}
          <PpdbTesKonfigurasiCard
            selectedJenjang={selectedJenjangTes}
            configByJenjang={tesConfigByJenjang}
            isLoading={isTesConfigLoading}
            isSaving={isTesConfigSaving}
            onJenjangChange={setSelectedJenjangTes}
            onToggle={async (jenjang, checked) => {
              updateTesConfigDraft(jenjang, { fiturSoalAktif: checked })
              // Auto-save toggle change immediately to prevent "ghost reactivation" bug
              const draft = { ...tesConfigByJenjang[jenjang], fiturSoalAktif: checked }
              const normalizedFormSchema = Array.isArray(draft.formSchema)
                ? draft.formSchema.filter((q) => (q.question || '').trim().length > 0)
                : []
              setIsTesConfigSaving(true)
              try {
                const updated = await ppdbAdminApi.updateTesKonfigurasiPerJenjang(jenjang, {
                  fiturSoalAktif: checked,
                  soalTes: draft.soalTes.trim(),
                  formSchema: normalizedFormSchema,
                  bahasa: draft.bahasa,
                  is_rtl: draft.is_rtl,
                })
                updateTesConfigDraft(jenjang, {
                  fiturSoalAktif: Boolean(updated.fiturSoalAktif),
                  soalTes: updated.soalTes || "",
                  formSchema: updated.formSchema || normalizedFormSchema,
                  bahasa: updated.bahasa,
                  is_rtl: updated.is_rtl,
                })
              } catch (err) {
                // Revert on failure
                updateTesConfigDraft(jenjang, { fiturSoalAktif: !checked })
                alert(getErrorMessage(err, "Gagal memperbarui status tes"))
              } finally {
                setIsTesConfigSaving(false)
              }
            }}
            onSoalChange={(jenjang, soal) => updateTesConfigDraft(jenjang, { soalTes: soal })}
            onFormSchemaChange={(jenjang, schema) => updateTesConfigDraft(jenjang, { formSchema: schema })}
            onConfigPatch={(jenjang, patch) => updateTesConfigDraft(jenjang, patch)}
            onSave={handleUpdateTesConfig}
          />
        </TabsContent>
      </Tabs>

      {/* Detail Dialog — now deprecated in favor of dedicated detail page */}
      {/* <PpdbDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        pendaftar={selectedPendaftar}
        isLoading={isDetailLoading}
        selectedPendaftarJenjang={selectedPendaftarJenjang}
        tesConfig={selectedPendaftarTesConfig}
        isTesResultSaving={testResultLoading}
        onTesResultSave={handleSaveTesResult}
        onUploadFile={handleUploadFile}
      /> */}

      {/* Konfirmasi Terima Dialog */}
      <Dialog open={isTerimaOpen} onOpenChange={(open) => {
        setIsTerimaOpen(open)
        if (open) void loadKelasList(terimaPendaftar)
      }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Konfirmasi Penerimaan Santri</DialogTitle>
            <DialogDescription>
              Konfirmasi data pendaftar, lalu klik tombol terima untuk menyetujui pendaftaran.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama Calon Santri</Label>
              <Input value={terimaPendaftar?.name || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>No Pendaftaran</Label>
              <Input
                value={terimaPendaftar?.noPendaftaranFinal || terimaPendaftar?.noPendaftaran || "-"}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label>Jenjang</Label>
              <Input
                value={terimaPendaftar?.jenjang || terimaPendaftar?.programPendaftaran || "-"}
                disabled
              />
            </div>

            <div className="space-y-2 pt-2">
              <Label>Pilih Kelas <span className="text-red-500">*</span></Label>
              {kelasLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memuat daftar kelas...
                </div>
              ) : (
                <Select
                  value={kodeKelasDiterima}
                  onValueChange={setKodeKelasDiterima}
                >
                  <SelectTrigger id="select-kode-kelas">
                    <SelectValue placeholder="-- Pilih Kelas --" />
                  </SelectTrigger>
                  <SelectContent>
                    {kelasList.length === 0 ? (
                      <SelectItem value="__empty" disabled>Tidak ada kelas aktif tersedia</SelectItem>
                    ) : (
                      kelasList.map((kelas) => (
                        <SelectItem key={kelas.kode_kelas} value={kelas.kode_kelas}>
                          {kelas.kode_kelas}{kelas.nama_kelas ? ` — ${kelas.nama_kelas}` : ""}{kelas.tahun_ajaran ? ` (${kelas.tahun_ajaran})` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-muted-foreground">
                Kelas wajib diisi saat menerima santri untuk keperluan master data.
              </p>
            </div>

            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" /></svg>
              <span>
                Data santri akan <strong>langsung diintegrasikan</strong> ke master santri dan NIS akan digenerate otomatis saat klik Terima.
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsTerimaOpen(false)
                setTerimaPendaftar(null)
              }}
            >
              Batal
            </Button>
            <Button onClick={handleTerimaPendaftarSubmit}>Terima</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
