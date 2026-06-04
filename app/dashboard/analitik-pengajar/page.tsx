"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
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

export default function AnalitikPengajarPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [query, setQuery] = useState<AnalyticsQuery>({})
  const [userRole, setUserRole] = useState<string>("")

  const {
    data: classStats,
    loading: classStatsLoading,
    fetchClassStatistics,
  } = useClassStatistics(query)

  const {
    data: subjectRecap,
    loading: subjectRecapLoading,
    fetchSubjectRecap,
  } = useSubjectRecap(query)

  const {
    data: scoreDistribution,
    loading: scoreDistributionLoading,
    fetchScoreDistribution,
  } = useScoreDistribution(query)

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

  // Fetch data on component mount
  useEffect(() => {
    if (mounted) {
      fetchClassStatistics(query)
      fetchSubjectRecap(query)
      fetchScoreDistribution(query)
    }
  }, [mounted, query])

  const handleFilterChange = (newQuery: AnalyticsQuery) => {
    setQuery(newQuery)
  }

  // Only render for pengajar/guru role
  const validTeacherRoles = ["guru_mapel", "guru mapel", "mapel", "staf pengajar"]
  const isTeacher = validTeacherRoles.includes((userRole || "").toLowerCase())

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

      <AnalitikPengajarFilters onFilterChange={handleFilterChange} loading={isLoading} />

      {/* Data Sections */}
      <div className="space-y-6">
        <ClassStatisticsSection data={classStats} loading={classStatsLoading} />
        <SubjectRecapSection data={subjectRecap} loading={subjectRecapLoading} />
        <ScoreDistributionSection data={scoreDistribution} loading={scoreDistributionLoading} />
      </div>
    </div>
  )
}
