"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/axios"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  UserX,
  Users,
  GraduationCap,
  Calendar,
  RefreshCw,
  BookOpen,
} from "lucide-react"

interface OverviewData {
  summary: {
    santri: { total: number; hadir: number; sakit: number; izin: number; alfa: number; percentage: number }
    guru: { total: number; hadir: number; tidakHadir: number; percentage: number }
  }
  perKelas: { kelas: string; jenjang: string; total: number; hadir: number; sakit: number; izin: number; alfa: number; percentage: number }[]
  perMapel: { mapel: string; guru: string; sessions: number; avgHadir: number }[]
  guru: { id: number; nama: string; nip: string; jabatan: string; status: string; jamMasuk: string; mapelHariIni: number; keterangan?: string }[]
}

const getInitials = (name: string) => {
  if (!name) return ""
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

const getStatusBadge = (status: string) => {
  switch (status?.toUpperCase()) {
    case "HADIR":
      return <Badge className="bg-primary/10 text-primary border-0">Hadir</Badge>
    case "SAKIT":
      return <Badge className="bg-yellow-500/10 text-yellow-700 border-0">Sakit</Badge>
    case "IZIN":
      return <Badge className="bg-blue-500/10 text-blue-700 border-0">Izin</Badge>
    case "ALFA":
    case "TIDAK HADIR":
      return <Badge className="bg-destructive/10 text-destructive border-0">Tidak Hadir</Badge>
    default:
      return <Badge variant="outline">{status || "-"}</Badge>
  }
}

export default function PresensiOverviewPage() {
  const { toast } = useToast()
  
  // Default to today in YYYY-MM-DD
  const today = new Date().toISOString().split("T")[0]
  const [selectedDate, setSelectedDate] = useState(today)
  const [data, setData] = useState<OverviewData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const res = await api.get("/akademik/presensi/overview", {
        params: { tanggal: selectedDate }
      })
      setData(res.data)
    } catch (error) {
      toast({ title: "Gagal memuat data", description: "Tidak dapat mengambil data presensi.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void fetchData()
  }, [selectedDate])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Overview Presensi</h1>
          <p className="text-muted-foreground">Ringkasan kehadiran harian santri dan guru</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-0 p-0 h-auto focus-visible:ring-0 w-32"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => void fetchData()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Santri Hadir */}
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Santri Aktif Hadir</p>
                <div className="flex items-baseline gap-2">
                  {isLoading ? <Skeleton className="h-8 w-24" /> : (
                    <>
                      <p className="text-2xl font-bold text-primary">{data?.summary?.santri?.hadir ?? 0}</p>
                      <span className="text-sm text-muted-foreground">/ {data?.summary?.santri?.total ?? 0}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={data?.summary?.santri?.percentage ?? 0} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {isLoading ? "-" : `${data?.summary?.santri?.percentage}% kehadiran`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Guru Hadir */}
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Guru Hadir (Tercatat)</p>
                <div className="flex items-baseline gap-2">
                  {isLoading ? <Skeleton className="h-8 w-24" /> : (
                    <>
                      <p className="text-2xl font-bold text-accent">{data?.summary?.guru?.hadir ?? 0}</p>
                      <span className="text-sm text-muted-foreground">/ {data?.summary?.guru?.total ?? 0}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-accent" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={data?.summary?.guru?.percentage ?? 0} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {isLoading ? "-" : `${data?.summary?.guru?.percentage}% kehadiran`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tidak Hadir */}
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Santri Tidak Hadir</p>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-foreground">
                    {(data?.summary?.santri?.sakit ?? 0) + (data?.summary?.santri?.izin ?? 0) + (data?.summary?.santri?.alfa ?? 0)}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs pt-1">
                  <span className="text-yellow-600">S: {data?.summary?.santri?.sakit ?? 0}</span>
                  <span className="text-blue-600">I: {data?.summary?.santri?.izin ?? 0}</span>
                  <span className="text-destructive">A: {data?.summary?.santri?.alfa ?? 0}</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-chart-3/20 flex items-center justify-center">
                <UserX className="w-6 h-6 text-chart-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="kelas" className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="kelas" className="data-[state=active]:bg-card">
              <Users className="w-4 h-4 mr-2" />
              Per Kelas
            </TabsTrigger>
            <TabsTrigger value="mapel" className="data-[state=active]:bg-card">
              <BookOpen className="w-4 h-4 mr-2" />
              Per Mapel
            </TabsTrigger>
            <TabsTrigger value="guru" className="data-[state=active]:bg-card">
              <GraduationCap className="w-4 h-4 mr-2" />
              Guru
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Per Kelas Tab */}
        <TabsContent value="kelas">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Kehadiran per Kelas</CardTitle>
              <CardDescription>Berdasarkan entri sesi absensi di tanggal {selectedDate}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Kelas</TableHead>
                      <TableHead>Jenjang</TableHead>
                      <TableHead className="text-center">Tercatat</TableHead>
                      <TableHead className="text-center">Hadir</TableHead>
                      <TableHead className="text-center">Sakit</TableHead>
                      <TableHead className="text-center">Izin</TableHead>
                      <TableHead className="text-center">Alfa</TableHead>
                      <TableHead>Tingkat Kehadiran</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8">Memuat data...</TableCell></TableRow>
                    ) : data?.perKelas?.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8">Belum ada absensi kelas hari ini.</TableCell></TableRow>
                    ) : (
                      data?.perKelas?.map((item, idx) => (
                        <TableRow key={idx} className="hover:bg-muted/30">
                          <TableCell className="font-medium text-foreground">{item.kelas}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-transparent">{item.jenjang || "-"}</Badge>
                          </TableCell>
                          <TableCell className="text-center text-foreground">{item.total}</TableCell>
                          <TableCell className="text-center">
                            <span className="font-medium text-primary">{item.hadir}</span>
                          </TableCell>
                          <TableCell className="text-center text-yellow-600">{item.sakit}</TableCell>
                          <TableCell className="text-center text-blue-600">{item.izin}</TableCell>
                          <TableCell className="text-center text-destructive">{item.alfa}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={item.percentage} className="h-2 w-20" />
                              <span className="text-sm font-medium text-foreground">{item.percentage}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Per Mapel Tab */}
        <TabsContent value="mapel">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Kehadiran per Mata Pelajaran</CardTitle>
              <CardDescription>Rata-rata kehadiran santri berdasarkan mata pelajaran</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Mata Pelajaran</TableHead>
                      <TableHead>Guru Pengampu</TableHead>
                      <TableHead className="text-center">Total Sesi</TableHead>
                      <TableHead>Rata-rata Kehadiran</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8">Memuat data...</TableCell></TableRow>
                    ) : data?.perMapel?.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8">Belum ada absensi mapel hari ini.</TableCell></TableRow>
                    ) : (
                      data?.perMapel?.map((item, idx) => (
                        <TableRow key={idx} className="hover:bg-muted/30">
                          <TableCell className="font-medium text-foreground">{item.mapel}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-7 h-7">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {getInitials(item.guru)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-foreground">{item.guru || "-"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-foreground">{item.sessions}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={item.avgHadir} className="h-2 w-20" />
                              <span className="text-sm font-medium text-foreground">{item.avgHadir}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guru Tab */}
        <TabsContent value="guru">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Kehadiran Guru</CardTitle>
              <CardDescription>Status absensi guru yang terekam hari ini</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Nama Guru</TableHead>
                      <TableHead>NIP</TableHead>
                      <TableHead>Jabatan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Jam Masuk</TableHead>
                      <TableHead className="text-center">Sesi Mengajar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8">Memuat data...</TableCell></TableRow>
                    ) : data?.guru?.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8">Belum ada data absensi guru.</TableCell></TableRow>
                    ) : (
                      data?.guru?.map((guru) => (
                        <TableRow key={guru.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-accent/20 text-accent text-xs">
                                  {getInitials(guru.nama)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-foreground">{guru.nama}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{guru.nip || "-"}</TableCell>
                          <TableCell className="text-foreground">{guru.jabatan}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 items-start">
                              {getStatusBadge(guru.status)}
                              {guru.keterangan && (
                                <span className="text-xs text-muted-foreground">{guru.keterangan}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-foreground">{guru.jamMasuk}</TableCell>
                          <TableCell className="text-center text-foreground">{guru.mapelHariIni}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
