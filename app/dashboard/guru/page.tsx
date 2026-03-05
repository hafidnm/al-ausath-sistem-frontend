"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Search,
  Plus,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  BookOpen,
  GraduationCap,
} from "lucide-react"

const guruData = [
  {
    id: "G001",
    nip: "198501012010011001",
    name: "Ustadz Ahmad Ridwan, S.Pd.I",
    jabatan: "Kepala Sekolah",
    mapel: "Al-Quran Hadits",
    jenjang: "SMA",
    status: "Aktif",
    phone: "081234567890",
    email: "ahmad.ridwan@pesantren.id",
  },
  {
    id: "G002",
    nip: "198702152012012002",
    name: "Ustadzah Fatimah Azzahra, S.Pd",
    jabatan: "Wali Kelas 12 IPA",
    mapel: "Bahasa Arab",
    jenjang: "SMA",
    status: "Aktif",
    phone: "081234567891",
    email: "fatimah.azzahra@pesantren.id",
  },
  {
    id: "G003",
    nip: "199003202015011003",
    name: "Ustadz Ibrahim Malik, M.Pd",
    jabatan: "Guru",
    mapel: "Matematika",
    jenjang: "SMP",
    status: "Aktif",
    phone: "081234567892",
    email: "ibrahim.malik@pesantren.id",
  },
  {
    id: "G004",
    nip: "198805102011012004",
    name: "Ustadzah Khadijah Nur, S.Ag",
    jabatan: "Wali Kelas 9A",
    mapel: "Fiqih",
    jenjang: "SMP",
    status: "Aktif",
    phone: "081234567893",
    email: "khadijah.nur@pesantren.id",
  },
  {
    id: "G005",
    nip: "199201012018011005",
    name: "Ustadz Umar Hasan, S.Pd",
    jabatan: "Guru",
    mapel: "Bahasa Indonesia",
    jenjang: "SD",
    status: "Aktif",
    phone: "081234567894",
    email: "umar.hasan@pesantren.id",
  },
  {
    id: "G006",
    nip: "198909152014012006",
    name: "Ustadzah Maryam Salma, S.Pd",
    jabatan: "Wali Kelas TK-B",
    mapel: "Pendidikan Anak Usia Dini",
    jenjang: "TK",
    status: "Aktif",
    phone: "081234567895",
    email: "maryam.salma@pesantren.id",
  },
]

export default function GuruPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedJenjang, setSelectedJenjang] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const filteredData = guruData.filter((guru) => {
    const matchesSearch =
      guru.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guru.nip.includes(searchQuery)
    const matchesJenjang =
      selectedJenjang === "all" || guru.jenjang === selectedJenjang
    return matchesSearch && matchesJenjang
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Data Guru / Ustadz</h1>
          <p className="text-muted-foreground">Kelola data guru dan ustadz pesantren</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Guru
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Tambah Guru Baru</DialogTitle>
                <DialogDescription>
                  Isi data guru baru dengan lengkap
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nip">NIP</Label>
                  <Input id="nip" placeholder="Nomor Induk Pegawai" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input id="name" placeholder="Nama lengkap dengan gelar" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="jabatan">Jabatan</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jabatan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kepala">Kepala Sekolah</SelectItem>
                        <SelectItem value="wakil">Wakil Kepala</SelectItem>
                        <SelectItem value="wali">Wali Kelas</SelectItem>
                        <SelectItem value="guru">Guru</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jenjang">Jenjang</Label>
                    <Select>
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mapel">Mata Pelajaran</Label>
                  <Input id="mapel" placeholder="Mata pelajaran yang diampu" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">No. Telepon</Label>
                    <Input id="phone" placeholder="08xxxxxxxxxx" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="email@domain.com" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Batal
                </Button>
                <Button className="bg-primary text-primary-foreground" onClick={() => setIsAddDialogOpen(false)}>
                  Simpan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">86</p>
                <p className="text-xs text-muted-foreground">Total Guru</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">42</p>
                <p className="text-xs text-muted-foreground">Mata Pelajaran</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">28</p>
                <p className="text-xs text-muted-foreground">Wali Kelas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">82</p>
                <p className="text-xs text-muted-foreground">Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau NIP..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedJenjang} onValueChange={setSelectedJenjang}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Jenjang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenjang</SelectItem>
                <SelectItem value="PAUD">PAUD</SelectItem>
                <SelectItem value="TK">TK</SelectItem>
                <SelectItem value="SD">SD</SelectItem>
                <SelectItem value="SMP">SMP</SelectItem>
                <SelectItem value="SMA">SMA</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg text-foreground">Daftar Guru / Ustadz</CardTitle>
          <CardDescription>
            Menampilkan {filteredData.length} dari {guruData.length} guru
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Guru / Ustadz</TableHead>
                  <TableHead className="text-muted-foreground">NIP</TableHead>
                  <TableHead className="text-muted-foreground">Jabatan</TableHead>
                  <TableHead className="text-muted-foreground">Mata Pelajaran</TableHead>
                  <TableHead className="text-muted-foreground">Jenjang</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((guru) => (
                  <TableRow key={guru.id} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {guru.name
                              .split(" ")
                              .filter((n) => !n.includes(".") && !n.includes(","))
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{guru.name}</p>
                          <p className="text-xs text-muted-foreground">{guru.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground font-mono text-xs">{guru.nip}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          guru.jabatan.includes("Kepala")
                            ? "bg-chart-3/20 text-chart-3"
                            : guru.jabatan.includes("Wali")
                              ? "bg-accent/20 text-accent"
                              : "bg-muted text-muted-foreground"
                        }
                      >
                        {guru.jabatan}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground">{guru.mapel}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {guru.jenjang}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-primary/20 text-primary">
                        {guru.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            Lihat Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Data
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Hapus
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
          <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
            <p className="text-sm text-muted-foreground">
              Halaman 1 dari 5
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Sebelumnya
              </Button>
              <Button variant="outline" size="sm">
                Selanjutnya
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
