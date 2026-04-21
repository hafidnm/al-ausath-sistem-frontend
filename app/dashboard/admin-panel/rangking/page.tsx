"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RangkingFilters } from "./components/rangking-filters"
import { RankingListCard } from "./components/ranking-list-card"
import { SummaryCards } from "./components/summary-cards"
import { useRangkingKelas } from "./hooks/use-rangking-kelas"

export default function RangkingPage() {
  const {
    classOptions,
    selectedClassCode,
    setSelectedClassCode,
    tahunAjaran,
    setTahunAjaran,
    semester,
    setSemester,
    isLoadingKelas,
    isGenerating,
    rankedData,
    averageScore,
    handleGenerate,
  } = useRangkingKelas()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/dashboard/admin-panel" className="inline-flex items-center gap-2 hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Panel Admin
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Rangking Santri</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Menampilkan data ranking santri per kelas dari data real backend.
          </p>
        </div>

        <RangkingFilters
          selectedClassCode={selectedClassCode}
          onSelectedClassCodeChange={setSelectedClassCode}
          tahunAjaran={tahunAjaran}
          onTahunAjaranChange={setTahunAjaran}
          semester={semester}
          onSemesterChange={setSemester}
          isLoadingKelas={isLoadingKelas}
          isGenerating={isGenerating}
          classOptions={classOptions}
          onGenerate={handleGenerate}
        />
      </div>

      <SummaryCards
        totalSantri={rankedData.length}
        rataRataNilai={averageScore}
        kelasTerbaik={selectedClassCode || "-"}
      />

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <RankingListCard
          kelasLabel={selectedClassCode || "Belum dipilih"}
          rankedData={rankedData}
        />

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Informasi Tampilan</CardTitle>
            <CardDescription>Ringkasan mode tampilan ranking saat ini</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="rounded-xl border border-dashed border-border/70 bg-background/60 p-4">
              Opsi dropdown kelas diambil langsung dari endpoint kelas.
            </div>
            <div className="rounded-xl border border-dashed border-border/70 bg-background/60 p-4">
              Tombol Generate Rangking memakai endpoint backend untuk menghasilkan data ranking real dari database.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}