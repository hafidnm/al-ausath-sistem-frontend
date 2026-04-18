import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ppdbPortalApi } from '@/lib/ppdb/portal-api';
import type { PpdbPortalRegisterRequest } from '@/types/ppdb/portal';
import { toErrorMessage } from '@/hooks/shared/react-query-helpers';

export function usePpdbPortalRegister() {
  const mutation = useMutation({
    mutationFn: ppdbPortalApi.register,
  });

  const register = useCallback(async (payload: PpdbPortalRegisterRequest) => mutation.mutateAsync(payload), [mutation]);

  return {
    loading: mutation.isPending,
    error: mutation.error ? toErrorMessage(mutation.error, 'Registrasi PPDB gagal') : null,
    success: mutation.isSuccess,
    register,
  };
}
