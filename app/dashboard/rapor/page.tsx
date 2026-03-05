"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Moon,
} from "lucide-react"

const raporData = [
  {
    id: "R001",
    santri: "Ahmad Fauzi",
    nis: "2024001",
    class: "12 IPA",
    jenjang: "SMA",
    semester: "Ganjil",
    tahunAjaran: "2024/2025",
    nilaiRata: 92.5,
    status: "Terbit",
    ranking: 1,
  },
  {
    id: "R002",
    santri: "Siti Aisyah",
    nis: "2024002",
    class: "12 IPA",
    jenjang: "SMA",
    semester: "Ganjil",
    tahunAjaran: "2024/2025",
    nilaiRata: 91.2,
    status: "Terbit",
    ranking: 2,
  },
  {
    id: "R003",
    santri: "Muhammad Rizki",
    nis: "2024003",
    class: "11 IPS",
    jenjang: "SMA",
    semester: "Ganjil",
    tahunAjaran: "2024/2025",
    nilaiRata: 88.7,
    status: "Proses",
    ranking: 3,
  },
  {
    id: "R004",
    santri: "Fatimah Zahra",
    nis: "2024004",
    class: "9A",
    jenjang: "SMP",
    semester: "Ganjil",
    tahunAjaran: "2024/2025",
    nilaiRata: 90.1,
    status: "Terbit",
    ranking: 1,
  },
  {
    id: "R005",
    santri: "Abdullah Ibrahim",
    nis: "2024005",
    class: "6A",
    jenjang: "SD",
    semester: "Ganjil",
    tahunAjaran: "2024/2025",
    nilaiRata: 87.5,
    status: "Belum",
    ranking: 4,
  },
]

const nilaiDetail = [
  { mapel: "Al-Quran Hadits", kkm: 75, uts: 90, uas: 92, rata: 91, predikat: "A" },
  { mapel: "Aqidah Akhlak", kkm: 75, uts: 88, uas: 90, rata: 89, predikat: "A" },
  { mapel: "Fiqih", kkm: 75, uts: 92, uas: 94, rata: 93, predikat: "A" },
  { mapel: "SKI", kkm: 75, uts: 85, uas: 88, rata: 86.5, predikat: "B" },
  { mapel: "Bahasa Arab", kkm: 75, uts: 90, uas: 91, rata: 90.5, predikat: "A" },
  { mapel: "Matematika", kkm: 75, uts: 88, uas: 90, rata: 89, predikat: "A" },
  { mapel: "Bahasa Indonesia", kkm: 75, uts: 86, uas: 89, rata: 87.5, predikat: "B" },
  { mapel: "Bahasa Inggris", kkm: 75, uts: 90, uas: 93, rata: 91.5, predikat: "A" },
  { mapel: "IPA", kkm: 75, uts: 92, uas: 95, rata: 93.5, predikat: "A" },
  { mapel: "IPS", kkm: 75, uts: 85, uas: 88, rata: 86.5, predikat: "B" },
]

