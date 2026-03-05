"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  Search,
  Save,
  CheckCircle,
  BookOpen,
  Users,
  Calculator,
  AlertCircle,
} from "lucide-react"

const kelasOptions = [
  { value: "12-ipa", label: "12 IPA", santri: 32 },
  { value: "12-ips", label: "12 IPS", santri: 28 },
  { value: "11-ipa", label: "11 IPA", santri: 30 },
  { value: "11-ips", label: "11 IPS", santri: 25 },
  { value: "10-ipa", label: "10 IPA", santri: 33 },
  { value: "10-ips", label: "10 IPS", santri: 29 },
]

const mapelOptions = [
  { value: "quran", label: "Al-Quran Hadits" },
  { value: "aqidah", label: "Aqidah Akhlak" },
  { value: "fiqih", label: "Fiqih" },
  { value: "ski", label: "SKI" },
  { value: "arab", label: "Bahasa Arab" },
  { value: "mtk", label: "Matematika" },
  { value: "indo", label: "Bahasa Indonesia" },
  { value: "eng", label: "Bahasa Inggris" },
  { value: "ipa", label: "IPA" },
  { value: "ips", label: "IPS" },
]

const initialNilaiData = [
  { id: 1, nis: "2024001", name: "Ahmad Fauzi", tugas1: 85, tugas2: 88, uts: 90, uas: null },
  { id: 2, nis: "2024002", name: "Siti Aisyah", tugas1: 90, tugas2: 92, uts: 88, uas: null },
  { id: 3, nis: "2024003", name: "Muhammad Rizki", tugas1: 78, tugas2: 82, uts: 85, uas: null },
  { id: 4, nis: "2024004", name: "Fatimah Zahra", tugas1: 88, tugas2: 90, uts: 92, uas: null },
  { id: 5, nis: "2024005", name: "Abdullah Ibrahim", tugas1: 82, tugas2: 85, uts: 80, uas: null },
  { id: 6, nis: "2024006", name: "Khadijah Amira", tugas1: 95, tugas2: 93, uts: 96, uas: null },
  { id: 7, nis: "2024007", name: "Umar Hasan", tugas1: 75, tugas2: 78, uts: 72, uas: null },
  { id: 8, nis: "2024008", name: "Maryam Salma", tugas1: 88, tugas2: 86, uts: 89, uas: null },
]

