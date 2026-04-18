import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ppdbAdminApi } from '@/lib/ppdb/admin-api';
import { toErrorMessage } from '@/hooks/shared/react-query-helpers';

export function useUploadPpdbFile() {
  const mutation = useMutation({
    mutationFn: ({ id, file, fileType }: { id: string; file: File; fileType: string }) =>
      ppdbAdminApi.uploadFile(id, file, fileType),
  });

  const upload = useCallback(
    async (id: string, file: File, fileType: string) => mutation.mutateAsync({ id, file, fileType }),
    [mutation],
  );

  return {
    loading: mutation.isPending,
    error: mutation.error ? toErrorMessage(mutation.error, 'Failed to upload file') : null,
    success: mutation.isSuccess,
    upload,
  };
}
