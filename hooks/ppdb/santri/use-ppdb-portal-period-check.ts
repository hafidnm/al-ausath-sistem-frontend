import { useQuery } from '@tanstack/react-query';
import { ppdbPortalApi } from '@/lib/ppdb/portal-api';

export function usePpdbPortalPeriodCheck() {
  const query = useQuery({
    queryKey: ['ppdb-portal-period-check'],
    queryFn: () => ppdbPortalApi.checkOpen(),
  });

  return {
    isOpen: query.data?.is_open ?? false,
    isKuotaPenuh: query.data?.is_kuota_penuh ?? false,
    period: query.data?.period ?? null,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
