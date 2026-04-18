import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ppdbPortalApi } from '@/lib/ppdb/portal-api';
import { ppdbQueryKeys } from '@/hooks/ppdb/query-keys';
import { toErrorMessage } from '@/hooks/shared/react-query-helpers';
import type { PpdbPortalTesStatus } from '@/types/ppdb/portal';

export function usePpdbPortalTesStatus() {
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ppdbQueryKeys.portalTesStatus,
    queryFn: ppdbPortalApi.getTesStatus,
    enabled: false,
    initialData: null as PpdbPortalTesStatus | null,
    staleTime: 5 * 60 * 1000,
  });

  const fetchTesStatus = useCallback(async () => {
    const result = await refetch();
    if (result.error) {
      throw result.error;
    }
    return result.data ?? null;
  }, [refetch]);

  return {
    data,
    loading: isFetching,
    error: error ? toErrorMessage(error, 'Gagal memuat status tes PPDB') : null,
    fetchTesStatus,
  };
}
