"use client"

import { Trophy, BookMarked } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { KelasOption } from "../types"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"
import { useUnit } from "@/contexts/unit-context"

type RangkingFiltersProps = {
  selectedClassCode: string
  onSelectedClassCodeChange: (value: string) => void
  semester: string
  onSemesterChange: (value: string) => void
  isLoadingKelas: boolean
  isGenerating: boolean
  classOptions: KelasOption[]
  onGenerate: () => void
}

export function RangkingFilters(props: RangkingFiltersProps) {
  const {
    selectedClassCode,
    onSelectedClassCodeChange,
    semester,
    onSemesterChange,
    isLoadingKelas,
    isGenerating,
    classOptions,
    onGenerate,
  } = props
  const { selectedTahunAjaran } = useTahunAjaran()
  const { selectedUnit } = useUnit()

  return (
    <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
      <Select value={selectedClassCode} onValueChange={onSelectedClassCodeChange}>
        <SelectTrigger className="w-full md:w-72">
          <SelectValue placeholder={isLoadingKelas ? "Memuat kelas..." : "Pilih kelas"} />
        </SelectTrigger>
        <SelectContent>
          {classOptions.map((kelas) => (
            <SelectItem key={kelas.kodeKelas} value={kelas.kodeKelas}>
              {kelas.namaKelas ? `${kelas.namaKelas} (${kelas.kodeKelas})` : kelas.kodeKelas}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex h-10 w-full md:w-40 items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm">
        <BookMarked className="w-4 h-4 text-primary shrink-0" />
        <span className="flex-1 truncate text-foreground">{selectedTahunAjaran?.nama_tahun || "Belum dipilih"}</span>
        {/* <Badge variant="secondary" className="text-xs shrink-0">Header</Badge> */}
      </div>

      <div className="flex h-10 w-full md:w-32 items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm">
        <span className="flex-1 truncate text-foreground">{selectedUnit?.nama_unit || "Semua Unit"}</span>
        {/* <Badge variant="secondary" className="text-xs shrink-0">Header</Badge> */}
      </div>

      <Select value={semester} onValueChange={onSemesterChange}>
        <SelectTrigger className="w-full md:w-32">
          <SelectValue placeholder="Semester" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Semester 1</SelectItem>
          <SelectItem value="2">Semester 2</SelectItem>
        </SelectContent>
      </Select>

      <Button className="gap-2 self-start" onClick={onGenerate} disabled={isGenerating || !selectedClassCode}>
        <Trophy className="h-4 w-4" />
        {isGenerating ? "Memproses..." : "Generate Ranking"}
      </Button>
    </div>
  )
}
