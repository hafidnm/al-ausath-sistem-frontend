"use client"

import { useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, TrendingUp, BarChart3 } from "lucide-react"
import { useSubjectScores, useScoresTrend, useAcademicProgress } from "@/hooks/use-analytics-santri"
import { SubjectScoresTable } from "./components/subject-scores-table"
import { ScoresTrendChart } from "./components/scores-trend-chart"
import { AcademicProgressCard } from "./components/academic-progress-card"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"

const SEMESTER = 1

export default function AnalitikSantriPage() {
  const { selectedKodeTahun } = useTahunAjaran()

  const {
    data: subjectScores,
    loading: loadingScores,
    error: errorScores,
    fetch: fetchScores,
  } = useSubjectScores()

  const {
    data: scoresTrend,
    loading: loadingTrend,
    error: errorTrend,
    fetch: fetchTrend,
  } = useScoresTrend()

  const {
    data: academicProgress,
    loading: loadingProgress,
    error: errorProgress,
    fetch: fetchProgress,
  } = useAcademicProgress()

  useEffect(() => {
    if (!selectedKodeTahun) return

    fetchScores({ tahun_ajaran: selectedKodeTahun, semester: SEMESTER })
    fetchTrend({ tahun_ajaran: selectedKodeTahun })
    fetchProgress({ tahun_ajaran: selectedKodeTahun, semester: SEMESTER })
  }, [selectedKodeTahun, fetchScores, fetchTrend, fetchProgress])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analitik Akademik</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Pantau perkembangan nilai dan progres belajar Anda secara menyeluruh{selectedKodeTahun ? ` untuk tahun ajaran ${selectedKodeTahun}` : ''}
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="nilai" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="nilai" className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            <span>Nilai Semester Ini</span>
          </TabsTrigger>
          <TabsTrigger value="tren" className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            <span>Tren Nilai</span>
          </TabsTrigger>
          <TabsTrigger value="progres" className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4" />
            <span>Progres vs KKM</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nilai">
          <SubjectScoresTable
            data={subjectScores}
            loading={loadingScores}
            error={errorScores}
          />
        </TabsContent>

        <TabsContent value="tren">
          <ScoresTrendChart
            data={scoresTrend}
            loading={loadingTrend}
            error={errorTrend}
          />
        </TabsContent>

        <TabsContent value="progres">
          <AcademicProgressCard
            data={academicProgress.data}
            summary={academicProgress.summary}
            loading={loadingProgress}
            error={errorProgress}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
