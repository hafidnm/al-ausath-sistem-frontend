"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useSppTunggakanSummary } from "@/hooks/use-spp"
import {
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  ArrowRight,
  Star,
  UserCheck,
  UserX,
  AlertCircle,
  CheckCircle,
  ClipboardCheck,
  Wallet,
} from "lucide-react"

const statsCards = [
  {
    title: "Total Santri",
    value: "1,247",
    change: "+12%",
    trend: "up",
    icon: Users,
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Total Guru",
    value: "86",
    change: "+3%",
    trend: "up",
    icon: GraduationCap,
    color: "bg-accent/20 text-accent",
  },
  {
    title: "Kehadiran Hari Ini",
    value: "92%",
    change: "+2%",
    trend: "up",
    icon: UserCheck,
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Rapor Terbit",
    value: "892",
    change: "+28%",
    trend: "up",
    icon: FileText,
    color: "bg-chart-3/20 text-chart-3",
  },
]

const attendanceOverview = {
  santri: {
    hadir: 1150,
    sakit: 45,
    izin: 32,
    alpha: 20,
    total: 1247,
  },
  guru: {
    hadir: 78,
    sakit: 4,
    izin: 2,
    alpha: 2,
    total: 86,
  },
}

const jenjangStats = [
  { name: "PAUD", count: 120, color: "bg-chart-1" },
  { name: "TK", count: 185, color: "bg-chart-2" },
  { name: "SD", count: 412, color: "bg-primary" },
  { name: "MA", count: 298, color: "bg-accent" },
  { name: "SMA", count: 232, color: "bg-chart-4" },
]

const recentActivities = [
  {
    user: "Ustadz Ahmad",
    action: "menginput presensi kelas 9A - Tahfidz",
    time: "5 menit lalu",
    avatar: "UA",
    type: "presensi",
  },
  {
    user: "Admin",
    action: "memvalidasi 15 presensi santri",
    time: "15 menit lalu",
    avatar: "AD",
    type: "validasi",
  },
  {
    user: "Ustadzah Fatimah",
    action: "menginput nilai kelas 10A",
    time: "1 jam lalu",
    avatar: "UF",
    type: "nilai",
  },
  {
    user: "Ustadz Ibrahim",
    action: "mengajukan izin tidak hadir",
    time: "2 jam lalu",
    avatar: "UI",
    type: "izin",
  },
]

const pendingValidations = [
  { name: "Muhammad Rizki", kelas: "9A", status: "sakit", type: "santri" },
  { name: "Fatimah Zahra", kelas: "9A", status: "izin", type: "santri" },
  { name: "Ustadz Ibrahim", jabatan: "Guru Bahasa Arab", status: "sakit", type: "guru" },
]

const upcomingTasks = [
  { task: "Batas input nilai UTS", date: "25 Jan 2025", urgent: true },
  { task: "Rekap presensi bulanan", date: "31 Jan 2025", urgent: true },
  { task: "Rapat wali kelas", date: "28 Jan 2025", urgent: false },
  { task: "Cetak rapor semester ganjil", date: "1 Feb 2025", urgent: false },
]

const topStudents = [
  { name: "Ahmad Fauzi", class: "12 IPA", score: 95.8, rank: 1, attendance: 100 },
  { name: "Siti Aisyah", class: "12 IPA", score: 94.2, rank: 2, attendance: 98 },
  { name: "Muhammad Rizki", class: "11 IPS", score: 93.5, rank: 3, attendance: 96 },
]

const ppdbOverview = {
  gelombang: "Gelombang 2",
  totalPendaftar: 186,
  terverifikasi: 142,
  menunggu: 31,
  ditolak: 13,
  deadline: "15 Februari 2025",
}

const defaultSppOverview = {
  periode: "Januari 2025",
  totalTagihan: 1247,
  lunas: 892,
  cicilan: 221,
  menunggak: 134,
  jatuhTempo: "10 Februari 2025",
}

const formatDashboardDate = (value: string): string => {
  if (!value) return "-"

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "hadir":
      return <Badge className="bg-primary/10 text-primary border-0">Hadir</Badge>
    case "sakit":
      return <Badge className="bg-chart-3/20 text-chart-4 border-0">Sakit</Badge>
    case "izin":
      return <Badge className="bg-accent/20 text-accent border-0">Izin</Badge>
    case "alpha":
      return <Badge className="bg-destructive/10 text-destructive border-0">Alpha</Badge>
    default:
      return <Badge variant="outline">-</Badge>
  }
}

