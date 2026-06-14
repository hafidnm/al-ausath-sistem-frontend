"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"
import { semesterOptions } from "../utils/constants"
import { KelasItem } from "@/lib/services/kelas.service"

interface KkmFiltersProps {
  query: string
  onQueryChange: (value: string) => void
  semester: string
  onSemesterChange: (value: string) => void
  kodeKelas: string
  onKodeKelasChange: (value: string) => void
  kelasList: KelasItem[]
  perPage: string
  onPerPageChange: (value: string) => void
}

export function KkmFilters({
  query,
  onQueryChange,
  semester,
  onSemesterChange,
  kodeKelas,
  onKodeKelasChange,
  kelasList,
  perPage,
  onPerPageChange,
}: KkmFiltersProps) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="pl-10"
              placeholder="Cari mapel atau kode mapel..."
            />
          </div>

          <Select value={semester} onValueChange={onSemesterChange}>
            <SelectTrigger className="w-full lg:w-36">
              <SelectValue placeholder="Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Semester</SelectItem>
              {semesterOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={kodeKelas} onValueChange={onKodeKelasChange}>
            <SelectTrigger className="w-full lg:w-40">
              <SelectValue placeholder="Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelas</SelectItem>
              {kelasList.map((kelas) => (
                <SelectItem key={kelas.kode_kelas} value={kelas.kode_kelas}>
                  {kelas.nama_kelas ?? kelas.kode_kelas}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={perPage} onValueChange={onPerPageChange}>
            <SelectTrigger className="w-full lg:w-28">
              <SelectValue placeholder="Per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 Baris</SelectItem>
              <SelectItem value="20">20 Baris</SelectItem>
              <SelectItem value="50">50 Baris</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
