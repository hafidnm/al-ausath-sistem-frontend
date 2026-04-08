import { useCallback, useState } from 'react';
import {
  CreateSppPaymentRequest,
  CreateSppSettingRequest,
  SppPayment,
  SppSetting,
  SppTunggakanSummary,
  UpdateSppPaymentRequest,
  UpdateSppSettingRequest,
  sppService,
} from '@/lib/services/spp.service';

export interface UseSppReturn {
  loading: boolean;
  error: string | null;
  success: boolean;
}

export function useSppPayments() {
  const [data, setData] = useState<SppPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await sppService.getPayments();
      setData(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch SPP payments';
      setError(message);
      console.error('Error fetching SPP payments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, setData, loading, error, fetchPayments };
}

export function useSppPaymentDetail(id?: string) {
  const [data, setData] = useState<SppPayment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentDetail = useCallback(
    async (targetId?: string) => {
      const idToFetch = targetId ?? id;
      if (!idToFetch) {
        setError('ID pembayaran tidak ditemukan');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await sppService.getPaymentDetail(idToFetch);
        setData(response);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch payment detail';
        setError(message);
        console.error('Error fetching payment detail:', err);
      } finally {
        setLoading(false);
      }
    },
    [id],
  );

  return { data, loading, error, fetchPaymentDetail };
}

export function useCreateSppPayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createPayment = useCallback(async (payload: CreateSppPaymentRequest) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await sppService.createPayment(payload);
      setSuccess(true);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create payment';
      setError(message);
      console.error('Error creating payment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, success, createPayment };
}

export function useUpdateSppPayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updatePayment = useCallback(async (id: string, payload: UpdateSppPaymentRequest) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await sppService.updatePayment(id, payload);
      setSuccess(true);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update payment';
      setError(message);
      console.error('Error updating payment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, success, updatePayment };
}

export function useDeleteSppPayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const deletePayment = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await sppService.deletePayment(id);
      setSuccess(true);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete payment';
      setError(message);
      console.error('Error deleting payment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, success, deletePayment };
}

export function useSppTunggakanSummary() {
  const [data, setData] = useState<SppTunggakanSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await sppService.getTunggakanSummary();
      setData(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tunggakan summary';
      setError(message);
      console.error('Error fetching tunggakan summary:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchSummary };
}

export function useSppSettings() {
  const [data, setData] = useState<SppSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await sppService.getSettings();
      setData(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch SPP settings';
      setError(message);
      console.error('Error fetching SPP settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, setData, loading, error, fetchSettings };
}

export function useSppSettingDetail(id?: string) {
  const [data, setData] = useState<SppSetting | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettingDetail = useCallback(
    async (targetId?: string) => {
      const idToFetch = targetId ?? id;
      if (!idToFetch) {
        setError('ID setting tidak ditemukan');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await sppService.getSettingDetail(idToFetch);
        setData(response);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch setting detail';
        setError(message);
        console.error('Error fetching setting detail:', err);
      } finally {
        setLoading(false);
      }
    },
    [id],
  );

  return { data, loading, error, fetchSettingDetail };
}

export function useCreateSppSetting() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createSetting = useCallback(async (payload: CreateSppSettingRequest) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await sppService.createSetting(payload);
      setSuccess(true);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create SPP setting';
      setError(message);
      console.error('Error creating SPP setting:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, success, createSetting };
}

export function useUpdateSppSetting() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateSetting = useCallback(async (id: string, payload: UpdateSppSettingRequest) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await sppService.updateSetting(id, payload);
      setSuccess(true);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update SPP setting';
      setError(message);
      console.error('Error updating SPP setting:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, success, updateSetting };
}

export function useDeleteSppSetting() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const deleteSetting = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await sppService.deleteSetting(id);
      setSuccess(true);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete SPP setting';
      setError(message);
      console.error('Error deleting SPP setting:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, success, deleteSetting };
}