export default function DashboardPage() {
  const { data: sppSummary, fetchSummary } = useSppTunggakanSummary()

  useEffect(() => {
    void fetchSummary()
  }, [fetchSummary])

  const santriPercentage = Math.round((attendanceOverview.santri.hadir / attendanceOverview.santri.total) * 100)
  const guruPercentage = Math.round((attendanceOverview.guru.hadir / attendanceOverview.guru.total) * 100)

  const sppOverview = useMemo(() => {
    if (!sppSummary) {
      return defaultSppOverview
    }

    return {
      periode: sppSummary.periode || defaultSppOverview.periode,
      totalTagihan: sppSummary.totalTagihan || defaultSppOverview.totalTagihan,
      lunas: sppSummary.totalLunas || defaultSppOverview.lunas,
      cicilan: sppSummary.totalCicilan || defaultSppOverview.cicilan,
      menunggak:
        sppSummary.totalTerlambat + sppSummary.totalBelumBayar || defaultSppOverview.menunggak,
      jatuhTempo: sppSummary.jatuhTempoBerikutnya
        ? formatDashboardDate(sppSummary.jatuhTempoBerikutnya)
        : defaultSppOverview.jatuhTempo,
    }
  }, [sppSummary])

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-sidebar to-sidebar-accent border-0 text-sidebar-foreground overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Assalamu&apos;alaikum, Admin!</h1>
              <p className="text-sidebar-foreground/80 mt-1">
                Selamat datang di e-Rapor Pesantren. Berikut ringkasan data hari ini.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-sidebar-foreground/70">
              <Calendar className="w-4 h-4" />
              <span>Kamis, 30 Januari 2025</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.title} className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                {stat.trend === "up" ? (
                  <TrendingUp className="w-4 h-4 text-primary" />
                ) : stat.trend === "down" ? (
                  <TrendingDown className="w-4 h-4 text-destructive" />
                ) : null}
                <span
                  className={`text-sm ${
                    stat.trend === "up"
                      ? "text-primary"
                      : stat.trend === "down"
                        ? "text-destructive"
                        : "text-muted-foreground"
                  }`}
                >
                  {stat.change}
                </span>
                <span className="text-sm text-muted-foreground">dari kemarin</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Attendance Overview */}
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-foreground">Ringkasan Kehadiran Hari Ini</CardTitle>
                  <CardDescription>Presensi santri dan guru per mata pelajaran</CardDescription>
                </div>
                <Link href="/dashboard/presensi-santri">
                  <Button variant="ghost" size="sm" className="text-primary">
                    Lihat Detail
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Santri Attendance */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold text-foreground">Kehadiran Santri</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span className="text-sm text-foreground">Hadir</span>
                      </div>
                      <span className="font-semibold text-foreground">{attendanceOverview.santri.hadir}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-chart-3" />
                        <span className="text-sm text-foreground">Sakit</span>
                      </div>
                      <span className="font-semibold text-foreground">{attendanceOverview.santri.sakit}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-accent" />
                        <span className="text-sm text-foreground">Izin</span>
                      </div>
                      <span className="font-semibold text-foreground">{attendanceOverview.santri.izin}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-destructive" />
                        <span className="text-sm text-foreground">Alpha</span>
                      </div>
                      <span className="font-semibold text-foreground">{attendanceOverview.santri.alpha}</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Tingkat Kehadiran</span>
                      <span className="font-bold text-primary">{santriPercentage}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${santriPercentage}%` }} />
                    </div>
                  </div>
                </div>

                {/* Guru Attendance */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-accent" />
                    <h4 className="font-semibold text-foreground">Kehadiran Guru</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span className="text-sm text-foreground">Hadir</span>
                      </div>
                      <span className="font-semibold text-foreground">{attendanceOverview.guru.hadir}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-chart-3" />
                        <span className="text-sm text-foreground">Sakit</span>
                      </div>
                      <span className="font-semibold text-foreground">{attendanceOverview.guru.sakit}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-accent" />
                        <span className="text-sm text-foreground">Izin</span>
                      </div>
                      <span className="font-semibold text-foreground">{attendanceOverview.guru.izin}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-destructive" />
                        <span className="text-sm text-foreground">Alpha</span>
                      </div>
                      <span className="font-semibold text-foreground">{attendanceOverview.guru.alpha}</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Tingkat Kehadiran</span>
                      <span className="font-bold text-primary">{guruPercentage}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${guruPercentage}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Jenjang Distribution */}
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-foreground">Distribusi Santri per Jenjang</CardTitle>
              <CardDescription>Total 1,247 santri aktif</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jenjangStats.map((jenjang) => (
                  <div key={jenjang.name} className="flex items-center gap-4">
                    <div className="w-12 text-sm font-medium text-foreground">{jenjang.name}</div>
                    <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden">
                      <div
                        className={`h-full ${jenjang.color} flex items-center justify-end pr-3`}
                        style={{ width: `${(jenjang.count / 500) * 100}%` }}
                      >
                        <span className="text-xs font-medium text-primary-foreground">
                          {jenjang.count}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-foreground">Aktivitas Terkini</CardTitle>
                  <CardDescription>Aktivitas pengguna dalam sistem</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary">
                  Lihat Semua
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {activity.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{activity.user}</span>{" "}
                        <span className="text-muted-foreground">{activity.action}</span>
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {activity.time}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">{activity.type}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Pending Validations */}
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-foreground">Menunggu Validasi</CardTitle>
                  <CardDescription>Presensi yang perlu disetujui</CardDescription>
                </div>
                <Badge className="bg-chart-3/20 text-chart-3 border-0">
                  {pendingValidations.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingValidations.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {item.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.type === "santri" ? `Kelas ${item.kelas}` : item.jabatan}
                      </p>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                ))}
              </div>
              <Link href="/dashboard/presensi-guru">
                <Button variant="outline" className="w-full mt-4 bg-transparent">
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  Kelola Presensi Guru
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Upcoming Tasks */}
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-foreground">Jadwal Mendatang</CardTitle>
              <CardDescription>Kegiatan yang perlu diperhatikan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingTasks.map((task, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        task.urgent ? "bg-destructive" : "bg-primary"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{task.task}</p>
                      <p className="text-xs text-muted-foreground">{task.date}</p>
                    </div>
                    {task.urgent && (
                      <Badge variant="destructive" className="text-xs">
                        Segera
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* PPDB Overview */}
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-foreground">PPDB</CardTitle>
                  <CardDescription>Ringkasan penerimaan santri baru</CardDescription>
                </div>
                <Badge className="bg-primary/10 text-primary border-0">{ppdbOverview.gelombang}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs text-muted-foreground">Total Pendaftar</p>
                  <p className="text-xl font-bold text-foreground mt-1">{ppdbOverview.totalPendaftar}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs text-muted-foreground">Terverifikasi</p>
                  <p className="text-xl font-bold text-primary mt-1">{ppdbOverview.terverifikasi}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    Menunggu Verifikasi
                  </div>
                  <span className="font-semibold text-foreground">{ppdbOverview.menunggu}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="w-4 h-4" />
                    Ditolak
                  </div>
                  <span className="font-semibold text-foreground">{ppdbOverview.ditolak}</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                  <span className="text-muted-foreground">Batas Pendaftaran</span>
                  <span className="font-medium text-foreground">{ppdbOverview.deadline}</span>
                </div>
              </div>

              <Link href="/dashboard/ppdb">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Kelola PPDB
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* SPP Overview */}
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-foreground">SPP</CardTitle>
                  <CardDescription>Ringkasan pembayaran SPP santri</CardDescription>
                </div>
                <Badge className="bg-accent/20 text-accent border-0">{sppOverview.periode}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs text-muted-foreground">Total Tagihan</p>
                  <p className="text-xl font-bold text-foreground mt-1">{sppOverview.totalTagihan}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs text-muted-foreground">Lunas</p>
                  <p className="text-xl font-bold text-primary mt-1">{sppOverview.lunas}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cicilan</span>
                  <span className="font-semibold text-foreground">{sppOverview.cicilan}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="w-4 h-4" />
                    Menunggak
                  </div>
                  <span className="font-semibold text-foreground">{sppOverview.menunggak}</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                  <span className="text-muted-foreground">Jatuh Tempo Berikutnya</span>
                  <span className="font-medium text-foreground">{sppOverview.jatuhTempo}</span>
                </div>
              </div>

              <Link href="/dashboard/spp">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Wallet className="w-4 h-4 mr-2" />
                  Kelola SPP
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Top Students */}
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-foreground">Santri Berprestasi</CardTitle>
              <CardDescription>Nilai dan kehadiran terbaik</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topStudents.map((student) => (
                  <div
                    key={student.rank}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        student.rank === 1
                          ? "bg-chart-3 text-foreground"
                          : student.rank === 2
                            ? "bg-muted-foreground/30 text-foreground"
                            : "bg-chart-5 text-foreground"
                      }`}
                    >
                      {student.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{student.name}</p>
                      <p className="text-xs text-muted-foreground">Kelas {student.class}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{student.score}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <UserCheck className="w-3 h-3" />
                        {student.attendance}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-foreground">Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/dashboard/presensi-santri">
                <Button className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90">
                  <UserCheck className="w-4 h-4 mr-2" />
                  Input Presensi Santri
                </Button>
              </Link>
              <Link href="/dashboard/presensi-guru">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  Input Presensi Guru
                </Button>
              </Link>
              <Link href="/dashboard/nilai">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Input Nilai
                </Button>
              </Link>
              <Link href="/dashboard/rapor">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <FileText className="w-4 h-4 mr-2" />
                  Cetak Rapor
                </Button>
              </Link>
              <Link href="/dashboard/spp">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Wallet className="w-4 h-4 mr-2" />
                  Kelola SPP
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
