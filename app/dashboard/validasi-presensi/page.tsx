"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  UserCheck,
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Users,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react"

// Sample data for pending validations
const pendingValidations = {
  santri: [
    { id: 1, type: "santri", name: "Muhammad Rizki", identifier: "2024003", kelas: "9A", jenjang: "SMP", mapel: "Tahfidz Al-Quran", tanggal: "30 Jan 2025", status: "sakit", keterangan: "Demam tinggi", pengaju: "Ustadz Ahmad", waktuPengajuan: "07:30" },
    { id: 2, type: "santri", name: "Fatimah Zahra", identifier: "2024004", kelas: "9A", jenjang: "SMP", mapel: "Fiqih", tanggal: "30 Jan 2025", status: "izin", keterangan: "Acara keluarga", pengaju: "Ustadzah Fatimah", waktuPengajuan: "06:45" },
    { id: 3, type: "santri", name: "Khadijah Amina", identifier: "2024006", kelas: "8A", jenjang: "SMP", mapel: "Bahasa Arab", tanggal: "30 Jan 2025", status: "alpha", keterangan: "Tidak ada keterangan", pengaju: "Ustadz Ibrahim", waktuPengajuan: "08:15" },
    { id: 4, type: "santri", name: "Maryam Salma", identifier: "2024010", kelas: "12A", jenjang: "SMA", mapel: "Matematika", tanggal: "30 Jan 2025", status: "sakit", keterangan: "Sakit perut", pengaju: "Pak Budi", waktuPengajuan: "07:50" },
  ],
  guru: [
    { id: 5, type: "guru", name: "Ustadz Ibrahim Hasan", identifier: "199001202015011003", jabatan: "Guru Bahasa Arab", mapel: "Bahasa Arab", tanggal: "30 Jan 2025", status: "sakit", keterangan: "Rawat jalan di RS", pengaju: "Self-report", waktuPengajuan: "06:00" },
    { id: 6, type: "guru", name: "Bu Siti Aminah", identifier: "199205102018012005", jabatan: "Guru Matematika", mapel: "Matematika", tanggal: "30 Jan 2025", status: "hadir", keterangan: "Jam pulang belum tercatat", pengaju: "System", waktuPengajuan: "15:35" },
    { id: 7, type: "guru", name: "Ustadz Yusuf Hakim", identifier: "198604200009011008", jabatan: "Guru Aqidah", mapel: "Aqidah Akhlak", tanggal: "30 Jan 2025", status: "alpha", keterangan: "Tidak ada keterangan", pengaju: "System", waktuPengajuan: "09:00" },
  ],
}

