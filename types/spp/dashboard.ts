import type { SppStatus } from '@/lib/services/spp.service';

/**
 * Form state untuk dialog Tambah/Edit Pembayaran.
 * Field disesuaikan dengan POST /api/administrasi/spp/pembayaran
 */
export type PaymentFormState = {
  idSantri: string;      // id_santri (FK ke data_santri)
  idSetting: string;     // id_setting (FK ke spp_setting)
  nominalBayar: string;  // nominal_bayar
  tanggalBayar: string;  // tanggal_bayar (datetime)
  metodeBayar: string;   // metode_bayar: 'cash' | 'transfer' | dll
};

/**
 * Form state untuk dialog Tambah/Edit Setting SPP.
 * Field disesuaikan dengan POST /api/administrasi/spp/setting
 */
export type SettingFormState = {
  kodeKelas: string;     // kode_kelas
  idGolonganSpp: string; // id_golongan_spp
  nominal: string;       // nominal (dalam IDR)
};

export const metodeBayarOptions = ['transfer', 'cash', 'qris', 'lainnya'] as const;
export type MetodeBayar = (typeof metodeBayarOptions)[number];

export const paymentStatusOptions: SppStatus[] = [
  'Menunggu Verifikasi',
  'Terverifikasi',
  'Lunas',
  'Cicilan',
  'Belum Bayar',
  'Terlambat',
  'Tagihan Dibuat',
  'Ditolak',
];

export const emptyPaymentForm: PaymentFormState = {
  idSantri: '',
  idSetting: '',
  nominalBayar: '',
  tanggalBayar: '',
  metodeBayar: 'transfer',
};

export const emptySettingForm: SettingFormState = {
  kodeKelas: '',
  idGolonganSpp: '',
  nominal: '',
};
