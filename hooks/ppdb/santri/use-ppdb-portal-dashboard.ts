import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ppdbPortalApi } from '@/lib/ppdb/portal-api';
import { ppdbQueryKeys } from '@/hooks/ppdb/query-keys';
import { toErrorMessage } from '@/hooks/shared/react-query-helpers';
import type { PpdbPortalDashboard } from '@/types/ppdb/portal';

export function usePpdbPortalDashboard() {
  const queryClient = useQueryClient();
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ppdbQueryKeys.portalDashboard,
    queryFn: ppdbPortalApi.getDashboard,
    enabled: false,
    initialData: null as PpdbPortalDashboard | null,
    staleTime: 5 * 60 * 1000,
  });

  const setData = useCallback(
    (value: PpdbPortalDashboard | null | ((prev: PpdbPortalDashboard | null) => PpdbPortalDashboard | null)) => {
      queryClient.setQueryData(ppdbQueryKeys.portalDashboard, (prev: PpdbPortalDashboard | null | undefined) => {
        const current = prev ?? null;
        if (typeof value === 'function') {
          return value(current);
        }
        return value;
      });
    },
    [queryClient],
  );

  const fetchDashboard = useCallback(async () => {
    const result = await refetch();
    if (result.error) {
      throw result.error;
    }
    return result.data ?? null;
  }, [refetch]);

  return {
    data,
    setData,
    loading: isFetching,
    error: error ? toErrorMessage(error, 'Gagal memuat dashboard PPDB') : null,
    fetchDashboard,
  };
}
