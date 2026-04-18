import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ppdbAdminApi } from '@/lib/ppdb/admin-api';
import type { AddNotificationRequest } from '@/types/ppdb/admin';
import { toErrorMessage } from '@/hooks/shared/react-query-helpers';

export function useAddPpdbNotification() {
  const mutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AddNotificationRequest }) =>
      ppdbAdminApi.addNotification(id, payload),
  });

  const addNotification = useCallback(
    async (id: string, payload: AddNotificationRequest) =>
      mutation.mutateAsync({ id, payload }),
    [mutation],
  );

  return {
    loading: mutation.isPending,
    error: mutation.error ? toErrorMessage(mutation.error, 'Failed to add notification') : null,
    success: mutation.isSuccess,
    addNotification,
  };
}
