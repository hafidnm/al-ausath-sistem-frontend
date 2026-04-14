"use client"

import { useEffect, useMemo, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, Plus, Trash2, Check } from "lucide-react"
import {
  NilaiMapelTugasItem,
  NilaiMapelUlanganItem,
  UpsertNilaiMapelPayload,
} from "@/lib/services/nilai-mapel.service"
import { kkmService } from "@/lib/services/kkm.service"
import { authService } from "@/lib/services/auth.service"
import { santriService, type SantriItem } from "@/lib/services/santri.service"
import { mataPelajaranService, type MataPelajaranItem } from "@/lib/services/mata-pelajaran.service"
import { semesterOptions, tahunAjaranOptions, jenisTugasOptions } from "../utils/constants"
import { calculateRaporRaw, normalizeRaporDisplay, statusKkm } from "../utils/helpers"

interface NilaiMapelFormProps {
  initialNomorInduk?: string
  onSubmit?: (data: UpsertNilaiMapelPayload) => Promise<void> | void
  onCancel?: () => void
}

const extractPetugasInputId = (me: any): number | undefined => {
  const candidates = [
    me?.user?.id_petugas,
    me?.user?.petugas_id,
    me?.user?.idDataPetugas,
    me?.user?.data_petugas?.id,
    me?.id_petugas,
    me?.petugas_id,
    me?.idDataPetugas,
    me?.data_petugas?.id,
    me?.user?.id,
    me?.id,
  ]

  for (const candidate of candidates) {
    const id = Number(candidate)
    if (Number.isFinite(id) && id > 0) {
      return id
    }
  }

  return undefined
}

const defaultTugas: NilaiMapelTugasItem[] = [
  { nilai: 0, jenis: "PR" },
  { nilai: 0, jenis: "TUGAS_PENGGANTI" },
  { nilai: 0, jenis: "MODUL_KOMPETENSI" },
]

const defaultUlangan: NilaiMapelUlanganItem[] = [
  { nilai: 0, soal_disusun_pengajar: true, diawasi_pengajar: true },
  { nilai: 0, soal_disusun_pengajar: true, diawasi_pengajar: true },
  { nilai: 0, soal_disusun_pengajar: true, diawasi_pengajar: true },
]

const toErrorMessage = (error: any): string => {
  const message = error?.response?.data?.message
  const errors = error?.response?.data?.errors

  if (typeof message === "string" && message) return message

  if (errors && typeof errors === "object") {
    const firstField = Object.keys(errors)[0]
    const firstValue = errors[firstField]

    if (Array.isArray(firstValue) && firstValue.length > 0) {
      return String(firstValue[0])
    }

    if (typeof firstValue === "string") {
      return firstValue
    }
  }

  return "Gagal menyimpan nilai mapel"
}

