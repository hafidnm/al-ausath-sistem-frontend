import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ppdbPortalApi } from '@/lib/ppdb/portal-api';
import { ppdbQueryKeys } from '@/hooks/ppdb/query-keys';
import { toErrorMessage } from '@/hooks/shared/react-query-helpers';

export function usePpdbPortalPreviewNomor() {
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ppdbQueryKeys.portalPreviewNomor,
    queryFn: ppdbPortalApi.previewNomor,
    enabled: false,
    initialData: '',
    staleTime: 5 * 60 * 1000,
  });

  const fetchPreviewNomor = useCallback(async () => {
    const result = await refetch();
    if (result.error) {
      throw result.error;
    }
    return result.data ?? '';
  }, [refetch]);

  return {
    data,
    loading: isFetching,
    error: error ? toErrorMessage(error, 'Gagal mengambil nomor preview') : null,
    fetchPreviewNomor,
  };
}
