import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ppdbAdminApi } from '@/lib/ppdb/admin-api';
import type { PpdbDetail } from '@/types/ppdb/admin';
import { ppdbQueryKeys } from '@/hooks/ppdb/query-keys';
import { toErrorMessage } from '@/hooks/shared/react-query-helpers';

export function usePpdbList() {
  const queryClient = useQueryClient();
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ppdbQueryKeys.adminList,
    queryFn: async () => {
      const response = await ppdbAdminApi.getList({ per_page: 1000 });
      return response.data;
    },
    enabled: false,
    initialData: [] as PpdbDetail[],
    staleTime: 0,
  });

  const fetchList = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ppdbQueryKeys.adminList });
    const result = await refetch();
    if (result.error) {
      throw result.error;
    }
    return result.data || [];
  }, [queryClient, refetch]);

  const updateStatusByIds = useCallback((ids: string[], status: string) => {
    const validIds = ids.filter((id) => id.trim().length > 0);
    if (validIds.length === 0) return;

    const idSet = new Set(validIds);

    queryClient.setQueryData(ppdbQueryKeys.adminList, (prevData: PpdbDetail[] | undefined) => {
      const prev = prevData || [];
      return prev.map((item) => {
        const itemIds = [item.pendaftaranId, item.id, item.userId, item.noPendaftaran].filter(
          (id): id is string => Boolean(id && id.trim().length > 0),
        );

        if (!itemIds.some((id) => idSet.has(id))) {
          return item;
        }

        return {
          ...item,
          status,
        };
      });
    });
  }, [queryClient]);

  return {
    data,
    loading: isFetching,
    error: error ? toErrorMessage(error, 'Failed to fetch PPDB list') : null,
    fetchList,
    updateStatusByIds,
  };
}
