import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ppdbAdminApi } from '@/lib/ppdb/admin-api';
import type { UpdateVerificationRequest } from '@/types/ppdb/admin';
import { toErrorMessage } from '@/hooks/shared/react-query-helpers';

export function useUpdatePpdbVerification() {
  const mutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateVerificationRequest }) =>
      ppdbAdminApi.updateVerification(id, payload),
  });

  const updateVerification = useCallback(
    async (id: string, payload: UpdateVerificationRequest) => mutation.mutateAsync({ id, payload }),
    [mutation],
  );

  return {
    loading: mutation.isPending,
    error: mutation.error ? toErrorMessage(mutation.error, 'Failed to update verification') : null,
    success: mutation.isSuccess,
    updateVerification,
  };
}
