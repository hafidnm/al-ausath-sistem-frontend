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
  UserPlus,
  FileSpreadsheet,
} from "lucide-react"

const santriData = [
  {
    id: "S001",
    nis: "2024001",
    name: "Ahmad Fauzi",
    class: "12 IPA",
    jenjang: "SMA",
    gender: "L",
    status: "Aktif",
    wali: "Bpk. Fauzi Rahman",
    phone: "081234567890",
  },
  {
    id: "S002",
    nis: "2024002",
    name: "Siti Aisyah",
    class: "12 IPA",
    jenjang: "SMA",
    gender: "P",
    status: "Aktif",
    wali: "Ibu Aisyah Putri",
    phone: "081234567891",
  },
  {
    id: "S003",
    nis: "2024003",
    name: "Muhammad Rizki",
    class: "11 IPS",
    jenjang: "SMA",
    gender: "L",
    status: "Aktif",
    wali: "Bpk. Rizki Pratama",
    phone: "081234567892",
  },
  {
    id: "S004",
    nis: "2024004",
    name: "Fatimah Zahra",
    class: "9A",
    jenjang: "SMP",
    gender: "P",
    status: "Aktif",
    wali: "Ibu Zahra Kamila",
    phone: "081234567893",
  },
  {
    id: "S005",
    nis: "2024005",
    name: "Abdullah Ibrahim",
    class: "6A",
    jenjang: "SD",
    gender: "L",
    status: "Aktif",
    wali: "Bpk. Ibrahim Saleh",
    phone: "081234567894",
  },
  {
    id: "S006",
    nis: "2024006",
    name: "Khadijah Amira",
    class: "TK-B",
    jenjang: "TK",
    gender: "P",
    status: "Aktif",
    wali: "Ibu Amira Salsabila",
    phone: "081234567895",
  },
  {
    id: "S007",
    nis: "2024007",
    name: "Umar Hasan",
    class: "8B",
    jenjang: "SMP",
    gender: "L",
    status: "Cuti",
    wali: "Bpk. Hasan Basri",
    phone: "081234567896",
  },
  {
    id: "S008",
    nis: "2024008",
    name: "Maryam Salma",
    class: "10 IPA",
    jenjang: "SMA",
    gender: "P",
    status: "Aktif",
    wali: "Ibu Salma Nur",
    phone: "081234567897",
  },
]

export default function SantriPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedJenjang, setSelectedJenjang] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const filteredData = santriData.filter((santri) => {
    const matchesSearch =
      santri.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      santri.nis.includes(searchQuery)
    const matchesJenjang =
      selectedJenjang === "all" || santri.jenjang === selectedJenjang
    return matchesSearch && matchesJenjang
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Data Santri</h1>
          <p className="text-muted-foreground">Kelola data santri pesantren</p>
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
                Tambah Santri
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Tambah Santri Baru</DialogTitle>
                <DialogDescription>
                  Isi data santri baru dengan lengkap
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nis">NIS</Label>
                    <Input id="nis" placeholder="Nomor Induk Santri" />
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
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input id="name" placeholder="Nama lengkap santri" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="class">Kelas</Label>
                    <Input id="class" placeholder="Kelas" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Jenis Kelamin</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L">Laki-laki</SelectItem>
                        <SelectItem value="P">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wali">Nama Wali</Label>
                  <Input id="wali" placeholder="Nama wali santri" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">No. Telepon Wali</Label>
                  <Input id="phone" placeholder="08xxxxxxxxxx" />
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "PAUD", count: 120, color: "bg-chart-1" },
          { label: "TK", count: 185, color: "bg-chart-2" },
          { label: "SD", count: 412, color: "bg-primary" },
          { label: "SMP", count: 298, color: "bg-accent" },
          { label: "SMA", count: 232, color: "bg-chart-4" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-10 rounded-full ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.count}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau NIS..."
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
          <CardTitle className="text-lg text-foreground">Daftar Santri</CardTitle>
          <CardDescription>
            Menampilkan {filteredData.length} dari {santriData.length} santri
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Santri</TableHead>
                  <TableHead className="text-muted-foreground">NIS</TableHead>
                  <TableHead className="text-muted-foreground">Kelas</TableHead>
                  <TableHead className="text-muted-foreground">Jenjang</TableHead>
                  <TableHead className="text-muted-foreground">Wali</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((santri) => (
                  <TableRow key={santri.id} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {santri.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{santri.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {santri.gender === "L" ? "Laki-laki" : "Perempuan"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">{santri.nis}</TableCell>
                    <TableCell className="text-foreground">{santri.class}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          santri.jenjang === "SMA"
                            ? "bg-chart-4/20 text-chart-4"
                            : santri.jenjang === "SMP"
                              ? "bg-accent/20 text-accent"
                              : santri.jenjang === "SD"
                                ? "bg-primary/20 text-primary"
                                : santri.jenjang === "TK"
                                  ? "bg-chart-2/20 text-chart-2"
                                  : "bg-chart-1/20 text-chart-1"
                        }
                      >
                        {santri.jenjang}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-foreground">{santri.wali}</p>
                        <p className="text-xs text-muted-foreground">{santri.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={santri.status === "Aktif" ? "default" : "secondary"}
                        className={
                          santri.status === "Aktif"
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {santri.status}
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
                          <DropdownMenuItem>
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Lihat Rapor
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
              Halaman 1 dari 10
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
