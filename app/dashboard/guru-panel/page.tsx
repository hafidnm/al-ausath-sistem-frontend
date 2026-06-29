"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/services/auth.service"
import { sesiAbsensiService } from "@/lib/services/sesiabsensi.service"
import type { TahunAjaranApiItem } from "@/lib/services/tahun-ajaran.service"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"
import { useUnit } from "@/contexts/unit-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  BookOpen,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  UserCheck,
  Send,
  History,
  ArrowRight,
  Check,
  UserX,
  Eye,
  ChevronsUpDown,
} from "lucide-react"

type GuruStatus = "hadir" | "izin" | "sakit"
type SantriStatus = "hadir" | "izin" | "sakit" | "alfa"

type JadwalItem = {
  id_sesi: number
  id_jadwal: number
  id_petugas_hadir?: number
  id_petugas_pengganti?: number | null
  kode_kelas?: string
  kode_unit?: string
  nama_unit?: string
  ruangan?: string
  tanggal?: string
  waktu_mulai?: string | null
  waktu_selesai?: string | null
  status_sesi?: string | null
  status_kehadiran_guru?: string | null
  keterangan?: string | null
  mapel: string
  kelas: string
  jenjang: string
  hari: string
  jam: string
  siswa: number
  nama_petugas?: string
  tahun_ajaran?: string
}

type SantriItem = {
  nomor_induk: string
  nama_lengkap_santri: string
  status_kehadiran?: string | null
  keterangan?: string | null
}

type PetugasOption = {
  id: number
  label: string
}

type RekapSantriRow = {
  nomor_induk: string
  nama_lengkap_santri: string
  kode_kelas: string
  nama_kelas: string
  total_pertemuan: number
  jumlah_hadir: number
  jumlah_izin: number
  jumlah_sakit: number
  jumlah_alfa: number
  persentase_kehadiran: number
}

type RekapKelasRow = {
  kode_kelas: string
  nama_kelas: string
  total_entri_absensi: number
  total_sesi: number
  total_santri_tercatat: number
  jumlah_hadir: number
  jumlah_izin: number
  jumlah_sakit: number
  jumlah_alfa: number
  persentase_kehadiran: number
}

type RekapPetugasRow = {
  id_petugas: number
  nama_lengkap: string
  peran_akun: string
  total_pertemuan: number
  jumlah_hadir: number
  jumlah_izin: number
  jumlah_sakit: number
  jumlah_alfa: number
  total_menit_terlambat: number
  rata_menit_terlambat_hadir: number
  persentase_kehadiran: number
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()
}

const getValidationBadge = (status?: string | null) => {
  if (!status) return <Badge variant="outline">-</Badge>

  switch (status.toLowerCase()) {
    case "validated":
      return <Badge className="bg-primary/10 text-primary border-0">Disetujui</Badge>
    case "pending":
      return <Badge className="bg-secondary text-secondary-foreground border-0">Menunggu</Badge>
    case "rejected":
      return <Badge className="bg-destructive/10 text-destructive border-0">Ditolak</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const getGuruStatusBadge = (status: GuruStatus | string) => {
  const value = String(status).toLowerCase()

  switch (value) {
    case "hadir":
      return <Badge className="bg-primary/10 text-primary border-0">Hadir</Badge>
    case "sakit":
      return <Badge className="bg-chart-3/20 text-chart-4 border-0">Sakit</Badge>
    case "izin":
      return <Badge className="bg-accent/20 text-accent border-0">Izin</Badge>
    case "alfa":
      return <Badge className="bg-rose-500/15 text-rose-700 border-0">Alfa</Badge>
    default:
      return <Badge variant="outline">-</Badge>
  }
}

const normalizeNumber = (value: unknown, fallback = 0) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const getHariOrder = (hari: string) => {
  const normalized = String(hari || "").toUpperCase()
  const order: Record<string, number> = {
    "SENIN": 1,
    "SELASA": 2,
    "RABU": 3,
    "KAMIS": 4,
    "JUMAT": 5,
    "SABTU": 6,
    "MINGGU": 7,
  }

  return order[normalized] ?? 99
}

const toArray = (value: unknown): any[] => {
  if (Array.isArray(value)) return value
  return []
}

const uniqueOptions = (items: Array<{ value: string; label: string }>) => {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (!item.value || seen.has(item.value)) return false
    seen.add(item.value)
    return true
  })
}

const normalizeUnitCode = (value: unknown): string => String(value || "").trim().toUpperCase()

const mapSesiToJadwal = (item: any): JadwalItem => {
  const jadwal = item?.jadwal ?? {}
  const kelasMapel = jadwal?.kelasMapel ?? jadwal?.kelas_mapel ?? {}
  const kelas = kelasMapel?.kelas ?? {}
  const mapel = kelasMapel?.mataPelajaran ?? kelasMapel?.mata_pelajaran ?? {}

  const jamMulai = jadwal?.jam_mulai ?? item?.waktu_mulai ?? ""
  const jamSelesai = jadwal?.jam_selesai ?? item?.waktu_selesai ?? ""
  const jam = jamMulai && jamSelesai ? `${jamMulai} - ${jamSelesai}` : "-"

  return {
    id_sesi: normalizeNumber(item?.id_sesi ?? item?.id ?? 0),
    id_jadwal: normalizeNumber(item?.id_jadwal ?? jadwal?.id_jadwal ?? 0),
    id_petugas_hadir: normalizeNumber(item?.id_petugas_hadir ?? 0),
    id_petugas_pengganti: item?.id_petugas_pengganti ?? null,
    kode_kelas: kelas?.kode_kelas ?? kelasMapel?.kode_kelas ?? item?.kode_kelas ?? undefined,
    tanggal: item?.tanggal,
    waktu_mulai: item?.waktu_mulai ?? null,
    waktu_selesai: item?.waktu_selesai ?? null,
    status_sesi: item?.status_sesi ?? null,
    status_kehadiran_guru: item?.absensi_pengajar?.[0]?.status_kehadiran ?? item?.absensiPengajar?.[0]?.status_kehadiran ?? null,
    keterangan: item?.keterangan ?? null,
    mapel: mapel?.nama_mapel ?? mapel?.kode_mapel ?? "-",
    kelas: kelas?.nama_kelas ?? kelas?.kode_kelas ?? kelasMapel?.kode_kelas ?? "-",
    jenjang: kelas?.jenjang ?? "-",
    hari: jadwal?.hari ?? "-",
    jam,
    kode_unit: normalizeUnitCode(kelas?.kode_unit ?? kelasMapel?.kode_unit ?? jadwal?.kode_unit ?? item?.kode_unit),
    nama_unit: String(kelas?.nama_unit ?? kelasMapel?.nama_unit ?? jadwal?.nama_unit ?? item?.nama_unit ?? "").trim(),
    siswa: normalizeNumber(item?.absensi_santri_count ?? item?.total_santri ?? 0),
    tahun_ajaran: kelasMapel?.tahun_ajaran ?? kelas?.tahun_ajaran ?? item?.tahun_ajaran ?? undefined,
  }
}

