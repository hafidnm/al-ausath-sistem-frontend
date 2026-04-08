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

export interface UsePpdbReturn {
  loading: boolean;
  error: string | null;
  success: boolean;
}

// Hook untuk get list pendaftar PPDB
export function usePpdbList() {
  const [data, setData] = useState<PpdbDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ppdbService.getList();
      setData(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch PPDB list';
      setError(errorMessage);
      console.error('Error fetching PPDB list:', err);
    } finally {
      setLoading(false);
    }
  }, []);

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
  const [data, setData] = useState<PpdbDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(
    async (fetchId?: string) => {
      const idToFetch = fetchId || id;
      if (!idToFetch) {
        setError('ID is required');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await ppdbService.getDetail(idToFetch);
        setData(response);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch PPDB detail';
        setError(errorMessage);
        console.error('Error fetching PPDB detail:', err);
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  return { data, loading, error, fetchDetail };
}

// Hook untuk create pendaftar PPDB
export function useCreatePpdb() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const create = useCallback(async (payload: CreatePpdbRequest) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await ppdbService.create(payload);
      setSuccess(true);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create PPDB';
      setError(errorMessage);
      console.error('Error creating PPDB:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, success, create };
}

// Hook untuk update data pendaftar PPDB
export function useUpdatePpdb() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const update = useCallback(async (id: string, payload: UpdatePpdbRequest) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await ppdbService.update(id, payload);
      setSuccess(true);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update PPDB';
      setError(errorMessage);
      console.error('Error updating PPDB:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, success, update };
}

// Hook untuk delete pendaftar PPDB
export function useDeletePpdb() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const deleteItem = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await ppdbService.delete(id);
      setSuccess(true);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete PPDB';
      setError(errorMessage);
      console.error('Error deleting PPDB:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, success, deleteItem };
}

// Hook untuk upload file PPDB
export function useUploadPpdbFile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const upload = useCallback(async (id: string, file: File, fileType: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await ppdbService.uploadFile(id, file, fileType);
      setSuccess(true);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      setError(errorMessage);
      console.error('Error uploading file:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, success, upload };
}

// Hook untuk update hasil tes PPDB
export function useUpdatePpdbTestResult() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateTestResult = useCallback(async (id: string, payload: UpdateTestResultRequest) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await ppdbService.updateTestResult(id, payload);
      setSuccess(true);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update test result';
      setError(errorMessage);
      console.error('Error updating test result:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, success, updateTestResult };
}

// Hook untuk update verifikasi PPDB
export function useUpdatePpdbVerification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateVerification = useCallback(async (id: string, payload: UpdateVerificationRequest) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await ppdbService.updateVerification(id, payload);
      setSuccess(true);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update verification';
      setError(errorMessage);
      console.error('Error updating verification:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, success, updateVerification };
}

// Hook untuk add notifikasi PPDB
export function useAddPpdbNotification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const addNotification = useCallback(async (id: string, payload: AddNotificationRequest) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await ppdbService.addNotification(id, payload);
      setSuccess(true);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add notification';
      setError(errorMessage);
      console.error('Error adding notification:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, success, addNotification };
}
