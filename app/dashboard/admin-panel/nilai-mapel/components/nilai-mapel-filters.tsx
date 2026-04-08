"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { semesterOptions, tahunAjaranOptions } from "../utils/constants"

interface NilaiMapelFiltersProps {
  nomorInduk: string
  onNomorIndukChange: (value: string) => void
  kodeMapel: string
  onKodeMapelChange: (value: string) => void
  kodeKelas: string
  onKodeKelasChange: (value: string) => void
  tahunAjaran: string
  onTahunAjaranChange: (value: string) => void
  semester: string
  onSemesterChange: (value: string) => void
  perPage: string
  onPerPageChange: (value: string) => void
  onApply?: () => void
}

export function NilaiMapelFilters({
  nomorInduk,
  onNomorIndukChange,
  kodeMapel,
  onKodeMapelChange,
  kodeKelas,
  onKodeKelasChange,
  tahunAjaran,
  onTahunAjaranChange,
  semester,
  onSemesterChange,
  perPage,
  onPerPageChange,
  onApply,
}: NilaiMapelFiltersProps) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <Input
            value={nomorInduk}
            onChange={(e) => onNomorIndukChange(e.target.value)}
            placeholder="Nomor induk (wajib)"
          />

          <Input
            value={kodeMapel}
            onChange={(e) => onKodeMapelChange(e.target.value)}
            placeholder="Filter kode mapel"
          />

          <Input
            value={kodeKelas}
            onChange={(e) => onKodeKelasChange(e.target.value)}
            placeholder="Filter kode kelas"
          />

          <Select value={tahunAjaran} onValueChange={onTahunAjaranChange}>
            <SelectTrigger>
              <SelectValue placeholder="Tahun Ajaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tahun</SelectItem>
              {tahunAjaranOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={semester} onValueChange={onSemesterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Semester</SelectItem>
              {semesterOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={perPage} onValueChange={onPerPageChange}>
            <SelectTrigger>
              <SelectValue placeholder="Per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>

          <div className="xl:col-span-2 flex justify-end">
            <Button onClick={onApply}>Tampilkan Data</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
