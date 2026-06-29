"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { BookMarked, X } from "lucide-react"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"
import { getCachedUser } from "@/lib/auth-cache"
import { dataKelasMapelService } from "@/lib/services/kelas-mapel.service"

interface KelasOption {
  kode_kelas: string
  nama_kelas: string
}

interface FiltersProps {
  kodeKelas: string
  onKodeKelasChange: (kelas: string) => void
  semester: number
  onSemesterChange: (semester: number) => void
  onReset: () => void
  loading?: boolean
}

export function AnalitikPengajarFilters({ kodeKelas, onKodeKelasChange, semester, onSemesterChange, onReset, loading }: FiltersProps) {
  const { selectedTahunAjaran, selectedKodeTahun } = useTahunAjaran()
  const [kelasList, setKelasList] = useState<KelasOption[]>([])
  const [loadingKelas, setLoadingKelas] = useState(false)

  // Fetch daftar kelas yang DIAJAR guru ini saja (filter by id_petugas)
  useEffect(() => {
    if (!selectedKodeTahun) return

    const fetchMyKelas = async () => {
      setLoadingKelas(true)
      try {
        const authData = await getCachedUser()
        const idPetugas: number | undefined =
          authData?.user?.id_petugas ?? authData?.user?.petugas?.id_petugas ?? undefined

        if (!idPetugas) {
          setKelasList([])
          return
        }

        // Gunakan endpoint /data-master/kelas-mapel dengan filter id_petugas agar
        // hanya kelas yang diajar guru ini yang muncul — bukan semua kelas
        const { data } = await dataKelasMapelService.getAll({
          id_petugas: idPetugas,
          include_wali: true,
          tahun_ajaran: selectedKodeTahun,
          semester,
          per_page: 200,
        })

        // Deduplicate by kode_kelas
        const seen = new Set<string>()
        const unique: KelasOption[] = []
        for (const item of data) {
          const kode = item.kode_kelas ?? item.kelas?.kode_kelas
          const nama = item.nama_kelas ?? item.kelas?.nama_kelas ?? kode
          if (kode && !seen.has(kode)) {
            seen.add(kode)
            unique.push({ kode_kelas: kode, nama_kelas: nama ?? kode })
          }
        }
        setKelasList(unique)
      } catch {
        setKelasList([])
      } finally {
        setLoadingKelas(false)
      }
    }

    fetchMyKelas()
  }, [selectedKodeTahun, semester])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filter Data</CardTitle>
        <CardDescription>Data dibatasi hanya untuk kelas yang Anda ajar</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Tahun Ajaran — read-only dari header */}
          <div className="space-y-2">
            <Label>Tahun Ajaran</Label>
            <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm">
              <BookMarked className="w-4 h-4 text-primary shrink-0" />
              <span className="flex-1 truncate text-foreground">{selectedTahunAjaran?.nama_tahun || "Belum dipilih"}</span>
              <Badge variant="secondary" className="text-xs shrink-0">Dari Header</Badge>
            </div>
          </div>

          {/* Semester — dropdown mandiri */}
          <div className="space-y-2">
            <Label>Semester</Label>
            <Select
              value={String(semester)}
              onValueChange={(v) => onSemesterChange(parseInt(v))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Semester 1</SelectItem>
                <SelectItem value="2">Semester 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Kelas — hanya kelas yang diajar guru ini */}
          <div className="space-y-2">
            <Label>Kelas yang Anda Ajar</Label>
            <div className="flex gap-2">
              <Select
                value={kodeKelas || "__all__"}
                onValueChange={(v) => onKodeKelasChange(v === "__all__" ? "" : v)}
                disabled={loadingKelas || loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingKelas ? "Memuat kelas..." : "Semua kelas Anda"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Semua kelas yang Anda ajar</SelectItem>
                  {kelasList.length === 0 && !loadingKelas && (
                    <SelectItem value="__empty__" disabled>
                      Tidak ada kelas ditemukan
                    </SelectItem>
                  )}
                  {kelasList.map((k) => (
                    <SelectItem key={k.kode_kelas} value={k.kode_kelas}>
                      {k.nama_kelas} ({k.kode_kelas})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {kodeKelas && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onReset}
                  disabled={loading}
                  title="Reset filter kelas"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
