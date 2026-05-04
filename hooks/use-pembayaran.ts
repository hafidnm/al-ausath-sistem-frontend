import { useCallback } from 'react';
import {
  pembayaranService,
  type TagihanRow,
  type ProsesRow,
  type VerifikasiRow,
  type PembayaranDetail,
  type UbahStatusRequest,
  type RingkasanPembayaran,
  type StatusPembayaran,
  type TunggakanSantri,
} from '@/lib/services/pembayaran.service';
import { useAsyncQuery, useAsyncMutation } from '@/hooks/shared/use-async-request';

export type {
  TagihanRow,
  ProsesRow,
  VerifikasiRow,
  PembayaranDetail,
  UbahStatusRequest,
  RingkasanPembayaran,
  StatusPembayaran,
  TunggakanSantri,
};

// ─── Tagihan ──────────────────────────────────────────────────────────────────

export function useTagihan() {
  const query = useCallback(() => pembayaranService.getTagihan().then((r) => r.data), []);
  const { data, loading, error, run } = useAsyncQuery(query, [] as TagihanRow[], {
    fallbackError: 'Gagal memuat daftar tagihan',
    logLabel: 'Error fetching tagihan:',
  });

  const fetchTagihan = useCallback(async () => run(), [run]);
  return { data, loading, error, fetchTagihan };
}

// ─── Proses Pembayaran ────────────────────────────────────────────────────────

export function useProsesPembayaran() {
  const query = useCallback(
    (params?: { kode_unit?: string; kode_kelas?: string; search?: string }) =>
      pembayaranService.getProses(params).then((r) => r.data),
    [],
  );
  const { data, loading, error, run } = useAsyncQuery(query, [] as ProsesRow[], {
    fallbackError: 'Gagal memuat data proses pembayaran',
    logLabel: 'Error fetching proses pembayaran:',
  });

  const fetchProses = useCallback(
    async (params?: { kode_unit?: string; kode_kelas?: string; search?: string }) => run(params),
    [run],
  );

  return { data, loading, error, fetchProses };
}

// ─── Verifikasi Pembayaran ────────────────────────────────────────────────────

export function useVerifikasiPembayaran() {
  const query = useCallback(() => pembayaranService.getVerifikasi().then((r) => r.data), []);
  const { data, loading, error, run } = useAsyncQuery(query, [] as VerifikasiRow[], {
    fallbackError: 'Gagal memuat data verifikasi pembayaran',
    logLabel: 'Error fetching verifikasi pembayaran:',
  });

  const fetchVerifikasi = useCallback(async () => run(), [run]);
  return { data, loading, error, fetchVerifikasi };
}

// ─── Detail Pembayaran ────────────────────────────────────────────────────────

export function useDetailPembayaran() {
  const query = useCallback((id: string) => pembayaranService.getDetail(id), []);
  const { data, loading, error, run } = useAsyncQuery(query, null as PembayaranDetail | null, {
    fallbackError: 'Gagal memuat detail pembayaran',
    logLabel: 'Error fetching detail pembayaran:',
  });

  const fetchDetail = useCallback(async (id: string) => run(id), [run]);
  return { data, loading, error, fetchDetail };
}

// ─── Ubah Status ──────────────────────────────────────────────────────────────

export function useUbahStatusPembayaran() {
  const mutation = useCallback(
    (id: string, payload: UbahStatusRequest) => pembayaranService.ubahStatus(id, payload),
    [],
  );
  const { loading, error, success, mutate } = useAsyncMutation(
    mutation,
    'Gagal mengubah status pembayaran',
    'Error updating status:',
  );

  const ubahStatus = useCallback(
    async (id: string, payload: UbahStatusRequest) => mutate(id, payload),
    [mutate],
  );

  return { loading, error, success, ubahStatus };
}

// ─── Hapus Pembayaran ─────────────────────────────────────────────────────────

export function useHapusPembayaran() {
  const { loading, error, success, mutate } = useAsyncMutation(
    pembayaranService.hapus,
    'Gagal menghapus pembayaran',
    'Error deleting pembayaran:',
  );

  const hapus = useCallback(async (id: string) => mutate(id), [mutate]);
  return { loading, error, success, hapus };
}

// ─── Ringkasan ────────────────────────────────────────────────────────────────

export function useRingkasanPembayaran() {
  const { data, loading, error, run } = useAsyncQuery(
    pembayaranService.getRingkasan,
    null as RingkasanPembayaran | null,
    {
      fallbackError: 'Gagal memuat ringkasan pembayaran',
      logLabel: 'Error fetching ringkasan:',
    },
  );

  const fetchRingkasan = useCallback(async () => run(), [run]);
  return { data, loading, error, fetchRingkasan };
}

// ─── Tunggakan Santri ─────────────────────────────────────────────────────────

export function useTunggakanSantri() {
  const query = useCallback((id: string) => pembayaranService.getTunggakanSantri(id), []);
  const { data, loading, error, run } = useAsyncQuery(query, null as TunggakanSantri | null, {
    fallbackError: 'Gagal memuat tunggakan santri',
    logLabel: 'Error fetching tunggakan santri:',
  });

  const fetchTunggakan = useCallback(async (id: string) => run(id), [run]);
  return { data, loading, error, fetchTunggakan };
}
