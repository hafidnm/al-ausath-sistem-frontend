import { useCallback } from 'react'
import { useAsyncQuery } from '@/hooks/shared/use-async-request'
import {
  analyticsSantriService,
  SantriAnalyticsQuery,
  SubjectScore,
  ScoreTrendItem,
  AcademicProgressItem,
  AcademicProgressSummary,
} from '@/lib/services/analytics-santri.service'

// ─── Hook: Subject Scores ─────────────────────────────────────────────────────

export function useSubjectScores(initialQuery?: SantriAnalyticsQuery) {
  const queryFn = useCallback(
    async (params?: SantriAnalyticsQuery) => {
      const res = await analyticsSantriService.getSubjectScores(params ?? initialQuery)
      return res.data
    },
    [initialQuery]
  )

  const { data, loading, error, run } = useAsyncQuery(
    queryFn,
    [] as SubjectScore[],
    {
      fallbackError: 'Gagal memuat nilai per mata pelajaran',
      logLabel: '[useSubjectScores]',
    }
  )

  const fetch = useCallback((params?: SantriAnalyticsQuery) => run(params), [run])

  return { data, loading, error, fetch }
}

// ─── Hook: Scores Trend ───────────────────────────────────────────────────────

export function useScoresTrend(initialQuery?: SantriAnalyticsQuery) {
  const queryFn = useCallback(
    async (params?: SantriAnalyticsQuery) => {
      const res = await analyticsSantriService.getScoresTrend(params ?? initialQuery)
      return res.data
    },
    [initialQuery]
  )

  const { data, loading, error, run } = useAsyncQuery(
    queryFn,
    [] as ScoreTrendItem[],
    {
      fallbackError: 'Gagal memuat tren nilai',
      logLabel: '[useScoresTrend]',
    }
  )

  const fetch = useCallback((params?: SantriAnalyticsQuery) => run(params), [run])

  return { data, loading, error, fetch }
}

// ─── Hook: Academic Progress ──────────────────────────────────────────────────

export function useAcademicProgress(initialQuery?: SantriAnalyticsQuery) {
  const queryFn = useCallback(
    async (params?: SantriAnalyticsQuery) => {
      const res = await analyticsSantriService.getAcademicProgress(params ?? initialQuery)
      return res
    },
    [initialQuery]
  )

  const { data, loading, error, run } = useAsyncQuery(
    queryFn,
    {
      data: [] as AcademicProgressItem[],
      summary: {
        total_mapel: 0,
        tuntas: 0,
        belum_tuntas: 0,
        persentase_tuntas: 0,
      } as AcademicProgressSummary,
      filters: {},
    },
    {
      fallbackError: 'Gagal memuat progres akademik',
      logLabel: '[useAcademicProgress]',
    }
  )

  const fetch = useCallback((params?: SantriAnalyticsQuery) => run(params), [run])

  return { data, loading, error, fetch }
}
