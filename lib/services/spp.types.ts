/**
 * SPP Types — aligned with backend API
 *
 * Backend endpoints:
 *   GET/POST   /api/administrasi/spp/pembayaran
 *   GET/PUT    /api/administrasi/spp/pembayaran/{id}
 *   PUT        /api/administrasi/spp/pembayaran/{id}/verifikasi
 *   GET/POST   /api/administrasi/spp/setting
 *   GET/PUT    /api/administrasi/spp/setting/{id}
 *   GET        /api/administrasi/spp/golongan
 */

// ─── Status enum ──────────────────────────────────────────────────────────────

export type SppStatus =
  | 'Lunas'
  | 'Cicilan'
  | 'Belum Bayar'
  | 'Terlambat'
  | 'Menunggu Verifikasi'
  | 'Terverifikasi'
  | 'Tagihan Dibuat'
  | 'Ditolak';

// ─── Payment ──────────────────────────────────────────────────────────────────

/** Shape returned to the UI after normalization */
export interface SppPayment {
  id: string;
  idSantri: string;
  idSetting: string;
  nominalBayar: number;
  tanggalBayar: string;
  metodeBayar: string;
  status: SppStatus;
  tanggalVerifikasi: string;
  idPetugasVerifikator: string;
  // Display helpers derived from related data (may be empty if not returned)
  noTagihan: string;
  nis: string;
  nama: string;
  kelas: string;
  bulan: string;
  jatuhTempo: string;
  nominal: number;
  terbayar: number;
  channelPembayaran: string;
  nomorWaPembayaran: string;
  buktiBayarUrl: string;
  kwitansiUrl: string;
  verifikasiAt: string;
  catatanVerifikasi: string;
}

/** POST /api/administrasi/spp/pembayaran */
export interface CreateSppPaymentRequest {
  id_santri: string | number;
  id_setting: string | number;
  nominal_bayar: number;
  tanggal_bayar: string; // format: "2026-04-22 10:00:00"
  metode_bayar: string;  // e.g. "transfer", "cash"
}

/** PUT /api/administrasi/spp/pembayaran/{id} */
export type UpdateSppPaymentRequest = Partial<CreateSppPaymentRequest>;

/** PUT /api/administrasi/spp/pembayaran/{id}/verifikasi */
export interface VerifySppPaymentRequest {
  status: 'verified';
}

// ─── Setting ──────────────────────────────────────────────────────────────────

/** Shape returned to UI after normalization */
export interface SppSetting {
  id: string;
  idUnit: string | null;
  kodeKelas: string | null;
  jenjang: string | null;
  idGolonganSpp: string | null;
  idKategoriTagihan: string | null;
  nominal: number;
  // Extra display fields
  nama: string;
  kelas: string;
  tahunAjaran: string;
  jatuhTempoHari: number | null;
  aktif: boolean;
  keterangan: string;
  // Relations
  unit?: { id_unit: number; nama_unit: string; kode_unit: string };
  kategoriTagihan?: { id_kategori: number; nama_tagihan: string; kode_kategori: string };
  golonganSpp?: { id_golongan: number; nama_golongan: string };
}

/** POST /api/administrasi/spp/setting */
export interface CreateSppSettingRequest {
  id_unit?: number | null;
  jenjang?: string | null;
  kode_kelas?: string | null;
  id_golongan_spp?: number | null;
  kategori_tagihan_id?: number | null;
  nominal?: number;
  jumlah?: number;
  periode?: string | null;
  keterangan?: string | null;
  aktif?: boolean;
}

/** PUT /api/administrasi/spp/setting/{id} */
export type UpdateSppSettingRequest = Partial<CreateSppSettingRequest>;

// ─── Golongan ─────────────────────────────────────────────────────────────────

export interface SppGolongan {
  id: string;
  namaGolongan: string;
  nominal: number;
  jenjang?: string;
  aktif?: boolean;
  keterangan?: string;
}

export interface CreateSppGolonganRequest {
  namaGolongan: string;
  jenjang?: string;
  nominal: number;
  aktif?: boolean;
  keterangan?: string;
}

export type UpdateSppGolonganRequest = Partial<CreateSppGolonganRequest>;

// ─── Summary ──────────────────────────────────────────────────────────────────

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

// ─── List Responses ───────────────────────────────────────────────────────────

export interface SppPaymentListResponse {
  data: SppPayment[];
  message: string;
}

export interface SppSettingListResponse {
  data: SppSetting[];
  message: string;
}

export interface SppGolonganListResponse {
  data: SppGolongan[];
  message: string;
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export interface SppPaymentQuery {
  per_page?: number;
  id_santri?: string | number;
  status?: string;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
}

export interface SppSettingQuery {
  per_page?: number;
  kode_kelas?: string;
  id_golongan_spp?: string | number;
}
