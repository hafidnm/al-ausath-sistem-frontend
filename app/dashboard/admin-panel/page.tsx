"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  UserCheck,
  UserX,
  Users,
  GraduationCap,
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Eye,
  MessageSquare,
  AlertTriangle,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react"

// Overview stats
const overviewStats = {
  santriHadir: 1150,
  santriTidakHadir: 97,
  totalSantri: 1247,
  guruHadir: 45,
  guruTidakHadir: 3,
  totalGuru: 48,
  pendingValidasi: 12,
  validasiHariIni: 28,
}

// Pending santri attendance for validation
const pendingSantriPresensi = [
  { id: 1, tanggal: "30 Jan 2026", guru: "Ustadz Ahmad", mapel: "Tahfidz Al-Quran", kelas: "9A", jenjang: "SMP", hadir: 26, sakit: 1, izin: 1, alpha: 0, waktuInput: "07:45", status: "pending" },
  { id: 2, tanggal: "30 Jan 2026", guru: "Ustadzah Fatimah", mapel: "Fiqih", kelas: "9A", jenjang: "SMP", hadir: 25, sakit: 2, izin: 1, alpha: 0, waktuInput: "09:30", status: "pending" },
  { id: 3, tanggal: "30 Jan 2026", guru: "Ustadz Ibrahim", mapel: "Bahasa Arab", kelas: "8A", jenjang: "SMP", hadir: 30, sakit: 1, izin: 0, alpha: 1, waktuInput: "10:15", status: "pending" },
  { id: 4, tanggal: "30 Jan 2026", guru: "Ustadz Umar", mapel: "Hadits", kelas: "7A", jenjang: "SMP", hadir: 29, sakit: 0, izin: 2, alpha: 0, waktuInput: "11:00", status: "pending" },
  { id: 5, tanggal: "29 Jan 2026", guru: "Pak Budi", mapel: "Matematika", kelas: "12A", jenjang: "SMA", hadir: 32, sakit: 0, izin: 0, alpha: 0, waktuInput: "08:00", status: "pending" },
]

// Pending guru attendance for validation
const pendingGuruPresensi = [
  { id: 1, tanggal: "30 Jan 2026", nip: "198501012010011001", guru: "Ustadz Ahmad Hidayat", mapel: "Tahfidz Al-Quran", kelas: "9A", jenjang: "SMP", status: "hadir", jamMasuk: "06:45", jamKeluar: "-", validasi: "pending" },
  { id: 2, tanggal: "30 Jan 2026", nip: "198601022010012002", guru: "Ustadzah Fatimah", mapel: "Fiqih", kelas: "9A", jenjang: "SMP", status: "hadir", jamMasuk: "07:00", jamKeluar: "-", validasi: "pending" },
  { id: 3, tanggal: "30 Jan 2026", nip: "198701032010011003", guru: "Ustadz Ibrahim", mapel: "Bahasa Arab", kelas: "8A", jenjang: "SMP", status: "tidak_hadir", jamMasuk: "-", jamKeluar: "-", validasi: "pending", alasan: "Sakit" },
]

// Validation history
const validationHistory = [
  { id: 1, tanggal: "29 Jan 2026", tipe: "santri", guru: "Ustadz Ahmad", mapel: "Tahfidz Al-Quran", kelas: "9A", status: "approved", admin: "Admin", waktu: "12:30" },
  { id: 2, tanggal: "29 Jan 2026", tipe: "santri", guru: "Ustadzah Fatimah", mapel: "Fiqih", kelas: "8B", status: "approved", admin: "Admin", waktu: "13:15" },
  { id: 3, tanggal: "28 Jan 2026", tipe: "guru", guru: "Ustadz Umar", mapel: "Hadits", kelas: "7A", status: "rejected", admin: "Admin", waktu: "14:00", catatan: "Data tidak lengkap" },
  { id: 4, tanggal: "28 Jan 2026", tipe: "santri", guru: "Pak Budi", mapel: "Matematika", kelas: "12A", status: "approved", admin: "Admin", waktu: "11:45" },
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
      return <Badge className="bg-primary/10 text-primary border-0">Disetujui</Badge>
    case "pending":
      return <Badge className="bg-secondary text-secondary-foreground border-0">Menunggu</Badge>
    case "rejected":
      return <Badge className="bg-destructive/10 text-destructive border-0">Ditolak</Badge>
    default:
      return <Badge variant="outline">-</Badge>
  }
}

