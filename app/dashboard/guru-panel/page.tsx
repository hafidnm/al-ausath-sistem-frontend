"use client"

import { useState } from "react"
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
} from "lucide-react"

// Teaching schedule data
const jadwalMengajar = [
  { id: 1, mapel: "Tahfidz Al-Quran", kelas: "9A", jenjang: "SMP", hari: "Senin", jam: "07:00 - 08:30", siswa: 28 },
  { id: 2, mapel: "Tahfidz Al-Quran", kelas: "9B", jenjang: "SMP", hari: "Senin", jam: "08:30 - 10:00", siswa: 30 },
  { id: 3, mapel: "Tahfidz Al-Quran", kelas: "8A", jenjang: "SMP", hari: "Selasa", jam: "07:00 - 08:30", siswa: 32 },
  { id: 4, mapel: "Tahfidz Al-Quran", kelas: "8B", jenjang: "SMP", hari: "Selasa", jam: "08:30 - 10:00", siswa: 29 },
  { id: 5, mapel: "Fiqih", kelas: "7A", jenjang: "SMP", hari: "Rabu", jam: "10:30 - 12:00", siswa: 31 },
  { id: 6, mapel: "Fiqih", kelas: "7B", jenjang: "SMP", hari: "Kamis", jam: "10:30 - 12:00", siswa: 27 },
]

// Students for attendance input
const daftarSantri = [
  { id: 1, nis: "2024001", name: "Ahmad Fauzi", status: "" },
  { id: 2, nis: "2024002", name: "Siti Aisyah", status: "" },
  { id: 3, nis: "2024003", name: "Muhammad Rizki", status: "" },
  { id: 4, nis: "2024004", name: "Fatimah Zahra", status: "" },
  { id: 5, nis: "2024005", name: "Ibrahim Hasan", status: "" },
  { id: 6, nis: "2024006", name: "Khadijah Amina", status: "" },
  { id: 7, nis: "2024007", name: "Umar Abdullah", status: "" },
  { id: 8, nis: "2024008", name: "Zainab Putri", status: "" },
  { id: 9, nis: "2024009", name: "Yusuf Hidayat", status: "" },
  { id: 10, nis: "2024010", name: "Maryam Salma", status: "" },
]

// Attendance history
const riwayatPresensi = [
  { id: 1, tanggal: "30 Jan 2026", mapel: "Tahfidz Al-Quran", kelas: "9A", hadir: 26, sakit: 1, izin: 1, alpha: 0, status: "validated", validasi: "Disetujui" },
  { id: 2, tanggal: "29 Jan 2026", mapel: "Tahfidz Al-Quran", kelas: "9B", hadir: 28, sakit: 0, izin: 2, alpha: 0, status: "validated", validasi: "Disetujui" },
  { id: 3, tanggal: "28 Jan 2026", mapel: "Fiqih", kelas: "7A", hadir: 30, sakit: 1, izin: 0, alpha: 0, status: "pending", validasi: "Menunggu" },
  { id: 4, tanggal: "27 Jan 2026", mapel: "Tahfidz Al-Quran", kelas: "8A", hadir: 29, sakit: 2, izin: 1, alpha: 0, status: "validated", validasi: "Disetujui" },
  { id: 5, tanggal: "26 Jan 2026", mapel: "Fiqih", kelas: "7B", hadir: 25, sakit: 1, izin: 0, alpha: 1, status: "rejected", validasi: "Ditolak" },
]