const validationStats = [
  { label: "Menunggu Validasi", count: 7, icon: Clock, color: "bg-chart-3/20 text-chart-3" },
  { label: "Disetujui Hari Ini", count: 24, icon: CheckCircle, color: "bg-primary/10 text-primary" },
  { label: "Ditolak Hari Ini", count: 2, icon: XCircle, color: "bg-destructive/10 text-destructive" },
  { label: "Perlu Perhatian", count: 3, icon: AlertTriangle, color: "bg-accent/20 text-accent" },
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

export default function ValidasiPresensiPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState("2025-01-30")
  const [selectedTab, setSelectedTab] = useState("santri")
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [validationDialog, setValidationDialog] = useState<{
    open: boolean
    item: typeof pendingValidations.santri[0] | typeof pendingValidations.guru[0] | null
    action: "approve" | "reject" | null
  }>({ open: false, item: null, action: null })
  const [bulkAction, setBulkAction] = useState<"approve" | "reject" | null>(null)

  const currentData = selectedTab === "santri" ? pendingValidations.santri : pendingValidations.guru

  const filteredData = currentData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.identifier.includes(searchQuery)
    return matchesSearch
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredData.map(item => item.id))
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, id])
    } else {
      setSelectedItems(selectedItems.filter(item => item !== id))
    }
  }

  const handleValidation = (item: typeof pendingValidations.santri[0] | typeof pendingValidations.guru[0], action: "approve" | "reject") => {
    setValidationDialog({ open: true, item, action })
  }

  const handleBulkValidation = (action: "approve" | "reject") => {
    setBulkAction(action)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Validasi Presensi</h1>
          <p className="text-muted-foreground">Validasi kehadiran santri dan guru oleh admin</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {validationStats.map((stat) => (
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList className="bg-muted">
            <TabsTrigger value="santri" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4 mr-2" />
              Presensi Santri
              <Badge variant="secondary" className="ml-2">{pendingValidations.santri.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="guru" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <GraduationCap className="w-4 h-4 mr-2" />
              Presensi Guru
              <Badge variant="secondary" className="ml-2">{pendingValidations.guru.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{selectedItems.length} dipilih</span>
              <Button
                size="sm"
                className="bg-primary text-primary-foreground"
                onClick={() => handleBulkValidation("approve")}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Setujui
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-transparent text-destructive border-destructive hover:bg-destructive/10"
                onClick={() => handleBulkValidation("reject")}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Tolak
              </Button>
            </div>
          )}
        </div>

        {/* Search Filter */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={selectedTab === "santri" ? "Cari nama atau NIS santri..." : "Cari nama atau NIP guru..."}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Santri Tab */}
        <TabsContent value="santri" className="mt-0">
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-foreground">Presensi Santri Menunggu Validasi</CardTitle>
              <CardDescription>Verifikasi dan setujui presensi santri yang diajukan guru</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedItems.length === filteredData.length && filteredData.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Santri</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Mata Pelajaran</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead>Pengaju</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingValidations.santri.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/30">
                        <TableCell>
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {getInitials(item.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.identifier}</p>
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
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground max-w-[150px] truncate">{item.keterangan}</p>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm text-foreground">{item.pengaju}</p>
                            <p className="text-xs text-muted-foreground">{item.waktuPengajuan}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-primary hover:text-primary hover:bg-primary/10"
                              onClick={() => handleValidation(item, "approve")}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleValidation(item, "reject")}
                            >
                              <XCircle className="w-4 h-4" />
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

        {/* Guru Tab */}
        <TabsContent value="guru" className="mt-0">
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-foreground">Presensi Guru Menunggu Validasi</CardTitle>
              <CardDescription>Verifikasi dan setujui presensi guru/ustadz</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedItems.length === pendingValidations.guru.length && pendingValidations.guru.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Guru/Ustadz</TableHead>
                      <TableHead>Jabatan</TableHead>
                      <TableHead>Mata Pelajaran</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead>Sumber</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingValidations.guru.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/30">
                        <TableCell>
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {getInitials(item.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.identifier}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">{item.jabatan}</TableCell>
                        <TableCell className="text-foreground">{item.mapel}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground max-w-[150px] truncate">{item.keterangan}</p>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm text-foreground">{item.pengaju}</p>
                            <p className="text-xs text-muted-foreground">{item.waktuPengajuan}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-primary hover:text-primary hover:bg-primary/10"
                              onClick={() => handleValidation(item, "approve")}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleValidation(item, "reject")}
                            >
                              <XCircle className="w-4 h-4" />
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
      </Tabs>

      {/* Riwayat Validasi */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg text-foreground">Riwayat Validasi Hari Ini</CardTitle>
              <CardDescription>Presensi yang sudah divalidasi</CardDescription>
            </div>
            <Button variant="outline" className="bg-transparent">
              <FileText className="w-4 h-4 mr-2" />
              Lihat Semua
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "Ahmad Fauzi", type: "santri", status: "hadir", action: "approved", time: "07:20", by: "Admin" },
              { name: "Siti Aisyah", type: "santri", status: "hadir", action: "approved", time: "07:18", by: "Admin" },
              { name: "Ustadz Ahmad Ridwan", type: "guru", status: "hadir", action: "approved", time: "07:00", by: "System" },
              { name: "Ustadzah Fatimah", type: "guru", status: "hadir", action: "approved", time: "06:55", by: "System" },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border border-border/50">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(item.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">{item.name}</p>
                    <Badge variant="outline" className="text-xs">{item.type === "santri" ? "Santri" : "Guru"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Divalidasi oleh {item.by} pada {item.time}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(item.status)}
                  {item.action === "approved" ? (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Validation Dialog */}
      <Dialog open={validationDialog.open} onOpenChange={(open) => setValidationDialog({ ...validationDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {validationDialog.action === "approve" ? "Setujui Presensi" : "Tolak Presensi"}
            </DialogTitle>
            <DialogDescription>
              {validationDialog.action === "approve" 
                ? "Konfirmasi persetujuan presensi berikut"
                : "Berikan alasan penolakan presensi"
              }
            </DialogDescription>
          </DialogHeader>
          {validationDialog.item && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(validationDialog.item.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{validationDialog.item.name}</p>
                  <p className="text-sm text-muted-foreground">{validationDialog.item.identifier}</p>
                </div>
                {getStatusBadge(validationDialog.item.status)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal</p>
                  <p className="font-medium text-foreground">{validationDialog.item.tanggal}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mata Pelajaran</p>
                  <p className="font-medium text-foreground">{validationDialog.item.mapel}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Keterangan dari Pengaju</p>
                <p className="font-medium text-foreground">{validationDialog.item.keterangan}</p>
              </div>
              {validationDialog.action === "reject" && (
                <div className="space-y-2">
                  <Label htmlFor="reject-reason">Alasan Penolakan</Label>
                  <Textarea id="reject-reason" placeholder="Masukkan alasan penolakan..." />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="bg-transparent" onClick={() => setValidationDialog({ open: false, item: null, action: null })}>
              Batal
            </Button>
            <Button
              className={validationDialog.action === "approve" 
                ? "bg-primary text-primary-foreground" 
                : "bg-destructive text-destructive-foreground"
              }
              onClick={() => setValidationDialog({ open: false, item: null, action: null })}
            >
              {validationDialog.action === "approve" ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Setujui
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Tolak
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={!!bulkAction} onOpenChange={() => setBulkAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {bulkAction === "approve" ? "Setujui Presensi Terpilih" : "Tolak Presensi Terpilih"}
            </DialogTitle>
            <DialogDescription>
              {selectedItems.length} presensi akan {bulkAction === "approve" ? "disetujui" : "ditolak"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {bulkAction === "reject" && (
              <div className="space-y-2">
                <Label htmlFor="bulk-reject-reason">Alasan Penolakan</Label>
                <Textarea id="bulk-reject-reason" placeholder="Masukkan alasan penolakan untuk semua item..." />
              </div>
            )}
            {bulkAction === "approve" && (
              <p className="text-muted-foreground">
                Semua presensi terpilih akan disetujui dan statusnya akan diperbarui.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="bg-transparent" onClick={() => setBulkAction(null)}>
              Batal
            </Button>
            <Button
              className={bulkAction === "approve" 
                ? "bg-primary text-primary-foreground" 
                : "bg-destructive text-destructive-foreground"
              }
              onClick={() => {
                setSelectedItems([])
                setBulkAction(null)
              }}
            >
              {bulkAction === "approve" ? "Setujui Semua" : "Tolak Semua"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
