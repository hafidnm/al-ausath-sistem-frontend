import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ppdbPortalApi } from '@/lib/ppdb/portal-api';
import type { PpdbPortalTesJawabRequest } from '@/types/ppdb/portal';
import { toErrorMessage } from '@/hooks/shared/react-query-helpers';

export function usePpdbPortalSubmitTesJawab() {
  const mutation = useMutation({
    mutationFn: ppdbPortalApi.submitTesJawab,
  });

  const submitTesJawab = useCallback(async (payload: PpdbPortalTesJawabRequest) => mutation.mutateAsync(payload), [mutation]);

  return {
    loading: mutation.isPending,
    error: mutation.error ? toErrorMessage(mutation.error, 'Gagal menyimpan jawaban tes PPDB') : null,
    success: mutation.isSuccess,
    submitTesJawab,
  };
}
