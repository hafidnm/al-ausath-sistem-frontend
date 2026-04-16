import { useCallback } from 'react';
import {
  PpdbPortalDashboard,
  PpdbPortalFormRequest,
  PpdbPortalLoginRequest,
  PpdbPortalTesJawabRequest,
  PpdbPortalTesStatus,
  PpdbPortalRegisterRequest,
  ppdbPortalService,
} from '@/lib/services/ppdb-portal.service';
import { useAsyncMutation, useAsyncQuery } from '@/hooks/shared/use-async-request';

export function usePpdbPortalRegister() {
  const { loading, error, success, mutate } = useAsyncMutation(
    ppdbPortalService.register,
    'Registrasi PPDB gagal',
  );

  const register = useCallback(async (payload: PpdbPortalRegisterRequest) => mutate(payload), [mutate]);

  return { loading, error, success, register };
}

export function usePpdbPortalLogin() {
  const { loading, error, success, mutate } = useAsyncMutation(
    ppdbPortalService.login,
    'Login PPDB gagal',
  );

  const login = useCallback(async (payload: PpdbPortalLoginRequest) => mutate(payload), [mutate]);

  return { loading, error, success, login };
}

export function usePpdbPortalDashboard() {
  const { data, setData, loading, error, run } = useAsyncQuery(
    ppdbPortalService.getDashboard,
    null as PpdbPortalDashboard | null,
    {
      fallbackError: 'Gagal memuat dashboard PPDB',
      rethrow: true,
    },
  );

  const fetchDashboard = useCallback(async () => run(), [run]);

  return { data, setData, loading, error, fetchDashboard };
}

export function usePpdbPortalUpdateForm() {
  const { loading, error, success, mutate } = useAsyncMutation(
    ppdbPortalService.updateForm,
    'Gagal memperbarui form PPDB',
  );

  const updateForm = useCallback(async (payload: PpdbPortalFormRequest) => mutate(payload), [mutate]);

  return { loading, error, success, updateForm };
}

export function usePpdbPortalPreviewNomor() {
  const { data, loading, error, run } = useAsyncQuery(ppdbPortalService.previewNomor, '', {
    fallbackError: 'Gagal mengambil nomor preview',
    rethrow: true,
  });

  const fetchPreviewNomor = useCallback(async () => run(), [run]);

  return { data, loading, error, fetchPreviewNomor };
}



export function usePpdbPortalTesStatus() {
  const { data, loading, error, run } = useAsyncQuery(
    ppdbPortalService.getTesStatus,
    null as PpdbPortalTesStatus | null,
    {
      fallbackError: 'Gagal memuat status tes PPDB',
      rethrow: true,
    },
  );

  const fetchTesStatus = useCallback(async () => run(), [run]);

  return { data, loading, error, fetchTesStatus };
}

export function usePpdbPortalSubmitTesJawab() {
  const { loading, error, success, mutate } = useAsyncMutation(
    ppdbPortalService.submitTesJawab,
    'Gagal menyimpan jawaban tes PPDB',
  );

  const submitTesJawab = useCallback(async (payload: PpdbPortalTesJawabRequest) => mutate(payload), [mutate]);

  return { loading, error, success, submitTesJawab };
}
