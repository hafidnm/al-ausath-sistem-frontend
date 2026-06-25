"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts"
import api from "@/lib/axios"
import { sesiAbsensiService } from "@/lib/services/sesiabsensi.service"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"
import { useUnit } from "@/contexts/unit-context"
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
    santri: { total_aktif: number; total: number; hadir: number; sakit: number; izin: number; alfa: number; percentage: number }
    guru: { total_aktif: number; total: number; hadir: number; sakit: number; izin: number; alfa: number; tidakHadir: number; percentage: number }
  }
  perKelas: { kelas: string; jenjang: string; total_pertemuan: number; total: number; hadir: number; sakit: number; izin: number; alfa: number; percentage: number }[]
  perMapel: { mapel: string; guru: string; sessions: number; avgHadir: number }[]
  trend: { tanggal: string; hadir: number; sakit: number; izin: number; alfa: number; total_entri: number; percentage: number }[]
  guru: { id: number; nama: string; nip: string; jabatan: string; status: string; jamMasuk: string; mapelHariIni: number; keterangan?: string; total_pertemuan: number; jumlah_hadir: number; jumlah_sakit: number; jumlah_izin: number; jumlah_alfa: number; persentase_kehadiran: number }[]
}

const getInitials = (name: string) => {
  if (!name) return ""
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

const getStatusBadge = (status: string) => {
  switch (status?.toUpperCase()) {
    case "HADIR":
      return <Badge className="bg-emerald-500/10 text-emerald-600 border-0 hover:bg-emerald-500/20 transition-all">Hadir</Badge>
    case "SAKIT":
      return <Badge className="bg-yellow-500/10 text-yellow-600 border-0 hover:bg-yellow-500/20 transition-all">Sakit</Badge>
    case "IZIN":
      return <Badge className="bg-blue-500/10 text-blue-600 border-0 hover:bg-blue-500/20 transition-all">Izin</Badge>
    case "ALFA":
    case "TIDAK HADIR":
      return <Badge className="bg-destructive/10 text-destructive border-0 hover:bg-destructive/20 transition-all">Tidak Hadir</Badge>
    default:
      return <Badge variant="outline" className="border-muted-foreground/30">{status || "-"}</Badge>
  }
}

export default function PresensiOverviewPage() {
  const { toast } = useToast()

  // --- Global Context Filters (dari header dashboard) ---
  const { selectedKodeTahun, isLoading: isTahunLoading } = useTahunAjaran()
  const { selectedKodeUnit, isLoading: isUnitLoading } = useUnit()

  // Context dianggap siap ketika keduanya selesai loading
  const contextReady = !isTahunLoading && !isUnitLoading

  const [selectedDate, setSelectedDate] = useState("")
  const [periode, setPeriode] = useState<"semua" | "harian" | "mingguan" | "bulanan">("semua")
  const [selectedKelas, setSelectedKelas] = useState<string>("ALL")

  const [kelasOptions, setKelasOptions] = useState<any[]>([])

  const [data, setData] = useState<OverviewData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("kelas")

  const initDoneRef = useRef(false)

  // Memoize filtered kelas options based on global context (unit + tahun ajaran)
  const filteredKelasOptions = useMemo(() => {
    let opts = kelasOptions
    if (selectedKodeTahun) {
      opts = opts.filter((k: any) => k.tahun_ajaran === selectedKodeTahun)
    }
    if (selectedKodeUnit) {
      opts = opts.filter((k: any) => k.kode_unit === selectedKodeUnit)
    }
    return opts
  }, [selectedKodeUnit, selectedKodeTahun, kelasOptions])

  // Reset kelas filter ketika unit atau tahun ajaran berubah
  useEffect(() => {
    setSelectedKelas("ALL")
  }, [selectedKodeUnit, selectedKodeTahun])

  // Load kelas options dan tunggu context siap sebelum fetch pertama
  useEffect(() => {
    if (!contextReady) return
    const loadOptions = async () => {
      try {
        const initData = await sesiAbsensiService.adminPresensiSantriInit()
        setKelasOptions(initData.kelas || [])
      } catch (error) {
        console.error("Gagal memuat filter options", error)
      } finally {
        initDoneRef.current = true
        void fetchData()
      }
    }
    if (!initDoneRef.current) {
      void loadOptions()
    } else {
      void fetchData()
    }
  }, [contextReady])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const params: any = { periode }
      if (periode !== "semua" && selectedDate) {
        params.tanggal = selectedDate
      }
      // Gunakan nilai dari global context header
      if (selectedKodeUnit) params.kode_unit = selectedKodeUnit
      if (selectedKelas !== "ALL") params.kode_kelas = selectedKelas
      if (selectedKodeTahun) params.tahun_ajaran = selectedKodeTahun

      const res = await api.get("/akademik/presensi/overview", { params })
      setData(res.data)
    } catch (error) {
      toast({ title: "Gagal memuat data", description: "Tidak dapat mengambil data presensi.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  // Re-fetch ketika filter lokal atau context global berubah
  useEffect(() => {
    if (!initDoneRef.current) return
    void fetchData()
  }, [selectedDate, periode, selectedKelas, selectedKodeTahun, selectedKodeUnit])

  return (
    <div className="space-y-6">
      {/* Header & Main Filters */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 bg-card/60 backdrop-blur-md p-4 rounded-xl border border-border/40 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Overview Presensi</h1>
          <p className="text-muted-foreground text-sm">
            Ringkasan statistik kehadiran santri dan guru
            {selectedKodeTahun && <span className="ml-1 text-primary font-medium">— {selectedKodeTahun}</span>}
            {selectedKodeUnit && <span className="ml-1 text-primary font-medium">/ {selectedKodeUnit}</span>}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Periode Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Periode:</span>
            <Select value={periode} onValueChange={(val: any) => setPeriode(val)}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua</SelectItem>
                <SelectItem value="harian">Harian</SelectItem>
                <SelectItem value="mingguan">Mingguan</SelectItem>
                <SelectItem value="bulanan">Bulanan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Kelas Filter */}
          <div className="flex items-center gap-2">
            <Select value={selectedKelas} onValueChange={(val) => setSelectedKelas(val)}>
              <SelectTrigger className="w-40 h-9">
                <SelectValue placeholder="Semua Kelas" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="ALL">Semua Kelas</SelectItem>
                {filteredKelasOptions.map((k: any) => (
                  <SelectItem key={k.kode_kelas} value={k.kode_kelas}>
                    {k.nama_kelas}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Picker - only shown when periode is not 'semua' */}
          {periode !== "semua" && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {periode === "harian" ? "Tanggal:" : periode === "mingguan" ? "Acuan Minggu:" : "Acuan Bulan:"}
              </span>
              <div className="flex items-center gap-2 bg-background border border-input rounded-md px-3 py-1.5 shadow-sm text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border-0 p-0 h-auto focus-visible:ring-0 w-32 bg-transparent text-sm"
                />
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <Button variant="outline" size="sm" className="h-9 gap-1" onClick={() => void fetchData()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Santri Hadir */}
        <Card className="border-border/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Santri Aktif Hadir</p>
                <div className="flex items-baseline gap-2">
                  {isLoading ? <Skeleton className="h-8 w-24" /> : (
                    <>
                      <p className="text-2xl font-extrabold text-primary">{data?.summary?.santri?.hadir ?? 0}</p>
                      <span className="text-sm text-muted-foreground">/ {data?.summary?.santri?.total ?? 0} Entri ({data?.summary?.santri?.total_aktif ?? 0} Aktif)</span>
                    </>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={data?.summary?.santri?.percentage ?? 0} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2 font-medium">
                {isLoading ? "-" : `${data?.summary?.santri?.percentage}% tingkat kehadiran`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Guru Hadir */}
        <Card className="border-border/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Guru Hadir (Tercatat)</p>
                <div className="flex items-baseline gap-2">
                  {isLoading ? <Skeleton className="h-8 w-24" /> : (
                    <>
                      <p className="text-2xl font-extrabold text-emerald-600">{data?.summary?.guru?.hadir ?? 0}</p>
                      <span className="text-sm text-muted-foreground">/ {data?.summary?.guru?.total ?? 0} Entri ({data?.summary?.guru?.total_aktif ?? 0} Aktif)</span>
                    </>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <GraduationCap className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={data?.summary?.guru?.percentage ?? 0} className="h-2 bg-emerald-100" />
              <p className="text-xs text-muted-foreground mt-2 font-medium">
                {isLoading ? "-" : `${data?.summary?.guru?.percentage}% kehadiran`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Santri Tidak Hadir */}
        <Card className="border-border/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Santri Tidak Hadir</p>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-extrabold text-amber-600">
                    {(data?.summary?.santri?.sakit ?? 0) + (data?.summary?.santri?.izin ?? 0) + (data?.summary?.santri?.alfa ?? 0)}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs pt-2 font-semibold">
                  <span className="text-yellow-600 bg-yellow-500/10 px-1.5 py-0.5 rounded">S: {data?.summary?.santri?.sakit ?? 0}</span>
                  <span className="text-blue-600 bg-blue-500/10 px-1.5 py-0.5 rounded">I: {data?.summary?.santri?.izin ?? 0}</span>
                  <span className="text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">A: {data?.summary?.santri?.alfa ?? 0}</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserX className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guru Tidak Hadir */}
        <Card className="border-border/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Guru Tidak Hadir</p>
                <div className="flex items-baseline gap-2">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : (
                    <p className="text-2xl font-extrabold text-destructive">
                      {data?.summary?.guru?.tidakHadir ?? 0}
                    </p>
                  )}
                  <span className="text-sm text-muted-foreground">/ {data?.summary?.guru?.total_aktif ?? 0} Aktif</span>
                </div>
                <p className="text-xs text-muted-foreground pt-2">Memerlukan tindak lanjut / jadwal pengganti</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserX className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {!isLoading && data && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Trend Kehadiran — Multi-line */}
            <Card className="col-span-1 border-border/50 shadow-sm flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg font-semibold">Trend Kehadiran Santri</CardTitle>
                    <CardDescription>Jumlah entri absensi per tanggal sesi</CardDescription>
                  </div>
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-4 text-xs font-semibold mt-1">
                  <span className="flex items-center gap-1.5 text-emerald-600"><span className="w-6 h-0.5 bg-emerald-500 rounded-full inline-block"></span>Hadir</span>
                  <span className="flex items-center gap-1.5 text-yellow-600"><span className="w-6 h-0.5 bg-yellow-500 rounded-full inline-block"></span>Sakit</span>
                  <span className="flex items-center gap-1.5 text-blue-600"><span className="w-6 h-0.5 bg-blue-500 rounded-full inline-block"></span>Izin</span>
                  <span className="flex items-center gap-1.5 text-red-600"><span className="w-6 h-0.5 bg-red-500 rounded-full inline-block"></span>Alfa</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 min-h-[300px] pt-4 pb-4 px-2">
                {data.trend && data.trend.length > 0 ? (
                  <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={data.trend}
                        margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={true}
                          horizontal={true}
                          stroke="#e2e8f0"
                        />
                        <XAxis
                          dataKey="tanggal"
                          axisLine={{ stroke: "#cbd5e1" }}
                          tickLine={{ stroke: "#cbd5e1" }}
                          tick={{ fontSize: 11 }}
                          tickMargin={12}
                          tickFormatter={(val) => {
                            const d = new Date(val);
                            return `${d.getDate()}/${d.getMonth() + 1}`;
                          }}
                        />
                        <YAxis
                          allowDecimals={false}
                          axisLine={{ stroke: "#cbd5e1" }}
                          tickLine={{ stroke: "#cbd5e1" }}
                          tick={{ fontSize: 11 }}
                          width={38}
                        />
                        <Tooltip
                          labelFormatter={(label) => {
                            const d = new Date(label);
                            return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
                          }}
                          formatter={(value: number, name: string) => {
                            const map: Record<string, string> = { hadir: "Hadir", sakit: "Sakit", izin: "Izin", alfa: "Alfa" };
                            return [`${value} entri`, map[name] ?? name];
                          }}
                          contentStyle={{
                            borderRadius: "10px",
                            border: "1px solid hsl(var(--border))",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                            fontSize: 13,
                          }}
                          cursor={{ stroke: "hsl(var(--muted-foreground)/0.3)", strokeWidth: 1.5 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="hadir"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="sakit"
                          stroke="#eab308"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: "#eab308", stroke: "#fff", strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: "#eab308", stroke: "#fff", strokeWidth: 2 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="izin"
                          stroke="#3b82f6"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="alfa"
                          stroke="#ef4444"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: "#ef4444", stroke: "#fff", strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: "#ef4444", stroke: "#fff", strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Belum ada data trend kehadiran.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tingkat Kehadiran (Dinamis Kelas/Mapel/Guru) */}
            <Card className="col-span-1 border-border/50 shadow-sm flex flex-col">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg font-semibold">
                  Tingkat Kehadiran {activeTab === 'guru' ? 'Guru' : activeTab === 'mapel' ? 'per Mapel' : 'per Kelas'}
                </CardTitle>
                <CardDescription>Persentase & rincian kehadiran seluruh data</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-[300px] pt-6 pb-4">
                {(activeTab === 'guru' && data.guru?.length > 0) || (activeTab === 'mapel' && data.perMapel?.length > 0) || (activeTab === 'kelas' && data.perKelas?.length > 0) ? (() => {
                  const chartData = activeTab === 'guru'
                    ? [...data.guru].sort((a, b) => b.persentase_kehadiran - a.persentase_kehadiran).map(g => ({
                        name: g.nama.split(' ')[0],
                        percentage: g.persentase_kehadiran,
                        hadir: g.jumlah_hadir,
                        sakit: g.jumlah_sakit,
                        izin: g.jumlah_izin,
                        alfa: g.jumlah_alfa,
                        total: g.total_pertemuan,
                      }))
                    : activeTab === 'mapel'
                      ? [...data.perMapel].sort((a, b) => b.avgHadir - a.avgHadir).map(m => ({
                          name: m.mapel,
                          percentage: m.avgHadir,
                          hadir: null, sakit: null, izin: null, alfa: null, total: m.sessions,
                        }))
                      : [...data.perKelas].sort((a, b) => b.percentage - a.percentage).map(k => ({
                          name: k.kelas,
                          percentage: k.percentage,
                          hadir: k.hadir,
                          sakit: k.sakit,
                          izin: k.izin,
                          alfa: k.alfa,
                          total: k.total,
                        }));
                  return (
                    <div className="w-full h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" axisLine={{ stroke: "#cbd5e1" }} tickLine={false} tick={{ fontSize: 11 }} tickMargin={10} />
                          <YAxis axisLine={{ stroke: "#cbd5e1" }} tickLine={false} tick={{ fontSize: 11 }} domain={[0, 100]} />
                          <Tooltip
                            cursor={false}
                            content={({ active, payload, label }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0]?.payload;
                              return (
                                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 13, minWidth: 170 }}>
                                  <p style={{ fontWeight: 700, marginBottom: 6, color: "#1e293b" }}>{label}</p>
                                  <p style={{ color: "#10b981", margin: "2px 0" }}>✔ Hadir: <b>{d.hadir ?? "-"}</b></p>
                                  <p style={{ color: "#eab308", margin: "2px 0" }}>🤒 Sakit: <b>{d.sakit ?? "-"}</b></p>
                                  <p style={{ color: "#3b82f6", margin: "2px 0" }}>📋 Izin: <b>{d.izin ?? "-"}</b></p>
                                  <p style={{ color: "#ef4444", margin: "2px 0" }}>✘ Alfa: <b>{d.alfa ?? "-"}</b></p>
                                  <p style={{ color: "#64748b", marginTop: 6, paddingTop: 6, borderTop: "1px solid #f1f5f9" }}>Kehadiran: <b>{d.percentage}%</b></p>
                                </div>
                              );
                            }}
                          />
                          <Bar dataKey="percentage" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })() : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Belum ada data presensi untuk kriteria ini.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Tabs for detailed views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <TabsList className="bg-muted/50 p-1 border border-border/40">
            <TabsTrigger value="kelas" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Users className="w-4 h-4 mr-2" />
              Per Kelas
            </TabsTrigger>
            <TabsTrigger value="mapel" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <BookOpen className="w-4 h-4 mr-2" />
              Per Mapel
            </TabsTrigger>
            <TabsTrigger value="guru" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <GraduationCap className="w-4 h-4 mr-2" />
              Kehadiran Guru
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Per Kelas Tab */}
        <TabsContent value="kelas">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-lg font-bold text-foreground">Kehadiran per Kelas</CardTitle>
              <CardDescription>Berdasarkan status keaktifan kelas dan jadwal pelajaran</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-bold">Kelas</TableHead>
                      <TableHead className="font-bold">Jenjang</TableHead>
                      <TableHead className="text-center font-bold">Total Pertemuan</TableHead>
                      <TableHead className="text-center font-bold">Total Santri</TableHead>
                      <TableHead className="text-center font-bold">Hadir</TableHead>
                      <TableHead className="text-center font-bold text-yellow-600">Sakit</TableHead>
                      <TableHead className="text-center font-bold text-blue-600">Izin</TableHead>
                      <TableHead className="text-center font-bold text-destructive">Alfa</TableHead>
                      <TableHead className="font-bold">Tingkat Kehadiran</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Memuat data kelas...</TableCell></TableRow>
                    ) : data?.perKelas?.length === 0 ? (
                      <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Belum ada absensi kelas untuk kriteria ini.</TableCell></TableRow>
                    ) : (
                      data?.perKelas?.map((item, idx) => (
                        <TableRow key={idx} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="font-semibold text-foreground">{item.kelas}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-transparent border-border/60">{item.jenjang || "-"}</Badge>
                          </TableCell>
                          <TableCell className="text-center font-medium text-foreground">{item.total_pertemuan ?? "-"}</TableCell>
                          <TableCell className="text-center font-medium text-foreground">{item.total}</TableCell>
                          <TableCell className="text-center">
                            <span className="font-semibold text-primary">{item.hadir}</span>
                          </TableCell>
                          <TableCell className="text-center font-medium text-yellow-600">{item.sakit}</TableCell>
                          <TableCell className="text-center font-medium text-blue-600">{item.izin}</TableCell>
                          <TableCell className="text-center font-medium text-destructive">{item.alfa}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={item.percentage} className="h-2 w-24" />
                              <span className="text-sm font-bold text-foreground">{item.percentage}%</span>
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
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-lg font-bold text-foreground">Kehadiran per Mata Pelajaran</CardTitle>
              <CardDescription>Rata-rata kehadiran santri berdasarkan sesi mapel yang telah selesai</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-bold">Mata Pelajaran</TableHead>
                      <TableHead className="font-bold">Guru Pengampu</TableHead>
                      <TableHead className="text-center font-bold">Total Sesi</TableHead>
                      <TableHead className="font-bold">Rata-rata Kehadiran Santri</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Memuat data mapel...</TableCell></TableRow>
                    ) : data?.perMapel?.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Belum ada absensi mapel untuk kriteria ini.</TableCell></TableRow>
                    ) : (
                      data?.perMapel?.map((item, idx) => (
                        <TableRow key={idx} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="font-semibold text-foreground">{item.mapel}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-7 h-7">
                                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                                  {getInitials(item.guru)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium text-foreground">{item.guru || "-"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-medium text-foreground">{item.sessions}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={item.avgHadir} className="h-2 w-24" />
                              <span className="text-sm font-bold text-foreground">{item.avgHadir}%</span>
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
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-lg font-bold text-foreground">Kehadiran Guru</CardTitle>
              <CardDescription>Status kehadiran guru dan catatan waktu terlambat</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-bold">Nama Guru</TableHead>
                      <TableHead className="font-bold">Jabatan</TableHead>
                      <TableHead className="text-center font-bold">Total Pertemuan</TableHead>
                      <TableHead className="text-center font-bold text-emerald-600">Hadir</TableHead>
                      <TableHead className="text-center font-bold text-yellow-600">Sakit</TableHead>
                      <TableHead className="text-center font-bold text-blue-600">Izin</TableHead>
                      <TableHead className="text-center font-bold text-destructive">Alfa</TableHead>
                      <TableHead className="text-right font-bold">% Kehadiran</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Memuat data guru...</TableCell></TableRow>
                    ) : data?.guru?.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Belum ada data absensi guru.</TableCell></TableRow>
                    ) : (
                      data?.guru?.map((guru) => (
                        <TableRow key={guru.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-emerald-500/10 text-emerald-600 text-xs font-bold">
                                  {getInitials(guru.nama)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-semibold text-foreground text-sm">{guru.nama}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-foreground text-sm font-medium">{guru.jabatan}</TableCell>
                          <TableCell className="text-center font-medium text-foreground">{(guru as any).total_pertemuan ?? 0}</TableCell>
                          <TableCell className="text-center">
                            <span className="font-semibold text-emerald-600">{(guru as any).jumlah_hadir ?? 0}</span>
                          </TableCell>
                          <TableCell className="text-center font-medium text-yellow-600">{(guru as any).jumlah_sakit ?? 0}</TableCell>
                          <TableCell className="text-center font-medium text-blue-600">{(guru as any).jumlah_izin ?? 0}</TableCell>
                          <TableCell className="text-center font-medium text-destructive">{(guru as any).jumlah_alfa ?? 0}</TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant="outline"
                              className={(guru as any).persentase_kehadiran >= 90 ? 'text-emerald-600 border-emerald-200' : 'text-destructive border-destructive/30'}
                            >
                              {(guru as any).persentase_kehadiran ?? 0}%
                            </Badge>
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
      </Tabs>
    </div>
  )
}
