"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  UserCheck,
  UserX,
  Users,
  GraduationCap,
  Search,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts"

// Daily overview data
const dailyOverview = {
  date: "30 Januari 2026",
  santri: {
    total: 1247,
    hadir: 1150,
    sakit: 45,
    izin: 32,
    alpha: 20,
    percentage: 92.2,
    trend: "+2.1%",
    trendUp: true,
  },
  guru: {
    total: 48,
    hadir: 45,
    tidakHadir: 3,
    percentage: 93.8,
    trend: "+1.5%",
    trendUp: true,
  },
  validation: {
    pending: 12,
    approved: 156,
    rejected: 3,
  }
}

// Attendance by class
const attendanceByClass = [
  { kelas: "7A", jenjang: "SMP", total: 31, hadir: 29, sakit: 1, izin: 1, alpha: 0, percentage: 93.5 },
  { kelas: "7B", jenjang: "SMP", total: 30, hadir: 28, sakit: 1, izin: 0, alpha: 1, percentage: 93.3 },
  { kelas: "8A", jenjang: "SMP", total: 32, hadir: 30, sakit: 1, izin: 1, alpha: 0, percentage: 93.8 },
  { kelas: "8B", jenjang: "SMP", total: 29, hadir: 27, sakit: 0, izin: 2, alpha: 0, percentage: 93.1 },
  { kelas: "9A", jenjang: "SMP", total: 28, hadir: 26, sakit: 1, izin: 1, alpha: 0, percentage: 92.9 },
  { kelas: "9B", jenjang: "SMP", total: 30, hadir: 29, sakit: 0, izin: 0, alpha: 1, percentage: 96.7 },
  { kelas: "10A", jenjang: "SMA", total: 35, hadir: 33, sakit: 1, izin: 1, alpha: 0, percentage: 94.3 },
  { kelas: "11A", jenjang: "SMA", total: 34, hadir: 31, sakit: 2, izin: 1, alpha: 0, percentage: 91.2 },
  { kelas: "12A", jenjang: "SMA", total: 32, hadir: 30, sakit: 1, izin: 0, alpha: 1, percentage: 93.8 },
]

// Attendance by subject
const attendanceBySubject = [
  { mapel: "Tahfidz Al-Quran", guru: "Ustadz Ahmad", sessions: 5, avgHadir: 94.2, trend: "+1.2%" },
  { mapel: "Fiqih", guru: "Ustadz Umar", sessions: 4, avgHadir: 92.8, trend: "-0.5%" },
  { mapel: "Hadits", guru: "Ustadz Ibrahim", sessions: 4, avgHadir: 95.1, trend: "+2.3%" },
  { mapel: "Bahasa Arab", guru: "Ustadzah Fatimah", sessions: 5, avgHadir: 91.5, trend: "-1.1%" },
  { mapel: "Matematika", guru: "Pak Budi", sessions: 6, avgHadir: 93.7, trend: "+0.8%" },
  { mapel: "IPA", guru: "Bu Siti", sessions: 4, avgHadir: 94.5, trend: "+1.5%" },
]

// Teacher attendance
const teacherAttendance = [
  { id: 1, nama: "Ustadz Ahmad Hidayat", nip: "198501012010011001", jabatan: "Guru Tahfidz", status: "hadir", jamMasuk: "06:45", mapelHariIni: 2, validasi: "approved" },
  { id: 2, nama: "Ustadzah Fatimah", nip: "198601022010012002", jabatan: "Guru Bahasa Arab", status: "hadir", jamMasuk: "07:00", mapelHariIni: 2, validasi: "approved" },
  { id: 3, nama: "Ustadz Ibrahim", nip: "198701032010011003", jabatan: "Guru Bahasa Arab", status: "tidak_hadir", jamMasuk: "-", mapelHariIni: 0, validasi: "pending", alasan: "Sakit" },
  { id: 4, nama: "Ustadz Umar", nip: "198801042010011004", jabatan: "Guru Hadits", status: "hadir", jamMasuk: "06:50", mapelHariIni: 2, validasi: "approved" },
  { id: 5, nama: "Pak Budi Santoso", nip: "198901052010011005", jabatan: "Guru Matematika", status: "hadir", jamMasuk: "07:05", mapelHariIni: 3, validasi: "approved" },
]

