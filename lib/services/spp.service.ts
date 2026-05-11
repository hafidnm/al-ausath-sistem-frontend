/**
 * SPP Service — aligned with backend API
 *
 * Base path: /api/administrasi/spp
 *
 * Endpoints:
 *   GET/POST   /pembayaran
 *   GET/PUT/DELETE /pembayaran/{id}
 *   PUT        /pembayaran/{id}/verifikasi
 *   GET        /tunggakan-ringkasan
 *   GET/POST   /setting
 *   GET/PUT/DELETE /setting/{id}
 *   GET        /golongan
 */
import api from '../axios';
import type {
  CreateSppPaymentRequest,
  CreateSppSettingRequest,
  CreateSppGolonganRequest,
  SppGolongan,
  SppGolonganListResponse,
  SppPayment,
  SppPaymentListResponse,
  SppPaymentQuery,
  SppSetting,
  SppSettingListResponse,
  SppSettingQuery,
  SppStatus,
  SppTunggakanSummary,
  UpdateSppPaymentRequest,
  UpdateSppSettingRequest,
  UpdateSppGolonganRequest,
  VerifySppPaymentRequest,
} from './spp.types';

export type {
  CreateSppPaymentRequest,
  CreateSppSettingRequest,
  CreateSppGolonganRequest,
  SppGolongan,
  SppGolonganListResponse,
  SppPayment,
  SppPaymentListResponse,
  SppPaymentQuery,
  SppSetting,
  SppSettingListResponse,
  SppSettingQuery,
  SppStatus,
  SppTunggakanSummary,
  UpdateSppPaymentRequest,
  UpdateSppSettingRequest,
  UpdateSppGolonganRequest,
  VerifySppPaymentRequest,
};

type ApiRecord = Record<string, unknown>;

const BASE = '/administrasi/spp';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toStr = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  return '';
};

const toNum = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    // If it contains both dot and comma, assume comma is decimal (Indonesian format)
    // Otherwise, assume dot is decimal (International format)
    let cleaned = value.replace(/[^\d.,-]/g, '');
    if (cleaned.includes(',') && cleaned.includes('.')) {
       cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',')) {
       cleaned = cleaned.replace(',', '.');
    }
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const toBool = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  const s = toStr(value).trim().toLowerCase();
  return ['1', 'true', 'yes', 'y', 'aktif', 'active'].includes(s);
};

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object') {
    const e = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
    return e.response?.data?.message ?? e.response?.data?.error ?? e.message ?? fallback;
  }
  return fallback;
};

// Walk a response payload and find the first array of objects
const extractList = (payload: unknown): ApiRecord[] => {
  const visited = new Set<unknown>();

  const walk = (value: unknown): ApiRecord[] => {
    if (!value || typeof value !== 'object' || visited.has(value)) return [];
    visited.add(value);

    if (Array.isArray(value)) {
      return value.filter((item): item is ApiRecord => !!item && typeof item === 'object');
    }

    const rec = value as ApiRecord;
    const preferred = ['data', 'items', 'list', 'rows', 'pembayaran', 'setting', 'golongan'];

    for (const key of preferred) {
      if (Array.isArray(rec[key])) {
        return (rec[key] as unknown[]).filter(
          (item): item is ApiRecord => !!item && typeof item === 'object',
        );
      }
    }

    for (const key of preferred) {
      const nested = walk(rec[key]);
      if (nested.length > 0) return nested;
    }

    for (const val of Object.values(rec)) {
      const nested = walk(val);
      if (nested.length > 0) return nested;
    }

    return [];
  };

  return walk(payload);
};

const extractSingle = (payload: unknown): ApiRecord => {
  if (!payload || typeof payload !== 'object') return {};
  const rec = payload as ApiRecord;
  if (rec.data && typeof rec.data === 'object' && !Array.isArray(rec.data)) {
    return rec.data as ApiRecord;
  }
  return rec;
};

// ─── Status normalization ─────────────────────────────────────────────────────

