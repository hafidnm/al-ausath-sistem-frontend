import { useState, useCallback } from 'react';
import {
  ppdbService,
  CreatePpdbRequest,
  UpdatePpdbRequest,
  PpdbDetail,
  UpdateTestResultRequest,
  UpdateVerificationRequest,
  AddNotificationRequest,
} from '@/lib/services/ppdb.service';
import { useAsyncMutation, useAsyncQuery } from '@/hooks/shared/use-async-request';

export interface UsePpdbReturn {
  loading: boolean;
  error: string | null;
  success: boolean;
}

// Hook untuk get list pendaftar PPDB
export function usePpdbList() {
  const query = useCallback(async () => {
    const response = await ppdbService.getList({ per_page: 1000 });
    return response.data;
  }, []);

  const { data, setData, loading, error, run } = useAsyncQuery(query, [] as PpdbDetail[], {
    fallbackError: 'Failed to fetch PPDB list',
    logLabel: 'Error fetching PPDB list:',
  });

  const fetchList = useCallback(async () => {
    await run();
  }, [run]);

  const updateStatusByIds = useCallback((ids: string[], status: string) => {
    const validIds = ids.filter((id) => id.trim().length > 0);
    if (validIds.length === 0) return;

    const idSet = new Set(validIds);

    setData((prev) =>
      prev.map((item) => {
        const itemIds = [item.pendaftaranId, item.id, item.userId, item.noPendaftaran].filter(
          (id): id is string => Boolean(id && id.trim().length > 0)
        );

        if (!itemIds.some((id) => idSet.has(id))) {
          return item;
        }

        return {
          ...item,
          status,
        };
      })
    );
  }, []);

  return { data, loading, error, fetchList, updateStatusByIds };
}

// Hook untuk get detail pendaftar PPDB
export function usePpdbDetail(id?: string) {
  const query = useCallback((targetId: string) => ppdbService.getDetail(targetId), []);
  const { data, loading, error, setError, run } = useAsyncQuery(query, null as PpdbDetail | null, {
    fallbackError: 'Failed to fetch PPDB detail',
    logLabel: 'Error fetching PPDB detail:',
  });

  const fetchDetail = useCallback(
    async (fetchId?: string) => {
      const idToFetch = fetchId || id;
      if (!idToFetch) {
        setError('ID is required');
        return;
      }

      await run(idToFetch);
    },
    [id, run, setError],
  );

  return { data, loading, error, fetchDetail };
}

// Hook untuk create pendaftar PPDB
export function useCreatePpdb() {
  const { loading, error, success, mutate } = useAsyncMutation(
    ppdbService.create,
    'Failed to create PPDB',
    'Error creating PPDB:',
  );

  const create = useCallback(async (payload: CreatePpdbRequest) => mutate(payload), [mutate]);

  return { loading, error, success, create };
}

// Hook untuk update data pendaftar PPDB
export function useUpdatePpdb() {
  const mutation = useCallback((id: string, payload: UpdatePpdbRequest) => ppdbService.update(id, payload), []);
  const { loading, error, success, mutate } = useAsyncMutation(
    mutation,
    'Failed to update PPDB',
    'Error updating PPDB:',
  );

  const update = useCallback(async (id: string, payload: UpdatePpdbRequest) => mutate(id, payload), [mutate]);

  return { loading, error, success, update };
}

// Hook untuk delete pendaftar PPDB
export function useDeletePpdb() {
  const { loading, error, success, mutate } = useAsyncMutation(
    ppdbService.delete,
    'Failed to delete PPDB',
    'Error deleting PPDB:',
  );

  const deleteItem = useCallback(async (id: string) => mutate(id), [mutate]);

  return { loading, error, success, deleteItem };
}

// Hook untuk upload file PPDB
export function useUploadPpdbFile() {
  const mutation = useCallback(
    (id: string, file: File, fileType: string) => ppdbService.uploadFile(id, file, fileType),
    [],
  );
  const { loading, error, success, mutate } = useAsyncMutation(
    mutation,
    'Failed to upload file',
    'Error uploading file:',
  );

  const upload = useCallback(async (id: string, file: File, fileType: string) => mutate(id, file, fileType), [mutate]);

  return { loading, error, success, upload };
}

// Hook untuk update hasil tes PPDB
export function useUpdatePpdbTestResult() {
  const mutation = useCallback(
    (id: string, payload: UpdateTestResultRequest) => ppdbService.updateTestResult(id, payload),
    [],
  );
  const { loading, error, success, mutate } = useAsyncMutation(
    mutation,
    'Failed to update test result',
    'Error updating test result:',
  );

  const updateTestResult = useCallback(async (id: string, payload: UpdateTestResultRequest) => mutate(id, payload), [mutate]);

  return { loading, error, success, updateTestResult };
}

// Hook untuk update verifikasi PPDB
export function useUpdatePpdbVerification() {
  const mutation = useCallback(
    (id: string, payload: UpdateVerificationRequest) => ppdbService.updateVerification(id, payload),
    [],
  );
  const { loading, error, success, mutate } = useAsyncMutation(
    mutation,
    'Failed to update verification',
    'Error updating verification:',
  );

  const updateVerification = useCallback(async (id: string, payload: UpdateVerificationRequest) => mutate(id, payload), [mutate]);

  return { loading, error, success, updateVerification };
}

// Hook untuk add notifikasi PPDB
export function useAddPpdbNotification() {
  const mutation = useCallback(
    (id: string, payload: AddNotificationRequest) => ppdbService.addNotification(id, payload),
    [],
  );
  const { loading, error, success, mutate } = useAsyncMutation(
    mutation,
    'Failed to add notification',
    'Error adding notification:',
  );

  const addNotification = useCallback(async (id: string, payload: AddNotificationRequest) => mutate(id, payload), [mutate]);

  return { loading, error, success, addNotification };
}
