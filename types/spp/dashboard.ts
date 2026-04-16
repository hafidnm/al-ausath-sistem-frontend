import { SppStatus } from '@/lib/services/spp.service';

export type PaymentFormState = {
  noTagihan: string;
  nis: string;
  nama: string;
  kelas: string;
  bulan: string;
  jatuhTempo: string;
  nominal: string;
  terbayar: string;
  status: SppStatus;
};

export type SettingFormState = {
  nama: string;
  jenjang: string;
  kelas: string;
  tahunAjaran: string;
  nominal: string;
  jatuhTempoHari: string;
  aktif: 'true' | 'false';
  keterangan: string;
};

export const paymentStatusOptions: SppStatus[] = [
  'Menunggu Verifikasi',
  'Terverifikasi',
  'Lunas',
  'Cicilan',
  'Belum Bayar',
  'Terlambat',
];

export const emptyPaymentForm: PaymentFormState = {
  noTagihan: '',
  nis: '',
  nama: '',
  kelas: '',
  bulan: '',
  jatuhTempo: '',
  nominal: '',
  terbayar: '0',
  status: 'Belum Bayar',
};

export const emptySettingForm: SettingFormState = {
  nama: '',
  jenjang: '',
  kelas: '',
  tahunAjaran: '',
  nominal: '',
  jatuhTempoHari: '',
  aktif: 'true',
  keterangan: '',
};
