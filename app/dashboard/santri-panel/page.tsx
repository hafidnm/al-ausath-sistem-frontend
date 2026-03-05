"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  Calendar,
  BookOpen,
  TrendingUp,
  User,
  FileText,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

// Student data
const santriInfo = {
  name: "Ahmad Fauzi",
  nis: "2024001",
  kelas: "9A",
  jenjang: "SMP",
  waliKelas: "Ustadz Ibrahim",
  tahunAjaran: "2025/2026",
  semester: "Ganjil",
}

// Attendance summary
const attendanceSummary = {
  hadir: 145,
  sakit: 3,
  izin: 2,
  alpha: 0,
  total: 150,
}

// Monthly attendance data
const monthlyData = [
  { bulan: "Jul", hadir: 20, sakit: 1, izin: 0, alpha: 0 },
  { bulan: "Agu", hadir: 22, sakit: 0, izin: 1, alpha: 0 },
  { bulan: "Sep", hadir: 21, sakit: 1, izin: 0, alpha: 0 },
  { bulan: "Okt", hadir: 23, sakit: 0, izin: 0, alpha: 0 },
  { bulan: "Nov", hadir: 20, sakit: 1, izin: 1, alpha: 0 },
  { bulan: "Des", hadir: 18, sakit: 0, izin: 0, alpha: 0 },
  { bulan: "Jan", hadir: 21, sakit: 0, izin: 0, alpha: 0 },
]

// Attendance by subject
const attendanceBySubject = [
  { mapel: "Tahfidz Al-Quran", hadir: 28, sakit: 1, izin: 1, alpha: 0, total: 30, guru: "Ustadz Ahmad" },
  { mapel: "Fiqih", hadir: 25, sakit: 1, izin: 0, alpha: 0, total: 26, guru: "Ustadz Umar" },
  { mapel: "Hadits", hadir: 24, sakit: 0, izin: 1, alpha: 0, total: 25, guru: "Ustadz Ibrahim" },
  { mapel: "Bahasa Arab", hadir: 26, sakit: 1, izin: 0, alpha: 0, total: 27, guru: "Ustadzah Fatimah" },
  { mapel: "Matematika", hadir: 22, sakit: 0, izin: 0, alpha: 0, total: 22, guru: "Pak Budi" },
  { mapel: "IPA", hadir: 20, sakit: 0, izin: 0, alpha: 0, total: 20, guru: "Bu Siti" },
]

// Recent attendance records
const recentAttendance = [
  { tanggal: "30 Jan 2026", mapel: "Tahfidz Al-Quran", status: "hadir", jam: "07:15" },
  { tanggal: "30 Jan 2026", mapel: "Fiqih", status: "hadir", jam: "09:05" },
  { tanggal: "29 Jan 2026", mapel: "Hadits", status: "hadir", jam: "07:10" },
  { tanggal: "29 Jan 2026", mapel: "Matematika", status: "hadir", jam: "10:00" },
  { tanggal: "28 Jan 2026", mapel: "Bahasa Arab", status: "sakit", jam: "-" },
  { tanggal: "27 Jan 2026", mapel: "IPA", status: "hadir", jam: "08:30" },
  { tanggal: "27 Jan 2026", mapel: "Tahfidz Al-Quran", status: "hadir", jam: "07:08" },
  { tanggal: "26 Jan 2026", mapel: "Fiqih", status: "izin", jam: "-" },
]

const pieChartData = [
  { name: "Hadir", value: attendanceSummary.hadir, color: "hsl(var(--primary))" },
  { name: "Sakit", value: attendanceSummary.sakit, color: "hsl(var(--chart-3))" },
  { name: "Izin", value: attendanceSummary.izin, color: "hsl(var(--accent))" },
  { name: "Alpha", value: attendanceSummary.alpha, color: "hsl(var(--destructive))" },
]

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

const getStatusIcon = (status: string) => {
  switch (status) {
    case "hadir":
      return <CheckCircle className="w-4 h-4 text-primary" />
    case "sakit":
      return <AlertCircle className="w-4 h-4 text-chart-3" />
    case "izin":
      return <Clock className="w-4 h-4 text-accent" />
    case "alpha":
      return <XCircle className="w-4 h-4 text-destructive" />
    default:
      return null
  }
}