export default function RaporPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedJenjang, setSelectedJenjang] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")

  const filteredData = raporData.filter((rapor) => {
    const matchesSearch =
      rapor.santri.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rapor.nis.includes(searchQuery)
    const matchesJenjang =
      selectedJenjang === "all" || rapor.jenjang === selectedJenjang
    const matchesStatus =
      selectedStatus === "all" || rapor.status === selectedStatus
    return matchesSearch && matchesJenjang && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Terbit":
        return (
          <Badge className="bg-primary/20 text-primary">
            <CheckCircle className="w-3 h-3 mr-1" />
            Terbit
          </Badge>
        )
      case "Proses":
        return (
          <Badge className="bg-chart-3/20 text-chart-3">
            <Clock className="w-3 h-3 mr-1" />
            Proses
          </Badge>
        )
      default:
        return (
          <Badge className="bg-muted text-muted-foreground">
            <XCircle className="w-3 h-3 mr-1" />
            Belum
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rapor Santri</h1>
          <p className="text-muted-foreground">Kelola dan cetak rapor digital</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Semua
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground">
            <Printer className="w-4 h-4 mr-2" />
            Cetak Batch
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">892</p>
                <p className="text-sm text-muted-foreground">Rapor Terbit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-chart-3/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">156</p>
                <p className="text-sm text-muted-foreground">Dalam Proses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <XCircle className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">199</p>
                <p className="text-sm text-muted-foreground">Belum Diproses</p>
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
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="Terbit">Terbit</SelectItem>
                <SelectItem value="Proses">Proses</SelectItem>
                <SelectItem value="Belum">Belum</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg text-foreground">Daftar Rapor</CardTitle>
          <CardDescription>
            Semester Ganjil - Tahun Ajaran 2024/2025
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Santri</TableHead>
                  <TableHead className="text-muted-foreground">Kelas</TableHead>
                  <TableHead className="text-muted-foreground">Jenjang</TableHead>
                  <TableHead className="text-muted-foreground">Nilai Rata-rata</TableHead>
                  <TableHead className="text-muted-foreground">Ranking</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((rapor) => (
                  <TableRow key={rapor.id} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {rapor.santri
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{rapor.santri}</p>
                          <p className="text-xs text-muted-foreground">NIS: {rapor.nis}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">{rapor.class}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {rapor.jenjang}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-primary">{rapor.nilaiRata}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-foreground">#{rapor.ranking}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(rapor.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Preview Rapor</DialogTitle>
                              <DialogDescription>
                                {rapor.santri} - {rapor.class} - Semester {rapor.semester} {rapor.tahunAjaran}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                              {/* Rapor Header */}
                              <div className="border border-border rounded-lg p-6 bg-card">
                                <div className="flex items-center justify-center gap-4 mb-4">
                                  <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center">
                                    <Moon className="w-10 h-10 text-primary-foreground" />
                                  </div>
                                  <div className="text-center">
                                    <h3 className="text-xl font-bold text-foreground">PESANTREN NURUL ILMI</h3>
                                    <p className="text-sm text-muted-foreground">Jl. Raya Pesantren No. 123, Jakarta</p>
                                    <p className="text-sm text-muted-foreground">Telp: (021) 12345678</p>
                                  </div>
                                </div>
                                <div className="border-t border-border pt-4">
                                  <h4 className="text-lg font-bold text-center text-foreground mb-4">
                                    LAPORAN HASIL BELAJAR SANTRI
                                  </h4>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-muted-foreground">Nama Santri</p>
                                      <p className="font-medium text-foreground">{rapor.santri}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">NIS</p>
                                      <p className="font-medium text-foreground">{rapor.nis}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Kelas</p>
                                      <p className="font-medium text-foreground">{rapor.class}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Semester / TA</p>
                                      <p className="font-medium text-foreground">{rapor.semester} / {rapor.tahunAjaran}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Nilai Table */}
                              <div className="border border-border rounded-lg overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-muted/50">
                                      <TableHead className="text-foreground font-semibold">Mata Pelajaran</TableHead>
                                      <TableHead className="text-center text-foreground font-semibold">KKM</TableHead>
                                      <TableHead className="text-center text-foreground font-semibold">UTS</TableHead>
                                      <TableHead className="text-center text-foreground font-semibold">UAS</TableHead>
                                      <TableHead className="text-center text-foreground font-semibold">Rata-rata</TableHead>
                                      <TableHead className="text-center text-foreground font-semibold">Predikat</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {nilaiDetail.map((nilai, index) => (
                                      <TableRow key={index} className="border-border">
                                        <TableCell className="font-medium text-foreground">{nilai.mapel}</TableCell>
                                        <TableCell className="text-center text-muted-foreground">{nilai.kkm}</TableCell>
                                        <TableCell className="text-center text-foreground">{nilai.uts}</TableCell>
                                        <TableCell className="text-center text-foreground">{nilai.uas}</TableCell>
                                        <TableCell className="text-center font-semibold text-primary">{nilai.rata}</TableCell>
                                        <TableCell className="text-center">
                                          <Badge className={nilai.predikat === "A" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"}>
                                            {nilai.predikat}
                                          </Badge>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>

                              {/* Summary */}
                              <div className="grid grid-cols-3 gap-4">
                                <Card className="border-border/50">
                                  <CardContent className="p-4 text-center">
                                    <p className="text-sm text-muted-foreground">Nilai Rata-rata</p>
                                    <p className="text-2xl font-bold text-primary">{rapor.nilaiRata}</p>
                                  </CardContent>
                                </Card>
                                <Card className="border-border/50">
                                  <CardContent className="p-4 text-center">
                                    <p className="text-sm text-muted-foreground">Ranking Kelas</p>
                                    <p className="text-2xl font-bold text-foreground">#{rapor.ranking}</p>
                                  </CardContent>
                                </Card>
                                <Card className="border-border/50">
                                  <CardContent className="p-4 text-center">
                                    <p className="text-sm text-muted-foreground">Predikat</p>
                                    <p className="text-2xl font-bold text-accent">A</p>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t border-border">
                              <Button variant="outline">
                                <Download className="w-4 h-4 mr-2" />
                                Unduh PDF
                              </Button>
                              <Button className="bg-primary text-primary-foreground">
                                <Printer className="w-4 h-4 mr-2" />
                                Cetak
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Printer className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
            <p className="text-sm text-muted-foreground">
              Halaman 1 dari 50
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
