"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/services/auth.service"
import { tahunAjaranService, TahunAjaranApiItem } from "@/lib/services/tahun-ajaran.service"
import api from "@/lib/axios"
import {
  BookOpen, FileText, Award, Receipt, Wallet, Megaphone,
  GraduationCap, CheckCircle, XCircle, Clock, AlertCircle,
  Calendar, TrendingUp, User,
} from "lucide-react"
import { ParentInformationCard } from "../shared/parent-info-card"

/* ─── Types ──────────────────────────────────────────────────── */
interface RekapSantri {
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

interface AbsensiItem {
  id_absensi?: number
  tanggal?: string
  status_kehadiran: string
  nama_mapel?: string
  nama_kelas?: string
  keterangan?: string
  id_sesi?: number
  /* from sesi */
  sesi?: {
    tanggal?: string
    jadwal?: {
      kelasMapel?: {
        mataPelajaran?: { nama_mapel?: string }
        kelas?: { nama_kelas?: string }
      }
    }
  }
}

interface UserInfo {
  nama_lengkap: string
  nomor_induk?: string
  peran_akun: string
  pilihan_unit?: string
}

const STATUS_COLORS: Record<string, string> = {
  HADIR: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  SAKIT: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
  IZIN: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  ALFA: "bg-destructive/10 text-destructive border-destructive/30",
}

const formatDate = (v: string) => {
  if (!v) return "-"
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString("id-ID", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })
}

