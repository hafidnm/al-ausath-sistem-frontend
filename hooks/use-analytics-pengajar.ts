import { useCallback } from 'react';
import {
  AnalyticsQuery,
  ClassStatistics,
  SubjectRecap,
  ScoreDistributionResponse,
  analyticsPengajarService,
} from '@/lib/services/analytics-pengajar.service';
import { useAsyncQuery } from '@/hooks/shared/use-async-request';

export function useClassStatistics(initialQuery?: AnalyticsQuery) {
  const query = useCallback(
    async (params?: AnalyticsQuery) => {
      const response = await analyticsPengajarService.getClassStatistics(params || initialQuery);
      return response.data;
    },
    [initialQuery]
  );

  const { data, loading, error, run } = useAsyncQuery(
    query,
    [] as ClassStatistics[],
    {
      fallbackError: 'Gagal memuat statistik kelas',
      logLabel: 'Error fetching class statistics:',
    }
  );

  const fetchClassStatistics = useCallback(
    async (params?: AnalyticsQuery) => run(params),
    [run]
  );

  return { data, loading, error, fetchClassStatistics };
}

export function useSubjectRecap(initialQuery?: AnalyticsQuery) {
  const query = useCallback(
    async (params?: AnalyticsQuery) => {
      const response = await analyticsPengajarService.getSubjectRecap(params || initialQuery);
      return response.data;
    },
    [initialQuery]
  );

  const { data, loading, error, run } = useAsyncQuery(
    query,
    [] as SubjectRecap[],
    {
      fallbackError: 'Gagal memuat rekap mapel',
      logLabel: 'Error fetching subject recap:',
    }
  );

  const fetchSubjectRecap = useCallback(
    async (params?: AnalyticsQuery) => run(params),
    [run]
  );

  return { data, loading, error, fetchSubjectRecap };
}

export function useScoreDistribution(initialQuery?: AnalyticsQuery) {
  const query = useCallback(
    async (params?: AnalyticsQuery) => {
      const response = await analyticsPengajarService.getScoreDistribution(params || initialQuery);
      return response;
    },
    [initialQuery]
  );

  const { data, loading, error, run } = useAsyncQuery(
    query,
    { data: [], total_santri: 0 } as ScoreDistributionResponse,
    {
      fallbackError: 'Gagal memuat distribusi nilai',
      logLabel: 'Error fetching score distribution:',
    }
  );

  const fetchScoreDistribution = useCallback(
    async (params?: AnalyticsQuery) => run(params),
    [run]
  );

  return { data, loading, error, fetchScoreDistribution };
}
