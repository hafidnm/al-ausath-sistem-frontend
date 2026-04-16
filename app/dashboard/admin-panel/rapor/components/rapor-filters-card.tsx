"use client"

import { Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface RaporFiltersCardProps {
  query: string
  onQueryChange: (value: string) => void
  tahunAjaran: string
  onTahunAjaranChange: (value: string) => void
  kodeKelas: string
  onKodeKelasChange: (value: string) => void
  semester: string
  onSemesterChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
  perPage: string
  onPerPageChange: (value: string) => void
  isLoading: boolean
  onSearch: () => void
  onReset: () => void
}

export function RaporFiltersCard({
  query,
  onQueryChange,
  tahunAjaran,
  onTahunAjaranChange,
  kodeKelas,
  onKodeKelasChange,
  semester,
  onSemesterChange,
  status,
  onStatusChange,
  perPage,
  onPerPageChange,
  isLoading,
  onSearch,
  onReset,
}: RaporFiltersCardProps) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Filter Pencarian</CardTitle>
        <CardDescription>Gunakan nama atau nomor induk untuk mencari data rapor yang sudah ada</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Label htmlFor="search-rapor">Cari nama / nomor induk</Label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search-rapor"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Contoh: Ahmad Fauzi atau 2025001"
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="tahun-ajaran">Tahun ajaran</Label>
            <Input id="tahun-ajaran" className="mt-2" value={tahunAjaran} onChange={(event) => onTahunAjaranChange(event.target.value)} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <Label>Kelas</Label>
            <Input className="mt-2" value={kodeKelas} onChange={(event) => onKodeKelasChange(event.target.value)} placeholder="Kode kelas / all" />
          </div>
          <div>
            <Label>Semester</Label>
            <Select value={semester} onValueChange={onSemesterChange}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={onStatusChange}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="DRAFT">DRAFT</SelectItem>
                <SelectItem value="TERBIT">TERBIT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Per halaman</Label>
            <Select value={perPage} onValueChange={onPerPageChange}>
              <SelectTrigger className="mt8-2">
                <SelectValue placeholder="Per halaman" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={onSearch} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Cari
          </Button>
          <Button variant="outline" className="bg-transparent" onClick={onReset}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