export function NilaiMapelForm({ initialNomorInduk = "", onSubmit, onCancel }: NilaiMapelFormProps) {
  const [selectedNomorInduk, setSelectedNomorInduk] = useState(initialNomorInduk)
  const [selectedNama, setSelectedNama] = useState("")
  const [selectedSantriId, setSelectedSantriId] = useState<number | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const [santriResults, setSantriResults] = useState<SantriItem[]>([])
  const [isLoadingSantri, setIsLoadingSantri] = useState(false)
  const [santriSearchError, setSantriSearchError] = useState("")
  const [openSantriPopover, setOpenSantriPopover] = useState(false)
  const [kodeMapel, setKodeMapel] = useState("")
  const [mapelSearchInput, setMapelSearchInput] = useState("")
  const [mapelResults, setMapelResults] = useState<MataPelajaranItem[]>([])
  const [isLoadingMapel, setIsLoadingMapel] = useState(false)
  const [mapelSearchError, setMapelSearchError] = useState("")
  const [openMapelPopover, setOpenMapelPopover] = useState(false)
  const [selectedNamaMapel, setSelectedNamaMapel] = useState("")
  const [selectedMapelId, setSelectedMapelId] = useState<number | null>(null)
  const [isKodeMapelManual, setIsKodeMapelManual] = useState(true)
  const [kodeKelas, setKodeKelas] = useState("")
  const [isKodeKelasManual, setIsKodeKelasManual] = useState(true)
  const [tahunAjaran, setTahunAjaran] = useState("")
  const [semester, setSemester] = useState("")
  const [keterangan, setKeterangan] = useState("")
  const [ujianAkhir, setUjianAkhir] = useState(0)
  const [tugas, setTugas] = useState<NilaiMapelTugasItem[]>(defaultTugas)
  const [ulangan, setUlangan] = useState<NilaiMapelUlanganItem[]>(defaultUlangan)
  const [petugasInputId, setPetugasInputId] = useState<number | undefined>(undefined)
  const [nilaiKkm, setNilaiKkm] = useState<number | undefined>(undefined)
  const [isLoadingKkm, setIsLoadingKkm] = useState(false)
  const [isUserReady, setIsUserReady] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const normalizeCode = (value: string): string => value.trim().toUpperCase()

  const applySelectedSantri = (santri: SantriItem) => {
    setSelectedNomorInduk(santri.nomor_induk)
    setSelectedNama(santri.nama_lengkap ?? "")
    setSelectedSantriId(santri.id)

    const kodeKelasSantri = santri.kode_kelas ?? santri.kelas

    if (kodeKelasSantri) {
      setKodeKelas(kodeKelasSantri)
      setIsKodeKelasManual(false)
    } else {
      setIsKodeKelasManual(true)
    }

    setSearchInput("")
    setOpenSantriPopover(false)
  }

  const applySelectedMapel = (mapel: MataPelajaranItem) => {
    setKodeMapel(mapel.kode_mapel)
    setSelectedNamaMapel(mapel.nama_mapel ?? "")
    setSelectedMapelId(mapel.id)
    setIsKodeMapelManual(false)
    setMapelSearchInput("")
    setOpenMapelPopover(false)
  }

  useEffect(() => {
    const loadUser = async () => {
      const me = await authService.me()
      const id = extractPetugasInputId(me)
      setPetugasInputId(id)
      setIsUserReady(true)
    }

    loadUser()
  }, [])

  useEffect(() => {
    if (!searchInput.trim()) {
      setSantriResults([])
      setSantriSearchError("")
      return
    }

    let cancelled = false

    const searchSantri = async () => {
      try {
        setIsLoadingSantri(true)
        setSantriSearchError("")
        // Search API support both nomor_induk and nama
        const results = await santriService.search(searchInput.trim())
        if (!cancelled) {
          setSantriResults(results)
        }
      } catch {
        if (!cancelled) {
          setSantriResults([])
          setSantriSearchError("Gagal mengambil data santri dari server")
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSantri(false)
        }
      }
    }

    const timer = setTimeout(searchSantri, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [searchInput])

  useEffect(() => {
    const query = searchInput.trim().toLowerCase()
    if (!query || selectedSantriId) return

    const exact = santriResults.find((item) => item.nomor_induk.trim().toLowerCase() === query)
    if (exact) {
      applySelectedSantri(exact)
    }
  }, [santriResults, searchInput, selectedSantriId])

  useEffect(() => {
    const query = mapelSearchInput.trim().toLowerCase()
    if (!query || selectedMapelId) return

    const exact = mapelResults.find(
      (item) => item.kode_mapel.trim().toLowerCase() === query || item.nama_mapel?.trim().toLowerCase() === query
    )
    if (exact) {
      applySelectedMapel(exact)
    }
  }, [mapelResults, mapelSearchInput, selectedMapelId])

  useEffect(() => {
    if (!mapelSearchInput.trim()) {
      setMapelResults([])
      setMapelSearchError("")
      return
    }

    let cancelled = false

    const searchMapel = async () => {
      try {
        setIsLoadingMapel(true)
        setMapelSearchError("")
        const results = await mataPelajaranService.search(mapelSearchInput.trim())
        if (!cancelled) {
          setMapelResults(results)
        }
      } catch {
        if (!cancelled) {
          setMapelResults([])
          setMapelSearchError("Gagal mengambil data mata pelajaran dari server")
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMapel(false)
        }
      }
    }

    const timer = setTimeout(searchMapel, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [mapelSearchInput])

  useEffect(() => {
    const kodeMapelTrimmed = kodeMapel.trim()
    if (!kodeMapelTrimmed || !tahunAjaran || !semester) {
      setNilaiKkm(undefined)
      return
    }

    let cancelled = false

    const loadKkm = async () => {
      try {
        setIsLoadingKkm(true)
        let rows = await kkmService.getAll({
          kode_mapel: kodeMapelTrimmed,
          tahun_ajaran: tahunAjaran,
          semester: Number(semester),
          per_page: "10",
        })

        // Fallback: beberapa backend mengabaikan/mismatch filter tahun/semester.
        // Ambil by kode_mapel lalu pilih baris paling relevan di frontend.
        if (rows.length === 0) {
          rows = await kkmService.getAll({
            kode_mapel: kodeMapelTrimmed,
            per_page: "50",
          })
        }

        if (cancelled) return

        const kodeMapelNormalized = normalizeCode(kodeMapelTrimmed)
        const selected = rows.find((row) => (
          normalizeCode(row.kode_mapel) === kodeMapelNormalized
          && row.tahun_ajaran === tahunAjaran
          && String(row.semester) === semester
        ))
          ?? rows.find((row) => normalizeCode(row.kode_mapel) === kodeMapelNormalized)
          ?? rows[0]

        setNilaiKkm(selected?.nilai_kkm)
      } catch {
        if (!cancelled) {
          setNilaiKkm(undefined)
        }
      } finally {
        if (!cancelled) {
          setIsLoadingKkm(false)
        }
      }
    }

    loadKkm()

    return () => {
      cancelled = true
    }
  }, [kodeMapel, tahunAjaran, semester])

  const preview = useMemo(() => {
    const raw = calculateRaporRaw(tugas, ulangan, ujianAkhir)
    const normalized = normalizeRaporDisplay(raw)
    const status = statusKkm(normalized.nilai, nilaiKkm ?? 75)

    return {
      raw,
      nilai: normalized.nilai,
      isRed: normalized.isRed,
      status,
    }
  }, [nilaiKkm, tugas, ulangan, ujianAkhir])

  const updateTugas = (index: number, patch: Partial<NilaiMapelTugasItem>) => {
    setTugas((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)))
  }

  const updateUlangan = (index: number, patch: Partial<NilaiMapelUlanganItem>) => {
    setUlangan((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedNomorInduk.trim() || !kodeMapel.trim() || !kodeKelas.trim() || !tahunAjaran || !semester) {
      setError("Nomor induk, kode mapel, kode kelas, tahun ajaran, dan semester wajib diisi")
      return
    }

    if (tugas.length < 3) {
      setError("Minimal 3 item tugas wajib diisi")
      return
    }

    if (ulangan.length < 3) {
      setError("Minimal 3 item ulangan wajib diisi")
      return
    }

    if (ulangan.some((item) => !item.soal_disusun_pengajar || !item.diawasi_pengajar)) {
      setError("Setiap ulangan wajib memiliki soal disusun pengajar dan diawasi pengajar")
      return
    }

    if (!isUserReady) {
      setError("Data user belum siap, tunggu sebentar lalu coba simpan lagi")
      return
    }

    if (!petugasInputId) {
      setError("ID petugas input tidak ditemukan dari akun login. Silakan refresh halaman atau cek data akun petugas")
      return
    }

    if (nilaiKkm == null) {
      setError("KKM mapel belum ditemukan. Pastikan KKM mapel sudah disetting untuk tahun ajaran dan semester ini")
      return
    }

    try {
      setIsSubmitting(true)
      setError("")

      await onSubmit?.({
        nomor_induk: selectedNomorInduk.trim(),
        kode_mapel: kodeMapel.trim(),
        kode_kelas: kodeKelas.trim(),
        tahun_ajaran: tahunAjaran,
        semester: Number(semester),
        id_petugas_input: petugasInputId,
        keterangan: keterangan.trim() || undefined,
        tugas,
        ulangan,
        ujian_akhir: ujianAkhir,
      })
    } catch (err) {
      setError(toErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Input Nilai Mapel</CardTitle>
        <CardDescription>Minimal 3 tugas dan 3 ulangan, serta validasi aturan nilai rapor</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <Alert className="bg-destructive/10 border-destructive/30">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <AlertDescription className="text-destructive ml-2">{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nomor Induk</Label>
              <div className="relative">
                <Input
                  placeholder="Cari berdasarkan nomor induk atau nama..."
                  value={selectedNomorInduk && !searchInput ? `${selectedNomorInduk}${selectedNama ? " - " + selectedNama : ""}` : searchInput}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return
                    e.preventDefault()

                    const query = searchInput.trim().toLowerCase()
                    if (!query || santriResults.length === 0) return

                    const exact = santriResults.find((item) => item.nomor_induk.trim().toLowerCase() === query)
                    applySelectedSantri(exact ?? santriResults[0])
                  }}
                  onChange={(e) => {
                    const value = e.target.value
                    setSearchInput(value)
                    setSelectedNomorInduk("")
                    setSelectedNama("")
                    setSelectedSantriId(null)
                    setIsKodeKelasManual(true)
                    setOpenSantriPopover(true)
                  }}
                  onFocus={() => setOpenSantriPopover(true)}
                  onBlur={() => {
                    setTimeout(() => setOpenSantriPopover(false), 120)
                  }}
                />

                {openSantriPopover && (searchInput.trim() || isLoadingSantri || santriResults.length > 0) && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover p-1 shadow-md">
                    {isLoadingSantri && (
                      <div className="px-2 py-4 text-center text-sm text-muted-foreground">Mencari santri...</div>
                    )}

                    {!isLoadingSantri && santriSearchError && (
                      <div className="px-2 py-4 text-center text-sm text-destructive">{santriSearchError}</div>
                    )}

                    {!isLoadingSantri && !santriSearchError && santriResults.length === 0 && searchInput.trim() && (
                      <div className="px-2 py-4 text-center text-sm text-muted-foreground">Tidak ada santri ditemukan</div>
                    )}

                    {!isLoadingSantri && santriResults.length > 0 && (
                      <div className="max-h-60 overflow-auto">
                        {santriResults.map((santri) => (
                          <button
                            key={santri.id}
                            type="button"
                            className="flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left hover:bg-accent"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => applySelectedSantri(santri)}
                          >
                            <Check
                              className={`mt-0.5 h-4 w-4 ${
                                selectedNomorInduk === santri.nomor_induk ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            <div className="flex-1">
                              <div className="font-medium">{santri.nomor_induk} - {santri.nama_lengkap}</div>
                              {(santri.kode_kelas ?? santri.kelas) && (
                                <div className="text-xs text-muted-foreground">{santri.kode_kelas ?? santri.kelas}</div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Kode Mapel</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Cari berdasarkan kode atau nama mapel..."
                    value={kodeMapel && !mapelSearchInput ? `${kodeMapel}${selectedNamaMapel ? " - " + selectedNamaMapel : ""}` : mapelSearchInput}
                    disabled={!isKodeMapelManual && Boolean(selectedMapelId) && Boolean(kodeMapel.trim())}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return
                      e.preventDefault()

                      const query = mapelSearchInput.trim().toLowerCase()
                      if (!query || mapelResults.length === 0) return

                      const exact = mapelResults.find((item) => item.kode_mapel.trim().toLowerCase() === query || item.nama_mapel?.trim().toLowerCase() === query)
                      applySelectedMapel(exact ?? mapelResults[0])
                    }}
                    onChange={(e) => {
                      const value = e.target.value
                      setMapelSearchInput(value)
                      setKodeMapel("")
                      setSelectedNamaMapel("")
                      setSelectedMapelId(null)
                      setIsKodeMapelManual(true)
                      setOpenMapelPopover(true)
                    }}
                  onFocus={() => setOpenMapelPopover(true)}
                  onBlur={() => {
                    setTimeout(() => setOpenMapelPopover(false), 120)
                  }}
                />

                {openMapelPopover && (mapelSearchInput.trim() || isLoadingMapel || mapelResults.length > 0) && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover p-1 shadow-md">
                    {isLoadingMapel && (
                      <div className="px-2 py-4 text-center text-sm text-muted-foreground">Mencari mapel...</div>
                    )}

                    {!isLoadingMapel && mapelSearchError && (
                      <div className="px-2 py-4 text-center text-sm text-destructive">{mapelSearchError}</div>
                    )}

                    {!isLoadingMapel && !mapelSearchError && mapelResults.length === 0 && mapelSearchInput.trim() && (
                      <div className="px-2 py-4 text-center text-sm text-muted-foreground">Tidak ada mata pelajaran ditemukan</div>
                    )}

                    {!isLoadingMapel && mapelResults.length > 0 && (
                      <div className="max-h-60 overflow-auto">
                        {mapelResults.map((mapel) => (
                          <button
                            key={mapel.id}
                            type="button"
                            className="flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left hover:bg-accent"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => applySelectedMapel(mapel)}
                          >
                            <Check
                              className={`mt-0.5 h-4 w-4 ${
                                selectedMapelId === mapel.id ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            <div className="flex-1">
                              <div className="font-medium">{mapel.kode_mapel} - {mapel.nama_mapel}</div>
                              {mapel.kelompok_mapel && (
                                <div className="text-xs text-muted-foreground">{mapel.kelompok_mapel}</div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                </div>
                {!isKodeMapelManual && Boolean(selectedMapelId) && Boolean(kodeMapel.trim()) && (
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-transparent"
                    onClick={() => setIsKodeMapelManual(true)}
                  >
                    Ubah Manual
                  </Button>
                )}
              </div>
              {!isKodeMapelManual && Boolean(selectedMapelId) && selectedNamaMapel && (
                <p className="text-xs text-muted-foreground">Kode mapel diisi otomatis dari opsi mapel yang tersedia.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Kode Kelas</Label>
              <div className="flex gap-2">
                <Input
                  value={kodeKelas}
                  onChange={(e) => setKodeKelas(e.target.value)}
                  placeholder="KLS-10A"
                  disabled={!isKodeKelasManual && Boolean(selectedSantriId) && Boolean(kodeKelas.trim())}
                />
                {!isKodeKelasManual && Boolean(selectedSantriId) && Boolean(kodeKelas.trim()) && (
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-transparent"
                    onClick={() => setIsKodeKelasManual(true)}
                  >
                    Ubah Manual
                  </Button>
                )}
              </div>
              {!isKodeKelasManual && Boolean(selectedSantriId) && Boolean(kodeKelas.trim()) && (
                <p className="text-xs text-muted-foreground">Kode kelas diisi otomatis dari data santri.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Tahun Ajaran</Label>
              <Select value={tahunAjaran} onValueChange={setTahunAjaran}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tahun ajaran" />
                </SelectTrigger>
                <SelectContent>
                  {tahunAjaranOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Semester</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesterOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ujian Akhir</Label>
              <Input type="number" min={0} max={100} value={ujianAkhir} onChange={(e) => setUjianAkhir(Number(e.target.value))} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Komponen Tugas</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="bg-transparent"
                onClick={() => setTugas((prev) => [...prev, { nilai: 0, jenis: "PR" }])}
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Tugas
              </Button>
            </div>
            <div className="space-y-2">
              {tugas.map((item, index) => (
                <div key={`tugas-${index}`} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-md border border-border/50">
                  <Select value={item.jenis} onValueChange={(value) => updateTugas(index, { jenis: value as NilaiMapelTugasItem["jenis"] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {jenisTugasOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="number" min={0} max={100} value={item.nilai} onChange={(e) => updateTugas(index, { nilai: Number(e.target.value) })} />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={tugas.length <= 3}
                      onClick={() => setTugas((prev) => prev.filter((_, idx) => idx !== index))}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Komponen Ulangan</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="bg-transparent"
                onClick={() => setUlangan((prev) => [...prev, { nilai: 0, soal_disusun_pengajar: true, diawasi_pengajar: true }])}
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Ulangan
              </Button>
            </div>
            <div className="space-y-2">
              {ulangan.map((item, index) => (
                <div key={`ulangan-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 rounded-md border border-border/50">
                  <Input type="number" min={0} max={100} value={item.nilai} onChange={(e) => updateUlangan(index, { nilai: Number(e.target.value) })} />
                  <Label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={item.soal_disusun_pengajar} onCheckedChange={(checked) => updateUlangan(index, { soal_disusun_pengajar: Boolean(checked) })} />
                    Soal disusun pengajar
                  </Label>
                  <Label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={item.diawasi_pengajar} onCheckedChange={(checked) => updateUlangan(index, { diawasi_pengajar: Boolean(checked) })} />
                    Diawasi pengajar
                  </Label>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={ulangan.length <= 3}
                      onClick={() => setUlangan((prev) => prev.filter((_, idx) => idx !== index))}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Keterangan (opsional)</Label>
            <Textarea value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Catatan input nilai" />
          </div>

          <div className="rounded-md border border-border/50 p-4 bg-muted/20">
            <h4 className="font-semibold text-foreground mb-2">Preview Nilai Rapor</h4>
            <div className="grid sm:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Rapor Raw (20/30/50)</p>
                <p className="font-semibold text-foreground">{preview.raw.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Rapor Tampil</p>
                <p className={preview.isRed ? "font-semibold text-destructive" : "font-semibold text-primary"}>{preview.nilai}</p>
              </div>
              <div>
                <p className="text-muted-foreground">KKM Aktif</p>
                <p className="font-semibold text-foreground">{isLoadingKkm ? "Memuat..." : (nilaiKkm ?? "Belum diset")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status KKM</p>
                <p className="font-semibold text-foreground">{preview.status}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Flag Merah</p>
                <p className="font-semibold text-foreground">{preview.isRed ? "YA" : "TIDAK"}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t border-border/50">
            <div className="flex-1" />
            <Button type="button" variant="outline" className="bg-transparent" onClick={onCancel}>Batal</Button>
            <Button type="submit" disabled={isSubmitting || !isUserReady}>{isSubmitting ? "Menyimpan..." : "Simpan Nilai"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
