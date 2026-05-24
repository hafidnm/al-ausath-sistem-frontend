"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen } from "lucide-react"
import { JadwalPembelajaranFilters, type JadwalPembelajaranFilterState } from "./components/jadwal-pembelajaran-filters"
import { JadwalPembelajaranTable } from "./components/jadwal-pembelajaran-table"
import { useJadwalPembelajaranSantri } from "@/hooks/use-jadwal-pembelajaran-santri"

const defaultFilters: JadwalPembelajaranFilterState = {
  hari: "",
  status: "",
  q: "",
}

export default function JadwalPembelajaranSantriPage() {
  const [filters, setFilters] = useState<JadwalPembelajaranFilterState>(defaultFilters)

  const queryParams = useMemo(() => ({
    hari: filters.hari || undefined,
    status: filters.status ? (filters.status as "AKTIF" | "NONAKTIF") : undefined,
    q: filters.q || undefined,
    perPage: 50,
  }), [filters])

  const { data, meta, loading, error, refetch } = useJadwalPembelajaranSantri(queryParams)

  useEffect(() => {
    refetch()
  }, [queryParams, refetch])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Data Jadwal Pembelajaran</h1>
        <p className="text-sm text-muted-foreground">
          Jadwal pembelajaran pribadi sesuai nomor induk Anda.
        </p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Filter Jadwal
          </CardTitle>
          <CardDescription>Gunakan filter untuk melihat jadwal pada hari tertentu.</CardDescription>
        </CardHeader>
        <CardContent>
          <JadwalPembelajaranFilters filters={filters} onChange={setFilters} />
        </CardContent>
      </Card>

      <div>
        <JadwalPembelajaranTable data={data} loading={loading} error={error} />
        <p className="text-xs text-muted-foreground mt-2">
          Total jadwal: {meta.total ?? data.length}
        </p>
      </div>
    </div>
  )
}
