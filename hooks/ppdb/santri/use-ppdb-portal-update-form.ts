import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ppdbPortalApi } from '@/lib/ppdb/portal-api';
import type { PpdbPortalFormRequest } from '@/types/ppdb/portal';
import { toErrorMessage } from '@/hooks/shared/react-query-helpers';

export function usePpdbPortalUpdateForm() {
  const mutation = useMutation({
    mutationFn: ppdbPortalApi.updateForm,
  });

  const updateForm = useCallback(async (payload: PpdbPortalFormRequest) => mutation.mutateAsync(payload), [mutation]);

  return {
    loading: mutation.isPending,
    error: mutation.error ? toErrorMessage(mutation.error, 'Gagal memperbarui form PPDB') : null,
    success: mutation.isSuccess,
    updateForm,
  };
}
