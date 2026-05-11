"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type SelectOption = {
  value: string
  label: string
}

type StatistikKeseluruhanFiltersProps = {
  kodeKelas: string
  kodeMapel: string
  tahunAjaran: string
  semester: string
  kelasOptions: SelectOption[]
  mapelOptions: SelectOption[]
  tahunAjaranOptions: SelectOption[]
  isLoading: boolean
  isLoadingOptions: boolean
  onKodeKelasChange: (value: string) => void
  onKodeMapelChange: (value: string) => void
  onTahunAjaranChange: (value: string) => void
  onSemesterChange: (value: string) => void
  onApply: () => void
  onReset: () => void
}

export function StatistikKeseluruhanFilters({
  kodeKelas,
  kodeMapel,
  tahunAjaran,
  semester,
  kelasOptions,
  mapelOptions,
  tahunAjaranOptions,
  isLoading,
  isLoadingOptions,
  onKodeKelasChange,
  onKodeMapelChange,
  onTahunAjaranChange,
  onSemesterChange,
  onApply,
  onReset,
}: StatistikKeseluruhanFiltersProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Select value={kodeKelas || "all"} onValueChange={(value) => onKodeKelasChange(value === "all" ? "" : value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih kelas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelas</SelectItem>
            {kelasOptions.map((item) => (
              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={kodeMapel || "all"} onValueChange={(value) => onKodeMapelChange(value === "all" ? "" : value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih mapel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Mapel</SelectItem>
            {mapelOptions.map((item) => (
              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tahunAjaran || "all"} onValueChange={(value) => onTahunAjaranChange(value === "all" ? "" : value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih tahun ajaran" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tahun</SelectItem>
            {tahunAjaranOptions.map((item) => (
              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={semester} onValueChange={onSemesterChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih semester" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Semester</SelectItem>
            <SelectItem value="1">Semester 1</SelectItem>
            <SelectItem value="2">Semester 2</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={onApply} disabled={isLoading || isLoadingOptions}>
          {isLoading ? "Memuat..." : "Terapkan Filter"}
        </Button>
        <Button size="sm" variant="outline" className="bg-transparent" onClick={onReset} disabled={isLoading || isLoadingOptions}>
          Reset
        </Button>
      </div>
    </div>
  )
}
