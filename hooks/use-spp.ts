import { useCallback, useState } from 'react';
import {
  CreateSppPaymentRequest,
  CreateSppSettingRequest,
  SppPayment,
  SppSetting,
  SppTunggakanSummary,
  UpdateSppPaymentRequest,
  UpdateSppSettingRequest,
  VerifySppPaymentRequest,
  sppService,
} from '@/lib/services/spp.service';
import { useAsyncMutation, useAsyncQuery } from '@/hooks/shared/use-async-request';

export interface UseSppReturn {
  loading: boolean;
  error: string | null;
  success: boolean;
}

export function useSppPayments() {
  const query = useCallback(async () => {
    const response = await sppService.getPayments();
    return response.data;
  }, []);

  const { data, setData, loading, error, run } = useAsyncQuery(query, [] as SppPayment[], {
    fallbackError: 'Failed to fetch SPP payments',
    logLabel: 'Error fetching SPP payments:',
  });

  const fetchPayments = useCallback(async () => {
    await run();
  }, [run]);

  return { data, setData, loading, error, fetchPayments };
}

export function useSppPaymentDetail(id?: string) {
  const query = useCallback((targetId: string) => sppService.getPaymentDetail(targetId), []);
  const { data, loading, error, setError, run } = useAsyncQuery(query, null as SppPayment | null, {
    fallbackError: 'Failed to fetch payment detail',
    logLabel: 'Error fetching payment detail:',
  });

  const fetchPaymentDetail = useCallback(
    async (targetId?: string) => {
      const idToFetch = targetId ?? id;
      if (!idToFetch) {
        setError('ID pembayaran tidak ditemukan');
        return;
      }

      await run(idToFetch);
    },
    [id, run, setError],
  );

  return { data, loading, error, fetchPaymentDetail };
}

export function useCreateSppPayment() {
  const { loading, error, success, mutate } = useAsyncMutation(
    sppService.createPayment,
    'Failed to create payment',
    'Error creating payment:',
  );

  const createPayment = useCallback(async (payload: CreateSppPaymentRequest) => mutate(payload), [mutate]);

  return { loading, error, success, createPayment };
}

export function useUpdateSppPayment() {
  const mutation = useCallback(
    (id: string, payload: UpdateSppPaymentRequest) => sppService.updatePayment(id, payload),
    [],
  );
  const { loading, error, success, mutate } = useAsyncMutation(
    mutation,
    'Failed to update payment',
    'Error updating payment:',
  );

  const updatePayment = useCallback(
    async (id: string, payload: UpdateSppPaymentRequest) => mutate(id, payload),
    [mutate],
  );

  return { loading, error, success, updatePayment };
}

export function useVerifySppPayment() {
  const mutation = useCallback(
    (id: string, payload?: VerifySppPaymentRequest) => sppService.verifyPayment(id, payload),
    [],
  );
  const { loading, error, success, mutate } = useAsyncMutation(
    mutation,
    'Failed to verify payment',
    'Error verifying payment:',
  );

  const verifyPayment = useCallback(async (id: string, payload?: VerifySppPaymentRequest) => mutate(id, payload), [mutate]);

  return { loading, error, success, verifyPayment };
}

export function useDeleteSppPayment() {
  const { loading, error, success, mutate } = useAsyncMutation(
    sppService.deletePayment,
    'Failed to delete payment',
    'Error deleting payment:',
  );

  const deletePayment = useCallback(async (id: string) => mutate(id), [mutate]);

  return { loading, error, success, deletePayment };
}

export function useSppTunggakanSummary() {
  const { data, loading, error, run } = useAsyncQuery(
    sppService.getTunggakanSummary,
    null as SppTunggakanSummary | null,
    {
      fallbackError: 'Failed to fetch tunggakan summary',
      logLabel: 'Error fetching tunggakan summary:',
    },
  );

  const fetchSummary = useCallback(async () => {
    await run();
  }, [run]);

  return { data, loading, error, fetchSummary };
}

export function useSppSettings() {
  const query = useCallback(async () => {
    const response = await sppService.getSettings();
    return response.data;
  }, []);
  const { data, setData, loading, error, run } = useAsyncQuery(query, [] as SppSetting[], {
    fallbackError: 'Failed to fetch SPP settings',
    logLabel: 'Error fetching SPP settings:',
  });

  const fetchSettings = useCallback(async () => {
    await run();
  }, [run]);

  return { data, setData, loading, error, fetchSettings };
}

export function useSppSettingDetail(id?: string) {
  const query = useCallback((targetId: string) => sppService.getSettingDetail(targetId), []);
  const { data, loading, error, setError, run } = useAsyncQuery(query, null as SppSetting | null, {
    fallbackError: 'Failed to fetch setting detail',
    logLabel: 'Error fetching setting detail:',
  });

  const fetchSettingDetail = useCallback(
    async (targetId?: string) => {
      const idToFetch = targetId ?? id;
      if (!idToFetch) {
        setError('ID setting tidak ditemukan');
        return;
      }

      await run(idToFetch);
    },
    [id, run, setError],
  );

  return { data, loading, error, fetchSettingDetail };
}

export function useCreateSppSetting() {
  const { loading, error, success, mutate } = useAsyncMutation(
    sppService.createSetting,
    'Failed to create SPP setting',
    'Error creating SPP setting:',
  );

  const createSetting = useCallback(async (payload: CreateSppSettingRequest) => mutate(payload), [mutate]);

  return { loading, error, success, createSetting };
}

export function useUpdateSppSetting() {
  const mutation = useCallback(
    (id: string, payload: UpdateSppSettingRequest) => sppService.updateSetting(id, payload),
    [],
  );
  const { loading, error, success, mutate } = useAsyncMutation(
    mutation,
    'Failed to update SPP setting',
    'Error updating SPP setting:',
  );

  const updateSetting = useCallback(
    async (id: string, payload: UpdateSppSettingRequest) => mutate(id, payload),
    [mutate],
  );

  return { loading, error, success, updateSetting };
}

export function useDeleteSppSetting() {
  const { loading, error, success, mutate } = useAsyncMutation(
    sppService.deleteSetting,
    'Failed to delete SPP setting',
    'Error deleting SPP setting:',
  );

  const deleteSetting = useCallback(async (id: string) => mutate(id), [mutate]);

  return { loading, error, success, deleteSetting };
}
