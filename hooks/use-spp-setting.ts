import { useCallback } from 'react';
import { sppService, type SppSetting, type SppSettingQuery, type CreateSppSettingRequest, type UpdateSppSettingRequest } from '@/lib/services/spp.service';
import { useAsyncQuery, useAsyncMutation } from '@/hooks/shared/use-async-request';

export function useSppSettings(query?: SppSettingQuery) {
  const fetcher = useCallback(() => sppService.getSettings(query).then(r => r.data), [query]);
  const { data, loading, error, run } = useAsyncQuery(fetcher, [] as SppSetting[], {
    fallbackError: 'Gagal memuat pengaturan SPP',
  });

  const fetchSettings = useCallback(async () => run(), [run]);
  return { data, loading, error, fetchSettings };
}

export function useSppSettingDetail(id?: string) {
  const fetcher = useCallback(() => (id ? sppService.getSettingDetail(id) : Promise.resolve(null)), [id]);
  const { data, loading, error, run } = useAsyncQuery(fetcher, null as SppSetting | null, {
    fallbackError: 'Gagal memuat detail pengaturan',
  });

  const fetchDetail = useCallback(async () => run(), [run]);
  return { data, loading, error, fetchDetail };
}

export function useCreateSppSetting() {
  const { loading, error, success, mutate } = useAsyncMutation(
    sppService.createSetting,
    'Gagal membuat pengaturan SPP'
  );

  const createSetting = useCallback(
    async (payload: CreateSppSettingRequest) => mutate(payload),
    [mutate]
  );

  return { loading, error, success, createSetting };
}

export function useUpdateSppSetting() {
  const { loading, error, success, mutate } = useAsyncMutation(
    sppService.updateSetting,
    'Gagal memperbarui pengaturan SPP'
  );

  const updateSetting = useCallback(
    async (id: string, payload: UpdateSppSettingRequest) => mutate(id, payload),
    [mutate]
  );

  return { loading, error, success, updateSetting };
}

export function useDeleteSppSetting() {
  const { loading, error, success, mutate } = useAsyncMutation(
    sppService.deleteSetting,
    'Gagal menghapus pengaturan SPP'
  );

  const deleteSetting = useCallback(async (id: string) => mutate(id), [mutate]);
  return { loading, error, success, deleteSetting };
}
