/**
 * Pembayaran Service — unified payment module
 *
 * Base path: /api/administrasi/pembayaran
 *
 * Endpoints (sesuai FE Guide ppdb-spp-frontend-flow.md):
 *   GET    /tagihan               → daftar tagihan semua santri + PPDB
 *   GET    /proses                → proses pembayaran (filter kelas/unit)
 *   GET    /verifikasi            → verifikasi pembayaran
 *   GET    /{id}/detail           → detail invoice
 *   PUT    /{id}/status           → ubah status pembayaran
 *   DELETE /{id}                  → hapus pembayaran
 *   GET    /options               → opsi filter (kelas, unit)
 *   GET    /ringkasan             → ringkasan pembayaran
 */
import api from '../axios';

const BASE = '/administrasi/pembayaran';

type ApiRecord = Record<string, unknown>;

// ─── Types ────────────────────────────────────────────────────────────────────

/** Status pembayaran sesuai FE Guide */
export type StatusPembayaran =
  | 'menunggu_pembayaran'
  | 'menunggu_konfirmasi'
  | 'dibatalkan'
  | 'lunas';

/** Jenis transaksi */
export type JenisTransaksi = 'SPP' | 'PPDB';

/** Row untuk halaman Tagihan (GET /tagihan) */
export interface TagihanRow {
  id: string;
  idSantri: string;
  idPendaftaran: string;
  namaUnit: string;
  nomorInduk: string;
  namaLengkap: string;
  kelasSaatIni: string;
  tahunAjaran: string;
  status: StatusPembayaran;
  totalTagihan: number;
  totalDibayar: number;
  totalTunggakan: number;
  sumber: 'santri' | 'ppdb';
  isAnakGuru: boolean;
}

export interface TagihanDetailResponse {
  profil: {
    id: string;
    sumber: 'santri' | 'ppdb';
    nama_lengkap: string;
    nomor_induk: string;
    nama_unit: string;
    kelas_sekarang: string | null;
    tahun_ajaran: string | null;
    status: string | null;
    isAnakGuru?: boolean;
  };
  ringkasan: {
    jumlah_invoice: number;
    total_tagihan: number;
    total_dibayar: number;
    total_tunggakan: number;
  };
  invoice: Array<{
    id_pembayaran: number;
    nomor_invoice: string;
    periode_tagihan: string | null;
    rincian_tagihan: string | null;
    jumlah_tagihan: number;
    jumlah_dibayar: number;
    jumlah_tunggakan: number;
    status: string;
    status_key: StatusPembayaran;
    status_label: string;
    waktu_invoice: string | null;
    kwitansi_tersedia: boolean;
    kwitansi_url: string | null;
    bukti_bayar_url?: string | null;
    catatan_bayar?: string | null;
  }>;
}

/** Row untuk halaman Proses Pembayaran (GET /proses) */
export interface ProsesRow {
  id: string;
  namaLengkap: string;
  jenisKelamin: string;
  nomorInduk: string;
  unitSaatIni: string;
  kelasSaatIni: string;
  kodeKelas?: string;
  kodeUnit?: string;
  status: StatusPembayaran;
  daftarInvoice: InvoiceItem[];
  isAnakGuru?: boolean;
}

export interface InvoiceItem {
  id: string;
  nomorInvoice: string;
  nominal: number;
  status: StatusPembayaran;
  tanggal: string;
}

/** Row untuk halaman Verifikasi Pembayaran (GET /verifikasi) */
export interface VerifikasiRow {
  id: string;
  namaUnit: string;
  nomorInduk: string;
  namaLengkap: string;
  nomorInvoice: string;
  totalPembayaran: number;
  jenisTransaksi: JenisTransaksi;
  statusPembayaran: StatusPembayaran;
  waktuInvoice: string;
  noHp?: string;
  isAnakGuru?: boolean;
}