const mapJadwalToDisplay = (item: any): JadwalItem => {
  const kelasMapel = item?.kelas_mapel ?? item?.kelasMapel ?? {}
  const kelas = kelasMapel?.kelas ?? item?.kelas ?? {}
  const mapel =
    kelasMapel?.mata_pelajaran ??
    kelasMapel?.mataPelajaran ??
    item?.mata_pelajaran ??
    item?.mataPelajaran ??
    item?.mapel ??
    {}

  const jamMulai = item?.jam_mulai ?? ""
  const jamSelesai = item?.jam_selesai ?? ""
  const jam = jamMulai && jamSelesai ? `${jamMulai} - ${jamSelesai}` : "-"
  const petugas = kelasMapel?.petugas ?? item?.petugas ?? {}

  return {
    id_sesi: normalizeNumber(item?.id_jadwal ?? item?.id ?? 0),
    id_jadwal: normalizeNumber(item?.id_jadwal ?? item?.id ?? 0),
    id_petugas_hadir: normalizeNumber(item?.id_petugas ?? kelasMapel?.id_petugas ?? kelasMapel?.petugas?.id_petugas ?? 0),
    id_petugas_pengganti: null,
    kode_kelas: kelas?.kode_kelas ?? kelasMapel?.kode_kelas ?? item?.kode_kelas ?? undefined,
    ruangan: item?.ruangan ?? item?.ruang ?? null,
    tanggal: undefined,
    waktu_mulai: jamMulai || null,
    waktu_selesai: jamSelesai || null,
    status_sesi: item?.status ?? null,
    keterangan: item?.keterangan ?? null,
    mapel: mapel?.nama_mapel ?? mapel?.kode_mapel ?? item?.nama_mapel ?? item?.kode_mapel ?? "-",
    kelas: kelas?.nama_kelas ?? kelas?.kode_kelas ?? kelasMapel?.kode_kelas ?? item?.kode_kelas ?? "-",
    jenjang: kelas?.jenjang ?? "-",
    hari: String(item?.hari || "-").toUpperCase(),
    jam,
    kode_unit: normalizeUnitCode(kelas?.kode_unit ?? kelasMapel?.kode_unit ?? item?.kode_unit),
    nama_unit: String(kelas?.nama_unit ?? kelasMapel?.nama_unit ?? item?.nama_unit ?? "").trim(),
    siswa: 0,
    nama_petugas: petugas?.nama_lengkap ?? "-",
  }
}

const mapSantriStatusToApi = (status: SantriStatus): "HADIR" | "IZIN" | "SAKIT" | "ALFA" => {
  switch (status) {
    case "hadir":
      return "HADIR"
    case "izin":
      return "IZIN"
    case "sakit":
      return "SAKIT"
    default:
      return "ALFA"
  }
}

const mapGuruStatusToApi = (status: GuruStatus): "HADIR" | "IZIN" | "SAKIT" => {
  switch (status) {
    case "hadir":
      return "HADIR"
    case "izin":
      return "IZIN"
    default:
      return "SAKIT"
  }
}

