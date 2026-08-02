"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"
import { useUnit } from "@/contexts/unit-context"
import { dataSantriService } from "@/lib/services/santri.service"
import { dataPetugasService } from "@/lib/services/petugas.service"
import { dataKelasService } from "@/lib/services/kelas.service"
import { sesiAbsensiService } from "@/lib/services/sesiabsensi.service"
import {
  Users,
  UserCheck,
  School,
  CalendarX2,
  BookMarked,
  FileText,
  Plus,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  GraduationCap,
  SlidersHorizontal,
} from "lucide-react"

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SantriStats {
  total: number
  aktif: number
  lulus: number
  keluar: number
  cuti: number
}

interface DashboardStats {
  santri: SantriStats | null
  petugas: number | null
  kelas: number | null
  belumDiabsen: number | null
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  value,
  sub,
  colorClass,
  loading,
}: {
  icon: React.ReactNode
  value: string | number
  sub?: string
  colorClass: string
  loading?: boolean
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={`p-2.5 rounded-xl ${colorClass}`}>{icon}</div>
        </div>
        {loading ? (
          <div className="mt-4 space-y-2">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{sub}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function AdminPanelHome() {
  const { toast } = useToast()
  const { allTahunAjaran, selectedTahunAjaran, selectedKodeTahun, isLoading: isTahunLoading } = useTahunAjaran()
  const { allUnit, selectedKodeUnit, selectedUnit, isLoading: isUnitLoading } = useUnit()

  const [stats, setStats] = useState<DashboardStats>({
    santri: null,
    petugas: null,
    kelas: null,
    belumDiabsen: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  const fetchStats = async (kodeTahun?: string | null, kodeUnit?: string | null) => {
    setIsLoading(true)
    try {
      const santriParams = {
        ...(kodeTahun ? { tahun_ajaran: kodeTahun } : {}),
        ...(kodeUnit ? { kode_unit: kodeUnit } : {}),
      }
      const kelasParams = {
        status: "AKTIF" as const,
        per_page: 1,
        ...(kodeTahun ? { tahun_ajaran: kodeTahun } : {}),
        ...(kodeUnit ? { kode_unit: kodeUnit } : {}),
      }

      const belumDiabsenParams = {
        tanggal: new Date().toISOString().split("T")[0],
        ...(kodeUnit ? { kode_unit: kodeUnit } : {}),
        ...(kodeTahun ? { tahun_ajaran: kodeTahun } : {}),
      }

      const [santriStats, petugasResult, kelasResult, belumDiabsenResult] = await Promise.allSettled([
        dataSantriService.getStats(santriParams),
        dataPetugasService.getAll({ per_page: 1 }),
        dataKelasService.getAll(kelasParams),
        sesiAbsensiService.adminGetBelumDiabsen(belumDiabsenParams),
      ])

      setStats({
        santri: santriStats.status === "fulfilled" ? santriStats.value : null,
        petugas:
          petugasResult.status === "fulfilled"
            ? Number(petugasResult.value.meta?.total ?? 0)
            : null,
        kelas:
          kelasResult.status === "fulfilled"
            ? Number(kelasResult.value.meta?.total ?? 0)
            : null,
        belumDiabsen:
          belumDiabsenResult.status === "fulfilled"
            ? Array.isArray(belumDiabsenResult.value) ? belumDiabsenResult.value.length : 0
            : null,
      })

      setLastRefreshed(new Date())
    } catch {
      toast({
        title: "Gagal Memuat Data",
        description: "Beberapa statistik tidak dapat dimuat. Coba refresh.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isTahunLoading && !isUnitLoading) {
      void fetchStats(selectedKodeTahun, selectedKodeUnit)
    }
  }, [selectedKodeTahun, selectedKodeUnit, isTahunLoading, isUnitLoading])

  const now = new Date()
  const greeting =
    now.getHours() < 11 ? "Selamat Pagi" : now.getHours() < 15 ? "Selamat Siang" : now.getHours() < 18 ? "Selamat Sore" : "Selamat Malam"

  const dateLabel = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const quickActions = [
    { label: "Tambah Santri", href: "/dashboard/santri/tambah", icon: <Plus className="w-4 h-4" /> },
    { label: "Input Nilai Mapel", href: "/dashboard/admin-panel/nilai-mapel/new", icon: <BookMarked className="w-4 h-4" /> },
    { label: "Cetak Rapor", href: "/dashboard/admin-panel/rapor", icon: <FileText className="w-4 h-4" /> },
    { label: "Analitik", href: "/dashboard/analitik", icon: <TrendingUp className="w-4 h-4" /> },
    { label: "Lihat PPDB", href: "/dashboard/ppdb", icon: <UserCheck className="w-4 h-4" /> },
    { label: "Data Petugas", href: "/dashboard/guru", icon: <GraduationCap className="w-4 h-4" /> },
  ]

  // Build passive filter label
  const filterParts: string[] = []
  if (selectedTahunAjaran?.nama_tahun) filterParts.push(selectedTahunAjaran.nama_tahun)
  if (selectedUnit?.nama_unit) filterParts.push(selectedUnit.nama_unit)
  const filterLabel = filterParts.length > 0 ? filterParts.join(" · ") : "Semua Data"

  // Suppress unused-variable warning: allTahunAjaran and allUnit are used by context hooks for header
  void allTahunAjaran
  void allUnit

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{greeting}, Admin! 👋</h1>
            <p className="text-muted-foreground mt-1">{dateLabel} — Sistem Informasi Akademik Al-Ausath</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="bg-transparent self-start sm:self-auto gap-2"
            onClick={() => void fetchStats(selectedKodeTahun, selectedKodeUnit)}
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Memuat..." : "Refresh Data"}
          </Button>
        </div>

        {/* Passive filter label */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
          <span>Berdasarkan:</span>
          <span className="font-medium text-foreground">{filterLabel}</span>
          {(isTahunLoading || isUnitLoading) && (
            <Skeleton className="h-4 w-24 inline-block" />
          )}
        </div>
      </div>

      {/* ── Statistik Utama ── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">Statistik Sistem</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="w-5 h-5" />}
            value={stats.santri?.aktif ?? "—"}
            sub={`dari ${stats.santri?.total ?? "—"} total santri`}
            colorClass="bg-primary/10 text-primary"
            loading={isLoading}
          />
          <StatCard
            icon={<UserCheck className="w-5 h-5" />}
            value={stats.petugas ?? "—"}
            sub="Guru & Staf Aktif"
            colorClass="bg-emerald-500/15 text-emerald-600"
            loading={isLoading}
          />
          <StatCard
            icon={<School className="w-5 h-5" />}
            value={stats.kelas ?? "—"}
            sub="Kelas Aktif"
            colorClass="bg-sky-500/15 text-sky-600"
            loading={isLoading}
          />
          <Link href="/dashboard/presensi-guru" className="block">
            <StatCard
              icon={<CalendarX2 className="w-5 h-5" />}
              value={stats.belumDiabsen ?? "—"}
              sub={stats.belumDiabsen === 0 ? "Semua jadwal sudah diabsen ✓" : "Jadwal belum diabsen hari ini"}
              colorClass={stats.belumDiabsen && stats.belumDiabsen > 0 ? "bg-rose-500/15 text-rose-600" : "bg-emerald-500/15 text-emerald-600"}
              loading={isLoading}
            />
          </Link>
        </div>
      </div>

      {/* ── Row 2: Status Santri + Quick Actions ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Status Santri */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Distribusi Status Santri
            </CardTitle>
            <CardDescription>Ringkasan status keseluruhan santri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : stats.santri ? (
              [
                { label: "Aktif", value: stats.santri.aktif, color: "bg-primary/15 text-primary", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
                { label: "Lulus", value: stats.santri.lulus, color: "bg-emerald-500/15 text-emerald-600", icon: <GraduationCap className="w-3.5 h-3.5" /> },
                { label: "Cuti", value: stats.santri.cuti, color: "bg-amber-500/15 text-amber-700", icon: <AlertCircle className="w-3.5 h-3.5" /> },
                { label: "Keluar", value: stats.santri.keluar, color: "bg-rose-500/15 text-rose-600", icon: <AlertCircle className="w-3.5 h-3.5" /> },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Badge className={`${item.color} border-0 text-xs gap-1`}>
                      {item.icon}
                      {item.label}
                    </Badge>
                  </div>
                  <span className="font-semibold text-foreground">{item.value} santri</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Data tidak tersedia</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Akses Cepat
            </CardTitle>
            <CardDescription>Pintasan ke halaman yang sering digunakan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href}>
                  <Button
                    variant="outline"
                    className="bg-transparent w-full h-auto py-3 justify-start gap-2 text-sm hover:bg-primary/5 hover:border-primary/30 transition-colors"
                  >
                    <span className="text-primary">{action.icon}</span>
                    {action.label}
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground text-right">
        Terakhir diperbarui: {lastRefreshed.toLocaleTimeString("id-ID")}
      </p>
    </div>
  )
}
