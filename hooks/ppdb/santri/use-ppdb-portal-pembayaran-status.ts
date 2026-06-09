import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ppdbPortalApi } from '@/lib/ppdb/portal-api';
import { ppdbQueryKeys } from '@/hooks/ppdb/query-keys';
import { toErrorMessage } from '@/hooks/shared/react-query-helpers';
import type { PpdbPortalDashboard } from '@/types/ppdb/portal';

export function usePpdbPortalPembayaranStatus() {
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ppdbQueryKeys.portalPembayaranStatus,
    queryFn: ppdbPortalApi.getPembayaranStatus,
    enabled: false,
    initialData: null as PpdbPortalDashboard | null,
    staleTime: 5 * 60 * 1000,
  });

  const fetchPembayaranStatus = useCallback(async () => {
    const result = await refetch();
    if (result.error) {
      throw result.error;
    }
    return result.data ?? null;
  }, [refetch]);

  return {
    data,
    loading: isFetching,
    error: error ? toErrorMessage(error, 'Gagal memuat status pembayaran PPDB') : null,
    fetchPembayaranStatus,
  };
}