export default function GuruPanelPage() {
  const { toast } = useToast()
  const { selectedKodeTahun, isLoading: isTahunLoading } = useTahunAjaran()
  const { selectedKodeUnit, isLoading: isUnitLoading } = useUnit()
  const contextReady = !isTahunLoading && !isUnitLoading
  // Guard: cegah double-invocation dari React StrictMode (development)
  const initCalledRef = useRef(false)

  const [loadingJadwal, setLoadingJadwal] = useState(false)
  const [jadwalMengajar, setJadwalMengajar] = useState<JadwalItem[]>([])
  const [aktivitasSesi, setAktivitasSesi] = useState<JadwalItem[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: number; id_petugas?: number | null; nama_lengkap: string; peran_akun: string } | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(false)

  const [rekapLoading, setRekapLoading] = useState(false)
  const [rekapPetugasRows, setRekapPetugasRows] = useState<RekapPetugasRow[]>([])
  const [activeTab, setActiveTab] = useState("jadwal")
  const [riwayatLoaded, setRiwayatLoaded] = useState(false)

  const [step, setStep] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false)

  const [selectedJadwal, setSelectedJadwal] = useState<JadwalItem | null>(null)
  const [sesiAktifId, setSesiAktifId] = useState<number | null>(null)

  const [guruHadir, setGuruHadir] = useState<GuruStatus>("hadir")
  const [guruPenggantiId, setGuruPenggantiId] = useState("")
  const [alasanTidakHadir, setAlasanTidakHadir] = useState("")
  const [openPetugasCombobox, setOpenPetugasCombobox] = useState(false)
  const [isGuruTidakHadirFlow, setIsGuruTidakHadirFlow] = useState(false)
  const [petugasOptions, setPetugasOptions] = useState<PetugasOption[]>([])
  const [isLoadingPetugas, setIsLoadingPetugas] = useState(false)
  const [kelasFilter, setKelasFilter] = useState("all")
  const [mapelFilter, setMapelFilter] = useState("all")
  const [petugasFilter, setPetugasFilter] = useState("all")
  const [hariFilter, setHariFilter] = useState("all")

  const [santriList, setSantriList] = useState<SantriItem[]>([])
  const [attendanceData, setAttendanceData] = useState<Record<string, SantriStatus>>({})
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0)

  const [isRiwayatDetailOpen, setIsRiwayatDetailOpen] = useState(false)
  const [selectedRiwayat, setSelectedRiwayat] = useState<any | null>(null)
  const [isRiwayatDetailLoading, setIsRiwayatDetailLoading] = useState(false)

  const dayName = useMemo(() => {
    const index = new Date().getDay()
    const names = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"]
    return names[index] || ""
  }, [])

  const isAdminUser = useMemo(() => {
    return String(currentUser?.peran_akun || "").toLowerCase().includes("admin")
  }, [currentUser])

  const currentPetugasId = useMemo(() => {
    if (!currentUser) return null

    const explicitId = normalizeNumber(currentUser.id_petugas ?? 0)
    if (explicitId > 0) return explicitId

    return normalizeNumber(currentUser.id)
  }, [currentUser])

  const petugasLabelById = useMemo(() => {
    const map = new Map<number, string>()
    for (const option of petugasOptions) {
      map.set(option.id, option.label)
    }
    return map
  }, [petugasOptions])

  const unitOptions = useMemo(() => {
    return uniqueOptions(
      jadwalMengajar
        .map((jadwal) => ({
          value: normalizeUnitCode(jadwal.kode_unit),
          label: jadwal.nama_unit || normalizeUnitCode(jadwal.kode_unit) || "-",
        }))
        .filter((item) => item.value),
    )
  }, [jadwalMengajar])

  const kelasOptions = useMemo(() => {
    const source = jadwalMengajar.filter((jadwal) => !selectedKodeUnit || jadwal.kode_unit === selectedKodeUnit)
    return uniqueOptions(source.map((jadwal) => ({ value: jadwal.kelas, label: jadwal.kelas })))
  }, [jadwalMengajar, selectedKodeUnit])

  const mapelOptions = useMemo(() => {
    const source = jadwalMengajar.filter(
      (jadwal) => (!selectedKodeUnit || jadwal.kode_unit === selectedKodeUnit) && (kelasFilter === "all" || jadwal.kelas === kelasFilter),
    )
    return uniqueOptions(source.map((jadwal) => ({ value: jadwal.mapel, label: jadwal.mapel })))
  }, [jadwalMengajar, selectedKodeUnit, kelasFilter])

  const petugasFilterOptions = useMemo(() => {
    const source = jadwalMengajar.filter(
      (jadwal) =>
        (!selectedKodeUnit || jadwal.kode_unit === selectedKodeUnit) &&
        (kelasFilter === "all" || jadwal.kelas === kelasFilter) &&
        (mapelFilter === "all" || jadwal.mapel === mapelFilter),
    )

    return uniqueOptions(
      source
        .map((jadwal) => ({
          value: String(jadwal.id_petugas_hadir ?? ""),
          label: jadwal.nama_petugas || (jadwal.id_petugas_hadir ? `ID ${jadwal.id_petugas_hadir}` : "-"),
        }))
        .filter((item) => item.value && item.value !== "0"),
    )
  }, [jadwalMengajar, selectedKodeUnit, kelasFilter, mapelFilter])

  const filteredSortedJadwalMengajar = useMemo(() => {
    const source = jadwalMengajar.filter((jadwal) => {
      const unitMatch = !selectedKodeUnit || jadwal.kode_unit === selectedKodeUnit
      const kelasMatch = kelasFilter === "all" || jadwal.kelas === kelasFilter
      const mapelMatch = mapelFilter === "all" || jadwal.mapel === mapelFilter
      const petugasMatch = petugasFilter === "all" || String(jadwal.id_petugas_hadir ?? "") === petugasFilter
      const hariMatch = hariFilter === "all" || String(jadwal.hari || "").toUpperCase() === hariFilter

      return unitMatch && kelasMatch && mapelMatch && petugasMatch && hariMatch
    })

    return [...source].sort((a, b) => {
      const dayDiff = getHariOrder(a.hari) - getHariOrder(b.hari)
      if (dayDiff !== 0) return dayDiff
      return String(a.jam || "").localeCompare(String(b.jam || ""))
    })
  }, [jadwalMengajar, selectedKodeUnit, kelasFilter, mapelFilter, petugasFilter, hariFilter])

  const todaySchedule = useMemo(() => {
    const today = jadwalMengajar.filter(
      (j) => String(j.hari || "").toUpperCase() === dayName && (!selectedKodeUnit || j.kode_unit === selectedKodeUnit)
    )

    if (!currentPetugasId) return today

    return today.filter((jadwal) => Number(jadwal.id_petugas_hadir) === Number(currentPetugasId))
  }, [currentPetugasId, dayName, jadwalMengajar, selectedKodeUnit])

  const todayDateStr = useMemo(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const date = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${date}`
  }, [])

  const jadwalDilimpahkan = useMemo(() => {
    if (!currentPetugasId) return []

    const visible = aktivitasSesi.filter(
      (item) => Number(item.id_petugas_pengganti) === Number(currentPetugasId) && String(item.tanggal || "").slice(0, 10) === todayDateStr
    )

    return [...visible].sort((a, b) => {
      // Sort terbaru dulu (created_at descending)
      const timeA = new Date(String(a.tanggal || "") + " " + String(a.waktu_mulai || "")).getTime()
      const timeB = new Date(String(b.tanggal || "") + " " + String(b.waktu_mulai || "")).getTime()
      return timeB - timeA
    })
  }, [aktivitasSesi, currentPetugasId, todayDateStr])

  const riwayatPresensi = useMemo(() => {
    let filtered = currentPetugasId
      ? aktivitasSesi.filter(
          (item) =>
            Number(item.id_petugas_hadir) === Number(currentPetugasId) ||
            Number(item.id_petugas_pengganti) === Number(currentPetugasId)
        )
      : aktivitasSesi

    if (selectedKodeTahun && selectedKodeTahun !== "ALL") {
      filtered = filtered.filter((item) => item.tahun_ajaran === selectedKodeTahun)
    }

    if (selectedKodeUnit) {
      filtered = filtered.filter((item) => normalizeUnitCode(item.kode_unit) === selectedKodeUnit)
    }

    return [...filtered].sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || ""))
  }, [aktivitasSesi, currentPetugasId, selectedKodeTahun, selectedKodeUnit])

  // Set id_jadwal yang sudah SELESAI hari ini → untuk highlight & sembunyikan tombol input

  const jadwalSelesaiHariIniSet = useMemo(() => {
    const set = new Set<number>()
    for (const sesi of aktivitasSesi) {
      if (
        String(sesi.status_sesi || "").toUpperCase() === "SELESAI" &&
        String(sesi.tanggal || "").slice(0, 10) === todayDateStr &&
        sesi.id_jadwal
      ) {
        set.add(Number(sesi.id_jadwal))
      }
    }
    return set
  }, [aktivitasSesi, todayDateStr])

  const completedCount = Object.keys(attendanceData).length
  const progressPercentage = santriList.length > 0 ? (completedCount / santriList.length) * 100 : 0
  // Flow tidak hadir: step 1 (pilih izin/sakit + pengganti) → step 2 (summary kirim)
  // Flow hadir: step 1 (input santri) → step 2 (summary kirim)
  const summaryStep = isGuruTidakHadirFlow ? 2 : 2
  const isPenggantiSamaPengajar =
    isGuruTidakHadirFlow &&
    !!selectedJadwal?.id_petugas_hadir &&
    Number(guruPenggantiId) === Number(selectedJadwal.id_petugas_hadir)
  const isGuruStepValid = guruPenggantiId.trim().length > 0 && !isPenggantiSamaPengajar
  const isSantriStepValid = santriList.length > 0 && santriList.every((s) => !!attendanceData[s.nomor_induk])
  const selectedPetugasPenggantiLabel =
    petugasOptions.find((option) => String(option.id) === guruPenggantiId)?.label || "-"

  const getPetugasLabel = (id?: number | null) => {
    if (!id) return "-"
    return petugasLabelById.get(Number(id)) || `ID ${id}`
  }

  const extractApiErrorMessage = (error: any, fallback: string) => {
    const message = error?.response?.data?.message
    return typeof message === "string" && message.length > 0 ? message : fallback
  }

  // ---------- Load functions ----------

  /**
   * Init: HANYA 2 HTTP request paralel.
   * 1. authService.me()           — untuk identitas user
   * 2. sesiAbsensiService.guruPanelInit() — 1 endpoint yang mengembalikan
   *    jadwal + petugas + tahun_ajaran + sesi_hari_ini sekaligus dari backend.
   */
  const loadInitData = async () => {
    setLoadingJadwal(true)
    setIsLoadingUser(true)
    setIsLoadingPetugas(true)
    try {
      const [userRes, initRes] = await Promise.all([
        authService.me(),
        sesiAbsensiService.guruPanelInit(
          selectedKodeTahun ? { tahun_ajaran: selectedKodeTahun } : undefined
        ),
      ])

      // --- User ---
      const user = userRes?.user
      if (user) {
        setCurrentUser({
          id: normalizeNumber(user.id),
          id_petugas: normalizeNumber((user as any).id_petugas ?? (user as any).petugas?.id_petugas ?? 0) || null,
          nama_lengkap: String(user.nama_lengkap || ""),
          peran_akun: String(user.peran_akun || ""),
        })
      }

      // --- Jadwal aktif ---
      const jadwalMapped = toArray(initRes.jadwal).map(mapJadwalToDisplay).filter((r) => r.id_jadwal > 0)
      setJadwalMengajar(jadwalMapped)

      // --- Tahun Ajaran ---
      // const tahunList = toArray(initRes.tahun_ajaran) as TahunAjaranApiItem[]
      // (tahunAjaranOptions not needed anymore as we rely on global context)

      // --- Petugas ---
      const petugasMapped = toArray(initRes.petugas)
        .map((item: any) => {
          const id = normalizeNumber(item.id_petugas ?? item.id ?? 0)
          if (id <= 0) return null
          const nama = String(item.nama_lengkap || "").trim() || `Pengajar #${id}`
          return { id, label: nama }
        })
        .filter((item): item is PetugasOption => item !== null)
      setPetugasOptions(petugasMapped)

      // --- Sesi hari ini → set aktivitasSesi untuk jadwalSelesaiHariIniSet & jadwalDilimpahkan ---
      const sesiMapped = toArray(initRes.sesi_hari_ini).map(mapSesiToJadwal).filter((r) => r.id_sesi > 0)
      setAktivitasSesi(sesiMapped)
    } catch (error: any) {
      toast({
        title: "Gagal memuat data",
        description: extractApiErrorMessage(error, "Terjadi kesalahan saat memuat data halaman."),
        variant: "destructive",
      })
    } finally {
      setLoadingJadwal(false)
      setIsLoadingUser(false)
      setIsLoadingPetugas(false)
    }
  }

  /** Dipanggil saat tab Jadwal perlu refresh (setelah submit absensi, cancel dialog, dll). */
  const loadJadwal = async () => {
    setLoadingJadwal(true)
    try {
      const initRes = await sesiAbsensiService.guruPanelInit(
        selectedKodeTahun ? { tahun_ajaran: selectedKodeTahun } : undefined
      )
      const jadwalMapped = toArray(initRes.jadwal).map(mapJadwalToDisplay).filter((r) => r.id_jadwal > 0)
      setJadwalMengajar(jadwalMapped)
      // Refresh sesi hari ini sekaligus agar jadwalSelesaiHariIniSet up-to-date
      const sesiMapped = toArray(initRes.sesi_hari_ini).map(mapSesiToJadwal).filter((r) => r.id_sesi > 0)
      setAktivitasSesi(sesiMapped)
    } catch (error: any) {
      toast({
        title: "Gagal memuat jadwal pembelajaran",
        description: extractApiErrorMessage(error, "Terjadi kesalahan saat mengambil data jadwal pembelajaran."),
        variant: "destructive",
      })
    } finally {
      setLoadingJadwal(false)
    }
  }

  /** Dipanggil hanya saat tab Riwayat perlu refresh. Bisa dikirim filter tahun_ajaran. */
  const loadAktivitasSesi = async (tahunAjaran?: string) => {
    try {
      const params: Record<string, string | number> = { per_page: 200 }
      if (tahunAjaran && tahunAjaran !== "ALL") params.tahun_ajaran = tahunAjaran
      const rows = await sesiAbsensiService.getAll(params)
      const mapped = toArray(rows).map(mapSesiToJadwal).filter((r) => r.id_sesi > 0)
      setAktivitasSesi(mapped)
    } catch (error: any) {
      toast({
        title: "Gagal memuat aktivitas sesi",
        description: extractApiErrorMessage(error, "Terjadi kesalahan saat mengambil aktivitas sesi absensi."),
        variant: "destructive",
      })
    }
  }

  const loadRekap = async (idPetugas?: number | null, tahunOverride?: string) => {
    setRekapLoading(true)
    try {
      const params: Record<string, string | number | boolean> = { per_page: 100 }
      const activePetugas = idPetugas !== undefined ? idPetugas : currentPetugasId
      if (activePetugas) params.id_petugas = activePetugas

      const activeTahun = tahunOverride !== undefined ? tahunOverride : selectedKodeTahun
      if (activeTahun && activeTahun !== "ALL") {
        params.tahun_ajaran = activeTahun
      }

      // Filter by unit header
      if (selectedKodeUnit) {
        params.kode_unit = selectedKodeUnit
      }

      const result = await sesiAbsensiService.rekapPetugas(params)
      const rows = toArray(result?.data) as RekapPetugasRow[]
      const filtered = activePetugas ? rows.filter((r) => Number(r.id_petugas) === Number(activePetugas)) : rows
      setRekapPetugasRows(filtered)
    } catch (error: any) {
      toast({
        title: "Gagal memuat data rekap",
        description: extractApiErrorMessage(error, "Data rekap belum bisa ditampilkan."),
        variant: "destructive",
      })
    } finally {
      setRekapLoading(false)
    }
  }

  // Mount: 2 call paralel (me + guru-panel/init), dengan guard untuk cegah double-invoke
  // Tunggu context siap dulu sebelum fetch agar filter tahun_ajaran dari header tersedia
  useEffect(() => {
    if (!contextReady) return
    if (initCalledRef.current) return
    initCalledRef.current = true
    void loadInitData()
  }, [contextReady])

  // Lazy load: data sesi historis & rekap baru diambil saat tab Riwayat pertama kali dibuka
  useEffect(() => {
    if (activeTab === "riwayat" && !riwayatLoaded && currentPetugasId !== undefined) {
      setRiwayatLoaded(true)
      void Promise.all([
        loadAktivitasSesi(selectedKodeTahun || undefined),
        loadRekap(currentPetugasId, selectedKodeTahun || undefined),
      ])
    }
  }, [activeTab, riwayatLoaded, currentPetugasId, selectedKodeTahun])

  // Re-fetch rekap & riwayat sesi saat filter tahun ajaran berubah (hanya jika tab Riwayat sudah pernah dibuka)
  useEffect(() => {
    if (riwayatLoaded && currentPetugasId) {
      void Promise.all([
        loadAktivitasSesi(selectedKodeTahun || undefined),
        loadRekap(currentPetugasId, selectedKodeTahun || undefined),
      ])
    }
  }, [selectedKodeTahun])

  // Re-fetch rekap saat filter unit header berubah (hanya jika tab Riwayat sudah pernah dibuka)
  useEffect(() => {
    if (riwayatLoaded && currentPetugasId) {
      void loadRekap(currentPetugasId, selectedKodeTahun || undefined)
    }
  }, [selectedKodeUnit])

  // Re-fetch jadwal saat tahun ajaran global berubah (setelah mount pertama)
  const isMountedRef = useRef(false)
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true
      return
    }
    // Reload jadwal dengan filter tahun_ajaran baru
    void loadJadwal()
  }, [selectedKodeTahun])

  const resetDialogState = () => {
    setStep(1)
    setSesiAktifId(null)
    setSantriList([])
    setAttendanceData({})
    setCurrentStudentIndex(0)
    setGuruPenggantiId("")
    setAlasanTidakHadir("")
    setIsSubmitSuccess(false)
  }

  const handleOpenInput = async (jadwal: JadwalItem) => {
    setSelectedJadwal(jadwal)
    resetDialogState()
    setGuruHadir("hadir")
    setIsGuruTidakHadirFlow(false)
    setIsDialogOpen(true)
    // Langsung mulai sesi dengan status HADIR dan muat daftar santri
    setIsSubmitting(true)
    try {
      const mulai = await sesiAbsensiService.mulai({
        id_jadwal: jadwal.id_jadwal,
        tanggal: jadwal.tanggal,
        status_kehadiran: "HADIR",
      })
      const idSesi = Number((mulai as any)?.data?.id_sesi)
      if (!idSesi) throw new Error("ID sesi tidak ditemukan dari response mulai sesi.")
      setSesiAktifId(idSesi)
      await loadDaftarSantri(idSesi)
      setStep(1)
    } catch (error: any) {
      toast({
        title: "Gagal membuka sesi",
        description: extractApiErrorMessage(error, "Periksa jadwal lalu coba lagi."),
        variant: "destructive",
      })
      setIsDialogOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenGuruTidakHadir = (jadwal: JadwalItem) => {
    setSelectedJadwal(jadwal)
    resetDialogState()
    setGuruHadir("izin")
    setIsGuruTidakHadirFlow(true)
    setIsDialogOpen(true)
  }

  const handleSetAttendance = (nomorInduk: string, status: SantriStatus) => {
    setAttendanceData((prev) => ({ ...prev, [nomorInduk]: status }))
    if (currentStudentIndex < santriList.length - 1) {
      setTimeout(() => {
        setCurrentStudentIndex((prev) => prev + 1)
      }, 250)
    }
  }

  const loadDaftarSantri = async (idSesi: number) => {
    const response = await sesiAbsensiService.getDaftarSantri(idSesi)
    const santri = toArray((response as any)?.santri) as SantriItem[]
    setSantriList(santri)

    const initial: Record<string, SantriStatus> = {}
    for (const item of santri) {
      const value = String(item.status_kehadiran || "").toLowerCase()
      if (value === "hadir" || value === "izin" || value === "sakit" || value === "alfa") {
        initial[item.nomor_induk] = value as SantriStatus
      }
    }
    setAttendanceData(initial)
  }

  // handleStartSesi hanya dipakai untuk flow guru tidak hadir (izin/sakit)
  const handleStartSesi = async () => {
    if (!selectedJadwal?.id_jadwal) {
      toast({ title: "Gagal", description: "ID jadwal tidak ditemukan.", variant: "destructive" })
      return
    }
    if (isPenggantiSamaPengajar) {
      toast({ title: "Gagal", description: "Guru pengganti tidak boleh sama dengan pengajar utama.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const statusApi = mapGuruStatusToApi(guruHadir) as "IZIN" | "SAKIT"
      const mulai = await sesiAbsensiService.mulai({
        id_jadwal: selectedJadwal.id_jadwal,
        tanggal: selectedJadwal.tanggal,
        status_kehadiran: statusApi,
        keterangan: alasanTidakHadir || undefined,
      })

      const idSesi = Number((mulai as any)?.data?.id_sesi)
      if (!idSesi) {
        throw new Error("ID sesi tidak ditemukan dari response mulai sesi.")
      }

      setSesiAktifId(idSesi)

      await sesiAbsensiService.setPengganti(idSesi, {
        id_petugas_pengganti: Number(guruPenggantiId),
        status_kehadiran: statusApi,
        keterangan: alasanTidakHadir || undefined,
      })
      setStep(summaryStep)
      toast({ title: "Berhasil", description: "Pengganti berhasil diatur. Lanjut kirim laporan sesi." })
    } catch (error: any) {
      toast({
        title: "Gagal memulai sesi",
        description: extractApiErrorMessage(error, "Periksa data input lalu coba lagi."),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    if (!sesiAktifId) {
      toast({ title: "Gagal", description: "Sesi belum aktif.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      if (!isGuruTidakHadirFlow) {
        const payload = santriList.map((item) => ({
          nomor_induk: item.nomor_induk,
          status_kehadiran: mapSantriStatusToApi(attendanceData[item.nomor_induk] || "alfa"),
        }))

        await sesiAbsensiService.inputAbsensiSantri(sesiAktifId, { absensi: payload })
        await sesiAbsensiService.selesai(sesiAktifId, { status_sesi: "SELESAI", keterangan: alasanTidakHadir || undefined })
      }

      setIsSubmitSuccess(true)
      toast({ title: "Berhasil", description: "Data sesi absensi berhasil diproses." })

      setTimeout(() => {
        setIsDialogOpen(false)
        setIsSubmitSuccess(false)
        setSesiAktifId(null)
        setSelectedJadwal(null)
        setGuruHadir("hadir")
        setGuruPenggantiId("")
        setAlasanTidakHadir("")
        setIsGuruTidakHadirFlow(false)
        setSantriList([])
        setAttendanceData({})
        setCurrentStudentIndex(0)
        setStep(1)
      }, 1500)

      await loadJadwal()
      await loadAktivitasSesi()
    } catch (error: any) {
      toast({
        title: "Gagal kirim absensi",
        description: extractApiErrorMessage(error, "Terjadi kesalahan saat menyimpan absensi."),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrimaryAction = async () => {
    // Flow tidak hadir: step 1 = pilih status + pengganti, lanjut → summary + kirim
    if (isGuruTidakHadirFlow && step === 1) {
      await handleStartSesi()
      return
    }

    // Flow hadir: step 1 = input santri, lanjut → summary, step 2 = kirim
    if (!isGuruTidakHadirFlow && step === 1) {
      setStep(2)
      return
    }

    await handleSubmit()
  }

  const handleBackButton = async () => {
    if (step === 1) {
      // Step pertama: tutup dialog (trigger cancel sesi jika ada)
      await closePresensiDialog(false)
    } else {
      // Step 2 (summary): kembali ke step 1
      setStep(1)
    }
  }

  const handleOpenRiwayatDetail = async (item: JadwalItem) => {
    setSelectedRiwayat(null)
    setIsRiwayatDetailOpen(true)
    setIsRiwayatDetailLoading(true)
    try {
      const detail = await sesiAbsensiService.getById(item.id_sesi)
      setSelectedRiwayat(detail ?? item)
    } catch (error: any) {
      toast({
        title: "Gagal memuat detail",
        description: extractApiErrorMessage(error, "Detail riwayat belum bisa dibuka."),
        variant: "destructive",
      })
      setIsRiwayatDetailOpen(false)
    } finally {
      setIsRiwayatDetailLoading(false)
    }
  }

  const closePresensiDialog = async (open: boolean) => {
    if (open) {
      setIsDialogOpen(true)
      return
    }

    if (isSubmitting) return

    if (sesiAktifId && !isSubmitSuccess) {
      try {
        await sesiAbsensiService.cancel(sesiAktifId, {
          keterangan: "Dibatalkan sebelum absensi dikirim",
        })
        // Refresh data agar jadwal yang dibatalkan bisa digunakan kembali
        await Promise.all([loadJadwal(), loadAktivitasSesi()])
      } catch {
        // Tetap tutup dialog agar user bisa mencoba lagi.
        // Tetap coba refresh meskipun cancel gagal, supaya UI konsisten
        void loadJadwal()
        void loadAktivitasSesi()
      }
    }

    setIsDialogOpen(false)
    setIsSubmitSuccess(false)
    setSesiAktifId(null)
    setSelectedJadwal(null)
    setGuruHadir("hadir")
    setGuruPenggantiId("")
    setAlasanTidakHadir("")
    setIsGuruTidakHadirFlow(false)
    setSantriList([])
    setAttendanceData({})
    setCurrentStudentIndex(0)
    setStep(1)
  }

  const resetJadwalFilters = () => {
    setKelasFilter("all")
    setMapelFilter("all")
    setPetugasFilter("all")
    setHariFilter("all")
  }

  const disabledNext =
    isSubmitting ||
    // Flow tidak hadir step 1: wajib pilih pengganti
    (isGuruTidakHadirFlow && step === 1 && !isGuruStepValid) ||
    // Flow hadir step 1: wajib semua santri sudah diisi
    (!isGuruTidakHadirFlow && step === 1 && !isSantriStepValid)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Guru</h1>
          <p className="text-muted-foreground">
            Integrasi sesi absensi dan rekap kehadiran
            {currentUser?.nama_lengkap ? ` - ${currentUser.nama_lengkap}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{new Date().toLocaleDateString("id-ID", { dateStyle: "full" })}</span>
        </div>
      </div>



      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="jadwal" className="data-[state=active]:bg-card">
            <Calendar className="w-4 h-4 mr-2" />
            Jadwal Mengajar
          </TabsTrigger>
          <TabsTrigger value="riwayat" className="data-[state=active]:bg-card">
            <History className="w-4 h-4 mr-2" />
            Riwayat dan Rekap
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jadwal" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Sesi Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingJadwal || isLoadingUser ? (
                <p className="text-sm text-muted-foreground">Memuat data jadwal...</p>
              ) : todaySchedule.length > 0 ? (
                todaySchedule.map((jadwal) => {
                  const sudahSelesai = jadwalSelesaiHariIniSet.has(jadwal.id_jadwal)
                  return (
                    <div
                      key={jadwal.id_jadwal}
                      className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 p-4 rounded-lg border transition-colors ${
                        sudahSelesai
                          ? "border-emerald-500/30 bg-emerald-500/8"
                          : "border-border/50 bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          sudahSelesai ? "bg-emerald-500/15" : "bg-primary/10"
                        }`}>
                          {sudahSelesai
                            ? <CheckCircle className="w-6 h-6 text-emerald-600" />
                            : <BookOpen className="w-6 h-6 text-primary" />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{jadwal.mapel}</h4>
                          <p className="text-sm text-muted-foreground">
                            {jadwal.kelas} ({jadwal.jenjang}) - {jadwal.siswa} santri
                          </p>
                          <p className={`text-xs font-medium mt-1 ${
                            sudahSelesai ? "text-emerald-600" : "text-primary"
                          }`}>
                            {jadwal.hari || "-"} | {jadwal.jam}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Ruangan: {jadwal.ruangan || "-"} | Pengajar: {jadwal.nama_petugas || "-"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {sudahSelesai ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 border px-3 py-1.5 text-sm">
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                            Sudah Terisi
                          </Badge>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              className="bg-transparent text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleOpenGuruTidakHadir(jadwal)}
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              Absen Guru Tidak Hadir
                            </Button>
                            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => handleOpenInput(jadwal)}>
                              <UserCheck className="w-4 h-4 mr-2" />
                              Input Presensi
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Tidak ada sesi untuk hari ini.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                Jadwal Dialihkan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {jadwalDilimpahkan.length > 0 ? (
                jadwalDilimpahkan.map((item) => {
                  const sudahSelesai = String(item.status_sesi || "").toUpperCase() === "SELESAI"
                  return (
                    <div
                      key={item.id_sesi}
                      className={`flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between transition-colors ${
                        sudahSelesai
                          ? "border-emerald-500/30 bg-emerald-500/8"
                          : "border-border/50 bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                          sudahSelesai ? "bg-emerald-500/15" : "bg-amber-500/10"
                        }`}>
                          {sudahSelesai
                            ? <CheckCircle className="h-6 w-6 text-emerald-600" />
                            : <ArrowRight className="h-6 w-6 text-amber-600" />}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold text-foreground">{item.mapel}</h4>
                            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700">
                              Dilimpahkan
                            </Badge>
                            {sudahSelesai && (
                              <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 border">
                                Selesai
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {item.kelas} ({item.jenjang}) - {item.hari || "-"} | {item.jam}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Pengajar pengganti: {getPetugasLabel(item.id_petugas_pengganti)} | Ruangan: {item.ruangan || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {sudahSelesai ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 border px-3 py-1.5 text-sm">
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                            Sudah Terisi
                          </Badge>
                        ) : (
                          <Button variant="outline" className="bg-transparent" onClick={() => handleOpenInput(item)}>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Input
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <UserCheck className="mx-auto mb-2 h-12 w-12 opacity-50" />
                  <p>Tidak ada jadwal yang dialihkan ke Anda.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Semua Jadwal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <div className="space-y-2">
                  <Label>Kelas</Label>
                  <Select value={kelasFilter} onValueChange={setKelasFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kelas</SelectItem>
                      {kelasOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Mapel</Label>
                  <Select value={mapelFilter} onValueChange={setMapelFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua mapel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Mapel</SelectItem>
                      {mapelOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Pengajar</Label>
                  <Select value={petugasFilter} onValueChange={setPetugasFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua pengajar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Pengajar</SelectItem>
                      {petugasFilterOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Hari</Label>
                  <Select value={hariFilter} onValueChange={setHariFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua hari" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Hari</SelectItem>
                      {[
                        "SENIN",
                        "SELASA",
                        "RABU",
                        "KAMIS",
                        "JUMAT",
                        "SABTU",
                        "MINGGU",
                      ].map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" className="bg-transparent" onClick={resetJadwalFilters}>
                  Reset Filter
                </Button>
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Hari</TableHead>
                      <TableHead>Mapel</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Ruangan</TableHead>
                      <TableHead>Pengajar</TableHead>
                      <TableHead>Jam</TableHead>
                      <TableHead>Status Jadwal</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSortedJadwalMengajar.map((jadwal) => {
                      const sudahSelesai = jadwalSelesaiHariIniSet.has(jadwal.id_jadwal)
                      return (
                        <TableRow
                          key={jadwal.id_jadwal}
                          className={sudahSelesai ? "bg-emerald-500/8 hover:bg-emerald-500/12" : "hover:bg-muted/30"}
                        >
                          <TableCell className="font-medium text-foreground">{jadwal.hari || "-"}</TableCell>
                          <TableCell>{jadwal.mapel}</TableCell>
                          <TableCell>{jadwal.kelas}</TableCell>
                          <TableCell>{jadwal.ruangan || "-"}</TableCell>
                          <TableCell>{jadwal.nama_petugas || "-"}</TableCell>
                          <TableCell>{jadwal.jam}</TableCell>
                          <TableCell>
                            {sudahSelesai ? (
                              <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 border">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Selesai Hari Ini
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-transparent">{jadwal.status_sesi || "-"}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {sudahSelesai ? (
                              <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 border px-3 py-1">
                                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                Sudah Terisi
                              </Badge>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-transparent text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => handleOpenGuruTidakHadir(jadwal)}
                                >
                                  <UserX className="w-4 h-4 mr-1" />
                                  Guru Tidak Hadir
                                </Button>
                                <Button variant="outline" size="sm" className="bg-transparent" onClick={() => handleOpenInput(jadwal)}>
                                  <UserCheck className="w-4 h-4 mr-1" />
                                  Input
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {filteredSortedJadwalMengajar.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                          Data jadwal tidak ditemukan.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="riwayat" className="space-y-4">
          {/* Rekap Kehadiran Saya */}
          {rekapPetugasRows.length > 0 && (() => {
            const rekap = rekapPetugasRows[0]
            return (
              <Card className="border-border/50">
                <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg text-foreground flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-primary" />
                      Rekap Kehadiran Saya
                    </CardTitle>
                    <CardDescription>Rekapitulasi kehadiran mengajar Anda secara keseluruhan</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  {rekapLoading ? (
                    <p className="text-sm text-muted-foreground">Memuat rekap...</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
                      <div className="rounded-lg border bg-muted/20 p-3 text-center">
                        <p className="text-xs text-muted-foreground">Total Pertemuan</p>
                        <p className="text-2xl font-bold text-foreground">{rekap.total_pertemuan}</p>
                      </div>
                      <div className="rounded-lg border bg-emerald-500/8 p-3 text-center">
                        <p className="text-xs text-muted-foreground">Hadir</p>
                        <p className="text-2xl font-bold text-emerald-600">{rekap.jumlah_hadir}</p>
                      </div>
                      <div className="rounded-lg border bg-blue-500/8 p-3 text-center">
                        <p className="text-xs text-muted-foreground">Izin</p>
                        <p className="text-2xl font-bold text-blue-500">{rekap.jumlah_izin}</p>
                      </div>
                      <div className="rounded-lg border bg-amber-500/8 p-3 text-center">
                        <p className="text-xs text-muted-foreground">Sakit</p>
                        <p className="text-2xl font-bold text-amber-500">{rekap.jumlah_sakit}</p>
                      </div>
                      <div className="rounded-lg border bg-rose-500/8 p-3 text-center">
                        <p className="text-xs text-muted-foreground">Alfa</p>
                        <p className="text-2xl font-bold text-rose-500">{rekap.jumlah_alfa || 0}</p>
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-3 text-center">
                        <p className="text-xs text-muted-foreground">Total Terlambat</p>
                        <p className="text-2xl font-bold text-foreground">{rekap.total_menit_terlambat} <span className="text-sm font-normal">mnt</span></p>
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-3 text-center">
                        <p className="text-xs text-muted-foreground">Rata Terlambat</p>
                        <p className="text-2xl font-bold text-foreground">{rekap.rata_menit_terlambat_hadir} <span className="text-sm font-normal">mnt</span></p>
                      </div>
                      <div className="rounded-lg border bg-primary/8 p-3 text-center">
                        <p className="text-xs text-muted-foreground">% Hadir</p>
                        <p className="text-2xl font-bold text-primary">{rekap.persentase_kehadiran}%</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })()}

          {/* Riwayat Sesi */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Riwayat Sesi Saya
              </CardTitle>
              <CardDescription>Daftar sesi absensi yang pernah Anda ampu atau gantikan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Hari</TableHead>
                      <TableHead>Mapel</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Status Kehadiran</TableHead>
                      <TableHead>Peran</TableHead>
                      <TableHead className="text-right">Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {riwayatPresensi.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                          Belum ada riwayat sesi.
                        </TableCell>
                      </TableRow>
                    ) : (
                      riwayatPresensi.map((item) => (
                        <TableRow key={item.id_sesi} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{item.tanggal || "-"}</TableCell>
                          <TableCell>{item.hari || "-"}</TableCell>
                          <TableCell>{item.mapel}</TableCell>
                          <TableCell>{item.kelas}</TableCell>
                          <TableCell>
                            {getGuruStatusBadge(item.status_kehadiran_guru || item.status_sesi || "-")}
                          </TableCell>
                          <TableCell>
                            {Number(item.id_petugas_pengganti) === Number(currentPetugasId)
                              ? <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/30 border">Pengganti</Badge>
                              : <Badge className="bg-primary/10 text-primary border-0">Pengajar</Badge>}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" className="bg-transparent" onClick={() => handleOpenRiwayatDetail(item)}>
                              <Eye className="w-4 h-4 mr-1" />
                              Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={closePresensiDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {isSubmitSuccess ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Presensi Berhasil Diproses</h3>
              <p className="text-muted-foreground text-center">Data sesi absensi sudah tersimpan ke backend.</p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {isGuruTidakHadirFlow
                    ? `Absen Tidak Hadir - ${selectedJadwal?.mapel}`
                    : `Input Presensi Santri - ${selectedJadwal?.mapel}`}
                </DialogTitle>
                <DialogDescription>
                  {selectedJadwal?.kelas} ({selectedJadwal?.jenjang}) - {selectedJadwal?.tanggal || "-"}, {selectedJadwal?.jam}
                </DialogDescription>
              </DialogHeader>

              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2 py-2">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${step === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  <span className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs">1</span>
                  {isGuruTidakHadirFlow ? "Status & Pengganti" : "Presensi Santri"}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${step === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  <span className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs">2</span>
                  Konfirmasi & Kirim
                </div>
              </div>

              {/* STEP 1 - Flow Guru Tidak Hadir: pilih Izin/Sakit + pengganti */}
              {isGuruTidakHadirFlow && step === 1 && (
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base text-foreground">Alasan Tidak Hadir</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RadioGroup value={guruHadir} onValueChange={(v) => setGuruHadir(v as GuruStatus)} className="space-y-3">
                      <Label htmlFor="guru-sakit" className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${guruHadir === "sakit" ? "border-chart-3 bg-chart-3/10" : "border-border hover:border-chart-3/50"}`}>
                        <RadioGroupItem value="sakit" id="guru-sakit" />
                        <div>
                          <p className="font-medium text-foreground">Sakit</p>
                          <p className="text-sm text-muted-foreground">Guru berhalangan hadir karena sakit, perlu guru pengganti</p>
                        </div>
                        <Check className={`w-5 h-5 ml-auto ${guruHadir === "sakit" ? "text-chart-4" : "text-transparent"}`} />
                      </Label>

                      <Label htmlFor="guru-izin" className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${guruHadir === "izin" ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"}`}>
                        <RadioGroupItem value="izin" id="guru-izin" />
                        <div>
                          <p className="font-medium text-foreground">Izin</p>
                          <p className="text-sm text-muted-foreground">Guru berhalangan hadir karena izin, perlu guru pengganti</p>
                        </div>
                        <Check className={`w-5 h-5 ml-auto ${guruHadir === "izin" ? "text-accent" : "text-transparent"}`} />
                      </Label>
                    </RadioGroup>

                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="guru-pengganti-id">Guru Pengganti <span className="text-destructive">*</span></Label>
                        <Popover open={openPetugasCombobox} onOpenChange={setOpenPetugasCombobox} modal={true}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openPetugasCombobox}
                              className="w-full justify-between font-normal"
                              id="guru-pengganti-id"
                            >
                              {guruPenggantiId
                                ? petugasOptions.find((option) => String(option.id) === guruPenggantiId)?.label
                                : isLoadingPetugas ? "Memuat pengajar..." : "Cari guru pengganti..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full min-w-[300px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Cari nama pengajar..." />
                              <CommandList>
                                <CommandEmpty>Pengajar tidak ditemukan.</CommandEmpty>
                                <CommandGroup>
                                  {petugasOptions.map((option) => (
                                    <CommandItem
                                      key={option.id}
                                      value={option.label}
                                      onSelect={() => {
                                        setGuruPenggantiId(String(option.id))
                                        setOpenPetugasCombobox(false)
                                      }}
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${
                                          guruPenggantiId === String(option.id) ? "opacity-100" : "opacity-0"
                                        }`}
                                      />
                                      {option.label}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {isPenggantiSamaPengajar ? (
                          <p className="text-xs text-destructive mt-1">
                            Guru pengganti tidak boleh sama dengan pengajar utama sesi.
                          </p>
                        ) : null}
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="keterangan">Keterangan</Label>
                        <Input
                          id="keterangan"
                          placeholder="Masukkan keterangan tambahan"
                          value={alasanTidakHadir}
                          onChange={(e) => setAlasanTidakHadir(e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* STEP 1 - Flow Guru Hadir: input presensi santri */}
              {!isGuruTidakHadirFlow && step === 1 && (
                <div className="space-y-4">
                  {isSubmitting || santriList.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-sm">Membuka sesi dan memuat daftar santri...</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress Input</span>
                          <span className="font-medium text-foreground">{completedCount}/{santriList.length} santri</span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                      </div>

                      <Card className="border-primary/30 bg-primary/5">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4 mb-4">
                            <Avatar className="w-14 h-14">
                              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                                {getInitials(santriList[currentStudentIndex].nama_lengkap_santri)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-semibold text-lg text-foreground">{santriList[currentStudentIndex].nama_lengkap_santri}</p>
                              <p className="text-sm text-muted-foreground">NIS: {santriList[currentStudentIndex].nomor_induk}</p>
                              <p className="text-xs text-primary">Santri ke-{currentStudentIndex + 1} dari {santriList.length}</p>
                            </div>
                          </div>
                          <RadioGroup
                            value={attendanceData[santriList[currentStudentIndex].nomor_induk] || ""}
                            onValueChange={(value) => handleSetAttendance(santriList[currentStudentIndex].nomor_induk, value as SantriStatus)}
                            className="grid grid-cols-2 gap-3"
                          >
                            <Label htmlFor="santri-hadir" className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${attendanceData[santriList[currentStudentIndex].nomor_induk] === "hadir" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                              <RadioGroupItem value="hadir" id="santri-hadir" />
                              <p className="font-medium text-foreground">Hadir</p>
                            </Label>
                            <Label htmlFor="santri-sakit" className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${attendanceData[santriList[currentStudentIndex].nomor_induk] === "sakit" ? "border-chart-3 bg-chart-3/10" : "border-border hover:border-chart-3/50"}`}>
                              <RadioGroupItem value="sakit" id="santri-sakit" />
                              <p className="font-medium text-foreground">Sakit</p>
                            </Label>
                            <Label htmlFor="santri-izin" className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${attendanceData[santriList[currentStudentIndex].nomor_induk] === "izin" ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"}`}>
                              <RadioGroupItem value="izin" id="santri-izin" />
                              <p className="font-medium text-foreground">Izin</p>
                            </Label>
                            <Label htmlFor="santri-alfa" className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${attendanceData[santriList[currentStudentIndex].nomor_induk] === "alfa" ? "border-destructive bg-destructive/10" : "border-border hover:border-destructive/50"}`}>
                              <RadioGroupItem value="alfa" id="santri-alfa" />
                              <p className="font-medium text-foreground">Alfa</p>
                            </Label>
                          </RadioGroup>
                        </CardContent>
                      </Card>

                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>No</TableHead>
                              <TableHead>Nama Santri</TableHead>
                              <TableHead>NIS</TableHead>
                              <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {santriList.map((santri, idx) => (
                              <TableRow key={santri.nomor_induk} onClick={() => setCurrentStudentIndex(idx)} className="hover:bg-muted/30 cursor-pointer">
                                <TableCell>{idx + 1}</TableCell>
                                <TableCell>{santri.nama_lengkap_santri}</TableCell>
                                <TableCell>{santri.nomor_induk}</TableCell>
                                <TableCell className="text-center">
                                  {attendanceData[santri.nomor_induk] ? getGuruStatusBadge(attendanceData[santri.nomor_induk]) : <span className="text-sm text-muted-foreground">Belum diisi</span>}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </div>
              )}

              {step === summaryStep && (
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base text-foreground">Ringkasan Presensi</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">ID Sesi</p>
                        <p className="font-medium text-foreground">{sesiAktifId || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status Guru</p>
                        {getGuruStatusBadge(guruHadir)}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">ID Guru Pengganti</p>
                        <p className="font-medium text-foreground">{guruPenggantiId || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Nama Guru Pengganti</p>
                        <p className="font-medium text-foreground">{selectedPetugasPenggantiLabel}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Keterangan</p>
                        <p className="font-medium text-foreground">{alasanTidakHadir || "-"}</p>
                      </div>
                    </div>

                    {!isGuruTidakHadirFlow ? (
                      <>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-primary/10 rounded-lg">
                            <p className="text-2xl font-bold text-primary">{Object.values(attendanceData).filter((v) => v === "hadir").length}</p>
                            <p className="text-sm text-muted-foreground">Hadir</p>
                          </div>
                          <div className="text-center p-4 bg-chart-3/20 rounded-lg">
                            <p className="text-2xl font-bold text-chart-4">{Object.values(attendanceData).filter((v) => v === "sakit").length}</p>
                            <p className="text-sm text-muted-foreground">Sakit</p>
                          </div>
                          <div className="text-center p-4 bg-accent/20 rounded-lg">
                            <p className="text-2xl font-bold text-accent">{Object.values(attendanceData).filter((v) => v === "izin").length}</p>
                            <p className="text-sm text-muted-foreground">Izin</p>
                          </div>
                          <div className="text-center p-4 bg-destructive/10 rounded-lg">
                            <p className="text-2xl font-bold text-destructive">{Object.values(attendanceData).filter((v) => v === "alfa").length}</p>
                            <p className="text-sm text-muted-foreground">Alfa</p>
                          </div>
                        </div>

                        {(() => {
                          const unfilledCount = santriList.length - Object.keys(attendanceData).length;
                          if (unfilledCount > 0) {
                            return (
                              <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-3">
                                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                                <div>
                                  <h4 className="text-sm font-semibold text-destructive">Perhatian: {unfilledCount} Santri Belum Diabsen</h4>
                                  <p className="text-sm text-destructive/90 mt-1">
                                    Santri yang belum dipilih status kehadirannya akan otomatis dicatat sebagai <strong>ALFA</strong>. Pastikan Anda sudah mengecek semua santri sebelum mengirim presensi.
                                  </p>
                                </div>
                              </div>
                            )
                          }
                          return null;
                        })()}
                      </>

                    ) : (
                      <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                        <p className="text-sm text-foreground">Mode guru tidak hadir aktif: sesi akan menunggu pengganti dan input santri dilewati.</p>
                      </div>
                    )}

                    <div className="p-4 bg-secondary/50 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-secondary-foreground mt-0.5" />
                      <div>
                        <p className="font-medium text-secondary-foreground">Catatan</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <DialogFooter className="gap-2">
                {step >= 1 && (
                  <Button variant="outline" className="bg-transparent" onClick={handleBackButton} disabled={isSubmitting}>
                    Kembali
                  </Button>
                )}
                <Button className="bg-primary text-primary-foreground" onClick={handlePrimaryAction} disabled={disabledNext}>
                  {isSubmitting ? "Memproses..." : step < summaryStep ? "Lanjutkan" : "Kirim"}
                  {!isSubmitting && step < summaryStep && <ArrowRight className="w-4 h-4 ml-2" />}
                  {!isSubmitting && step === summaryStep && <Send className="w-4 h-4 ml-2" />}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isRiwayatDetailOpen} onOpenChange={setIsRiwayatDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Detail Sesi Absensi
            </DialogTitle>
          </DialogHeader>

          {isRiwayatDetailLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Clock className="w-8 h-8 text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">Memuat detail sesi...</p>
            </div>
          ) : selectedRiwayat && (
            <div className="space-y-5">

              {/* Info Sesi */}
              <div className="rounded-lg border border-border/60 overflow-hidden">
                <div className="bg-muted/40 px-4 py-2 border-b border-border/50">
                  <p className="text-sm font-semibold text-foreground">Informasi Sesi</p>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Mata Pelajaran</p>
                    <p className="font-medium text-foreground">
                      {selectedRiwayat.jadwal?.kelas_mapel?.mata_pelajaran?.nama_mapel
                        ?? selectedRiwayat.jadwal?.kelasMapel?.mataPelajaran?.nama_mapel
                        ?? "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Kelas</p>
                    <p className="font-medium text-foreground">
                      {selectedRiwayat.jadwal?.kelas_mapel?.kelas?.nama_kelas
                        ?? selectedRiwayat.jadwal?.kelasMapel?.kelas?.nama_kelas
                        ?? "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tanggal</p>
                    <p className="font-medium text-foreground">{selectedRiwayat.tanggal || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Hari</p>
                    <p className="font-medium text-foreground">{selectedRiwayat.jadwal?.hari || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Waktu Mulai</p>
                    <p className="font-medium text-foreground">{selectedRiwayat.waktu_mulai || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Waktu Selesai</p>
                    <p className="font-medium text-foreground">{selectedRiwayat.waktu_selesai || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status Sesi</p>
                    <Badge variant="outline" className="bg-transparent mt-0.5">{selectedRiwayat.status_sesi || "-"}</Badge>
                  </div>
                  {selectedRiwayat.keterangan && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Keterangan</p>
                      <p className="text-sm text-foreground">{selectedRiwayat.keterangan}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Absensi Pengajar */}
              <div className="rounded-lg border border-border/60 overflow-hidden">
                <div className="bg-muted/40 px-4 py-2 border-b border-border/50">
                  <p className="text-sm font-semibold text-foreground">Kehadiran Pengajar</p>
                </div>
                <div className="divide-y divide-border/40">
                  {(() => {
                    const pengajarList = Array.isArray(selectedRiwayat.absensi_pengajar)
                      ? selectedRiwayat.absensi_pengajar
                      : []
                    if (pengajarList.length === 0) {
                      return (
                        <div className="px-4 py-3 text-sm text-muted-foreground">Tidak ada data absensi pengajar.</div>
                      )
                    }
                    return pengajarList.map((ap: any, idx: number) => {
                      const namaPetugas = ap.petugas?.nama_lengkap
                        ?? petugasLabelById.get(Number(ap.id_petugas))?.split(' (')[0]
                        ?? `Pengajar #${ap.id_petugas}`
                      const isGuru = Number(ap.id_petugas) === Number(selectedRiwayat.id_petugas_hadir)
                      const isPengganti = Number(ap.id_petugas) === Number(selectedRiwayat.id_petugas_pengganti)
                      const status = String(ap.status_kehadiran || "").toUpperCase()
                      return (
                        <div key={idx} className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {getInitials(namaPetugas)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-foreground">{namaPetugas}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {isGuru && <Badge className="bg-primary/10 text-primary border-0 text-xs py-0">Pengajar</Badge>}
                                {isPengganti && <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/30 border text-xs py-0">Pengganti</Badge>}
                                {ap.menit_terlambat > 0 && (
                                  <span className="text-xs text-muted-foreground">{ap.menit_terlambat} mnt terlambat</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge
                            className={
                              status === "HADIR" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 border" :
                              status === "SAKIT" ? "bg-amber-500/10 text-amber-700 border-amber-500/30 border" :
                              status === "IZIN" ? "bg-blue-500/10 text-blue-600 border-blue-500/30 border" :
                              "bg-muted text-muted-foreground"
                            }
                          >
                            {status || "-"}
                          </Badge>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>

              {/* Absensi Santri */}
              <div className="rounded-lg border border-border/60 overflow-hidden">
                <div className="bg-muted/40 px-4 py-2 border-b border-border/50 flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Absensi Santri</p>
                  {Array.isArray(selectedRiwayat.absensi_santri) && (
                    <Badge variant="outline" className="text-xs">
                      {selectedRiwayat.absensi_santri.length} santri
                    </Badge>
                  )}
                </div>
                {(() => {
                  const santriAbsensi = Array.isArray(selectedRiwayat.absensi_santri)
                    ? selectedRiwayat.absensi_santri
                    : []
                  if (santriAbsensi.length === 0) {
                    return (
                      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        Belum ada data absensi santri.
                      </div>
                    )
                  }
                  const countByStatus = santriAbsensi.reduce((acc: Record<string, number>, s: any) => {
                    const st = String(s.status_kehadiran || "ALFA").toUpperCase()
                    acc[st] = (acc[st] || 0) + 1
                    return acc
                  }, {})
                  return (
                    <>
                      {/* Summary Pills */}
                      <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-border/40">
                        {Object.entries(countByStatus).map(([st, count]) => (
                          <span key={st} className={
                            `text-xs font-medium px-2 py-0.5 rounded-full border ${
                              st === "HADIR" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" :
                              st === "SAKIT" ? "bg-amber-500/10 text-amber-700 border-amber-500/30" :
                              st === "IZIN" ? "bg-blue-500/10 text-blue-600 border-blue-500/30" :
                              "bg-destructive/10 text-destructive border-destructive/30"
                            }`
                          }>
                            {st}: {count as number}
                          </span>
                        ))}
                      </div>
                      {/* Santri List */}
                      <div className="divide-y divide-border/30 max-h-64 overflow-y-auto">
                        {santriAbsensi.map((s: any, idx: number) => {
                          const nama = s.santri?.nama_lengkap_santri ?? s.nama_lengkap_santri ?? s.nomor_induk
                          const status = String(s.status_kehadiran || "ALFA").toUpperCase()
                          return (
                            <div key={idx} className="flex items-center justify-between px-4 py-2">
                              <div>
                                <p className="text-sm font-medium text-foreground">{nama}</p>
                                <p className="text-xs text-muted-foreground">{s.nomor_induk}</p>
                              </div>
                              <Badge
                                className={
                                  status === "HADIR" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 border" :
                                  status === "SAKIT" ? "bg-amber-500/10 text-amber-700 border-amber-500/30 border" :
                                  status === "IZIN" ? "bg-blue-500/10 text-blue-600 border-blue-500/30 border" :
                                  "bg-destructive/10 text-destructive border-destructive/30 border"
                                }
                              >
                                {status}
                              </Badge>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )
                })()}
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
