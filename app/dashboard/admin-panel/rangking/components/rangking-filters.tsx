import { Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { KelasOption } from "../types"

type RangkingFiltersProps = {
  selectedClassCode: string
  onSelectedClassCodeChange: (value: string) => void
  tahunAjaran: string
  onTahunAjaranChange: (value: string) => void
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
    tahunAjaran,
    onTahunAjaranChange,
    semester,
    onSemesterChange,
    isLoadingKelas,
    isGenerating,
    classOptions,
    onGenerate,
  } = props

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

      <Input
        value={tahunAjaran}
        onChange={(e) => onTahunAjaranChange(e.target.value)}
        placeholder="Tahun ajaran"
        className="w-full md:w-40"
      />

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
