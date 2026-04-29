"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
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
  usePpdbList,
  useCreatePpdb,
  useDeletePpdb,
  useUpdatePpdbTestResult,
  useUpdatePpdbVerification,
  useUploadPpdbFile,
} from "@/hooks/ppdb/admin"
import { ppdbAdminApi } from "@/lib/ppdb/admin-api"
import type { PpdbDetail, TesKonfigurasiJenjangKey, TestQuestion, UpdateTestResultRequest } from "@/types/ppdb/admin"
import { kelasService, type KelasItem } from "@/lib/services/kelas.service"

import { PpdbStatsCards } from "@/components/ppdb/admin/ppdb-stats-cards"
import { PpdbTesKonfigurasiCard } from "@/components/ppdb/admin/ppdb-tes-konfigurasi-card"
import { PpdbAddDialog } from "@/components/ppdb/admin/ppdb-add-dialog"
import { PpdbDetailDialog } from "@/components/ppdb/admin/ppdb-detail-dialog"
import { PpdbTable } from "@/components/ppdb/admin/ppdb-table"
import { PpdbRekapCard } from "@/components/ppdb/admin/ppdb-rekap-card"
import {
  PpdbFormState,
  emptyPendaftarForm,
  PpdbStatus,
} from "@/components/ppdb/admin/ppdb-form-fields"

// ─── Types ────────────────────────────────────────────────────────────────────

