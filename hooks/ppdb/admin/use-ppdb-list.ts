import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ppdbAdminApi } from '@/lib/ppdb/admin-api';
import type { PpdbDetail } from '@/types/ppdb/admin';
import { ppdbQueryKeys } from '@/hooks/ppdb/query-keys';
import { toErrorMessage } from '@/hooks/shared/react-query-helpers';

import type { PpdbListQuery } from '@/types/ppdb/admin';
import type { PaginationMeta } from '@/lib/ppdb/admin-api';

interface UsePpdbListParams extends PpdbListQuery {
  enabled?: boolean;
}

export function usePpdbList(params?: UsePpdbListParams) {
  const queryClient = useQueryClient();
  
  const queryParams = { ...params };
  delete queryParams.enabled;

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: [...ppdbQueryKeys.adminList, queryParams],
    queryFn: async () => {
      const response = await ppdbAdminApi.getList({ per_page: 15, ...queryParams });
      return response;
    },
    enabled: params?.enabled ?? true,
    initialData: { data: [] as PpdbDetail[], meta: undefined as PaginationMeta | undefined },
    staleTime: 5000,
  });

  const fetchList = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ppdbQueryKeys.adminList });
    const result = await refetch();
    if (result.error) {
      throw result.error;
    }
    return result.data?.data || [];
  }, [queryClient, refetch]);

  const updateStatusByIds = useCallback((ids: string[], status: string) => {
    const validIds = ids.filter((id) => id.trim().length > 0);
    if (validIds.length === 0) return;

    const idSet = new Set(validIds);

    queryClient.setQueryData([...ppdbQueryKeys.adminList, queryParams], (prevData: { data: PpdbDetail[], meta?: PaginationMeta } | undefined) => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        data: prevData.data.map((item) => {
          const itemIds = [item.pendaftaranId, item.id, item.userId, item.noPendaftaran].filter(
            (id): id is string => Boolean(id && id.trim().length > 0),
          );

          if (!itemIds.some((id) => idSet.has(id))) {
            return item;
          }

          return { ...item, status };
        })
      };
    });
  }, [queryClient, params]);

  return {
    data: data.data,
    meta: data.meta,
    loading: isFetching,
    error: error ? toErrorMessage(error, 'Failed to fetch PPDB list') : null,
    fetchList,
    updateStatusByIds,
  };
}
