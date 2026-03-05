"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  UserCheck,
  UserX,
  Clock,
  AlertCircle,
  Search,
  Calendar,
  Download,
  MoreHorizontal,
  CheckCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  BookOpen,
  MapPin,
} from "lucide-react"

// Sample data
const attendanceStats = [
  { label: "Hadir", count: 78, percentage: 91, icon: UserCheck, color: "bg-primary/10 text-primary" },
  { label: "Sakit", count: 4, percentage: 5, icon: AlertCircle, color: "bg-chart-3/20 text-chart-3" },
  { label: "Izin", count: 2, percentage: 2, icon: Clock, color: "bg-accent/20 text-accent" },
  { label: "Alpha", count: 2, percentage: 2, icon: UserX, color: "bg-destructive/10 text-destructive" },
]

const mapelOptions = [
  { value: "all", label: "Semua Mapel" },
  { value: "quran", label: "Tahfidz Al-Quran" },
  { value: "fiqih", label: "Fiqih" },
  { value: "hadits", label: "Hadits" },
  { value: "arab", label: "Bahasa Arab" },
  { value: "math", label: "Matematika" },
  { value: "ipa", label: "IPA" },
]

const jenjangOptions = [
  { value: "all", label: "Semua Jenjang" },
  { value: "paud", label: "PAUD" },
  { value: "tk", label: "TK" },
  { value: "sd", label: "SD" },
  { value: "smp", label: "SMP" },
  { value: "sma", label: "SMA" },
]

const statusOptions = [
  { value: "all", label: "Semua Status" },
  { value: "hadir", label: "Hadir" },
  { value: "sakit", label: "Sakit" },
  { value: "izin", label: "Izin" },
  { value: "alpha", label: "Alpha" },
]