type TesConfigState = { fiturSoalAktif: boolean; soalTes: string; formSchema?: TestQuestion[] }
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

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PpdbPage() {
  // Dialog state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isExportLoading, setIsExportLoading] = useState(false)
  const [isTagihanLoading, setIsTagihanLoading] = useState(false)
  const [isTerimaOpen, setIsTerimaOpen] = useState(false)
  const [terimaPendaftar, setTerimaPendaftar] = useState<PpdbDetail | null>(null)
  const [integrasikanSantri, setIntegrasikanSantri] = useState(false)
  const [kodeKelasDiterima, setKodeKelasDiterima] = useState("")
  const [kelasList, setKelasList] = useState<KelasItem[]>([])
  const [kelasLoading, setKelasLoading] = useState(false)

  // Selection & form state
  const [selectedPendaftar, setSelectedPendaftar] = useState<PpdbDetail | null>(null)
  const [newForm, setNewForm] = useState<PpdbFormState>(emptyPendaftarForm)

  // Table filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedProgram, setSelectedProgram] = useState("all")

  // Tes konfigurasi state
  const [selectedJenjangTes, setSelectedJenjangTes] = useState<TesKonfigurasiJenjangKey>("MI")
  const [tesConfigByJenjang, setTesConfigByJenjang] = useState<TesConfigMap>(emptyTesConfig)
  const [isTesConfigLoading, setIsTesConfigLoading] = useState(false)
  const [isTesConfigSaving, setIsTesConfigSaving] = useState(false)

  // Hooks
  const { data: ppdbData, loading, error, fetchList, updateStatusByIds } = usePpdbList()
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
    const set = new Set<string>()
    ppdbData.forEach((item) => {
      const c = item.programPendaftaran || item.jenjang
      if (c?.trim()) set.add(c)
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
    setSelectedPendaftar(p)
    const j = normalizeTesJenjang(p.jenjang)
    if (j) setSelectedJenjangTes(j)
    setIsDetailOpen(true)
    setIsDetailLoading(true)
    try {
      const res = await runActionWithIdFallback(p, (id) => ppdbAdminApi.getDetail(id))
      if (res) {
        const detail = res as PpdbDetail
        setSelectedPendaftar(detail)
        const dj = normalizeTesJenjang(detail.jenjang)
        if (dj) setSelectedJenjangTes(dj)
      }
    } catch (err) { console.error("Error fetching detail:", err) }
    finally { setIsDetailLoading(false) }
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

  const loadKelasList = useCallback(async () => {
    setKelasLoading(true)
    try {
      const list = await kelasService.getAll({ per_page: "300" })
      setKelasList(list)
    } catch {
      setKelasList([])
    } finally {
      setKelasLoading(false)
    }
  }, [])

  const handleTerimaPendaftarSubmit = async () => {
    if (!terimaPendaftar) {
      alert("Data pendaftar tidak ditemukan")
      return
    }
    if (integrasikanSantri && !kodeKelasDiterima) {
      alert("Pilih kode kelas terlebih dahulu sebelum mengintegrasikan santri.")
      return
    }
    try {
      const targetIds = getIdCandidates(terimaPendaftar)
      await runActionWithIdFallback(terimaPendaftar, (id) =>
        updateVerification(id, { 
          status: "Diterima", 
          keterangan: "",
          integrasikanLangsungKeSantri: integrasikanSantri,
          kodeKelasDiterima: integrasikanSantri ? kodeKelasDiterima : undefined
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
      setIntegrasikanSantri(false)
      setKodeKelasDiterima("")
      void fetchList()
    } catch (err) { alert(getErrorMessage(err, "Gagal menerima pendaftar")) }
  }

  const handleExport = async () => {
    setIsExportLoading(true)
    try {
      const blob = await ppdbAdminApi.exportPendaftar({
        jenjang: selectedProgram === "all" ? undefined : selectedProgram,
        status_verifikasi: "diterima",
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `ppdb-diterima-${new Date().toISOString().slice(0, 10)}.csv`
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
      })
      updateTesConfigDraft(jenjang, {
        fiturSoalAktif: Boolean(updated.fiturSoalAktif),
        soalTes: updated.soalTes || "",
        formSchema: updated.formSchema || normalizedFormSchema,
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

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalPendaftar = ppdbData.length
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
          <p className="text-muted-foreground">Kelola pendaftaran dan proses seleksi murid baru</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isExportLoading}>
            {isExportLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {isExportLoading ? "Exporting..." : "Export Diterima"}
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

      {/* Tes Konfigurasi */}
      <PpdbTesKonfigurasiCard
        selectedJenjang={selectedJenjangTes}
        configByJenjang={tesConfigByJenjang}
        isLoading={isTesConfigLoading}
        isSaving={isTesConfigSaving}
        onJenjangChange={setSelectedJenjangTes}
        onToggle={(jenjang, checked) => updateTesConfigDraft(jenjang, { fiturSoalAktif: checked })}
        onSoalChange={(jenjang, soal) => updateTesConfigDraft(jenjang, { soalTes: soal })}
        onFormSchemaChange={(jenjang, schema) => updateTesConfigDraft(jenjang, { formSchema: schema })}
        onSave={handleUpdateTesConfig}
      />

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
        loading={loading}
        searchQuery={searchQuery}
        selectedStatus={selectedStatus}
        selectedProgram={selectedProgram}
        programOptions={programOptions}
        verificationLoading={verificationLoading}
        deleteLoading={deleteLoading}
        onSearchChange={setSearchQuery}
        onStatusChange={setSelectedStatus}
        onProgramChange={setSelectedProgram}
        onDetail={handleOpenDetail}
        onVerifikasi={handleVerifikasi}
        onDelete={handleDeletePendaftar}
        onCreateTagihan={handleCreateTagihan}
        tagihanLoading={isTagihanLoading}
      />

      {/* Rekap Diterima & Ditolak */}
      <PpdbRekapCard data={ppdbData} />

      {/* Detail Dialog */}
      <PpdbDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        pendaftar={selectedPendaftar}
        isLoading={isDetailLoading}
        selectedPendaftarJenjang={selectedPendaftarJenjang}
        tesConfig={selectedPendaftarTesConfig}
        isTesResultSaving={testResultLoading}
        onTesResultSave={handleSaveTesResult}
        onUploadFile={handleUploadFile}
      />

      {/* Konfirmasi Terima Dialog */}
      <Dialog open={isTerimaOpen} onOpenChange={(open) => {
        setIsTerimaOpen(open)
        if (open) void loadKelasList()
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

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="integrasikanSantri"
                checked={integrasikanSantri}
                onChange={(e) => setIntegrasikanSantri(e.target.checked)}
                className="rounded border-gray-300 text-primary shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 h-4 w-4"
              />
              <Label htmlFor="integrasikanSantri" className="cursor-pointer font-normal">
                Integrasikan Langsung Data ke Master Santri
              </Label>
            </div>

            {integrasikanSantri && (
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
                  Kelas diperlukan untuk mendaftarkan akun santri secara otomatis.
                </p>
              </div>
            )}
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