// Weekly trend data
const weeklyTrend = [
  { hari: "Sen", santriHadir: 92, guruHadir: 94 },
  { hari: "Sel", santriHadir: 91, guruHadir: 92 },
  { hari: "Rab", santriHadir: 93, guruHadir: 96 },
  { hari: "Kam", santriHadir: 90, guruHadir: 91 },
  { hari: "Jum", santriHadir: 89, guruHadir: 90 },
  { hari: "Sab", santriHadir: 88, guruHadir: 89 },
]

// Jenjang distribution
const jenjangDistribution = [
  { name: "PAUD", value: 120, hadir: 115, color: "hsl(var(--chart-1))" },
  { name: "TK", value: 150, hadir: 142, color: "hsl(var(--chart-2))" },
  { name: "SD", value: 380, hadir: 355, color: "hsl(var(--chart-3))" },
  { name: "SMP", value: 350, hadir: 325, color: "hsl(var(--chart-4))" },
  { name: "SMA", value: 247, hadir: 213, color: "hsl(var(--chart-5))" },
]

const getInitials = (name: string) => {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "hadir":
      return <Badge className="bg-primary/10 text-primary border-0">Hadir</Badge>
    case "tidak_hadir":
      return <Badge className="bg-destructive/10 text-destructive border-0">Tidak Hadir</Badge>
    default:
      return <Badge variant="outline">-</Badge>
  }
}

const getValidationBadge = (status: string) => {
  switch (status) {
    case "approved":
      return <Badge className="bg-primary/10 text-primary border-0">Valid</Badge>
    case "pending":
      return <Badge className="bg-secondary text-secondary-foreground border-0">Pending</Badge>
    case "rejected":
      return <Badge className="bg-destructive/10 text-destructive border-0">Ditolak</Badge>
    default:
      return <Badge variant="outline">-</Badge>
  }
}