/** Detail invoice (GET /{id}/detail) */
export interface PembayaranDetail {
  id: string;
  profilSantri: {
    namaLengkap: string;
    nomorInduk: string;
    kelas: string;
    unit: string;
  };
  informasiInvoice: {
    nomorInvoice: string;
    jenisTransaksi: JenisTransaksi;
    total: number;
    tanggal: string;
    status: StatusPembayaran;
    bukti_bayar_url?: string | null;
    catatan_bayar?: string | null;
  };
  riwayatPembayaran: RiwayatPembayaranItem[];
  tagihanKustom: TagihanKustomItem[];
  informasiKwitansi: {
    tersedia: boolean;
    url?: string;
  } | null;
}

export interface RiwayatPembayaranItem {
  id: string;
  tanggal: string;
  nominal: number;
  metode: string;
  keterangan: string;
}

export interface TagihanKustomItem {
  id: string;
  nama: string;
  nominal: number;
}

/** Request ubah status */
export interface UbahStatusRequest {
  status: StatusPembayaran;
  keterangan?: string;
}

/** Ringkasan pembayaran */
export interface RingkasanPembayaran {
  totalTagihan: number;
  totalDibayar: number;
  totalTunggakan: number;
  menungguKonfirmasi: number;
  lunas: number;
  dibatalkan: number;
}

export interface TunggakanSantri {
  id_santri: string;
  nomor_induk: string;
  nama_santri: string;
  kode_kelas: string;
  jumlah_transaksi_tunggakan: number;
  total_tunggakan: number;
  rincian: {
    id_pembayaran: string;
    id_setting: number;
    nominal_bayar: number;
    tanggal_bayar: string;
    status: StatusPembayaran;
    kategori: string;
  }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toStr = (v: unknown): string => {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'bigint') return String(v);
  return '';
};

const toNum = (v: unknown): number => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    let cleaned = v.replace(/[^\d.,-]/g, '');
    if (cleaned.includes(',') && cleaned.includes('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',')) {
      cleaned = cleaned.replace(',', '.');
    }
    const n = Number(cleaned);
    return isNaN(n) ? 0 : n;
  }
  return 0;
};

