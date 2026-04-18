import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ppdbAdminApi } from '@/lib/ppdb/admin-api';
import type { CreatePpdbRequest } from '@/types/ppdb/admin';
import { toErrorMessage } from '@/hooks/shared/react-query-helpers';

export function useCreatePpdb() {
  const mutation = useMutation({
    mutationFn: ppdbAdminApi.create,
  });

  const create = useCallback(async (payload: CreatePpdbRequest) => mutation.mutateAsync(payload), [mutation]);

  return {
    loading: mutation.isPending,
    error: mutation.error ? toErrorMessage(mutation.error, 'Failed to create PPDB') : null,
    success: mutation.isSuccess,
    create,
  };
}