export default function AdminPanelPage() {
  const [selectedTab, setSelectedTab] = useState("pending")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState("2026-01-30")
  const [selectedMapel, setSelectedMapel] = useState("all")
  const [selectedKelas, setSelectedKelas] = useState("all")
  const [selectedGuru, setSelectedGuru] = useState("all")
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<typeof pendingSantriPresensi[0] | null>(null)
  const [rejectNote, setRejectNote] = useState("")
  const [selectedItems, setSelectedItems] = useState<number[]>([])

  const handleViewDetail = (item: typeof pendingSantriPresensi[0]) => {
    setSelectedItem(item)
    setIsDetailOpen(true)
  }

  const handleApprove = (id: number) => {
    // In real app, this would call API
    console.log("Approved:", id)
  }

  const handleReject = (item: typeof pendingSantriPresensi[0]) => {
    setSelectedItem(item)
    setIsRejectOpen(true)
  }

  const handleBulkApprove = () => {
    console.log("Bulk approved:", selectedItems)
    setSelectedItems([])
  }

  const handleSelectItem = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedItems.length === pendingSantriPresensi.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(pendingSantriPresensi.map(p => p.id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Panel Admin</h1>
          <p className="text-muted-foreground">Validasi presensi santri dan guru</p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Santri Hadir</p>
                <p className="text-2xl font-bold text-primary mt-1">{overviewStats.santriHadir}</p>
                <p className="text-xs text-muted-foreground">{overviewStats.santriTidakHadir} tidak hadir</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Guru Hadir</p>
                <p className="text-2xl font-bold text-accent mt-1">{overviewStats.guruHadir}</p>
                <p className="text-xs text-muted-foreground">{overviewStats.guruTidakHadir} tidak hadir</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 border-l-4 border-l-secondary">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Menunggu Validasi</p>
                <p className="text-2xl font-bold text-secondary-foreground mt-1">{overviewStats.pendingValidasi}</p>
                <p className="text-xs text-muted-foreground">perlu ditinjau</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <Clock className="w-6 h-6 text-secondary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Validasi Hari Ini</p>
                <p className="text-2xl font-bold text-chart-4 mt-1">{overviewStats.validasiHariIni}</p>
                <p className="text-xs text-muted-foreground">telah diproses</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-chart-3/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-chart-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari guru, kelas, atau mata pelajaran..."
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
              <Select value={selectedMapel} onValueChange={setSelectedMapel}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Mata Pelajaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Mapel</SelectItem>
                  <SelectItem value="quran">Tahfidz Al-Quran</SelectItem>
                  <SelectItem value="fiqih">Fiqih</SelectItem>
                  <SelectItem value="hadits">Hadits</SelectItem>
                  <SelectItem value="arab">Bahasa Arab</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  <SelectItem value="7a">7A</SelectItem>
                  <SelectItem value="8a">8A</SelectItem>
                  <SelectItem value="9a">9A</SelectItem>
                  <SelectItem value="12a">12A</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedGuru} onValueChange={setSelectedGuru}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Guru" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Guru</SelectItem>
                  <SelectItem value="ahmad">Ustadz Ahmad</SelectItem>
                  <SelectItem value="fatimah">Ustadzah Fatimah</SelectItem>
                  <SelectItem value="ibrahim">Ustadz Ibrahim</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="pending" className="data-[state=active]:bg-card">
            <Clock className="w-4 h-4 mr-2" />
            Menunggu Validasi
            <Badge className="ml-2 bg-secondary text-secondary-foreground">{pendingSantriPresensi.length + pendingGuruPresensi.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-card">
            <CheckCircle className="w-4 h-4 mr-2" />
            Riwayat Validasi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{selectedItems.length}</span> item dipilih
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="bg-transparent"
                      onClick={() => setSelectedItems([])}
                    >
                      Batal
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-primary text-primary-foreground"
                      onClick={handleBulkApprove}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Setujui Semua
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Santri Attendance */}
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-foreground flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-primary" />
                    Validasi Presensi Santri
                  </CardTitle>
                  <CardDescription>Presensi santri yang perlu divalidasi</CardDescription>
                </div>
                <Badge variant="outline" className="bg-transparent">{pendingSantriPresensi.length} pending</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 accent-primary"
                          checked={selectedItems.length === pendingSantriPresensi.length}
                          onChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Guru</TableHead>
                      <TableHead>Mata Pelajaran</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead className="text-center">Hadir</TableHead>
                      <TableHead className="text-center">Sakit</TableHead>
                      <TableHead className="text-center">Izin</TableHead>
                      <TableHead className="text-center">Alpha</TableHead>
                      <TableHead>Waktu Input</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingSantriPresensi.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/30">
                        <TableCell>
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 accent-primary"
                            checked={selectedItems.includes(item.id)}
                            onChange={() => handleSelectItem(item.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{item.tanggal}</TableCell>
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
                        <TableCell className="text-foreground">{item.mapel}</TableCell>
                        <TableCell>
                          <div>
                            <span className="text-foreground">{item.kelas}</span>
                            <span className="text-xs text-muted-foreground ml-1">({item.jenjang})</span>
                          </div>
                        </TableCell>
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
                        <TableCell className="text-muted-foreground">{item.waktuInput}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0"
                              onClick={() => handleViewDetail(item)}
                            >
                              <Eye className="w-4 h-4 text-muted-foreground" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 hover:bg-primary/10"
                              onClick={() => handleApprove(item.id)}
                            >
                              <CheckCircle className="w-4 h-4 text-primary" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 hover:bg-destructive/10"
                              onClick={() => handleReject(item)}
                            >
                              <XCircle className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pending Guru Attendance */}
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-foreground flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-accent" />
                    Validasi Presensi Guru
                  </CardTitle>
                  <CardDescription>Presensi guru yang perlu divalidasi</CardDescription>
                </div>
                <Badge variant="outline" className="bg-transparent">{pendingGuruPresensi.length} pending</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Guru</TableHead>
                      <TableHead>Mata Pelajaran</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Jam Masuk</TableHead>
                      <TableHead>Jam Keluar</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingGuruPresensi.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-foreground">{item.tanggal}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-7 h-7">
                              <AvatarFallback className="bg-accent/20 text-accent text-xs">
                                {getInitials(item.guru)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-foreground">{item.guru}</p>
                              <p className="text-xs text-muted-foreground">{item.nip}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">{item.mapel}</TableCell>
                        <TableCell>
                          <div>
                            <span className="text-foreground">{item.kelas}</span>
                            <span className="text-xs text-muted-foreground ml-1">({item.jenjang})</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(item.status)}
                          {item.alasan && (
                            <p className="text-xs text-muted-foreground mt-1">{item.alasan}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-foreground">{item.jamMasuk}</TableCell>
                        <TableCell className="text-muted-foreground">{item.jamKeluar}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 hover:bg-primary/10"
                            >
                              <CheckCircle className="w-4 h-4 text-primary" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 hover:bg-destructive/10"
                            >
                              <XCircle className="w-4 h-4 text-destructive" />
                            </Button>
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

        <TabsContent value="history" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Riwayat Validasi</CardTitle>
              <CardDescription>Daftar presensi yang sudah divalidasi</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Guru</TableHead>
                      <TableHead>Mata Pelajaran</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationHistory.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-foreground">{item.tanggal}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-transparent capitalize">{item.tipe}</Badge>
                        </TableCell>
                        <TableCell className="text-foreground">{item.guru}</TableCell>
                        <TableCell className="text-foreground">{item.mapel}</TableCell>
                        <TableCell className="text-foreground">{item.kelas}</TableCell>
                        <TableCell>{getValidationBadge(item.status)}</TableCell>
                        <TableCell className="text-muted-foreground">{item.admin}</TableCell>
                        <TableCell className="text-muted-foreground">{item.waktu}</TableCell>
                        <TableCell className="text-muted-foreground max-w-32 truncate">
                          {item.catatan || "-"}
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

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Detail Presensi</DialogTitle>
            <DialogDescription>
              {selectedItem?.mapel} - {selectedItem?.kelas} ({selectedItem?.tanggal})
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Guru Pengampu</p>
                  <p className="font-medium text-foreground">{selectedItem.guru}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Waktu Input</p>
                  <p className="font-medium text-foreground">{selectedItem.waktuInput}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mata Pelajaran</p>
                  <p className="font-medium text-foreground">{selectedItem.mapel}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kelas</p>
                  <p className="font-medium text-foreground">{selectedItem.kelas} ({selectedItem.jenjang})</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{selectedItem.hadir}</p>
                  <p className="text-sm text-muted-foreground">Hadir</p>
                </div>
                <div className="text-center p-4 bg-chart-3/20 rounded-lg">
                  <p className="text-2xl font-bold text-chart-4">{selectedItem.sakit}</p>
                  <p className="text-sm text-muted-foreground">Sakit</p>
                </div>
                <div className="text-center p-4 bg-accent/20 rounded-lg">
                  <p className="text-2xl font-bold text-accent">{selectedItem.izin}</p>
                  <p className="text-sm text-muted-foreground">Izin</p>
                </div>
                <div className="text-center p-4 bg-destructive/10 rounded-lg">
                  <p className="text-2xl font-bold text-destructive">{selectedItem.alpha}</p>
                  <p className="text-sm text-muted-foreground">Alpha</p>
                </div>
              </div>

              {/* Sample student list */}
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
                    {[
                      { no: 1, name: "Ahmad Fauzi", status: "hadir" },
                      { no: 2, name: "Siti Aisyah", status: "hadir" },
                      { no: 3, name: "Muhammad Rizki", status: "sakit" },
                    ].map((s) => (
                      <TableRow key={s.no}>
                        <TableCell className="text-muted-foreground">{s.no}</TableCell>
                        <TableCell className="font-medium text-foreground">{s.name}</TableCell>
                        <TableCell className="text-center">{getStatusBadge(s.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="bg-transparent" onClick={() => setIsDetailOpen(false)}>
              Tutup
            </Button>
            <Button variant="outline" className="bg-transparent text-destructive border-destructive hover:bg-destructive/10">
              <XCircle className="w-4 h-4 mr-2" />
              Tolak
            </Button>
            <Button className="bg-primary text-primary-foreground">
              <CheckCircle className="w-4 h-4 mr-2" />
              Setujui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Tolak Presensi
            </DialogTitle>
            <DialogDescription>
              Masukkan alasan penolakan presensi ini
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Data yang akan ditolak:</p>
              <p className="font-medium text-foreground">{selectedItem?.mapel} - {selectedItem?.kelas}</p>
              <p className="text-sm text-muted-foreground">oleh {selectedItem?.guru}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reject-note">Catatan/Alasan Penolakan</Label>
              <Textarea 
                id="reject-note"
                placeholder="Masukkan alasan penolakan..."
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="bg-transparent" onClick={() => setIsRejectOpen(false)}>
              Batal
            </Button>
            <Button 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                console.log("Rejected with note:", rejectNote)
                setIsRejectOpen(false)
                setRejectNote("")
              }}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Tolak Presensi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
