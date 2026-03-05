"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Label } from "@/components/ui/label"
import {
  Search,
  Plus,
  Filter,
  Users,
  GraduationCap,
  School,
  Edit,
  Trash2,
  Eye,
} from "lucide-react"

const kelasData = [
  {
    id: "K001",
    nama: "12 IPA",
    jenjang: "SMA",
    waliKelas: "Ustadzah Fatimah Azzahra, S.Pd",
    jumlahSantri: 32,
    putra: 15,
    putri: 17,
    tahunAjaran: "2024/2025",
  },
  {
    id: "K002",
    nama: "12 IPS",
    jenjang: "SMA",
    waliKelas: "Ustadz Ibrahim Malik, M.Pd",
    jumlahSantri: 28,
    putra: 12,
    putri: 16,
    tahunAjaran: "2024/2025",
  },
  {
    id: "K003",
    nama: "11 IPA",
    jenjang: "SMA",
    waliKelas: "Ustadz Ahmad Ridwan, S.Pd.I",
    jumlahSantri: 30,
    putra: 14,
    putri: 16,
    tahunAjaran: "2024/2025",
  },
  {
    id: "K004",
    nama: "9A",
    jenjang: "SMP",
    waliKelas: "Ustadzah Khadijah Nur, S.Ag",
    jumlahSantri: 25,
    putra: 12,
    putri: 13,
    tahunAjaran: "2024/2025",
  },
  {
    id: "K005",
    nama: "9B",
    jenjang: "SMP",
    waliKelas: "Ustadz Umar Hasan, S.Pd",
    jumlahSantri: 24,
    putra: 11,
    putri: 13,
    tahunAjaran: "2024/2025",
  },
  {
    id: "K006",
    nama: "6A",
    jenjang: "SD",
    waliKelas: "Ustadzah Maryam Salma, S.Pd",
    jumlahSantri: 28,
    putra: 15,
    putri: 13,
    tahunAjaran: "2024/2025",
  },
  {
    id: "K007",
    nama: "TK-B",
    jenjang: "TK",
    waliKelas: "Ustadzah Aisyah Putri, S.Pd",
    jumlahSantri: 20,
    putra: 10,
    putri: 10,
    tahunAjaran: "2024/2025",
  },
  {
    id: "K008",
    nama: "PAUD-A",
    jenjang: "PAUD",
    waliKelas: "Ustadzah Zahra Kamila, S.Pd",
    jumlahSantri: 15,
    putra: 8,
    putri: 7,
    tahunAjaran: "2024/2025",
  },
]

export default function KelasPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedJenjang, setSelectedJenjang] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const filteredData = kelasData.filter((kelas) => {
    const matchesSearch =
      kelas.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kelas.waliKelas.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesJenjang =
      selectedJenjang === "all" || kelas.jenjang === selectedJenjang
    return matchesSearch && matchesJenjang
  })

  const totalSantri = kelasData.reduce((acc, kelas) => acc + kelas.jumlahSantri, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Data Kelas</h1>
          <p className="text-muted-foreground">Kelola data kelas dan wali kelas</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Kelas
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Tambah Kelas Baru</DialogTitle>
              <DialogDescription>
                Isi data kelas baru dengan lengkap
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="namaKelas">Nama Kelas</Label>
                  <Input id="namaKelas" placeholder="Contoh: 12 IPA" />
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
                <Label htmlFor="waliKelas">Wali Kelas</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih wali kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guru1">Ustadz Ahmad Ridwan, S.Pd.I</SelectItem>
                    <SelectItem value="guru2">Ustadzah Fatimah Azzahra, S.Pd</SelectItem>
                    <SelectItem value="guru3">Ustadz Ibrahim Malik, M.Pd</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tahunAjaran">Tahun Ajaran</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tahun ajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024-2025">2024/2025</SelectItem>
                    <SelectItem value="2025-2026">2025/2026</SelectItem>
                  </SelectContent>
                </Select>
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <School className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{kelasData.length}</p>
                <p className="text-xs text-muted-foreground">Total Kelas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalSantri}</p>
                <p className="text-xs text-muted-foreground">Total Santri</p>
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
                <p className="text-2xl font-bold text-foreground">{kelasData.length}</p>
                <p className="text-xs text-muted-foreground">Wali Kelas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <School className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">5</p>
                <p className="text-xs text-muted-foreground">Jenjang</p>
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
                placeholder="Cari nama kelas atau wali kelas..."
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

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredData.map((kelas) => (
          <Card key={kelas.id} className="border-border/50 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-primary-foreground font-bold ${
                    kelas.jenjang === "SMA"
                      ? "bg-chart-4"
                      : kelas.jenjang === "SMP"
                        ? "bg-accent"
                        : kelas.jenjang === "SD"
                          ? "bg-primary"
                          : kelas.jenjang === "TK"
                            ? "bg-chart-2"
                            : "bg-chart-1"
                  }`}>
                    {kelas.nama.slice(0, 2)}
                  </div>
                  <div>
                    <CardTitle className="text-lg text-foreground">{kelas.nama}</CardTitle>
                    <Badge variant="secondary" className="mt-1 bg-primary/10 text-primary">
                      {kelas.jenjang}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {kelas.waliKelas.split(" ").filter(n => !n.includes(".")).map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-muted-foreground">Wali Kelas</p>
                    <p className="text-sm font-medium text-foreground truncate">{kelas.waliKelas}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{kelas.jumlahSantri}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center border-x border-border">
                    <p className="text-lg font-bold text-primary">{kelas.putra}</p>
                    <p className="text-xs text-muted-foreground">Putra</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-accent">{kelas.putri}</p>
                    <p className="text-xs text-muted-foreground">Putri</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
