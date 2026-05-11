import { useCallback, useState } from 'react';
import {
  CreateSppPaymentRequest,
  CreateSppSettingRequest,
  SppGolongan,
  SppPayment,
  SppPaymentQuery,
  SppSetting,
  SppSettingQuery,
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

// ─── Payments ─────────────────────────────────────────────────────────────────

export function useSppPayments() {
  const query = useCallback(async (params?: SppPaymentQuery) => {
    const response = await sppService.getPayments(params);
    return response.data;
  }, []);

  const { data, setData, loading, error, run } = useAsyncQuery(query, [] as SppPayment[], {
    fallbackError: 'Gagal memuat pembayaran SPP',
    logLabel: 'Error fetching SPP payments:',
  });

  const fetchPayments = useCallback(
    async (params?: SppPaymentQuery) => run(params),
    [run],
  );

  return { data, setData, loading, error, fetchPayments };
}

export function useSppPaymentDetail(id?: string) {
  const query = useCallback((targetId: string) => sppService.getPaymentDetail(targetId), []);
  const { data, loading, error, setError, run } = useAsyncQuery(
    query,
    null as SppPayment | null,
    {
      fallbackError: 'Gagal memuat detail pembayaran',
      logLabel: 'Error fetching payment detail:',
    },
  );

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
    'Gagal mencatat pembayaran',
    'Error creating payment:',
  );

  const createPayment = useCallback(
    async (payload: CreateSppPaymentRequest) => mutate(payload),
    [mutate],
  );

  return { loading, error, success, createPayment };
}

export function useUpdateSppPayment() {
  const mutation = useCallback(
    (id: string, payload: UpdateSppPaymentRequest) => sppService.updatePayment(id, payload),
    [],
  );
  const { loading, error, success, mutate } = useAsyncMutation(
    mutation,
    'Gagal memperbarui pembayaran',
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
    'Gagal memverifikasi pembayaran',
    'Error verifying payment:',
  );

  const verifyPayment = useCallback(
    async (id: string, payload?: VerifySppPaymentRequest) => mutate(id, payload),
    [mutate],
  );

  return { loading, error, success, verifyPayment };
}

export function useDeleteSppPayment() {
  const { loading, error, success, mutate } = useAsyncMutation(
    sppService.deletePayment,
    'Gagal menghapus pembayaran',
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
      fallbackError: 'Gagal memuat ringkasan tunggakan',
      logLabel: 'Error fetching tunggakan summary:',
    },
  );

  const fetchSummary = useCallback(async () => run(), [run]);

  return { data, loading, error, fetchSummary };
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function useSppSettings() {
  const query = useCallback(async (params?: SppSettingQuery) => {
    const response = await sppService.getSettings(params);
    return response.data;
  }, []);

  const { data, setData, loading, error, run } = useAsyncQuery(query, [] as SppSetting[], {
    fallbackError: 'Gagal memuat setting SPP',
    logLabel: 'Error fetching SPP settings:',
  });

  const fetchSettings = useCallback(
    async (params?: SppSettingQuery) => run(params),
    [run],
  );

  return { data, setData, loading, error, fetchSettings };
}

export function useSppSettingDetail(id?: string) {
  const query = useCallback((targetId: string) => sppService.getSettingDetail(targetId), []);
  const { data, loading, error, setError, run } = useAsyncQuery(
    query,
    null as SppSetting | null,
    {
      fallbackError: 'Gagal memuat detail setting',
      logLabel: 'Error fetching setting detail:',
    },
  );

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
    'Gagal membuat setting SPP',
    'Error creating SPP setting:',
  );

  const createSetting = useCallback(
    async (payload: CreateSppSettingRequest) => mutate(payload),
    [mutate],
  );

  return { loading, error, success, createSetting };
}

export function useUpdateSppSetting() {
  const mutation = useCallback(
    (id: string, payload: UpdateSppSettingRequest) => sppService.updateSetting(id, payload),
    [],
  );
  const { loading, error, success, mutate } = useAsyncMutation(
    mutation,
    'Gagal memperbarui setting SPP',
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
    'Gagal menghapus setting SPP',
    'Error deleting SPP setting:',
  );

  const deleteSetting = useCallback(async (id: string) => mutate(id), [mutate]);

  return { loading, error, success, deleteSetting };
}

// ─── Golongan ─────────────────────────────────────────────────────────────────

export function useSppGolongan() {
  const query = useCallback(async () => {
    const response = await sppService.getGolongan();
    return response.data;
  }, []);

  const { data, loading, error, run } = useAsyncQuery(query, [] as SppGolongan[], {
    fallbackError: 'Gagal memuat golongan SPP',
    logLabel: 'Error fetching SPP golongan:',
  });

  const fetchGolongan = useCallback(async () => run(), [run]);

  return { data, loading, error, fetchGolongan };
}

// Re-export types so callers don't need to import from two places
export type {
  CreateSppPaymentRequest,
  CreateSppSettingRequest,
  SppGolongan,
  SppPayment,
  SppPaymentQuery,
  SppSetting,
  SppSettingQuery,
  SppTunggakanSummary,
  UpdateSppPaymentRequest,
  UpdateSppSettingRequest,
  VerifySppPaymentRequest,
};