const getInitials = (name: string) => {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

const getValidationBadge = (status: string) => {
  switch (status) {
    case "validated":
      return <Badge className="bg-primary/10 text-primary border-0">Disetujui</Badge>
    case "pending":
      return <Badge className="bg-secondary text-secondary-foreground border-0">Menunggu</Badge>
    case "rejected":
      return <Badge className="bg-destructive/10 text-destructive border-0">Ditolak</Badge>
    default:
      return <Badge variant="outline">-</Badge>
  }
}

export default function GuruPanelPage() {
  const [step, setStep] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedJadwal, setSelectedJadwal] = useState<typeof jadwalMengajar[0] | null>(null)
  const [attendanceData, setAttendanceData] = useState<Record<number, string>>({})
  const [guruHadir, setGuruHadir] = useState<string>("hadir")
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0)
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false)

  const todaySchedule = jadwalMengajar.filter(j => j.hari === "Senin")

  const handleOpenInput = (jadwal: typeof jadwalMengajar[0]) => {
    setSelectedJadwal(jadwal)
    setStep(1)
    setAttendanceData({})
    setCurrentStudentIndex(0)
    setGuruHadir("hadir")
    setIsSubmitSuccess(false)
    setIsDialogOpen(true)
  }

  const handleSetAttendance = (studentId: number, status: string) => {
    setAttendanceData(prev => ({ ...prev, [studentId]: status }))
    // Auto advance to next student after brief delay
    if (currentStudentIndex < daftarSantri.length - 1) {
      setTimeout(() => {
        setCurrentStudentIndex(prev => prev + 1)
      }, 300)
    }
  }

  const handleSubmit = () => {
    setIsSubmitSuccess(true)
    setTimeout(() => {
      setIsDialogOpen(false)
      setIsSubmitSuccess(false)
    }, 2000)
  }

  const completedCount = Object.keys(attendanceData).length
  const progressPercentage = (completedCount / daftarSantri.length) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Guru</h1>
          <p className="text-muted-foreground">Selamat datang, Ustadz Ahmad Hidayat</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>Kamis, 30 Januari 2026</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mata Pelajaran</p>
                <p className="text-xl font-bold text-foreground">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Kelas</p>
                <p className="text-xl font-bold text-foreground">6</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-chart-3/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-chart-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jadwal Hari Ini</p>
                <p className="text-xl font-bold text-foreground">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Presensi Terisi</p>
                <p className="text-xl font-bold text-foreground">24/30</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="jadwal" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="jadwal" className="data-[state=active]:bg-card">
            <Calendar className="w-4 h-4 mr-2" />
            Jadwal Mengajar
          </TabsTrigger>
          <TabsTrigger value="riwayat" className="data-[state=active]:bg-card">
            <History className="w-4 h-4 mr-2" />
            Riwayat Presensi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jadwal" className="space-y-4">
          {/* Today's Schedule */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Jadwal Hari Ini
              </CardTitle>
              <CardDescription>Senin, 30 Januari 2026</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {todaySchedule.length > 0 ? (
                todaySchedule.map((jadwal) => (
                  <div
                    key={jadwal.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{jadwal.mapel}</h4>
                        <p className="text-sm text-muted-foreground">
                          {jadwal.kelas} ({jadwal.jenjang}) - {jadwal.siswa} santri
                        </p>
                        <p className="text-xs text-primary font-medium mt-1">{jadwal.jam}</p>
                      </div>
                    </div>
                    <Button 
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => handleOpenInput(jadwal)}
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Input Presensi
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Tidak ada jadwal mengajar hari ini</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Full Schedule */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Semua Jadwal Mengajar</CardTitle>
              <CardDescription>Daftar lengkap jadwal mengajar Anda</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Mata Pelajaran</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Jenjang</TableHead>
                      <TableHead>Hari</TableHead>
                      <TableHead>Jam</TableHead>
                      <TableHead>Jumlah Santri</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jadwalMengajar.map((jadwal) => (
                      <TableRow key={jadwal.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-foreground">{jadwal.mapel}</TableCell>
                        <TableCell className="text-foreground">{jadwal.kelas}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-transparent">{jadwal.jenjang}</Badge>
                        </TableCell>
                        <TableCell className="text-foreground">{jadwal.hari}</TableCell>
                        <TableCell className="text-muted-foreground">{jadwal.jam}</TableCell>
                        <TableCell className="text-foreground">{jadwal.siswa} santri</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-transparent"
                            onClick={() => handleOpenInput(jadwal)}
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Input
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="riwayat" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg text-foreground">Riwayat Presensi</CardTitle>
                  <CardDescription>Histori presensi yang sudah Anda input</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Semua Mapel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Mapel</SelectItem>
                      <SelectItem value="quran">Tahfidz Al-Quran</SelectItem>
                      <SelectItem value="fiqih">Fiqih</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="month" defaultValue="2026-01" className="w-40" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Mata Pelajaran</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead className="text-center">Hadir</TableHead>
                      <TableHead className="text-center">Sakit</TableHead>
                      <TableHead className="text-center">Izin</TableHead>
                      <TableHead className="text-center">Alpha</TableHead>
                      <TableHead>Status Validasi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {riwayatPresensi.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-foreground">{item.tanggal}</TableCell>
                        <TableCell className="text-foreground">{item.mapel}</TableCell>
                        <TableCell className="text-foreground">{item.kelas}</TableCell>
                        <TableCell className="text-center">
                          <span className="text-primary font-medium">{item.hadir}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-chart-3">{item.sakit}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-accent">{item.izin}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-destructive">{item.alpha}</span>
                        </TableCell>
                        <TableCell>{getValidationBadge(item.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Input Presensi Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {isSubmitSuccess ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Presensi Berhasil Dikirim</h3>
              <p className="text-muted-foreground text-center">
                Data presensi telah dikirim ke admin untuk divalidasi
              </p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  Input Presensi - {selectedJadwal?.mapel}
                </DialogTitle>
                <DialogDescription>
                  {selectedJadwal?.kelas} ({selectedJadwal?.jenjang}) - {selectedJadwal?.hari}, {selectedJadwal?.jam}
                </DialogDescription>
              </DialogHeader>

              {/* Step Indicator */}
              <div className="flex items-center justify-center gap-2 py-4">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${step === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <span className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs">1</span>
                  Presensi Santri
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <span className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs">2</span>
                  Presensi Guru
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${step === 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <span className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs">3</span>
                  Kirim
                </div>
              </div>

              {step === 1 && (
                <div className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress Input</span>
                      <span className="font-medium text-foreground">{completedCount}/{daftarSantri.length} santri</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>

                  {/* Current Student Input */}
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar className="w-14 h-14">
                          <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                            {getInitials(daftarSantri[currentStudentIndex].name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-lg text-foreground">{daftarSantri[currentStudentIndex].name}</p>
                          <p className="text-sm text-muted-foreground">NIS: {daftarSantri[currentStudentIndex].nis}</p>
                          <p className="text-xs text-primary">Santri ke-{currentStudentIndex + 1} dari {daftarSantri.length}</p>
                        </div>
                      </div>

                      <RadioGroup
                        value={attendanceData[daftarSantri[currentStudentIndex].id] || ""}
                        onValueChange={(value) => handleSetAttendance(daftarSantri[currentStudentIndex].id, value)}
                        className="grid grid-cols-2 gap-3"
                      >
                        <Label 
                          htmlFor="hadir" 
                          className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${attendanceData[daftarSantri[currentStudentIndex].id] === 'hadir' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                        >
                          <RadioGroupItem value="hadir" id="hadir" />
                          <div>
                            <p className="font-medium text-foreground">Hadir</p>
                            <p className="text-xs text-muted-foreground">Santri hadir di kelas</p>
                          </div>
                        </Label>
                        <Label 
                          htmlFor="sakit" 
                          className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${attendanceData[daftarSantri[currentStudentIndex].id] === 'sakit' ? 'border-chart-3 bg-chart-3/10' : 'border-border hover:border-chart-3/50'}`}
                        >
                          <RadioGroupItem value="sakit" id="sakit" />
                          <div>
                            <p className="font-medium text-foreground">Sakit</p>
                            <p className="text-xs text-muted-foreground">Tidak hadir karena sakit</p>
                          </div>
                        </Label>
                        <Label 
                          htmlFor="izin" 
                          className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${attendanceData[daftarSantri[currentStudentIndex].id] === 'izin' ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'}`}
                        >
                          <RadioGroupItem value="izin" id="izin" />
                          <div>
                            <p className="font-medium text-foreground">Izin</p>
                            <p className="text-xs text-muted-foreground">Ada keperluan/izin</p>
                          </div>
                        </Label>
                        <Label 
                          htmlFor="alpha" 
                          className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${attendanceData[daftarSantri[currentStudentIndex].id] === 'alpha' ? 'border-destructive bg-destructive/10' : 'border-border hover:border-destructive/50'}`}
                        >
                          <RadioGroupItem value="alpha" id="alpha" />
                          <div>
                            <p className="font-medium text-foreground">Alpha</p>
                            <p className="text-xs text-muted-foreground">Tidak hadir tanpa ket.</p>
                          </div>
                        </Label>
                      </RadioGroup>
                    </CardContent>
                  </Card>

                  {/* Quick Navigation */}
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent"
                      disabled={currentStudentIndex === 0}
                      onClick={() => setCurrentStudentIndex(prev => prev - 1)}
                    >
                      Sebelumnya
                    </Button>
                    <div className="flex gap-1">
                      {daftarSantri.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentStudentIndex(idx)}
                          className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                            idx === currentStudentIndex 
                              ? 'bg-primary text-primary-foreground' 
                              : attendanceData[daftarSantri[idx].id] 
                                ? 'bg-primary/20 text-primary' 
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent"
                      disabled={currentStudentIndex === daftarSantri.length - 1}
                      onClick={() => setCurrentStudentIndex(prev => prev + 1)}
                    >
                      Berikutnya
                    </Button>
                  </div>

                  {/* Summary Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-12">No</TableHead>
                          <TableHead>Nama Santri</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {daftarSantri.map((santri, idx) => (
                          <TableRow 
                            key={santri.id} 
                            className={`hover:bg-muted/30 cursor-pointer ${idx === currentStudentIndex ? 'bg-primary/5' : ''}`}
                            onClick={() => setCurrentStudentIndex(idx)}
                          >
                            <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                            <TableCell className="font-medium text-foreground">{santri.name}</TableCell>
                            <TableCell className="text-center">
                              {attendanceData[santri.id] ? (
                                <Badge className={`border-0 ${
                                  attendanceData[santri.id] === 'hadir' ? 'bg-primary/10 text-primary' :
                                  attendanceData[santri.id] === 'sakit' ? 'bg-chart-3/20 text-chart-4' :
                                  attendanceData[santri.id] === 'izin' ? 'bg-accent/20 text-accent' :
                                  'bg-destructive/10 text-destructive'
                                }`}>
                                  {attendanceData[santri.id].charAt(0).toUpperCase() + attendanceData[santri.id].slice(1)}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">Belum diisi</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="text-base text-foreground">Kehadiran Guru</CardTitle>
                      <CardDescription>Konfirmasi kehadiran Anda pada mata pelajaran ini</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup
                        value={guruHadir}
                        onValueChange={setGuruHadir}
                        className="space-y-3"
                      >
                        <Label 
                          htmlFor="guru-hadir" 
                          className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${guruHadir === 'hadir' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                        >
                          <RadioGroupItem value="hadir" id="guru-hadir" />
                          <div className="flex-1">
                            <p className="font-medium text-foreground">Hadir Mengajar</p>
                            <p className="text-sm text-muted-foreground">Saya hadir dan mengajar pada jadwal ini</p>
                          </div>
                          <Check className={`w-5 h-5 ${guruHadir === 'hadir' ? 'text-primary' : 'text-transparent'}`} />
                        </Label>
                        <Label 
                          htmlFor="guru-tidak" 
                          className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${guruHadir === 'tidak' ? 'border-destructive bg-destructive/10' : 'border-border hover:border-destructive/50'}`}
                        >
                          <RadioGroupItem value="tidak" id="guru-tidak" />
                          <div className="flex-1">
                            <p className="font-medium text-foreground">Tidak Hadir</p>
                            <p className="text-sm text-muted-foreground">Saya tidak hadir mengajar hari ini</p>
                          </div>
                          <Check className={`w-5 h-5 ${guruHadir === 'tidak' ? 'text-destructive' : 'text-transparent'}`} />
                        </Label>
                      </RadioGroup>

                      {guruHadir === 'tidak' && (
                        <div className="mt-4 space-y-2">
                          <Label htmlFor="alasan">Alasan Tidak Hadir</Label>
                          <Input id="alasan" placeholder="Masukkan alasan tidak hadir..." />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="text-base text-foreground">Ringkasan Presensi</CardTitle>
                      <CardDescription>Periksa kembali data sebelum mengirim</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">Mata Pelajaran</p>
                          <p className="font-medium text-foreground">{selectedJadwal?.mapel}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Kelas</p>
                          <p className="font-medium text-foreground">{selectedJadwal?.kelas}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Tanggal</p>
                          <p className="font-medium text-foreground">30 Januari 2026</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status Guru</p>
                          <Badge className={guruHadir === 'hadir' ? 'bg-primary/10 text-primary border-0' : 'bg-destructive/10 text-destructive border-0'}>
                            {guruHadir === 'hadir' ? 'Hadir' : 'Tidak Hadir'}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-primary/10 rounded-lg">
                          <p className="text-2xl font-bold text-primary">
                            {Object.values(attendanceData).filter(v => v === 'hadir').length}
                          </p>
                          <p className="text-sm text-muted-foreground">Hadir</p>
                        </div>
                        <div className="text-center p-4 bg-chart-3/20 rounded-lg">
                          <p className="text-2xl font-bold text-chart-4">
                            {Object.values(attendanceData).filter(v => v === 'sakit').length}
                          </p>
                          <p className="text-sm text-muted-foreground">Sakit</p>
                        </div>
                        <div className="text-center p-4 bg-accent/20 rounded-lg">
                          <p className="text-2xl font-bold text-accent">
                            {Object.values(attendanceData).filter(v => v === 'izin').length}
                          </p>
                          <p className="text-sm text-muted-foreground">Izin</p>
                        </div>
                        <div className="text-center p-4 bg-destructive/10 rounded-lg">
                          <p className="text-2xl font-bold text-destructive">
                            {Object.values(attendanceData).filter(v => v === 'alpha').length}
                          </p>
                          <p className="text-sm text-muted-foreground">Alpha</p>
                        </div>
                      </div>

                      <div className="p-4 bg-secondary/50 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-secondary-foreground mt-0.5" />
                        <div>
                          <p className="font-medium text-secondary-foreground">Catatan</p>
                          <p className="text-sm text-muted-foreground">
                            Data presensi akan dikirim ke admin untuk divalidasi. Anda akan mendapat notifikasi setelah presensi diverifikasi.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <DialogFooter className="gap-2">
                {step > 1 && (
                  <Button variant="outline" className="bg-transparent" onClick={() => setStep(step - 1)}>
                    Kembali
                  </Button>
                )}
                {step < 3 ? (
                  <Button 
                    className="bg-primary text-primary-foreground"
                    onClick={() => setStep(step + 1)}
                    disabled={step === 1 && completedCount < daftarSantri.length}
                  >
                    Lanjutkan
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    className="bg-primary text-primary-foreground"
                    onClick={handleSubmit}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Kirim ke Admin
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
