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

interface KonversiFiltersProps {
  query: string
  onQueryChange: (value: string) => void
  kodeUnit: string
  onKodeUnitChange: (value: string) => void
  perPage: string
  onPerPageChange: (value: string) => void
}

export function KonversiFilters({
  query,
  onQueryChange,
  kodeUnit,
  onKodeUnitChange,
  perPage,
  onPerPageChange,
}: KonversiFiltersProps) {
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
              placeholder="Cari huruf, predikat, atau keterangan..."
            />
          </div>

          <Select value={kodeUnit} onValueChange={onKodeUnitChange}>
            <SelectTrigger className="w-full lg:w-44">
              <SelectValue placeholder="Filter unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Unit</SelectItem>
              <SelectItem value="global">Global</SelectItem>
              <SelectItem value="MTQ">MTQ</SelectItem>
              <SelectItem value="MTS">MTS</SelectItem>
              <SelectItem value="ALY">Aliyah</SelectItem>
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
        </div>
      </CardContent>
    </Card>
  )
}
