import { useQuery } from '@tanstack/react-query';
import { dataUnitService } from '@/lib/services/unit.service';
import { dataKelasService } from '@/lib/services/kelas.service';
import { tahunAjaranService } from '@/lib/services/tahun-ajaran.service';
import api from '@/lib/axios';
import { sppService } from '@/lib/services/spp.service';

export interface discountOption {
  value: string | number;
  label: string;
  code?: string;
}

export function useMasterData(enabled = true) {
  const unitsQuery = useQuery({
    queryKey: ['master', 'units'],
    queryFn: () =>
      dataUnitService.getAll({ per_page: 100 }).then((r) =>
        r.data.map((i) => ({
          value: i.id_unit ?? 0,
          label: i.nama_unit ?? '',
          code: i.kode_unit ?? '',
        }))
      ),
    enabled,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  const kelasQuery = useQuery({
    queryKey: ['master', 'kelas'],
    queryFn: () =>
      dataKelasService.getAll({ per_page: 500 }).then((r) =>
        r.data.map((i) => ({
          value: i.kode_kelas ?? '',
          label: i.nama_kelas ?? '',
        }))
      ),
    enabled,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  const tahunAjaranQuery = useQuery({
    queryKey: ['master', 'tahunAjaran'],
    queryFn: () =>
      tahunAjaranService.getAll({ per_page: 100 }).then((r) =>
        r.data.map((i) => ({
          value: i.nama_tahun ?? '',
          label: i.nama_tahun ?? '',
        }))
      ),
    enabled,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  const categoriesQuery = useQuery({
    queryKey: ['master', 'categories'],
    queryFn: () =>
      api.get('/administrasi/pembayaran/options').then((r) => {
        const c = r.data.kategori_tagihan || [];
        return Array.isArray(c) ? c.map((i: any) => ({
          value: i.id_kategori ?? 0,
          label: i.nama_tagihan ?? '',
          code: i.kode_kategori ?? '',
        })) : [];
      }),
    enabled,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  const golonganSppQuery = useQuery({
    queryKey: ['master', 'golonganSpp'],
    queryFn: () =>
      sppService.getGolongan().then((r) =>
        r.data.map((i) => ({
          value: i.id ?? '',
          label: i.namaGolongan ?? '',
          code: i.id ?? '',
        }))
      ),
    enabled,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  const discountQuery = useQuery({
    queryKey: ['master', 'discount'],
    queryFn: () =>
      api.get('/administrasi/pembayaran/options').then((r) => {
        const d = r.data.discount || [];
        return Array.isArray(d) ? d.map((i: any) => ({
          value: i.id ?? '',
          label: i.nama_discount ?? '',
          code: i.kode_discount ?? '',
        })) : [];
      }),
    enabled,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  const loading = unitsQuery.isLoading || kelasQuery.isLoading || tahunAjaranQuery.isLoading || categoriesQuery.isLoading || golonganSppQuery.isLoading || discountQuery.isLoading;

  return {
    units: unitsQuery.data || [],
    kelas: kelasQuery.data || [],
    tahunAjaran: tahunAjaranQuery.data || [],
    categories: categoriesQuery.data || [],
    golonganSpp: golonganSppQuery.data || [],
    discountOption: discountQuery.data || [],
    loading,
  };
} 