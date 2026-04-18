import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ppdbAdminApi } from '@/lib/ppdb/admin-api';
import { toErrorMessage } from '@/hooks/shared/react-query-helpers';

export function useDeletePpdb() {
  const mutation = useMutation({
    mutationFn: ppdbAdminApi.delete,
  });

  const deleteItem = useCallback(async (id: string) => mutation.mutateAsync(id), [mutation]);

  return {
    loading: mutation.isPending,
    error: mutation.error ? toErrorMessage(mutation.error, 'Failed to delete PPDB') : null,
    success: mutation.isSuccess,
    deleteItem,
  };
}