export default function PresensiOverviewPage() {
  const [selectedDate, setSelectedDate] = useState("2026-01-30")
  const [selectedJenjang, setSelectedJenjang] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Presensi</h1>
          <p className="text-muted-foreground">Ringkasan kehadiran harian santri dan guru</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-0 p-0 h-auto focus-visible:ring-0 w-32"
            />
          </div>
          <Button variant="outline" size="sm" className="bg-transparent">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="bg-transparent">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Santri Hadir */}
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Santri Hadir</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-primary">{dailyOverview.santri.hadir}</p>
                  <span className="text-sm text-muted-foreground">/ {dailyOverview.santri.total}</span>
                </div>
                <div className="flex items-center gap-1">
                  {dailyOverview.santri.trendUp ? (
                    <ArrowUpRight className="w-3 h-3 text-primary" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-destructive" />
                  )}
                  <span className={`text-xs font-medium ${dailyOverview.santri.trendUp ? 'text-primary' : 'text-destructive'}`}>
                    {dailyOverview.santri.trend}
                  </span>
                  <span className="text-xs text-muted-foreground">vs kemarin</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="mt-3">
              <Progress value={dailyOverview.santri.percentage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{dailyOverview.santri.percentage}% kehadiran</p>
            </div>
          </CardContent>
        </Card>

        {/* Guru Hadir */}
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Guru Hadir</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-accent">{dailyOverview.guru.hadir}</p>
                  <span className="text-sm text-muted-foreground">/ {dailyOverview.guru.total}</span>
                </div>
                <div className="flex items-center gap-1">
                  {dailyOverview.guru.trendUp ? (
                    <ArrowUpRight className="w-3 h-3 text-primary" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-destructive" />
                  )}
                  <span className={`text-xs font-medium ${dailyOverview.guru.trendUp ? 'text-primary' : 'text-destructive'}`}>
                    {dailyOverview.guru.trend}
                  </span>
                  <span className="text-xs text-muted-foreground">vs kemarin</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-accent" />
              </div>
            </div>
            <div className="mt-3">
              <Progress value={dailyOverview.guru.percentage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{dailyOverview.guru.percentage}% kehadiran</p>
            </div>
          </CardContent>
        </Card>

        {/* Tidak Hadir */}
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tidak Hadir</p>
                <p className="text-2xl font-bold text-foreground">
                  {dailyOverview.santri.sakit + dailyOverview.santri.izin + dailyOverview.santri.alpha}
                </p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-chart-4">S: {dailyOverview.santri.sakit}</span>
                  <span className="text-accent">I: {dailyOverview.santri.izin}</span>
                  <span className="text-destructive">A: {dailyOverview.santri.alpha}</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-chart-3/20 flex items-center justify-center">
                <UserX className="w-6 h-6 text-chart-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validasi Status */}
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status Validasi</p>
                <p className="text-2xl font-bold text-secondary-foreground">{dailyOverview.validation.pending}</p>
                <p className="text-xs text-muted-foreground">menunggu validasi</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <Clock className="w-6 h-6 text-secondary-foreground" />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Badge className="bg-primary/10 text-primary border-0 text-xs">{dailyOverview.validation.approved} valid</Badge>
              <Badge className="bg-destructive/10 text-destructive border-0 text-xs">{dailyOverview.validation.rejected} ditolak</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly Trend */}
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Tren Kehadiran Mingguan
                </CardTitle>
                <CardDescription>Persentase kehadiran 7 hari terakhir</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrend}>
                  <defs>
                    <linearGradient id="santriGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="guruGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hari" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[80, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Area type="monotone" dataKey="santriHadir" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#santriGradient)" name="Santri (%)" />
                  <Area type="monotone" dataKey="guruHadir" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#guruGradient)" name="Guru (%)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Jenjang Distribution */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Distribusi per Jenjang</CardTitle>
            <CardDescription>Kehadiran berdasarkan jenjang pendidikan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={jenjangDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="hadir"
                  >
                    {jenjangDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                    formatter={(value, name, props) => [`${value} hadir`, props.payload.name]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="kelas" className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="kelas" className="data-[state=active]:bg-card">
              <Users className="w-4 h-4 mr-2" />
              Per Kelas
            </TabsTrigger>
            <TabsTrigger value="mapel" className="data-[state=active]:bg-card">
              <BookOpen className="w-4 h-4 mr-2" />
              Per Mapel
            </TabsTrigger>
            <TabsTrigger value="guru" className="data-[state=active]:bg-card">
              <GraduationCap className="w-4 h-4 mr-2" />
              Guru
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari..."
                className="pl-10 w-48"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedJenjang} onValueChange={setSelectedJenjang}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Jenjang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenjang</SelectItem>
                <SelectItem value="paud">PAUD</SelectItem>
                <SelectItem value="tk">TK</SelectItem>
                <SelectItem value="sd">SD</SelectItem>
                <SelectItem value="smp">SMP</SelectItem>
                <SelectItem value="sma">SMA</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Per Kelas Tab */}
        <TabsContent value="kelas">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Kehadiran per Kelas</CardTitle>
              <CardDescription>Detail kehadiran santri untuk setiap kelas</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Kelas</TableHead>
                      <TableHead>Jenjang</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Hadir</TableHead>
                      <TableHead className="text-center">Sakit</TableHead>
                      <TableHead className="text-center">Izin</TableHead>
                      <TableHead className="text-center">Alpha</TableHead>
                      <TableHead>Tingkat Kehadiran</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceByClass.map((item, idx) => (
                      <TableRow key={idx} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-foreground">{item.kelas}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-transparent">{item.jenjang}</Badge>
                        </TableCell>
                        <TableCell className="text-center text-foreground">{item.total}</TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium text-primary">{item.hadir}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-chart-4">{item.sakit}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-accent">{item.izin}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-destructive">{item.alpha}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={item.percentage} className="h-2 w-20" />
                            <span className="text-sm font-medium text-foreground">{item.percentage}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Per Mapel Tab */}
        <TabsContent value="mapel">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Kehadiran per Mata Pelajaran</CardTitle>
              <CardDescription>Rata-rata kehadiran berdasarkan mata pelajaran</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Mata Pelajaran</TableHead>
                      <TableHead>Guru Pengampu</TableHead>
                      <TableHead className="text-center">Sesi Hari Ini</TableHead>
                      <TableHead>Rata-rata Kehadiran</TableHead>
                      <TableHead>Tren</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceBySubject.map((item, idx) => (
                      <TableRow key={idx} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-foreground">{item.mapel}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-7 h-7">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {getInitials(item.guru)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-foreground">{item.guru}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-foreground">{item.sessions}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={item.avgHadir} className="h-2 w-20" />
                            <span className="text-sm font-medium text-foreground">{item.avgHadir}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {item.trend.startsWith("+") ? (
                              <ArrowUpRight className="w-4 h-4 text-primary" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4 text-destructive" />
                            )}
                            <span className={`text-sm font-medium ${item.trend.startsWith("+") ? 'text-primary' : 'text-destructive'}`}>
                              {item.trend}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guru Tab */}
        <TabsContent value="guru">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Kehadiran Guru</CardTitle>
              <CardDescription>Status kehadiran guru hari ini</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Nama Guru</TableHead>
                      <TableHead>NIP</TableHead>
                      <TableHead>Jabatan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Jam Masuk</TableHead>
                      <TableHead className="text-center">Mapel Hari Ini</TableHead>
                      <TableHead>Validasi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherAttendance.map((guru) => (
                      <TableRow key={guru.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-accent/20 text-accent text-xs">
                                {getInitials(guru.nama)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-foreground">{guru.nama}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{guru.nip}</TableCell>
                        <TableCell className="text-foreground">{guru.jabatan}</TableCell>
                        <TableCell>
                          {getStatusBadge(guru.status)}
                          {guru.alasan && (
                            <p className="text-xs text-muted-foreground mt-1">{guru.alasan}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-foreground">{guru.jamMasuk}</TableCell>
                        <TableCell className="text-center text-foreground">{guru.mapelHariIni}</TableCell>
                        <TableCell>{getValidationBadge(guru.validasi)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* UX Flow Diagram Card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            Alur Presensi
          </CardTitle>
          <CardDescription>Diagram alur proses presensi di e-Rapor Pesantren</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 overflow-x-auto py-4">
            {[
              { step: 1, title: "Login Guru", desc: "Guru login ke sistem" },
              { step: 2, title: "Pilih Kelas & Mapel", desc: "Pilih jadwal mengajar" },
              { step: 3, title: "Input Presensi", desc: "Input kehadiran per santri" },
              { step: 4, title: "Kirim ke Admin", desc: "Submit untuk validasi" },
              { step: 5, title: "Validasi Admin", desc: "Admin review & approve" },
              { step: 6, title: "Tampil ke Wali", desc: "Data visible ke wali santri" },
            ].map((item, idx) => (
              <div key={item.step} className="flex items-center gap-4">
                <div className="flex flex-col items-center text-center min-w-28">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm mb-2">
                    {item.step}
                  </div>
                  <p className="font-medium text-foreground text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                {idx < 5 && (
                  <div className="hidden md:block w-8 h-0.5 bg-primary/30" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Add missing import
import { BookOpen } from "lucide-react"
