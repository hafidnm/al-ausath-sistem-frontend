"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Calendar,
  RefreshCw,
  Download,
} from "lucide-react"

interface FiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  selectedDate: string
  onDateChange: (value: string) => void
  selectedMapel: string
  onMapelChange: (value: string) => void
  selectedKelas: string
  onKelasChange: (value: string) => void
  selectedGuru: string
  onGuruChange: (value: string) => void
  onRefresh?: () => void
  onExport?: () => void
}

export function Filters({
  searchQuery,
  onSearchChange,
  selectedDate,
  onDateChange,
  selectedMapel,
  onMapelChange,
  selectedKelas,
  onKelasChange,
  selectedGuru,
  onGuruChange,
  onRefresh,
  onExport,
}: FiltersProps) {
  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Panel Admin</h1>
          <p className="text-muted-foreground">Validasi presensi santri dan guru</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-transparent"
            onClick={onRefresh}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-transparent"
            onClick={onExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari guru, kelas, atau mata pelajaran..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => onDateChange(e.target.value)}
                  className="w-40"
                />
              </div>
              <Select value={selectedMapel} onValueChange={onMapelChange}>
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
              <Select value={selectedKelas} onValueChange={onKelasChange}>
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
              <Select value={selectedGuru} onValueChange={onGuruChange}>
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
    </>
  )
}