const normalizeStatus = (
  raw: unknown,
  nominal: number,
  terbayar: number,
  jatuhTempo: string,
): SppStatus => {
  const s = toStr(raw).trim().toLowerCase();

  if (s === 'tagihan_dibuat' || s === 'draft' || s === 'created') return 'Tagihan Dibuat';
  if (s === 'ditolak' || s === 'rejected') return 'Ditolak';
  if (s === 'lunas' || s === 'paid' || s === 'selesai') return 'Lunas';
  if (s === 'terverifikasi' || s === 'verified' || s === 'valid' || s === 'approved') return 'Terverifikasi';
  if (
    s === 'menunggu verifikasi' ||
    s === 'menunggu_verifikasi' ||
    s === 'waiting_verification' ||
    s === 'pending_verification' ||
    s === 'pending'
  )
    return 'Menunggu Verifikasi';
  if (s === 'cicilan' || s === 'partial' || s === 'installment') return 'Cicilan';
  if (s === 'belum bayar' || s === 'belum_bayar' || s === 'unpaid') return 'Belum Bayar';
  if (s === 'terlambat' || s === 'menunggak' || s === 'overdue' || s === 'tunggakan') return 'Terlambat';

  // Derive from amounts/dates
  if (nominal > 0 && terbayar >= nominal) return 'Lunas';
  if (terbayar > 0) return 'Cicilan';

  if (jatuhTempo) {
    const due = new Date(jatuhTempo);
    if (!Number.isNaN(due.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);
      if (due < today) return 'Terlambat';
    }
  }

  return 'Belum Bayar';
};

// ─── Normalizers ──────────────────────────────────────────────────────────────

const normalizePayment = (item: ApiRecord): SppPayment => {
  const nominalBayar = toNum(item.nominal_bayar ?? item.nominalBayar ?? item.nominal ?? item.nominal_tagihan);
  const terbayar = toNum(item.terbayar ?? item.jumlah_terbayar ?? item.total_terbayar ?? 0);
  const jatuhTempo = toStr(item.jatuh_tempo ?? item.jatuhTempo ?? item.tanggal_jatuh_tempo ?? '');

  const id = toStr(item.id ?? item.id_pembayaran ?? item.uuid) ||
    toStr(item.no_tagihan ?? item.noTagihan);

  const status = normalizeStatus(
    item.status ?? item.status_pembayaran ?? item.payment_status,
    nominalBayar,
    terbayar,
    jatuhTempo,
  );

  return {
    id,
    idSantri: toStr(item.id_santri ?? item.idSantri ?? ''),
    idSetting: toStr(item.id_setting ?? item.idSetting ?? ''),
    nominalBayar,
    tanggalBayar: toStr(item.tanggal_bayar ?? item.tanggalBayar ?? item.created_at ?? ''),
    metodeBayar: toStr(item.metode_bayar ?? item.metodeBayar ?? item.channel_pembayaran ?? ''),
    status,
    tanggalVerifikasi: toStr(item.tanggal_verifikasi ?? item.tanggalVerifikasi ?? ''),
    idPetugasVerifikator: toStr(item.id_petugas_verifikator ?? ''),
    // Display helpers
    noTagihan: toStr(item.no_tagihan ?? item.noTagihan ?? item.invoice_number ?? '') || id,
    nis: toStr(item.nis ?? item.nisn ?? item.nomor_induk ?? ''),
    nama: toStr(item.nama ?? item.nama_santri ?? item.name ?? ''),
    kelas: toStr(item.kelas ?? item.kelas_santri ?? item.rombel ?? ''),
    bulan: toStr(item.bulan ?? item.periode_bulan ?? item.periode ?? ''),
    jatuhTempo,
    nominal: nominalBayar,
    terbayar,
    channelPembayaran: toStr(item.channel_pembayaran ?? item.metode_pembayaran ?? item.metode_bayar ?? ''),
    nomorWaPembayaran: toStr(item.nomor_wa_pembayaran ?? item.wa_number ?? ''),
    buktiBayarUrl: toStr(item.bukti_bayar_url ?? item.payment_proof_url ?? ''),
    kwitansiUrl: toStr(item.kwitansi_url ?? item.receipt_url ?? ''),
    verifikasiAt: toStr(item.verified_at ?? item.verifikasi_at ?? item.tanggal_verifikasi ?? ''),
    catatanVerifikasi: toStr(item.catatan_verifikasi ?? item.verification_note ?? ''),
  };
};

