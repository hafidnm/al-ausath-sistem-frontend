import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ppdbAdminApi } from '@/lib/ppdb/admin-api';
import type { UpdateTestResultRequest } from '@/types/ppdb/admin';
import { toErrorMessage } from '@/hooks/shared/react-query-helpers';

export function useUpdatePpdbTestResult() {
  const mutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTestResultRequest }) =>
      ppdbAdminApi.updateTestResult(id, payload),
  });

  const updateTestResult = useCallback(
    async (id: string, payload: UpdateTestResultRequest) => mutation.mutateAsync({ id, payload }),
    [mutation],
  );

  return {
    loading: mutation.isPending,
    error: mutation.error ? toErrorMessage(mutation.error, 'Failed to update test result') : null,
    success: mutation.isSuccess,
    updateTestResult,
  };
}
