import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ppdbPortalApi } from '@/lib/ppdb/portal-api';
import type { PpdbPortalLoginRequest } from '@/types/ppdb/portal';
import { toErrorMessage } from '@/hooks/shared/react-query-helpers';

export function usePpdbPortalLogin() {
  const mutation = useMutation({
    mutationFn: ppdbPortalApi.login,
  });

  const login = useCallback(async (payload: PpdbPortalLoginRequest) => mutation.mutateAsync(payload), [mutation]);

  return {
    loading: mutation.isPending,
    error: mutation.error ? toErrorMessage(mutation.error, 'Login PPDB gagal') : null,
    success: mutation.isSuccess,
    login,
  };
}