const normalizeSetting = (item: ApiRecord): SppSetting => {
  const id = toStr(item.id ?? item.id_setting ?? item.uuid);
  return {
    id,
    idUnit: toStr(item.id_unit ?? item.idUnit ?? ''),
    kodeKelas: toStr(item.kode_kelas ?? item.kodeKelas ?? item.kelas ?? ''),
    jenjang: toStr(item.jenjang ?? item.unit ?? item.tingkat ?? ''),
    idGolonganSpp: toStr(item.id_golongan_spp ?? item.idGolonganSpp ?? ''),
    idKategoriTagihan: toStr(item.kategori_tagihan_id ?? item.idKategoriTagihan ?? ''),
    nominal: toNum(item.nominal ?? item.nominal_spp ?? item.biaya ?? item.jumlah ?? 0),
    // Display helpers
    nama:
      toStr(item.nama ?? item.nama_setting ?? item.nama_kelas ?? '') ||
      [toStr(item.kode_kelas ?? ''), toStr(item.jenjang ?? '')].filter(Boolean).join(' - ') ||
      `Setting ${id || '-'}`,
    kelas: toStr(item.kelas ?? item.nama_kelas ?? item.kode_kelas ?? ''),
    tahunAjaran: toStr(item.tahun_ajaran ?? item.tahunAjaran ?? item.periode ?? ''),
    jatuhTempoHari:
      item.jatuh_tempo_hari == null && item.jatuhTempoHari == null
        ? null
        : toNum(item.jatuh_tempo_hari ?? item.jatuhTempoHari ?? item.due_day ?? 0),
    aktif: toBool(item.aktif ?? item.active ?? item.is_active ?? item.status),
    keterangan: toStr(item.keterangan ?? item.deskripsi ?? item.catatan ?? ''),
    // Relations
    unit: item.unit as any,
    kategoriTagihan: (item.kategori_tagihan ?? item.kategoriTagihan) as any,
    golonganSpp: (item.golongan_spp ?? item.golonganSpp) as any,
  };
};

const normalizeGolongan = (item: ApiRecord): SppGolongan => ({
  id: toStr(item.id ?? item.id_golongan_spp ?? ''),
  namaGolongan: toStr(item.nama_golongan ?? item.namaGolongan ?? item.nama ?? ''),
  nominal: toNum(item.nominal ?? 0),
});

// ─── Summary ──────────────────────────────────────────────────────────────────

const summarizeFromPayments = (payments: SppPayment[]): SppTunggakanSummary => {
  const totalTagihan = payments.length;
  const totalLunas = payments.filter((p) => p.status === 'Lunas').length;
  const totalCicilan = payments.filter((p) => p.status === 'Cicilan').length;
  const totalBelumBayar = payments.filter((p) => p.status === 'Belum Bayar').length;
  const totalTerlambat = payments.filter((p) => p.status === 'Terlambat').length;
  const totalNominal = payments.reduce((s, p) => s + p.nominal, 0);
  const totalTerbayar = payments.reduce((s, p) => s + p.terbayar, 0);
  const totalSisa = Math.max(totalNominal - totalTerbayar, 0);

  const dueDates = payments
    .map((p) => new Date(p.jatuhTempo))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  const now = new Date();
  const nextDue = dueDates.find((d) => d >= now) ?? dueDates[0] ?? null;

  return {
    periode: payments[0]?.bulan ?? '',
    totalTagihan,
    totalLunas,
    totalCicilan,
    totalBelumBayar,
    totalTerlambat,
    totalNominal,
    totalTerbayar,
    totalSisa,
    jatuhTempoBerikutnya: nextDue ? nextDue.toISOString() : '',
  };
};

const normalizeSummaryPayload = (
  payload: unknown,
  fallback: SppTunggakanSummary,
): SppTunggakanSummary => {
  if (!payload || typeof payload !== 'object') return fallback;
  const raw = extractSingle(payload) as ApiRecord;

  const pick = (key: string, ...aliases: string[]): number =>
    toNum([key, ...aliases].map((k) => raw[k]).find((v) => v != null) ?? 0);

  const totalTagihan = pick('total_tagihan', 'totalTagihan') || fallback.totalTagihan;
  const totalLunas = pick('total_lunas', 'totalLunas', 'lunas') || fallback.totalLunas;
  const totalCicilan = pick('total_cicilan', 'totalCicilan', 'cicilan') || fallback.totalCicilan;
  const totalBelumBayar =
    pick('total_belum_bayar', 'totalBelumBayar', 'belum_bayar') || fallback.totalBelumBayar;
  const totalTerlambat =
    pick('total_terlambat', 'totalTerlambat', 'menunggak') || fallback.totalTerlambat;
  const totalNominal = pick('total_nominal', 'totalNominal', 'nominal') || fallback.totalNominal;
  const totalTerbayar =
    pick('total_terbayar', 'totalTerbayar', 'terbayar') || fallback.totalTerbayar;
  const explicitSisa = pick('total_sisa', 'totalSisa', 'total_tunggakan');
  const totalSisa = explicitSisa || Math.max(totalNominal - totalTerbayar, 0);

  return {
    periode: toStr(raw.periode ?? raw.bulan ?? raw.period ?? '') || fallback.periode,
    totalTagihan,
    totalLunas,
    totalCicilan,
    totalBelumBayar,
    totalTerlambat,
    totalNominal,
    totalTerbayar,
    totalSisa,
    jatuhTempoBerikutnya:
      toStr(raw.jatuh_tempo_berikutnya ?? raw.jatuhTempoBerikutnya ?? raw.next_due_date ?? '') ||
      fallback.jatuhTempoBerikutnya,
  };
};