export default function SantriPanelPage() {
  const [selectedMonth, setSelectedMonth] = useState("all")
  const [selectedMapel, setSelectedMapel] = useState("all")

  const attendancePercentage = Math.round((attendanceSummary.hadir / attendanceSummary.total) * 100)

  return (
    <div className="space-y-6">
      {/* Header with Student Info */}
      <Card className="border-border/50 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                AF
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-foreground">{santriInfo.name}</h1>
                <Badge variant="outline" className="bg-transparent">{santriInfo.jenjang}</Badge>
              </div>
              <p className="text-muted-foreground mb-3">NIS: {santriInfo.nis}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span className="text-foreground">Kelas {santriInfo.kelas}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-foreground">{santriInfo.waliKelas}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-foreground">{santriInfo.tahunAjaran} - {santriInfo.semester}</span>
                </div>
              </div>
            </div>
            <div className="text-center md:text-right">
              <div className="inline-flex flex-col items-center p-4 bg-card rounded-xl border border-border/50">
                <span className="text-3xl font-bold text-primary">{attendancePercentage}%</span>
                <span className="text-sm text-muted-foreground">Tingkat Kehadiran</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Hadir</p>
                <p className="text-2xl font-bold text-primary mt-1">{attendanceSummary.hadir}</p>
                <p className="text-xs text-muted-foreground mt-1">dari {attendanceSummary.total} hari</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sakit</p>
                <p className="text-2xl font-bold text-chart-4 mt-1">{attendanceSummary.sakit}</p>
                <p className="text-xs text-muted-foreground mt-1">hari</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-chart-3/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-chart-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Izin</p>
                <p className="text-2xl font-bold text-accent mt-1">{attendanceSummary.izin}</p>
                <p className="text-xs text-muted-foreground mt-1">hari</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alpha</p>
                <p className="text-2xl font-bold text-destructive mt-1">{attendanceSummary.alpha}</p>
                <p className="text-xs text-muted-foreground mt-1">hari</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Monthly Chart */}
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Grafik Kehadiran Bulanan
                </CardTitle>
                <CardDescription>Statistik kehadiran per bulan</CardDescription>
              </div>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Pilih Periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Bulan</SelectItem>
                  <SelectItem value="semester1">Semester 1</SelectItem>
                  <SelectItem value="semester2">Semester 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="bulan" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar dataKey="hadir" fill="hsl(var(--primary))" name="Hadir" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sakit" fill="hsl(var(--chart-3))" name="Sakit" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="izin" fill="hsl(var(--accent))" name="Izin" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="alpha" fill="hsl(var(--destructive))" name="Alpha" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Distribusi Kehadiran</CardTitle>
            <CardDescription>Total semester ini</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieChartData.filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="mapel" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="mapel" className="data-[state=active]:bg-card">
            <BookOpen className="w-4 h-4 mr-2" />
            Per Mata Pelajaran
          </TabsTrigger>
          <TabsTrigger value="riwayat" className="data-[state=active]:bg-card">
            <FileText className="w-4 h-4 mr-2" />
            Riwayat Terbaru
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mapel" className="space-y-4">
          {/* Attendance by Subject */}
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg text-foreground">Kehadiran Per Mata Pelajaran</CardTitle>
                  <CardDescription>Detail kehadiran untuk setiap mata pelajaran</CardDescription>
                </div>
                <Select value={selectedMapel} onValueChange={setSelectedMapel}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Filter Mapel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Mapel</SelectItem>
                    <SelectItem value="diniyah">Diniyah</SelectItem>
                    <SelectItem value="umum">Umum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {attendanceBySubject.map((subject, idx) => {
                const percentage = Math.round((subject.hadir / subject.total) * 100)
                return (
                  <div key={idx} className="p-4 rounded-lg border border-border/50 bg-muted/20">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-3">
                      <div>
                        <h4 className="font-semibold text-foreground">{subject.mapel}</h4>
                        <p className="text-sm text-muted-foreground">Guru: {subject.guru}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Hadir:</span>
                          <span className="font-medium text-primary">{subject.hadir}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Sakit:</span>
                          <span className="font-medium text-chart-4">{subject.sakit}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Izin:</span>
                          <span className="font-medium text-accent">{subject.izin}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Alpha:</span>
                          <span className="font-medium text-destructive">{subject.alpha}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Tingkat kehadiran</span>
                        <span className="font-medium text-foreground">{percentage}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="riwayat" className="space-y-4">
          {/* Recent Attendance Records */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Riwayat Kehadiran Terbaru</CardTitle>
              <CardDescription>10 record kehadiran terakhir</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Mata Pelajaran</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Jam Masuk</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentAttendance.map((record, idx) => (
                      <TableRow key={idx} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-foreground">{record.tanggal}</TableCell>
                        <TableCell className="text-foreground">{record.mapel}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(record.status)}
                            {getStatusBadge(record.status)}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.jam !== "-" ? record.jam : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Information Card for Parents */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Informasi untuk Wali Santri</h4>
              <p className="text-sm text-muted-foreground">
                Halaman ini menampilkan data kehadiran putra/putri Anda secara real-time. 
                Data presensi diinput oleh guru pengampu dan telah divalidasi oleh admin pesantren. 
                Jika ada pertanyaan atau ketidaksesuaian data, silakan hubungi wali kelas atau bagian administrasi.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