export default function SantriPanelPage() {
  const { toast } = useToast()

  const [user, setUser] = useState<UserInfo | null>(null)
  const [rekap, setRekap] = useState<RekapSantri | null>(null)
  const [absensiList, setAbsensiList] = useState<AbsensiItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAbsensiLoading, setIsAbsensiLoading] = useState(true)

  /* Filter riwayat */
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPeriode, setFilterPeriode] = useState("all")
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState<TahunAjaranApiItem[]>([])
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>("ALL")

  /* ─── Fetch rekap ─────────────────────────────────────── */
  const fetchRekap = async (nomorInduk: string, tahunAjaran?: string) => {
    try {
      const params: any = { nomor_induk: nomorInduk, per_page: 1 }
      const activeTahun = tahunAjaran ?? selectedTahunAjaran
      if (activeTahun && activeTahun !== "ALL") {
        params.tahun_ajaran = activeTahun
      }
      const res = await api.get("/akademik/sesi-absensi/rekap/santri", { params })
      const data = res.data?.data?.[0] ?? null
      setRekap(data)
    } catch {
      toast({ title: "Gagal memuat rekap", description: "Data rekap kehadiran tidak dapat dimuat.", variant: "destructive" })
    }
  }

  const fetchRiwayat = async (nomorInduk: string, periode: string, tahunAjaran?: string) => {
    setIsAbsensiLoading(true)
    try {
      const params: any = { nomor_induk: nomorInduk, per_page: 100 }
      const now = new Date()
      
      if (periode === "7hari") {
        const d = new Date()
        d.setDate(d.getDate() - 7)
        params.tanggal_mulai = d.toISOString().split('T')[0]
      } else if (periode === "30hari") {
        const d = new Date()
        d.setDate(d.getDate() - 30)
        params.tanggal_mulai = d.toISOString().split('T')[0]
      } else if (periode === "bulan-ini") {
        const y = now.getFullYear()
        const m = String(now.getMonth() + 1).padStart(2, '0')
        params.tanggal_mulai = `${y}-${m}-01`
      }

      const activeTahun = tahunAjaran ?? selectedTahunAjaran
      if (activeTahun && activeTahun !== "ALL") {
        params.tahun_ajaran = activeTahun
      }

      const riwayatRes = await api.get("/akademik/sesi-absensi/riwayat-santri", { params })
      setAbsensiList(riwayatRes.data?.data ?? [])
    } catch { /* ignore */ } finally {
      setIsAbsensiLoading(false)
    }
  }

  /* ─── Load user + rekap ────────────────────────────────────── */
  useEffect(() => {
    const init = async () => {
      const me = await authService.me()
      if (!me) return
      setUser(me.user)

      const nomorInduk: string = me.user?.nomor_induk ?? ""
      if (!nomorInduk) {
        setIsLoading(false)
        setIsAbsensiLoading(false)
        return
      }


      // Load tahun ajaran options dan rekap
      try {
        const tahunRes = await tahunAjaranService.getAll({ per_page: 100 })
        const tahunList = tahunRes.data || []
        setTahunAjaranOptions(tahunList)
        const activeTahun = tahunList.find((t) => t.status === "AKTIF")
        if (activeTahun?.kode_tahun) {
          setSelectedTahunAjaran(activeTahun.kode_tahun)
          await fetchRekap(nomorInduk, activeTahun.kode_tahun)
          await fetchRiwayat(nomorInduk, filterPeriode, activeTahun.kode_tahun)
        } else {
          await fetchRekap(nomorInduk)
          await fetchRiwayat(nomorInduk, filterPeriode)
        }
      } catch {
        await fetchRekap(nomorInduk)
        await fetchRiwayat(nomorInduk, filterPeriode)
      } finally {
        setIsLoading(false)
      }
    }
    void init()
  }, [])

  // Trigger ulang riwayat saat filter periode atau tahun ajaran berubah
  useEffect(() => {
    if (user?.nomor_induk) {
      void fetchRiwayat(user.nomor_induk, filterPeriode)
      void fetchRekap(user.nomor_induk)
    }
  }, [filterPeriode, selectedTahunAjaran])

  /* ─── Computed ─────────────────────────────────────────────── */
  const hadir = Number(rekap?.jumlah_hadir ?? 0)
  const sakit = Number(rekap?.jumlah_sakit ?? 0)
  const izin = Number(rekap?.jumlah_izin ?? 0)
  const alfa = Number(rekap?.jumlah_alfa ?? 0)
  const total = Number(rekap?.total_pertemuan ?? 0)
  const pct = rekap?.persentase_kehadiran ?? 0

  const filteredAbsensi = absensiList.filter(a => {
    if (filterStatus === "all") return true
    return a.status_kehadiran?.toUpperCase() === filterStatus
  })

  /* ─── Stat Card Component ──────────────────────────────────── */
  const StatCard = ({ label, value, icon: Icon, colorClass, bgClass }: {
    label: string; value: number; icon: any; colorClass: string; bgClass: string
  }) => (
    <Card className="border-border/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            {isLoading ? <Skeleton className="h-8 w-12 mt-1" /> : (
              <p className={`text-2xl font-bold mt-1 ${colorClass}`}>{value}</p>
            )}
          </div>
          <div className={`w-10 h-10 rounded-lg ${bgClass} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${colorClass}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  /* ─── Progress ring ─────────────────────────────────────────── */
  const radius = 54
  const circ = 2 * Math.PI * radius
  const dashOffset = circ - (pct / 100) * circ

  /* ─── Render ─────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* ── Header Info Santri ── */}
      <Card className="border-border/50 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary to-primary/60" />
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-7 h-7 text-primary" />
              </div>
              <div>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold text-foreground">{user?.nama_lengkap ?? "-"}</h2>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <Badge variant="outline" className="text-xs">NIS: {user?.nomor_induk ?? "-"}</Badge>
                      {rekap?.nama_kelas && <Badge variant="outline" className="text-xs">{rekap.nama_kelas}</Badge>}
                      {user?.pilihan_unit && <Badge variant="outline" className="text-xs">{user.pilihan_unit}</Badge>}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Persentase ring */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <svg width="128" height="128" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/30" />
                  <circle
                    cx="64" cy="64" r={radius} fill="none" stroke="currentColor" strokeWidth="10"
                    className="text-primary transition-all duration-700"
                    strokeDasharray={circ}
                    strokeDashoffset={isLoading ? circ : dashOffset}
                    strokeLinecap="round"
                    transform="rotate(-90 64 64)"
                  />
                  <text x="64" y="60" textAnchor="middle" className="fill-foreground" fontSize="18" fontWeight="bold">
                    {isLoading ? "-" : `${pct}%`}
                  </text>
                  <text x="64" y="78" textAnchor="middle" className="fill-muted-foreground" fontSize="10">
                    Kehadiran
                  </text>
                </svg>
              </div>
              <div className="text-sm space-y-1 text-muted-foreground hidden sm:block">
                <p className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-primary inline-block" /> Hadir: <span className="font-semibold text-foreground">{hadir}</span></p>
                <p className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" /> Sakit: <span className="font-semibold text-foreground">{sakit}</span></p>
                <p className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Izin: <span className="font-semibold text-foreground">{izin}</span></p>
                <p className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-destructive inline-block" /> Alfa: <span className="font-semibold text-foreground">{alfa}</span></p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Hadir" value={hadir} icon={CheckCircle} colorClass="text-primary" bgClass="bg-primary/10" />
        <StatCard label="Total Sakit" value={sakit} icon={AlertCircle} colorClass="text-yellow-600" bgClass="bg-yellow-500/10" />
        <StatCard label="Total Izin" value={izin} icon={Clock} colorClass="text-blue-600" bgClass="bg-blue-500/10" />
        <StatCard label="Total Alfa" value={alfa} icon={XCircle} colorClass="text-destructive" bgClass="bg-destructive/10" />
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="riwayat" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="riwayat" className="data-[state=active]:bg-card">
            <FileText className="w-4 h-4 mr-2" />Riwayat Kehadiran
          </TabsTrigger>
          <TabsTrigger value="nilai-mapel" className="data-[state=active]:bg-card">
            <Award className="w-4 h-4 mr-2" />Nilai Mapel
          </TabsTrigger>
        </TabsList>

        {/* Tab Riwayat Kehadiran */}
        <TabsContent value="riwayat" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base">Riwayat Kehadiran</CardTitle>
                  <CardDescription>Daftar sesi absensi yang tercatat</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={selectedTahunAjaran} onValueChange={setSelectedTahunAjaran}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Tahun Ajaran</SelectItem>
                      {tahunAjaranOptions.map((t) => (
                        <SelectItem key={t.kode_tahun} value={t.kode_tahun!}>
                          {t.nama_tahun} {t.status === "AKTIF" ? "(Aktif)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterPeriode} onValueChange={setFilterPeriode}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Waktu</SelectItem>
                      <SelectItem value="7hari">7 Hari Terakhir</SelectItem>
                      <SelectItem value="30hari">30 Hari Terakhir</SelectItem>
                      <SelectItem value="bulan-ini">Bulan Ini</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="HADIR">Hadir</SelectItem>
                      <SelectItem value="SAKIT">Sakit</SelectItem>
                      <SelectItem value="IZIN">Izin</SelectItem>
                      <SelectItem value="ALFA">Alfa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {isAbsensiLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
                    <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))
              ) : filteredAbsensi.length === 0 ? (
                <div className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-muted-foreground text-sm">Belum ada data kehadiran.</p>
                </div>
              ) : (
                filteredAbsensi.map((absensi, idx) => {
                  const statusKehadiran = absensi.status_kehadiran?.toUpperCase() ?? "-"
                  return (
                    <div key={absensi.id_absensi ?? idx} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{absensi.nama_mapel || absensi.nama_kelas || `Sesi #${absensi.id_sesi}`}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(absensi.tanggal ?? "")}</p>
                        {absensi.keterangan && <p className="text-xs text-muted-foreground italic">{absensi.keterangan}</p>}
                      </div>
                      <Badge variant="outline" className={`text-xs border shrink-0 ${STATUS_COLORS[statusKehadiran] ?? ""}`}>
                        {statusKehadiran}
                      </Badge>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Rekap Ringkasan */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Rekap Keseluruhan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                {[
                  ["Total Pertemuan", total],
                  ["Hadir", hadir],
                  ["Sakit", sakit],
                  ["Izin", izin],
                  ["Alfa", alfa],
                  ["% Kehadiran", `${pct}%`],
                ].map(([label, val]) => (
                  <div key={label} className="space-y-1">
                    <p className="text-muted-foreground">{label}</p>
                    <p className="font-semibold text-foreground">{val}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Nilai Mapel */}
        <TabsContent value="nilai-mapel" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                Nilai Mata Pelajaran
              </CardTitle>
              <CardDescription>Lihat nilai rapor digital lengkap</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="bg-primary text-primary-foreground">
                <Link href="/dashboard/rapor">
                  <FileText className="mr-2 h-4 w-4" />
                  Lihat Rapor Digital
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Administrasi ── */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Administrasi Santri</CardTitle>
          <CardDescription>
            Akses cepat untuk memantau tagihan, status pembayaran, dan pengumuman.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Button asChild variant="outline" className="justify-start">
            <Link href="/dashboard/santri-panel/administrasi">
              <Receipt className="mr-2 h-4 w-4" />
              Lihat Tagihan
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link href="/dashboard/santri-panel/administrasi">
              <Wallet className="mr-2 h-4 w-4" />
              Status Pembayaran
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link href="/dashboard/pengumuman">
              <Megaphone className="mr-2 h-4 w-4" />
              Pengumuman
            </Link>
          </Button>
        </CardContent>
      </Card>

      <ParentInformationCard />
    </div>
  )
}
