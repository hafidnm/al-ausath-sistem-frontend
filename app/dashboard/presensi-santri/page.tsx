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
  Filter,
  Calendar,
  Download,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

// Sample data
const attendanceStats = [
  { label: "Hadir", count: 1150, percentage: 92, icon: UserCheck, color: "bg-primary/10 text-primary" },
  { label: "Sakit", count: 45, percentage: 4, icon: AlertCircle, color: "bg-chart-3/20 text-chart-3" },
  { label: "Izin", count: 32, percentage: 3, icon: Clock, color: "bg-accent/20 text-accent" },
  { label: "Alpha", count: 20, percentage: 1, icon: UserX, color: "bg-destructive/10 text-destructive" },
]

const kelasOptions = [
  { value: "all", label: "Semua Kelas" },
  { value: "7a", label: "Kelas 7A" },
  { value: "7b", label: "Kelas 7B" },
  { value: "8a", label: "Kelas 8A" },
  { value: "8b", label: "Kelas 8B" },
  { value: "9a", label: "Kelas 9A" },
  { value: "9b", label: "Kelas 9B" },
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

const santriAttendance = [
  { id: 1, nis: "2024001", name: "Ahmad Fauzi", kelas: "9A", jenjang: "SMP", mapel: "Tahfidz Al-Quran", tanggal: "30 Jan 2025", status: "hadir", jam: "07:15", guru: "Ustadz Ahmad" },
  { id: 2, nis: "2024002", name: "Siti Aisyah", kelas: "9A", jenjang: "SMP", mapel: "Tahfidz Al-Quran", tanggal: "30 Jan 2025", status: "hadir", jam: "07:10", guru: "Ustadz Ahmad" },
  { id: 3, nis: "2024003", name: "Muhammad Rizki", kelas: "9A", jenjang: "SMP", mapel: "Tahfidz Al-Quran", tanggal: "30 Jan 2025", status: "sakit", jam: "-", guru: "Ustadz Ahmad" },
  { id: 4, nis: "2024004", name: "Fatimah Zahra", kelas: "9A", jenjang: "SMP", mapel: "Fiqih", tanggal: "30 Jan 2025", status: "izin", jam: "-", guru: "Ustadzah Fatimah" },
  { id: 5, nis: "2024005", name: "Ibrahim Hasan", kelas: "8A", jenjang: "SMP", mapel: "Bahasa Arab", tanggal: "30 Jan 2025", status: "hadir", jam: "07:20", guru: "Ustadz Ibrahim" },
  { id: 6, nis: "2024006", name: "Khadijah Amina", kelas: "8A", jenjang: "SMP", mapel: "Bahasa Arab", tanggal: "30 Jan 2025", status: "alpha", jam: "-", guru: "Ustadz Ibrahim" },
  { id: 7, nis: "2024007", name: "Umar Abdullah", kelas: "7A", jenjang: "SMP", mapel: "Hadits", tanggal: "30 Jan 2025", status: "hadir", jam: "07:05", guru: "Ustadz Umar" },
  { id: 8, nis: "2024008", name: "Zainab Putri", kelas: "7A", jenjang: "SMP", mapel: "Hadits", tanggal: "30 Jan 2025", status: "hadir", jam: "07:08", guru: "Ustadz Umar" },
  { id: 9, nis: "2024009", name: "Yusuf Hidayat", kelas: "12A", jenjang: "SMA", mapel: "Matematika", tanggal: "30 Jan 2025", status: "hadir", jam: "07:12", guru: "Pak Budi" },
  { id: 10, nis: "2024010", name: "Maryam Salma", kelas: "12A", jenjang: "SMA", mapel: "Matematika", tanggal: "30 Jan 2025", status: "sakit", jam: "-", guru: "Pak Budi" },
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

export default function PresensiSantriPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedKelas, setSelectedKelas] = useState("all")
  const [selectedMapel, setSelectedMapel] = useState("all")
  const [selectedJenjang, setSelectedJenjang] = useState("all")
  const [selectedDate, setSelectedDate] = useState("2025-01-30")
  const [isInputDialogOpen, setIsInputDialogOpen] = useState(false)
  const [selectedSantri, setSelectedSantri] = useState<typeof santriAttendance[0] | null>(null)

  const filteredData = santriAttendance.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.nis.includes(searchQuery)
    const matchesKelas = selectedKelas === "all" || item.kelas.toLowerCase().replace(" ", "") === selectedKelas
    const matchesMapel = selectedMapel === "all" || item.mapel.toLowerCase().includes(selectedMapel)
    const matchesJenjang = selectedJenjang === "all" || item.jenjang.toLowerCase() === selectedJenjang
    return matchesSearch && matchesKelas && matchesMapel && matchesJenjang
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Presensi Santri</h1>
          <p className="text-muted-foreground">Kelola kehadiran santri per mata pelajaran</p>
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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-foreground">Input Presensi Santri</DialogTitle>
                <DialogDescription>
                  Pilih kelas dan mata pelajaran untuk input presensi
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="input-tanggal">Tanggal</Label>
                    <Input id="input-tanggal" type="date" defaultValue="2025-01-30" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="input-jam">Jam Pelajaran</Label>
                    <Select defaultValue="1">
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jam" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Jam ke-1 (07:00 - 07:45)</SelectItem>
                        <SelectItem value="2">Jam ke-2 (07:45 - 08:30)</SelectItem>
                        <SelectItem value="3">Jam ke-3 (08:30 - 09:15)</SelectItem>
                        <SelectItem value="4">Jam ke-4 (09:30 - 10:15)</SelectItem>
                        <SelectItem value="5">Jam ke-5 (10:15 - 11:00)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="input-jenjang">Jenjang</Label>
                    <Select defaultValue="smp">
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenjang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paud">PAUD</SelectItem>
                        <SelectItem value="tk">TK</SelectItem>
                        <SelectItem value="sd">SD</SelectItem>
                        <SelectItem value="smp">SMP</SelectItem>
                        <SelectItem value="sma">SMA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="input-kelas">Kelas</Label>
                    <Select defaultValue="9a">
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kelas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7a">Kelas 7A</SelectItem>
                        <SelectItem value="7b">Kelas 7B</SelectItem>
                        <SelectItem value="8a">Kelas 8A</SelectItem>
                        <SelectItem value="8b">Kelas 8B</SelectItem>
                        <SelectItem value="9a">Kelas 9A</SelectItem>
                        <SelectItem value="9b">Kelas 9B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                
                {/* Mini attendance input table */}
                <div className="border rounded-lg overflow-hidden mt-2">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-12">No</TableHead>
                        <TableHead>Nama Santri</TableHead>
                        <TableHead className="text-center w-20">Hadir</TableHead>
                        <TableHead className="text-center w-20">Sakit</TableHead>
                        <TableHead className="text-center w-20">Izin</TableHead>
                        <TableHead className="text-center w-20">Alpha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { no: 1, name: "Ahmad Fauzi" },
                        { no: 2, name: "Siti Aisyah" },
                        { no: 3, name: "Muhammad Rizki" },
                      ].map((s) => (
                        <TableRow key={s.no}>
                          <TableCell className="text-muted-foreground">{s.no}</TableCell>
                          <TableCell className="font-medium text-foreground">{s.name}</TableCell>
                          <TableCell className="text-center">
                            <input type="radio" name={`status-${s.no}`} defaultChecked className="w-4 h-4 accent-primary" />
                          </TableCell>
                          <TableCell className="text-center">
                            <input type="radio" name={`status-${s.no}`} className="w-4 h-4 accent-chart-3" />
                          </TableCell>
                          <TableCell className="text-center">
                            <input type="radio" name={`status-${s.no}`} className="w-4 h-4 accent-accent" />
                          </TableCell>
                          <TableCell className="text-center">
                            <input type="radio" name={`status-${s.no}`} className="w-4 h-4 accent-destructive" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                placeholder="Cari nama atau NIS santri..."
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
              <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Kelas" />
                </SelectTrigger>
                <SelectContent>
                  {kelasOptions.map((opt) => (
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg text-foreground">Data Presensi Santri</CardTitle>
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
                  <TableHead>Santri</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Mata Pelajaran</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jam Masuk</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Guru</TableHead>
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
                          <p className="text-xs text-muted-foreground">{item.nis}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-foreground">{item.kelas}</p>
                        <p className="text-xs text-muted-foreground">{item.jenjang}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">{item.mapel}</TableCell>
                    <TableCell className="text-muted-foreground">{item.tanggal}</TableCell>
                    <TableCell className="text-muted-foreground">{item.jam}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-muted-foreground">{item.guru}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedSantri(item)}>
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
      <Dialog open={!!selectedSantri} onOpenChange={() => setSelectedSantri(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">Detail Presensi</DialogTitle>
          </DialogHeader>
          {selectedSantri && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {getInitials(selectedSantri.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">{selectedSantri.name}</h3>
                  <p className="text-muted-foreground">NIS: {selectedSantri.nis}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground">Kelas</p>
                  <p className="font-medium text-foreground">{selectedSantri.kelas} - {selectedSantri.jenjang}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mata Pelajaran</p>
                  <p className="font-medium text-foreground">{selectedSantri.mapel}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal</p>
                  <p className="font-medium text-foreground">{selectedSantri.tanggal}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jam Masuk</p>
                  <p className="font-medium text-foreground">{selectedSantri.jam}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedSantri.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Guru Pengampu</p>
                  <p className="font-medium text-foreground">{selectedSantri.guru}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
