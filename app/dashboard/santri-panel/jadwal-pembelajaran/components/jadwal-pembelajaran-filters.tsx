"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const tahunAjaranOptions = [
  { value: "2025/2026", label: "2025/2026" },
  { value: "2024/2025", label: "2024/2025" },
  { value: "2023/2024", label: "2023/2024" },
]

const hariOptions = [
  { value: "SENIN", label: "Senin" },
  { value: "SELASA", label: "Selasa" },
  { value: "RABU", label: "Rabu" },
  { value: "KAMIS", label: "Kamis" },
  { value: "JUMAT", label: "Jumat" },
  { value: "SABTU", label: "Sabtu" },
]

const statusOptions = [
  { value: "AKTIF", label: "Aktif" },
  { value: "NONAKTIF", label: "Nonaktif" },
]

export interface JadwalPembelajaranFilterState {
  tahunAjaran: string
  hari: string
  status: string
  q: string
}

interface JadwalPembelajaranFiltersProps {
  filters: JadwalPembelajaranFilterState
  onChange: (filters: JadwalPembelajaranFilterState) => void
}

export function JadwalPembelajaranFilters({ filters, onChange }: JadwalPembelajaranFiltersProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <div className="space-y-2">
        <Label>Tahun Ajaran</Label>
        <Select
          value={filters.tahunAjaran || "all"}
          onValueChange={(value) => onChange({ ...filters, tahunAjaran: value === "all" ? "" : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Semua" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            {tahunAjaranOptions.map((item) => (
              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Hari</Label>
        <Select
          value={filters.hari || "all"}
          onValueChange={(value) => onChange({ ...filters, hari: value === "all" ? "" : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Semua" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            {hariOptions.map((item) => (
              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={filters.status || "all"}
          onValueChange={(value) => onChange({ ...filters, status: value === "all" ? "" : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Semua" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            {statusOptions.map((item) => (
              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Pencarian</Label>
        <Input
          placeholder="Cari hari, jam, ruangan..."
          value={filters.q}
          onChange={(event) => onChange({ ...filters, q: event.target.value })}
        />
      </div>
    </div>
  )
}
