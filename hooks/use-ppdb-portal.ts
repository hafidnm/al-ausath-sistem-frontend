import { useCallback, useState } from 'react';
import {
  PpdbPortalAnnouncementResult,
  PpdbPortalDashboard,
  PpdbPortalFormRequest,
  PpdbPortalLoginRequest,
  PpdbPortalRegisterRequest,
  ppdbPortalService,
} from '@/lib/services/ppdb-portal.service';

export function usePpdbPortalRegister() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const register = useCallback(async (payload: PpdbPortalRegisterRequest) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await ppdbPortalService.register(payload);
      setSuccess(true);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registrasi PPDB gagal';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, success, register };
}

export function usePpdbPortalLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const login = useCallback(async (payload: PpdbPortalLoginRequest) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await ppdbPortalService.login(payload);
      setSuccess(true);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login PPDB gagal';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, success, login };
}

export function usePpdbPortalDashboard() {
  const [data, setData] = useState<PpdbPortalDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await ppdbPortalService.getDashboard();
      setData(response);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat dashboard PPDB';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, setData, loading, error, fetchDashboard };
}

export function usePpdbPortalUpdateForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateForm = useCallback(async (payload: PpdbPortalFormRequest) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await ppdbPortalService.updateForm(payload);
      setSuccess(true);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memperbarui form PPDB';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, success, updateForm };
}

export function usePpdbPortalPreviewNomor() {
  const [data, setData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreviewNomor = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await ppdbPortalService.previewNomor();
      setData(response);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengambil nomor preview';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchPreviewNomor };
}

export function usePpdbPortalAnnouncement() {
  const [data, setData] = useState<PpdbPortalAnnouncementResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAnnouncement = useCallback(async (idPendaftaran: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await ppdbPortalService.cekPengumuman(idPendaftaran);
      setData(response);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengecek pengumuman';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, checkAnnouncement };
}
