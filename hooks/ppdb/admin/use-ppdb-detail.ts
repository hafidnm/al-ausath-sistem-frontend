import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ppdbAdminApi } from '@/lib/ppdb/admin-api';
import type { PpdbDetail } from '@/types/ppdb/admin';
import { ppdbQueryKeys } from '@/hooks/ppdb/query-keys';
import { toErrorMessage } from '@/hooks/shared/react-query-helpers';

export function usePpdbDetail(id?: string) {
  const queryClient = useQueryClient();
  const [data, setData] = useState<PpdbDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(
    async (fetchId?: string) => {
      const idToFetch = fetchId || id;
      if (!idToFetch) {
        setError('ID is required');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const detail = await queryClient.fetchQuery({
          queryKey: ppdbQueryKeys.adminDetail(idToFetch),
          queryFn: () => ppdbAdminApi.getDetail(idToFetch),
          staleTime: 5 * 60 * 1000,
        });
        setData(detail);
        return detail;
      } catch (err) {
        setError(toErrorMessage(err, 'Failed to fetch PPDB detail'));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [id, queryClient],
  );

  return { data, loading, error, fetchDetail };
}