export default function NilaiPage() {
  const [selectedKelas, setSelectedKelas] = useState("")
  const [selectedMapel, setSelectedMapel] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [nilaiData, setNilaiData] = useState(initialNilaiData)
  const [hasChanges, setHasChanges] = useState(false)

  const filteredData = nilaiData.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.nis.includes(searchQuery)
  )

  const handleNilaiChange = (id: number, field: string, value: string) => {
    const numValue = value === "" ? null : Number(value)
    setNilaiData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: numValue } : item
      )
    )
    setHasChanges(true)
  }

  const calculateRata = (item: typeof initialNilaiData[0]) => {
    const values = [item.tugas1, item.tugas2, item.uts, item.uas].filter(
      (v) => v !== null
    ) as number[]
    if (values.length === 0) return "-"
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    return avg.toFixed(1)
  }

  const getPredikat = (rata: string) => {
    if (rata === "-") return "-"
    const num = parseFloat(rata)
    if (num >= 90) return "A"
    if (num >= 80) return "B"
    if (num >= 70) return "C"
    if (num >= 60) return "D"
    return "E"
  }

  const handleSave = () => {
    // Simulate save
    setHasChanges(false)
    alert("Nilai berhasil disimpan!")
  }

  const completedCount = nilaiData.filter(
    (item) => item.tugas1 && item.tugas2 && item.uts && item.uas
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Input Nilai</h1>
          <p className="text-muted-foreground">Kelola nilai santri per mata pelajaran</p>
        </div>
        <Button
          size="sm"
          className="bg-primary text-primary-foreground"
          onClick={handleSave}
          disabled={!hasChanges}
        >
          <Save className="w-4 h-4 mr-2" />
          Simpan Nilai
        </Button>
      </div>

      {/* Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-foreground">
              <Users className="w-5 h-5 text-primary" />
              Pilih Kelas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedKelas} onValueChange={setSelectedKelas}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kelas..." />
              </SelectTrigger>
              <SelectContent>
                {kelasOptions.map((kelas) => (
                  <SelectItem key={kelas.value} value={kelas.value}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <span>{kelas.label}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {kelas.santri} santri
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-foreground">
              <BookOpen className="w-5 h-5 text-primary" />
              Pilih Mata Pelajaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedMapel} onValueChange={setSelectedMapel}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih mata pelajaran..." />
              </SelectTrigger>
              <SelectContent>
                {mapelOptions.map((mapel) => (
                  <SelectItem key={mapel.value} value={mapel.value}>
                    {mapel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      {selectedKelas && selectedMapel && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{nilaiData.length}</p>
                  <p className="text-xs text-muted-foreground">Total Santri</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{completedCount}</p>
                  <p className="text-xs text-muted-foreground">Nilai Lengkap</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-chart-3" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{nilaiData.length - completedCount}</p>
                  <p className="text-xs text-muted-foreground">Belum Lengkap</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">75</p>
                  <p className="text-xs text-muted-foreground">KKM</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Input Table */}
      {selectedKelas && selectedMapel ? (
        <Card className="border-border/50">
          <CardHeader className="pb-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg text-foreground">
                  Input Nilai - {kelasOptions.find(k => k.value === selectedKelas)?.label} - {mapelOptions.find(m => m.value === selectedMapel)?.label}
                </CardTitle>
                <CardDescription>Semester Ganjil 2024/2025</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari santri..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground w-12">No</TableHead>
                    <TableHead className="text-muted-foreground">NIS</TableHead>
                    <TableHead className="text-muted-foreground">Nama Santri</TableHead>
                    <TableHead className="text-muted-foreground text-center">Tugas 1</TableHead>
                    <TableHead className="text-muted-foreground text-center">Tugas 2</TableHead>
                    <TableHead className="text-muted-foreground text-center">UTS</TableHead>
                    <TableHead className="text-muted-foreground text-center">UAS</TableHead>
                    <TableHead className="text-muted-foreground text-center">Rata-rata</TableHead>
                    <TableHead className="text-muted-foreground text-center">Predikat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item, index) => {
                    const rata = calculateRata(item)
                    const predikat = getPredikat(rata)
                    const isBelowKKM = rata !== "-" && parseFloat(rata) < 75

                    return (
                      <TableRow key={item.id} className="border-border">
                        <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="text-foreground font-mono text-sm">{item.nis}</TableCell>
                        <TableCell className="text-foreground font-medium">{item.name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={item.tugas1 ?? ""}
                            onChange={(e) => handleNilaiChange(item.id, "tugas1", e.target.value)}
                            className="w-16 text-center mx-auto"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={item.tugas2 ?? ""}
                            onChange={(e) => handleNilaiChange(item.id, "tugas2", e.target.value)}
                            className="w-16 text-center mx-auto"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={item.uts ?? ""}
                            onChange={(e) => handleNilaiChange(item.id, "uts", e.target.value)}
                            className="w-16 text-center mx-auto"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={item.uas ?? ""}
                            onChange={(e) => handleNilaiChange(item.id, "uas", e.target.value)}
                            className="w-16 text-center mx-auto"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-bold ${isBelowKKM ? "text-destructive" : "text-primary"}`}>
                            {rata}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {predikat !== "-" && (
                            <Badge
                              className={
                                predikat === "A"
                                  ? "bg-primary/20 text-primary"
                                  : predikat === "B"
                                    ? "bg-accent/20 text-accent"
                                    : predikat === "C"
                                      ? "bg-chart-3/20 text-chart-3"
                                      : "bg-destructive/20 text-destructive"
                              }
                            >
                              {predikat}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-sm font-medium text-foreground mb-2">Keterangan Predikat:</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/20 text-primary">A</Badge>
                  <span className="text-muted-foreground">90-100 (Sangat Baik)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-accent/20 text-accent">B</Badge>
                  <span className="text-muted-foreground">80-89 (Baik)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-chart-3/20 text-chart-3">C</Badge>
                  <span className="text-muted-foreground">70-79 (Cukup)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-destructive/20 text-destructive">D/E</Badge>
                  <span className="text-muted-foreground">{'<'}70 (Kurang)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Pilih Kelas dan Mata Pelajaran</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Silakan pilih kelas dan mata pelajaran terlebih dahulu untuk mulai menginput nilai santri.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
