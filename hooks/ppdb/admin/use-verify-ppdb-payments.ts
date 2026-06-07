import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ppdbAdminApi } from '@/lib/ppdb/admin-api';
import { toErrorMessage } from '@/hooks/shared/react-query-helpers';

export function useVerifyPpdbPayments() {
  const queryClient = useQueryClient();

  const verifyUangPangkalMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ppdbAdminApi.updateUangPangkalVerification(id, status),
    onSuccess: () => {
      // Invalidate PPDB query cache to refresh pendaftar lists and detail views
      void queryClient.invalidateQueries();
    },
  });

  const verifySppMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ppdbAdminApi.updateSppVerification(id, status),
    onSuccess: () => {
      // Invalidate PPDB query cache
      void queryClient.invalidateQueries();
    },
  });

  const verifyUangPangkal = useCallback(
    async (id: string, status: string) => verifyUangPangkalMutation.mutateAsync({ id, status }),
    [verifyUangPangkalMutation],
  );

  const verifySpp = useCallback(
    async (id: string, status: string) => verifySppMutation.mutateAsync({ id, status }),
    [verifySppMutation],
  );

  return {
    uangPangkalLoading: verifyUangPangkalMutation.isPending,
    sppLoading: verifySppMutation.isPending,
    error:
      verifyUangPangkalMutation.error || verifySppMutation.error
        ? toErrorMessage(verifyUangPangkalMutation.error || verifySppMutation.error, 'Failed to update payment status')
        : null,
    verifyUangPangkal,
    verifySpp,
  };
}
