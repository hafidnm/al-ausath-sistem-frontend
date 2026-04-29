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
}

/** Row untuk halaman Proses Pembayaran (GET /proses) */
export interface ProsesRow {
  id: string;
  namaLengkap: string;
  jenisKelamin: string;
  nomorInduk: string;
  unitSaatIni: string;
  kelasSaatIni: string;
  status: StatusPembayaran;
  daftarInvoice: InvoiceItem[];
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toStr = (v: unknown): string => {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'bigint') return String(v);
  return '';
};

const toNum = (v: unknown): number => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const parsed = Number(v.replace(/[^\d.]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
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
  id: toStr(item.id ?? item.id_pembayaran ?? item.id_tagihan ?? ''),
  namaUnit: toStr(item.nama_unit ?? item.namaUnit ?? item.unit ?? item.jenjang ?? '-'),
  nomorInduk: toStr(item.nomor_induk ?? item.nomorInduk ?? item.nis ?? item.nisn ?? '-'),
  namaLengkap: toStr(item.nama_lengkap ?? item.namaLengkap ?? item.nama ?? '-'),
  kelasSaatIni: toStr(item.kelas_saat_ini ?? item.kelasSaatIni ?? item.kelas ?? '-'),
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
});

const normalizeVerifikasiRow = (item: ApiRecord): VerifikasiRow => {
  const jenisRaw = toStr(item.jenis_transaksi ?? item.jenisTransaksi ?? item.jenis ?? '').toUpperCase();
  return {
    id: toStr(item.id ?? item.id_pembayaran ?? ''),
    namaUnit: toStr(item.nama_unit ?? item.namaUnit ?? item.unit ?? item.jenjang ?? '-'),
    nomorInduk: toStr(item.nomor_induk ?? item.nomorInduk ?? item.nis ?? '-'),
    namaLengkap: toStr(item.nama_lengkap ?? item.namaLengkap ?? item.nama ?? '-'),
    nomorInvoice: toStr(item.nomor_invoice ?? item.nomorInvoice ?? item.no_tagihan ?? '-'),
    totalPembayaran: toNum(item.total_pembayaran ?? item.totalPembayaran ?? item.nominal ?? 0),
    jenisTransaksi: jenisRaw === 'PPDB' ? 'PPDB' : 'SPP',
    statusPembayaran: normalizeStatus(item.status_pembayaran ?? item.status ?? ''),
    waktuInvoice: toStr(item.waktu_invoice ?? item.waktuInvoice ?? item.created_at ?? ''),
  };
};

const normalizeProsesRow = (item: ApiRecord): ProsesRow => {
  const rawInvoices = Array.isArray(item.daftar_invoice ?? item.invoices)
    ? ((item.daftar_invoice ?? item.invoices) as ApiRecord[])
    : [];

  return {
    id: toStr(item.id ?? item.id_santri ?? ''),
    namaLengkap: toStr(item.nama_lengkap ?? item.namaLengkap ?? item.nama ?? '-'),
    jenisKelamin: toStr(item.jenis_kelamin ?? item.jenisKelamin ?? '-'),
    nomorInduk: toStr(item.nomor_induk ?? item.nomorInduk ?? item.nis ?? '-'),
    unitSaatIni: toStr(item.unit_saat_ini ?? item.unitSaatIni ?? item.unit ?? '-'),
    kelasSaatIni: toStr(item.kelas_saat_ini ?? item.kelasSaatIni ?? item.kelas ?? '-'),
    status: normalizeStatus(item.status ?? ''),
    daftarInvoice: rawInvoices.map((inv) => ({
      id: toStr(inv.id ?? ''),
      nomorInvoice: toStr(inv.nomor_invoice ?? inv.no_tagihan ?? '-'),
      nominal: toNum(inv.nominal ?? 0),
      status: normalizeStatus(inv.status ?? ''),
      tanggal: toStr(inv.tanggal ?? inv.created_at ?? ''),
    })),
  };
};

// ─── Service ──────────────────────────────────────────────────────────────────

export const pembayaranService = {
  /** GET /api/administrasi/pembayaran/tagihan — daftar tagihan semua entitas */
  async getTagihan(): Promise<{ data: TagihanRow[] }> {
    try {
      const response = await api.get(`${BASE}/tagihan`);
      const data = extractList(response.data).map(normalizeTagihanRow);
      return { data };
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal memuat daftar tagihan'));
    }
  },

  /** GET /api/administrasi/pembayaran/proses — proses pembayaran per santri */
  async getProses(params?: { kode_unit?: string; kode_kelas?: string; search?: string }): Promise<{ data: ProsesRow[] }> {
    try {
      const response = await api.get(`${BASE}/proses`, { params });
      const data = extractList(response.data).map(normalizeProsesRow);
      return { data };
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
            toStr(invoice.jenis_transaksi ?? invoice.jenisTransaksi ?? '').toUpperCase() === 'PPDB'
              ? 'PPDB'
              : 'SPP',
          total: toNum(invoice.total ?? invoice.nominal ?? 0),
          tanggal: toStr(invoice.tanggal ?? invoice.created_at ?? ''),
          status: normalizeStatus(invoice.status ?? raw.status ?? ''),
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
        totalTagihan: toNum(raw.total_tagihan ?? raw.totalTagihan ?? 0),
        totalDibayar: toNum(raw.total_dibayar ?? raw.totalDibayar ?? 0),
        totalTunggakan: toNum(raw.total_tunggakan ?? raw.totalTunggakan ?? 0),
        menungguKonfirmasi: toNum(raw.menunggu_konfirmasi ?? raw.menungguKonfirmasi ?? 0),
        lunas: toNum(raw.lunas ?? 0),
        dibatalkan: toNum(raw.dibatalkan ?? 0),
      };
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal memuat ringkasan pembayaran'));
    }
  },
};
