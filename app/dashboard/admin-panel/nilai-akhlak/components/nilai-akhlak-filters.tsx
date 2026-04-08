"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { semesterOptions, tahunAjaranOptions } from "../utils/constants"

interface NilaiAkhlakFiltersProps {
  tahunAjaran: string
  onTahunAjaranChange: (value: string) => void
  semester: string
  onSemesterChange: (value: string) => void
  aspek: string
  onAspekChange: (value: string) => void
  perPage: string
  onPerPageChange: (value: string) => void
  onApply?: () => void
}

export function NilaiAkhlakFilters({
  tahunAjaran,
  onTahunAjaranChange,
  semester,
  onSemesterChange,
  aspek,
  onAspekChange,
  perPage,
  onPerPageChange,
  onApply,
}: NilaiAkhlakFiltersProps) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <Select value={tahunAjaran} onValueChange={onTahunAjaranChange}>
            <SelectTrigger className="w-full lg:w-40">
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
            <SelectTrigger className="w-full lg:w-36">
              <SelectValue placeholder="Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              {semesterOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={aspek} onValueChange={onAspekChange}>
            <SelectTrigger className="w-full lg:w-40">
              <SelectValue placeholder="Aspek" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Aspek</SelectItem>
              <SelectItem value="AKHLAK">AKHLAK</SelectItem>
            </SelectContent>
          </Select>

          <Select value={perPage} onValueChange={onPerPageChange}>
            <SelectTrigger className="w-full lg:w-28">
              <SelectValue placeholder="Per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={onApply} className="lg:ml-auto">Tampilkan</Button>
        </div>
      </CardContent>
    </Card>
  )
}