// ─── Service ──────────────────────────────────────────────────────────────────

export const sppService = {
  // ── Payments ───────────────────────────────────────────────────────────────

  async getPayments(query?: import('./spp.types').SppPaymentQuery): Promise<SppPaymentListResponse> {
    try {
      const response = await api.get(`${BASE}/pembayaran`, { params: query });
      const data = extractList(response.data).map(normalizePayment);
      return { data, message: 'success' };
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal memuat daftar pembayaran SPP'));
    }
  },

  async getPaymentDetail(id: string): Promise<SppPayment> {
    try {
      const response = await api.get(`${BASE}/pembayaran/${id}`);
      return normalizePayment(extractSingle(response.data));
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal memuat detail pembayaran'));
    }
  },

  async createPayment(data: CreateSppPaymentRequest): Promise<unknown> {
    try {
      const response = await api.post(`${BASE}/pembayaran`, data);
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal mencatat pembayaran'));
    }
  },

  async updatePayment(id: string, data: UpdateSppPaymentRequest): Promise<unknown> {
    try {
      const response = await api.put(`${BASE}/pembayaran/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal memperbarui pembayaran'));
    }
  },

  async verifyPayment(id: string, _payload?: VerifySppPaymentRequest): Promise<unknown> {
    try {
      const body: VerifySppPaymentRequest = { status: 'verified' };
      const response = await api.put(`${BASE}/pembayaran/${id}/verifikasi`, body);
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal memverifikasi pembayaran'));
    }
  },

  async deletePayment(id: string): Promise<unknown> {
    try {
      const response = await api.delete(`${BASE}/pembayaran/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal menghapus pembayaran'));
    }
  },

  async getTunggakanSummary(): Promise<SppTunggakanSummary> {
    try {
      const response = await api.get(`${BASE}/tunggakan-ringkasan`);
      const payments = extractList(response.data).map(normalizePayment);
      const fallback = summarizeFromPayments(payments);
      return normalizeSummaryPayload(response.data, fallback);
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal memuat ringkasan tunggakan'));
    }
  },

  // ── Settings ───────────────────────────────────────────────────────────────

  async getSettings(query?: import('./spp.types').SppSettingQuery): Promise<SppSettingListResponse> {
    try {
      const response = await api.get(`${BASE}/setting`, { params: query });
      const data = extractList(response.data).map(normalizeSetting);
      return { data, message: 'success' };
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal memuat pengaturan SPP'));
    }
  },

  async getSettingDetail(id: string): Promise<SppSetting> {
    try {
      const response = await api.get(`${BASE}/setting/${id}`);
      return normalizeSetting(extractSingle(response.data));
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal memuat detail setting'));
    }
  },

  async createSetting(data: CreateSppSettingRequest): Promise<unknown> {
    try {
      const response = await api.post(`${BASE}/setting`, data);
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal membuat setting SPP'));
    }
  },

  async updateSetting(id: string, data: UpdateSppSettingRequest): Promise<unknown> {
    try {
      const response = await api.put(`${BASE}/setting/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal memperbarui setting SPP'));
    }
  },

  async deleteSetting(id: string): Promise<unknown> {
    try {
      const response = await api.delete(`${BASE}/setting/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal menghapus setting SPP'));
    }
  },

  // ── Golongan ───────────────────────────────────────────────────────────────

  async getGolongan(): Promise<SppGolonganListResponse> {
    try {
      const response = await api.get(`${BASE}/golongan`);
      const data = extractList(response.data).map(normalizeGolongan);
      return { data, message: 'success' };
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal memuat golongan SPP'));
    }
  },
};
