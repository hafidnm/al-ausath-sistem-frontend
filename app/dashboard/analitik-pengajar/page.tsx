"use client"

import { useEffect, useState } from "react"
import { useClassStatistics, useSubjectRecap, useScoreDistribution } from "@/hooks/use-analytics-pengajar"
import { AnalyticsQuery } from "@/lib/services/analytics-pengajar.service"
import { getCachedUser } from "@/lib/auth-cache"
import { AnalitikPengajarHeader } from "./components/analitik-pengajar-header"
import { AnalitikPengajarFilters } from "./components/analitik-pengajar-filters"
import { ClassStatisticsSection } from "./components/class-statistics-section"
import { SubjectRecapSection } from "./components/subject-recap-section"
import { ScoreDistributionSection } from "./components/score-distribution-section"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"

export default function AnalitikPengajarPage() {
  const [mounted, setMounted] = useState(false)
  const [userRole, setUserRole] = useState<unknown>("")
  const [kodeKelas, setKodeKelas] = useState<string>("")
  const [semester, setSemester] = useState<number>(1)

  const { selectedKodeTahun } = useTahunAjaran()

  const {
    data: classStats,
    loading: classStatsLoading,
    fetchClassStatistics,
  } = useClassStatistics()

  const {
    data: subjectRecap,
    loading: subjectRecapLoading,
    fetchSubjectRecap,
  } = useSubjectRecap()

  const {
    data: scoreDistribution,
    loading: scoreDistributionLoading,
    fetchScoreDistribution,
  } = useScoreDistribution()

  // Check user role on mount
  useEffect(() => {
    setMounted(true)
    const checkUserRole = async () => {
      try {
        const authData = await getCachedUser()
        if (!authData?.user) {
          window.location.replace("/login")
          return
        }
        setUserRole(authData.user.peran_akun || "")
      } catch (error) {
        console.error("Error getting user:", error)
        window.location.replace("/login")
      }
    }
    checkUserRole()
  }, [])

  // Auto-fetch whenever header filters change
  useEffect(() => {
    if (!mounted || !selectedKodeTahun) return

    const query: AnalyticsQuery = {
      tahun_ajaran: selectedKodeTahun,
      semester,
      ...(kodeKelas ? { kode_kelas: kodeKelas } : {}),
    }

    fetchClassStatistics(query)
    fetchSubjectRecap(query)
    fetchScoreDistribution(query)
  }, [mounted, selectedKodeTahun, semester, kodeKelas])

  const handleKodeKelasChange = (kelas: string) => {
    setKodeKelas(kelas)
  }

  const handleReset = () => {
    setKodeKelas("")
  }

  // Only render for pengajar/guru role
  const validTeacherRoles = ["guru_mapel", "guru mapel", "mapel", "staf pengajar"]

  const normalizeRoles = (role: unknown): string[] => {
    if (!role) return []
    if (Array.isArray(role)) {
      return role.flat(Infinity).map(String).map((value) => value.toLowerCase())
    }
    if (typeof role === "string") {
      const trimmed = role.trim()
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          const parsed = JSON.parse(trimmed)
          if (Array.isArray(parsed)) {
            return parsed.flat(Infinity).map(String).map((value) => value.toLowerCase())
          }
        } catch {
          // ignore parse errors
        }
      }
      return [trimmed.toLowerCase()]
    }
    return [String(role).toLowerCase()]
  }

  const isTeacher = normalizeRoles(userRole).some((role) => validTeacherRoles.includes(role))

  if (!mounted) {
    return <div className="space-y-6" />
  }

  if (!isTeacher) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          Halaman ini hanya dapat diakses oleh guru/pengajar.
        </AlertDescription>
      </Alert>
    )
  }

  const isLoading = classStatsLoading || subjectRecapLoading || scoreDistributionLoading

  return (
    <div className="space-y-6">
      <AnalitikPengajarHeader />

      <AnalitikPengajarFilters
        kodeKelas={kodeKelas}
        onKodeKelasChange={handleKodeKelasChange}
        semester={semester}
        onSemesterChange={setSemester}
        onReset={handleReset}
        loading={isLoading}
      />

      {/* Data Sections */}
      <div className="space-y-6">
        <ClassStatisticsSection data={classStats} loading={classStatsLoading} />
        <SubjectRecapSection data={subjectRecap} loading={subjectRecapLoading} />
        <ScoreDistributionSection data={scoreDistribution} loading={scoreDistributionLoading} />
      </div>
    </div>
  )
}
