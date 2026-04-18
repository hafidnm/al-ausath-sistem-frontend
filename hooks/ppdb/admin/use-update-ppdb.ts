import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ppdbAdminApi } from '@/lib/ppdb/admin-api';
import type { UpdatePpdbRequest } from '@/types/ppdb/admin';
import { toErrorMessage } from '@/hooks/shared/react-query-helpers';

export function useUpdatePpdb() {
  const mutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePpdbRequest }) =>
      ppdbAdminApi.update(id, payload),
  });

  const update = useCallback(
    async (id: string, payload: UpdatePpdbRequest) => mutation.mutateAsync({ id, payload }),
    [mutation],
  );

  return {
    loading: mutation.isPending,
    error: mutation.error ? toErrorMessage(mutation.error, 'Failed to update PPDB') : null,
    success: mutation.isSuccess,
    update,
  };
}
