export type SppStatus =
  | 'Lunas'
  | 'Cicilan'
  | 'Belum Bayar'
  | 'Terlambat'
  | 'Menunggu Verifikasi'
  | 'Terverifikasi'
  | 'Tagihan Dibuat'
  | 'Ditolak';

export interface SppPayment {
  id: string;
  noTagihan: string;
  nis: string;
  nama: string;
  kelas: string;
  bulan: string;
  jatuhTempo: string;
  nominal: number;
  terbayar: number;
  status: SppStatus;
  channelPembayaran: string;
  nomorWaPembayaran: string;
  buktiBayarUrl: string;
  kwitansiUrl: string;
  verifikasiAt: string;
  catatanVerifikasi: string;
}

export interface SppSetting {
  id: string;
  nama: string;
  jenjang: string;
  kelas: string;
  tahunAjaran: string;
  nominal: number;
  jatuhTempoHari: number | null;
  aktif: boolean;
  keterangan: string;
}

export interface SppTunggakanSummary {
  periode: string;
  totalTagihan: number;
  totalLunas: number;
  totalCicilan: number;
  totalBelumBayar: number;
  totalTerlambat: number;
  totalNominal: number;
  totalTerbayar: number;
  totalSisa: number;
  jatuhTempoBerikutnya: string;
}

export interface SppPaymentListResponse {
  data: SppPayment[];
  message: string;
}

export interface SppSettingListResponse {
  data: SppSetting[];
  message: string;
}

export interface CreateSppPaymentRequest {
  idPendaftaran?: string;
  idSantri?: string;
  idSetting?: string;
  jenjang?: string;
  nominalBayar?: number;
  tanggalBayar?: string;
  metodeBayar?: string;
  idRekening?: string;
  noTagihan?: string;
  nis: string;
  nama: string;
  kelas: string;
  bulan: string;
  jatuhTempo: string;
  nominal: number;
  terbayar?: number;
  status?: SppStatus;
}

export type UpdateSppPaymentRequest = Partial<CreateSppPaymentRequest>;

export interface VerifySppPaymentRequest {
  status?:
    | 'verified'
    | 'rejected'
    | 'pending'
    | 'tagihan_dibuat'
    | 'menunggu_verifikasi'
    | 'terverifikasi'
    | 'ditolak';
  verified?: boolean;
  catatan?: string;
  idPetugasVerifikator?: string;
  tanggalVerifikasi?: string;
}

export interface CreateSppSettingRequest {
  nama: string;
  jenjang?: string;
  kelas?: string;
  tahunAjaran?: string;
  nominal: number;
  jatuhTempoHari?: number | null;
  aktif?: boolean;
  keterangan?: string;
}

export type UpdateSppSettingRequest = Partial<CreateSppSettingRequest>;
