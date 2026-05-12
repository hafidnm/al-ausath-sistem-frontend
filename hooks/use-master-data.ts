import { useState, useEffect } from 'react';
import { dataUnitService } from '@/lib/services/unit.service';
import { dataKelasService } from '@/lib/services/kelas.service';
import { tahunAjaranService } from '@/lib/services/tahun-ajaran.service';
import api from '@/lib/axios';

export interface MasterOption {
  value: string | number;
  label: string;
  code?: string;
}

export function useMasterData() {
  const [units, setUnits] = useState<MasterOption[]>([]);
  const [kelas, setKelas] = useState<MasterOption[]>([]);
  const [tahunAjaran, setTahunAjaran] = useState<MasterOption[]>([]);
  const [categories, setCategories] = useState<MasterOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [u, k, t, c] = await Promise.all([
          dataUnitService.getAll({ per_page: 100 }),
          dataKelasService.getAll({ per_page: 500 }),
          tahunAjaranService.getAll({ per_page: 100 }),
          api.get('/administrasi/pembayaran/options').then(r => r.data.kategori_tagihan || [])
        ]);

        setUnits(u.data.map(i => ({ 
          value: i.id_unit ?? 0, 
          label: i.nama_unit ?? '',
          code: i.kode_unit ?? '' 
        })));
        setKelas(k.data.map(i => ({ value: i.kode_kelas ?? '', label: i.nama_kelas ?? '' })));
        setTahunAjaran(t.data.map(i => ({ value: i.nama_tahun ?? '', label: i.nama_tahun ?? '' })));
        
        // Handle categories if coming from options endpoint or directly
        if (Array.isArray(c)) {
           setCategories(c.map((i: any) => ({ value: i.id_kategori, label: i.nama_tagihan })));
        }
      } catch (e) {
        console.error('Error loading master data:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { units, kelas, tahunAjaran, categories, loading };
}