const extractList = (payload: unknown): ApiRecord[] => {
  const visited = new Set<unknown>();
  const walk = (value: unknown): ApiRecord[] => {
    if (!value || typeof value !== 'object' || visited.has(value)) return [];
    visited.add(value);
    if (Array.isArray(value)) {
      return value.filter((item): item is ApiRecord => !!item && typeof item === 'object');
    }
    const rec = value as ApiRecord;
    const keys = ['data', 'items', 'list', 'rows', 'tagihan', 'proses', 'verifikasi'];
    for (const key of keys) {
      if (Array.isArray(rec[key])) {
        return (rec[key] as unknown[]).filter(
          (item): item is ApiRecord => !!item && typeof item === 'object',
        );
      }
    }
    for (const key of keys) {
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

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object') {
    const e = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
    return e.response?.data?.message ?? e.response?.data?.error ?? e.message ?? fallback;
  }
  return fallback;
};

/**
 * Normalisasi status pembayaran dari berbagai format backend
 * ke format yang sesuai FE Guide.
 */
const normalizeStatus = (raw: unknown): StatusPembayaran => {
  const s = toStr(raw).trim().toLowerCase().replace(/\s+/g, '_');

  if (['lunas', 'paid', 'selesai', 'terverifikasi', 'verified'].includes(s)) return 'lunas';

  if (
    [
      'menunggu_konfirmasi',
      'menunggu_verifikasi',
      'pending_verification',
      'pending_confirm',
      'tagihan_dibuat',
      'menunggu',
      'pending',
    ].includes(s)
  )
    return 'menunggu_konfirmasi';

  if (['dibatalkan', 'batal', 'cancel', 'cancelled', 'ditolak', 'rejected'].includes(s))
    return 'dibatalkan';

  return 'menunggu_pembayaran';
};

// ─── Normalizers ──────────────────────────────────────────────────────────────

const normalizeTagihanRow = (item: ApiRecord): TagihanRow => ({
  id: toStr(
    item.id_santri
      ?? item.idSantri
      ?? item.id_pendaftaran
      ?? item.idPendaftaran
      ?? item.id
      ?? item.id_pembayaran
      ?? item.id_tagihan
      ?? '',
  ),
  idSantri: toStr(item.id_santri ?? item.idSantri ?? ''),
  idPendaftaran: toStr(item.id_pendaftaran ?? item.idPendaftaran ?? ''),
  namaUnit: toStr(item.nama_unit ?? item.namaUnit ?? item.unit ?? item.jenjang ?? '-'),
  nomorInduk: toStr(item.nomor_induk ?? item.nomorInduk ?? item.nis ?? item.nisn ?? '-'),
  namaLengkap: toStr(item.nama_lengkap ?? item.namaLengkap ?? item.nama ?? '-'),
  kelasSaatIni: toStr(item.kelas_saat_ini ?? item.kelas_sekarang ?? item.kelasSaatIni ?? item.kelas ?? '-'),
  tahunAjaran: toStr(item.tahun_ajaran ?? item.tahunAjaran ?? item.periode ?? '-'),
  status: normalizeStatus(item.status ?? item.status_pembayaran ?? ''),
  totalTagihan: toNum(item.total_tagihan ?? item.totalTagihan ?? item.nominal ?? 0),
  totalDibayar: toNum(item.total_dibayar ?? item.totalDibayar ?? item.terbayar ?? 0),
  totalTunggakan: toNum(
    item.total_tunggakan ??
      item.totalTunggakan ??
      item.sisa ??
      Math.max(
        toNum(item.total_tagihan ?? item.nominal ?? 0) -
          toNum(item.total_dibayar ?? item.terbayar ?? 0),
        0,
      ),
  ),
  sumber: toStr(item.sumber ?? '').toLowerCase().includes('ppdb') ? 'ppdb' : 'santri',
  isAnakGuru: Boolean(item.is_anak_guru ?? item.isAnakGuru ?? false),
});

const normalizeVerifikasiRow = (item: ApiRecord): VerifikasiRow => {
  // BE sends "Administrasi PPDB" or "Tagihan" for jenis_transaksi.
  // Use `.includes('PPDB')` (case-insensitive) instead of strict equality.
  const jenisRaw = toStr(item.jenis_transaksi ?? item.jenisTransaksi ?? item.jenis ?? '');
  return {
    id: toStr(item.id ?? item.id_pembayaran ?? ''),
    namaUnit: toStr(item.nama_unit ?? item.namaUnit ?? item.unit ?? item.jenjang ?? '-'),
    nomorInduk: toStr(item.nomor_induk ?? item.nomorInduk ?? item.nis ?? '-'),
    namaLengkap: toStr(item.nama_lengkap ?? item.namaLengkap ?? item.nama ?? '-'),
    nomorInvoice: toStr(item.nomor_invoice ?? item.nomorInvoice ?? item.no_tagihan ?? '-'),
    totalPembayaran: toNum(item.total_pembayaran ?? item.totalPembayaran ?? item.nominal_bayar ?? item.nominal ?? 0),
    jenisTransaksi: jenisRaw.toUpperCase().includes('PPDB') ? 'PPDB' : 'SPP',
    statusPembayaran: normalizeStatus(item.status_pembayaran ?? item.status_key ?? item.status ?? ''),
    waktuInvoice: toStr(item.waktu_invoice ?? item.waktuInvoice ?? item.tanggal_bayar ?? item.created_at ?? ''),
    noHp: toStr(item.no_hp ?? item.phone ?? item.telepon ?? item.whatsapp ?? ''),
    isAnakGuru: Boolean(item.is_anak_guru ?? item.isAnakGuru ?? false),
  };
};

const normalizeProsesRow = (item: ApiRecord): ProsesRow => {
  // BE endpoint `/proses` returns `invoice` (singular), not `daftar_invoice`.
  // Also accept `invoices` and `daftar_invoice` as fallbacks for robustness.
  const rawInvoices = Array.isArray(item.invoice)
    ? (item.invoice as ApiRecord[])
    : Array.isArray(item.daftar_invoice)
      ? (item.daftar_invoice as ApiRecord[])
      : Array.isArray(item.invoices)
        ? (item.invoices as ApiRecord[])
        : [];

  return {
    id: toStr(item.id ?? item.id_santri ?? ''),
    namaLengkap: toStr(item.nama_lengkap ?? item.namaLengkap ?? item.nama ?? '-'),
    jenisKelamin: toStr(item.jenis_kelamin ?? item.jenisKelamin ?? '-'),
    nomorInduk: toStr(item.nomor_induk ?? item.nomorInduk ?? item.nis ?? '-'),
    unitSaatIni: toStr(item.unit_sekarang ?? item.unit_saat_ini ?? item.unitSaatIni ?? item.unit ?? '-'),
    kelasSaatIni: toStr(item.kelas_sekarang ?? item.kelas_saat_ini ?? item.kelasSaatIni ?? item.kelas ?? '-'),
    kodeKelas: toStr(item.kode_kelas ?? ''),
    kodeUnit: toStr(item.kode_unit ?? ''),
    status: normalizeStatus(item.status ?? ''),
    daftarInvoice: rawInvoices.map((inv) => ({
      id: toStr(inv.id_pembayaran ?? inv.id ?? ''),
      nomorInvoice: toStr(inv.nomor_invoice ?? inv.no_tagihan ?? '-'),
      nominal: toNum(inv.jumlah_tagihan ?? inv.nominal_bayar ?? inv.nominal ?? 0),
      status: normalizeStatus(inv.status_key ?? inv.status ?? ''),
      tanggal: toStr(inv.waktu_invoice ?? inv.tanggal ?? inv.created_at ?? ''),
    })),
    isAnakGuru: Boolean(item.is_anak_guru ?? item.isAnakGuru ?? false),
  };
};

// ─── Service ──────────────────────────────────────────────────────────────────

export const pembayaranService = {
  /** GET /api/administrasi/pembayaran/tagihan — daftar tagihan semua entitas */
  async getTagihan(params?: { nomor_induk?: string; q?: string; page?: number; per_page?: number }): Promise<{ data: TagihanRow[] }> {
    try {
      const response = await api.get(`${BASE}/tagihan`, { params });
      const data = extractList(response.data).map(normalizeTagihanRow);
      return { data, meta: response.data.meta };
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal memuat daftar tagihan'));
    }
  },

  /** GET /api/administrasi/pembayaran/tagihan/{id}/detail */
  async getTagihanDetail(id: string): Promise<TagihanDetailResponse> {
    try {
      const response = await api.get(`${BASE}/tagihan/${id}/detail`);
      const raw = extractSingle(response.data);

      return {
        profil: {
          id: toStr((raw.profil as ApiRecord)?.id ?? id),
          sumber: toStr((raw.profil as ApiRecord)?.sumber).toLowerCase() === 'ppdb' ? 'ppdb' : 'santri',
          nama_lengkap: toStr((raw.profil as ApiRecord)?.nama_lengkap ?? '-'),
          nomor_induk: toStr((raw.profil as ApiRecord)?.nomor_induk ?? '-'),
          nama_unit: toStr((raw.profil as ApiRecord)?.nama_unit ?? '-'),
          kelas_sekarang: toStr((raw.profil as ApiRecord)?.kelas_sekarang ?? '') || null,
          tahun_ajaran: toStr((raw.profil as ApiRecord)?.tahun_ajaran ?? '') || null,
          status: toStr((raw.profil as ApiRecord)?.status ?? '') || null,
          isAnakGuru: Boolean((raw.profil as ApiRecord)?.is_anak_guru ?? (raw.profil as ApiRecord)?.isAnakGuru ?? false),
        },
        ringkasan: {
          jumlah_invoice: toNum((raw.ringkasan as ApiRecord)?.jumlah_invoice ?? 0),
          total_tagihan: toNum((raw.ringkasan as ApiRecord)?.total_tagihan ?? 0),
          total_dibayar: toNum((raw.ringkasan as ApiRecord)?.total_dibayar ?? 0),
          total_tunggakan: toNum((raw.ringkasan as ApiRecord)?.total_tunggakan ?? 0),
        },
        invoice: Array.isArray(raw.invoice)
          ? (raw.invoice as ApiRecord[]).map((item) => ({
              id_pembayaran: toNum(item.id_pembayaran ?? 0),
              nomor_invoice: toStr(item.nomor_invoice ?? '-'),
              periode_tagihan: toStr(item.periode_tagihan ?? '') || null,
              rincian_tagihan: toStr(item.rincian_tagihan ?? '') || null,
              jumlah_tagihan: toNum(item.jumlah_tagihan ?? 0),
              jumlah_dibayar: toNum(item.jumlah_dibayar ?? 0),
              jumlah_tunggakan: toNum(item.jumlah_tunggakan ?? 0),
              status: toStr(item.status ?? ''),
              status_key: normalizeStatus(item.status_key ?? item.status ?? ''),
              status_label: toStr(item.status_label ?? '-'),
              waktu_invoice: toStr(item.waktu_invoice ?? '') || null,
              kwitansi_tersedia: Boolean(item.kwitansi_tersedia ?? false),
              kwitansi_url: toStr(item.kwitansi_url ?? '') || null,
              bukti_bayar_url: toStr(item.bukti_bayar_url ?? '') || null,
              catatan_bayar: toStr(item.catatan_bayar ?? '') || null,
            }))
          : [],
      };
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal memuat detail tagihan'));
    }
  },

  /** GET /api/administrasi/pembayaran/proses — proses pembayaran per santri */
  async getProses(params?: { kode_unit?: string; kode_kelas?: string; search?: string; status?: string; page?: number; per_page?: number }): Promise<{ data: ProsesRow[]; meta?: any }> {
    try {
      const response = await api.get(`${BASE}/proses`, { params });
      const data = extractList(response.data).map(normalizeProsesRow);
      return { data, meta: response.data?.meta };
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal memuat data proses pembayaran'));
    }
  },

  /** GET /api/administrasi/pembayaran/verifikasi — daftar pembayaran untuk diverifikasi */
  async getVerifikasi(): Promise<{ data: VerifikasiRow[] }> {
    try {
      const response = await api.get(`${BASE}/verifikasi`);
      const data = extractList(response.data).map(normalizeVerifikasiRow);
      return { data };
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal memuat data verifikasi pembayaran'));
    }
  },

  /** GET /api/administrasi/pembayaran/{id}/detail */
  async getDetail(id: string): Promise<PembayaranDetail> {
    try {
      const response = await api.get(`${BASE}/${id}/detail`);
      const raw = extractSingle(response.data);
      const profil = (raw.profil_santri ?? raw.profilSantri ?? raw.santri ?? raw) as ApiRecord;
      const invoice = (raw.informasi_invoice ?? raw.informasiInvoice ?? raw.invoice ?? raw) as ApiRecord;
      const kwitansi = (raw.informasi_kwitansi ?? raw.kwitansi ?? null) as ApiRecord | null;

      return {
        id: toStr(raw.id ?? id),
        profilSantri: {
          namaLengkap: toStr(profil.nama_lengkap ?? profil.namaLengkap ?? profil.nama ?? '-'),
          nomorInduk: toStr(profil.nomor_induk ?? profil.nomorInduk ?? profil.nis ?? '-'),
          kelas: toStr(profil.kelas ?? '-'),
          unit: toStr(profil.unit ?? profil.jenjang ?? '-'),
        },
        informasiInvoice: {
          nomorInvoice: toStr(invoice.nomor_invoice ?? invoice.nomorInvoice ?? invoice.no_tagihan ?? '-'),
          jenisTransaksi:
            // BE may send "Administrasi PPDB" — use contains check
            toStr(invoice.jenis_transaksi ?? invoice.jenisTransaksi ?? '').toUpperCase().includes('PPDB')
              ? 'PPDB'
              : 'SPP',
          // BE sends `nominal_bayar`, not `total`
          total: toNum(invoice.nominal_bayar ?? invoice.total ?? invoice.nominal ?? 0),
          // BE sends `tanggal_bayar`, not `tanggal`
          tanggal: toStr(invoice.tanggal_bayar ?? invoice.tanggal ?? invoice.created_at ?? ''),
          status: normalizeStatus(invoice.status_key ?? invoice.status ?? raw.status ?? ''),
          bukti_bayar_url: toStr(invoice.bukti_bayar_url ?? '') || null,
          catatan_bayar: toStr(invoice.catatan_bayar ?? '') || null,
        },
        riwayatPembayaran: Array.isArray(raw.riwayat_pembayaran ?? raw.riwayat)
          ? ((raw.riwayat_pembayaran ?? raw.riwayat) as ApiRecord[]).map((r) => ({
              id: toStr(r.id ?? ''),
              tanggal: toStr(r.tanggal ?? r.created_at ?? ''),
              nominal: toNum(r.nominal ?? r.jumlah ?? 0),
              metode: toStr(r.metode ?? r.metode_bayar ?? '-'),
              keterangan: toStr(r.keterangan ?? '-'),
            }))
          : [],
        tagihanKustom: Array.isArray(raw.tagihan_kustom ?? raw.tagihanKustom)
          ? ((raw.tagihan_kustom ?? raw.tagihanKustom) as ApiRecord[]).map((t) => ({
              id: toStr(t.id ?? ''),
              nama: toStr(t.nama ?? '-'),
              nominal: toNum(t.nominal ?? 0),
            }))
          : [],
        informasiKwitansi: kwitansi
          ? {
              tersedia: Boolean(kwitansi.tersedia ?? kwitansi.url),
              url: toStr(kwitansi.url ?? kwitansi.kwitansi_url ?? '') || undefined,
            }
          : null,
      };
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal memuat detail pembayaran'));
    }
  },

  /** PUT /api/administrasi/pembayaran/{id}/status */
  async ubahStatus(id: string, payload: UbahStatusRequest): Promise<unknown> {
    try {
      const response = await api.put(`${BASE}/${id}/status`, payload);
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal mengubah status pembayaran'));
    }
  },

  /** DELETE /api/administrasi/pembayaran/{id} */
  async hapus(id: string): Promise<unknown> {
    try {
      const response = await api.delete(`${BASE}/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal menghapus pembayaran'));
    }
  },

  /** GET /api/administrasi/pembayaran/ringkasan */
  async getRingkasan(): Promise<RingkasanPembayaran> {
    try {
      const response = await api.get(`${BASE}/ringkasan`);
      const raw = extractSingle(response.data);
      return {
        totalTagihan: toNum(raw.nominal_total ?? raw.total_tagihan ?? raw.totalTagihan ?? 0),
        totalDibayar: toNum(raw.nominal_terverifikasi ?? raw.total_dibayar ?? raw.totalDibayar ?? 0),
        totalTunggakan: toNum(raw.total_tunggakan ?? raw.totalTunggakan ?? 
          (toNum(raw.nominal_total ?? 0) - toNum(raw.nominal_terverifikasi ?? 0))),
        menungguKonfirmasi: toNum(raw.status_menunggu_verifikasi ?? raw.menunggu_konfirmasi ?? raw.menungguKonfirmasi ?? 0),
        lunas: toNum(raw.status_terverifikasi ?? raw.lunas ?? 0),
        dibatalkan: toNum(raw.status_ditolak ?? raw.dibatalkan ?? 0),
      };
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal memuat ringkasan pembayaran'));
    }
  },

  /** GET /api/administrasi/spp/tunggakan-ringkasan (BE route is under /spp/, not /pembayaran/) */
  async getTunggakanSantri(idSantri: string): Promise<TunggakanSantri | null> {
    try {
      const response = await api.get(`/administrasi/spp/tunggakan-ringkasan`, {
        params: { id_santri: idSantri },
      });
      const data = extractList(response.data);
      if (data.length === 0) return null;
      const raw = data[0];
      return {
        id_santri: toStr(raw.id_santri),
        nomor_induk: toStr(raw.nomor_induk),
        nama_santri: toStr(raw.nama_santri),
        kode_kelas: toStr(raw.kode_kelas),
        jumlah_transaksi_tunggakan: toNum(raw.jumlah_transaksi_tunggakan),
        total_tunggakan: toNum(raw.total_tunggakan),
        rincian: Array.isArray(raw.rincian) ? (raw.rincian as ApiRecord[]).map(r => ({
          id_pembayaran: toStr(r.id_pembayaran),
          id_setting: toNum(r.id_setting),
          nominal_bayar: toNum(r.nominal_bayar),
          tanggal_bayar: toStr(r.tanggal_bayar),
          status: normalizeStatus(r.status),
          kategori: toStr(r.kategori ?? '-'),
        })) : [],
      };
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal memuat tunggakan santri'));
    }
  },
};