const guruAttendance = [
  { id: 1, nip: "198501012010011001", name: "Ustadz Ahmad Ridwan", jabatan: "Guru Tahfidz", mapel: "Tahfidz Al-Quran", jenjang: "SMP", kelas: "9A, 9B", tanggal: "30 Jan 2025", jamMasuk: "06:45", jamKeluar: "15:30", status: "hadir", validated: true },
  { id: 2, nip: "198703152012012002", name: "Ustadzah Fatimah Az-Zahra", jabatan: "Wali Kelas", mapel: "Fiqih", jenjang: "SMP", kelas: "10A", tanggal: "30 Jan 2025", jamMasuk: "06:50", jamKeluar: "15:30", status: "hadir", validated: true },
  { id: 3, nip: "199001202015011003", name: "Ustadz Ibrahim Hasan", jabatan: "Guru Bahasa Arab", mapel: "Bahasa Arab", jenjang: "SMP", kelas: "8A, 8B, 9A", tanggal: "30 Jan 2025", jamMasuk: "-", jamKeluar: "-", status: "sakit", validated: false },
  { id: 4, nip: "198812012011011004", name: "Ustadz Umar Abdullah", jabatan: "Kepala Program Diniyah", mapel: "Hadits", jenjang: "SMA", kelas: "11A, 12A", tanggal: "30 Jan 2025", jamMasuk: "06:40", jamKeluar: "15:30", status: "hadir", validated: true },
  { id: 5, nip: "199205102018012005", name: "Bu Siti Aminah", jabatan: "Guru Matematika", mapel: "Matematika", jenjang: "SMA", kelas: "10A, 10B, 11A", tanggal: "30 Jan 2025", jamMasuk: "06:55", jamKeluar: "-", status: "hadir", validated: false },
  { id: 6, nip: "198907082013011006", name: "Pak Budi Santoso", jabatan: "Guru IPA", mapel: "IPA", jenjang: "SMP", kelas: "7A, 7B, 8A", tanggal: "30 Jan 2025", jamMasuk: "-", jamKeluar: "-", status: "izin", validated: true },
  { id: 7, nip: "199108152017012007", name: "Ustadzah Khadijah Nur", jabatan: "Guru PAUD", mapel: "Tematik", jenjang: "PAUD", kelas: "A, B", tanggal: "30 Jan 2025", jamMasuk: "06:30", jamKeluar: "12:00", status: "hadir", validated: true },
  { id: 8, nip: "198604202009011008", name: "Ustadz Yusuf Hakim", jabatan: "Guru Aqidah", mapel: "Aqidah Akhlak", jenjang: "SD", kelas: "4, 5, 6", tanggal: "30 Jan 2025", jamMasuk: "-", jamKeluar: "-", status: "alpha", validated: false },
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

const getInitials = (name: string) => {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

export default function PresensiGuruPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMapel, setSelectedMapel] = useState("all")
  const [selectedJenjang, setSelectedJenjang] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedDate, setSelectedDate] = useState("2025-01-30")
  const [isInputDialogOpen, setIsInputDialogOpen] = useState(false)
  const [selectedGuru, setSelectedGuru] = useState<typeof guruAttendance[0] | null>(null)

  const filteredData = guruAttendance.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.nip.includes(searchQuery)
    const matchesMapel = selectedMapel === "all" || item.mapel.toLowerCase().includes(selectedMapel)
    const matchesJenjang = selectedJenjang === "all" || item.jenjang.toLowerCase() === selectedJenjang
    const matchesStatus = selectedStatus === "all" || item.status === selectedStatus
    return matchesSearch && matchesMapel && matchesJenjang && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Presensi Guru</h1>
          <p className="text-muted-foreground">Kelola kehadiran guru/ustadz per mata pelajaran</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-transparent">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={isInputDialogOpen} onOpenChange={setIsInputDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <UserCheck className="w-4 h-4 mr-2" />
                Input Presensi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-foreground">Input Presensi Guru</DialogTitle>
                <DialogDescription>
                  Masukkan data kehadiran guru untuk hari ini
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="input-tanggal">Tanggal</Label>
                    <Input id="input-tanggal" type="date" defaultValue="2025-01-30" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="input-jam">Jam Masuk</Label>
                    <Input id="input-jam" type="time" defaultValue="06:45" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="input-guru">Nama Guru</Label>
                  <Select defaultValue="ahmad">
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih guru" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ahmad">Ustadz Ahmad Ridwan</SelectItem>
                      <SelectItem value="fatimah">Ustadzah Fatimah Az-Zahra</SelectItem>
                      <SelectItem value="ibrahim">Ustadz Ibrahim Hasan</SelectItem>
                      <SelectItem value="umar">Ustadz Umar Abdullah</SelectItem>
                      <SelectItem value="siti">Bu Siti Aminah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="input-mapel">Mata Pelajaran</Label>
                  <Select defaultValue="quran">
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih mata pelajaran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quran">Tahfidz Al-Quran</SelectItem>
                      <SelectItem value="fiqih">Fiqih</SelectItem>
                      <SelectItem value="hadits">Hadits</SelectItem>
                      <SelectItem value="arab">Bahasa Arab</SelectItem>
                      <SelectItem value="math">Matematika</SelectItem>
                      <SelectItem value="ipa">IPA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="input-kelas">Kelas yang Diajar</Label>
                  <Input id="input-kelas" placeholder="contoh: 9A, 9B" defaultValue="9A" />
                </div>
                <div className="space-y-2">
                  <Label>Status Kehadiran</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {["Hadir", "Sakit", "Izin", "Alpha"].map((status) => (
                      <Button
                        key={status}
                        variant="outline"
                        className={`bg-transparent ${status === "Hadir" ? "border-primary text-primary" : ""}`}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="input-keterangan">Keterangan</Label>
                  <Input id="input-keterangan" placeholder="Keterangan tambahan (opsional)" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="bg-transparent" onClick={() => setIsInputDialogOpen(false)}>
                  Batal
                </Button>
                <Button className="bg-primary text-primary-foreground" onClick={() => setIsInputDialogOpen(false)}>
                  Simpan Presensi
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {attendanceStats.map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.count}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${stat.label === "Hadir" ? "bg-primary" : stat.label === "Sakit" ? "bg-chart-3" : stat.label === "Izin" ? "bg-accent" : "bg-destructive"}`}
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{stat.percentage}% dari total</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau NIP guru..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <Select value={selectedJenjang} onValueChange={setSelectedJenjang}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Jenjang" />
                </SelectTrigger>
                <SelectContent>
                  {jenjangOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedMapel} onValueChange={setSelectedMapel}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Mata Pelajaran" />
                </SelectTrigger>
                <SelectContent>
                  {mapelOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg text-foreground">Data Presensi Guru</CardTitle>
              <CardDescription>Menampilkan {filteredData.length} data presensi</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Guru/Ustadz</TableHead>
                  <TableHead>Mata Pelajaran</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Jam Masuk</TableHead>
                  <TableHead>Jam Keluar</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Validasi</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item, index) => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(item.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.jabatan}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{item.mapel}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{item.kelas}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.jamMasuk}</TableCell>
                    <TableCell className="text-muted-foreground">{item.jamKeluar}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      {item.validated ? (
                        <Badge className="bg-primary/10 text-primary border-0">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Valid
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedGuru(item)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Edit Status
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Menampilkan 1-{filteredData.length} dari {filteredData.length} data
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" disabled>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 bg-primary text-primary-foreground border-primary">
                1
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" disabled>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedGuru} onOpenChange={() => setSelectedGuru(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">Detail Presensi Guru</DialogTitle>
          </DialogHeader>
          {selectedGuru && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {getInitials(selectedGuru.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">{selectedGuru.name}</h3>
                  <p className="text-muted-foreground">{selectedGuru.jabatan}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground">NIP</p>
                  <p className="font-medium text-foreground">{selectedGuru.nip}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mata Pelajaran</p>
                  <p className="font-medium text-foreground">{selectedGuru.mapel}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jenjang</p>
                  <p className="font-medium text-foreground">{selectedGuru.jenjang}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kelas</p>
                  <p className="font-medium text-foreground">{selectedGuru.kelas}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal</p>
                  <p className="font-medium text-foreground">{selectedGuru.tanggal}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedGuru.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jam Masuk</p>
                  <p className="font-medium text-foreground">{selectedGuru.jamMasuk}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jam Keluar</p>
                  <p className="font-medium text-foreground">{selectedGuru.jamKeluar}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Status Validasi</p>
                {selectedGuru.validated ? (
                  <Badge className="bg-primary/10 text-primary border-0">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Tervalidasi oleh Admin
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    <Clock className="w-3 h-3 mr-1" />
                    Menunggu Validasi
                  </Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
