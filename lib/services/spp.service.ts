import api from '../axios';

export type SppStatus =
  | 'Lunas'
  | 'Cicilan'
  | 'Belum Bayar'
  | 'Terlambat'
  | 'Menunggu Verifikasi'
  | 'Terverifikasi';

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
  status?: 'verified' | 'rejected' | 'pending';
  verified?: boolean;
  catatan?: string;
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

type ApiRecord = Record<string, unknown>;

const toStringOrEmpty = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  return '';
};

const toNumberOrZero = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = value.replace(/[^\d.,-]/g, '').replace('.', '').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  const normalized = toStringOrEmpty(value).trim().toLowerCase();
  return ['1', 'true', 'yes', 'y', 'aktif', 'active'].includes(normalized);
};

const getErrorStatus = (error: unknown): number | undefined => {
  if (!error || typeof error !== 'object') return undefined;

  const errObj = error as {
    response?: {
      status?: number;
    };
  };

  return errObj.response?.status;
};

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object') {
    const errObj = error as {
      response?: {
        data?: {
          message?: string;
          error?: string;
        };
      };
      message?: string;
    };

    return errObj.response?.data?.message || errObj.response?.data?.error || errObj.message || fallback;
  }

  return fallback;
};

const normalizeBasePath = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, '');
};

const basePathCandidates = [
  process.env.NEXT_PUBLIC_SPP_API_BASE_PATH,
  '/administrasi/spp',
  '/keuangan/spp',
  '/spp',
  '',
]
  .filter((item): item is string => typeof item === 'string')
  .map(normalizeBasePath);

const SPP_BASE_PATHS = Array.from(new Set(basePathCandidates));

const buildPath = (basePath: string, endpoint: string): string => {
  if (!basePath) return endpoint;
  return `${basePath}${endpoint}`;
};

const shouldTryNextBasePath = (error: unknown): boolean => {
  const status = getErrorStatus(error);
  return status === 404 || status === 405;
};

const requestWithBasePathFallback = async <T>(
  callback: (basePath: string) => Promise<T>,
): Promise<T> => {
  let lastError: unknown;

  for (let index = 0; index < SPP_BASE_PATHS.length; index += 1) {
    try {
      return await callback(SPP_BASE_PATHS[index]);
    } catch (error) {
      lastError = error;

      const isLast = index === SPP_BASE_PATHS.length - 1;
      if (!shouldTryNextBasePath(error) || isLast) {
        throw error;
      }
    }
  }

  throw lastError;
};

const isObjectArray = (value: unknown): value is ApiRecord[] => {
  return Array.isArray(value) && value.every((item) => item && typeof item === 'object');
};

const extractList = (payload: unknown): ApiRecord[] => {
  const visited = new Set<unknown>();

  const walk = (value: unknown): ApiRecord[] => {
    if (!value || typeof value !== 'object' || visited.has(value)) {
      return [];
    }

    visited.add(value);

    if (isObjectArray(value)) {
      return value;
    }

    const record = value as ApiRecord;
    const preferredKeys = ['data', 'items', 'list', 'rows', 'pembayaran', 'setting'];

    for (const key of preferredKeys) {
      const candidate = record[key];
      if (isObjectArray(candidate)) {
        return candidate;
      }
    }

    for (const key of preferredKeys) {
      const nested = walk(record[key]);
      if (nested.length > 0) {
        return nested;
      }
    }

    for (const candidate of Object.values(record)) {
      const nested = walk(candidate);
      if (nested.length > 0) {
        return nested;
      }
    }

    return [];
  };

  return walk(payload);
};

const parseDate = (value: string): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const derivePaymentStatus = (
  nominal: number,
  terbayar: number,
  jatuhTempo: string,
): SppStatus => {
  if (nominal > 0 && terbayar >= nominal) return 'Lunas';
  if (terbayar > 0) return 'Cicilan';

  const dueDate = parseDate(jatuhTempo);
  if (dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    if (dueDate < today) return 'Terlambat';
  }

  return 'Belum Bayar';
};

const normalizePaymentStatus = (
  value: unknown,
  nominal: number,
  terbayar: number,
  jatuhTempo: string,
): SppStatus => {
  const raw = toStringOrEmpty(value).trim().toLowerCase();

  if (raw === 'lunas' || raw === 'paid' || raw === 'selesai') return 'Lunas';
  if (
    raw === 'terverifikasi' ||
    raw === 'verified' ||
    raw === 'valid' ||
    raw === 'approved'
  )
    return 'Terverifikasi';
  if (
    raw === 'menunggu verifikasi' ||
    raw === 'menunggu_verifikasi' ||
    raw === 'waiting_verification' ||
    raw === 'pending_verification'
  )
    return 'Menunggu Verifikasi';
  if (raw === 'cicilan' || raw === 'partial' || raw === 'installment') return 'Cicilan';
  if (
    raw === 'belum bayar' ||
    raw === 'belum_bayar' ||
    raw === 'unpaid' ||
    raw === 'pending'
  )
    return 'Belum Bayar';
  if (
    raw === 'terlambat' ||
    raw === 'menunggak' ||
    raw === 'overdue' ||
    raw === 'tunggakan'
  )
    return 'Terlambat';

  return derivePaymentStatus(nominal, terbayar, jatuhTempo);
};

const normalizePayment = (item: ApiRecord): SppPayment => {
  const nominal = toNumberOrZero(
    item.nominal ?? item.nominal_tagihan ?? item.jumlah_tagihan ?? item.biaya_spp,
  );
  const terbayar = toNumberOrZero(
    item.terbayar ?? item.jumlah_bayar ?? item.total_bayar ?? item.jumlah_terbayar,
  );
  const jatuhTempo = toStringOrEmpty(
    item.jatuh_tempo ?? item.jatuhTempo ?? item.tanggal_jatuh_tempo ?? item.due_date,
  );

  const id =
    toStringOrEmpty(item.id ?? item.id_pembayaran ?? item.uuid) ||
    toStringOrEmpty(item.no_tagihan ?? item.noTagihan);

  const status = normalizePaymentStatus(
    item.status ?? item.status_pembayaran ?? item.payment_status,
    nominal,
    terbayar,
    jatuhTempo,
  );

  return {
    id,
    noTagihan:
      toStringOrEmpty(item.no_tagihan ?? item.noTagihan ?? item.invoice_number ?? item.invoice) ||
      id,
    nis: toStringOrEmpty(item.nis ?? item.nisn ?? item.nomor_induk),
    nama: toStringOrEmpty(item.nama ?? item.nama_santri ?? item.name),
    kelas: toStringOrEmpty(item.kelas ?? item.kelas_santri ?? item.rombel),
    bulan: toStringOrEmpty(item.bulan ?? item.periode_bulan ?? item.periode),
    jatuhTempo,
    nominal,
    terbayar,
    status,
    channelPembayaran: toStringOrEmpty(
      item.channel_pembayaran ?? item.metode_pembayaran ?? item.payment_channel,
    ),
    nomorWaPembayaran: toStringOrEmpty(
      item.nomor_wa_pembayaran ?? item.wa_number ?? item.whatsapp,
    ),
    buktiBayarUrl: toStringOrEmpty(
      item.bukti_bayar_url ?? item.payment_proof_url ?? item.bukti_url,
    ),
    kwitansiUrl: toStringOrEmpty(
      item.kwitansi_url ?? item.receipt_url ?? item.invoice_url,
    ),
    verifikasiAt: toStringOrEmpty(
      item.verified_at ?? item.verifikasi_at ?? item.tanggal_verifikasi,
    ),
    catatanVerifikasi: toStringOrEmpty(
      item.catatan_verifikasi ?? item.verification_note ?? item.keterangan_verifikasi,
    ),
  };
};

const normalizeSetting = (item: ApiRecord): SppSetting => {
  const id = toStringOrEmpty(item.id ?? item.id_setting ?? item.uuid);

  const jatuhTempoHariRaw =
    item.jatuh_tempo_hari ?? item.jatuhTempoHari ?? item.hari_jatuh_tempo ?? item.due_day;
  const jatuhTempoHari =
    jatuhTempoHariRaw === null || jatuhTempoHariRaw === undefined
      ? null
      : toNumberOrZero(jatuhTempoHariRaw);

  return {
    id,
    nama: toStringOrEmpty(item.nama ?? item.nama_setting ?? item.nama_unit) || `Setting ${id || '-'}`,
    jenjang: toStringOrEmpty(item.jenjang ?? item.unit ?? item.tingkat),
    kelas: toStringOrEmpty(item.kelas ?? item.nama_kelas),
    tahunAjaran: toStringOrEmpty(item.tahun_ajaran ?? item.tahunAjaran ?? item.periode),
    nominal: toNumberOrZero(item.nominal ?? item.nominal_spp ?? item.biaya),
    jatuhTempoHari,
    aktif: toBoolean(item.aktif ?? item.active ?? item.is_active ?? item.status),
    keterangan: toStringOrEmpty(item.keterangan ?? item.deskripsi ?? item.catatan),
  };
};

const summarizeFromPayments = (payments: SppPayment[]): SppTunggakanSummary => {
  const totalTagihan = payments.length;
  const totalLunas = payments.filter((item) => item.status === 'Lunas').length;
  const totalCicilan = payments.filter((item) => item.status === 'Cicilan').length;
  const totalBelumBayar = payments.filter((item) => item.status === 'Belum Bayar').length;
  const totalTerlambat = payments.filter((item) => item.status === 'Terlambat').length;

  const totalNominal = payments.reduce((sum, item) => sum + item.nominal, 0);
  const totalTerbayar = payments.reduce((sum, item) => sum + item.terbayar, 0);
  const totalSisa = Math.max(totalNominal - totalTerbayar, 0);

  const dueDates = payments
    .map((item) => parseDate(item.jatuhTempo))
    .filter((item): item is Date => Boolean(item))
    .sort((a, b) => a.getTime() - b.getTime());

  const now = new Date();
  const nextDueDate = dueDates.find((item) => item.getTime() >= now.getTime()) ?? dueDates[0] ?? null;

  return {
    periode: '',
    totalTagihan,
    totalLunas,
    totalCicilan,
    totalBelumBayar,
    totalTerlambat,
    totalNominal,
    totalTerbayar,
    totalSisa,
    jatuhTempoBerikutnya: nextDueDate ? nextDueDate.toISOString() : '',
  };
};

const normalizeSummary = (
  payload: unknown,
  fallbackPayments: SppPayment[],
): SppTunggakanSummary => {
  const baseSummary = summarizeFromPayments(fallbackPayments);

  const dataRecord =
    payload && typeof payload === 'object' && (payload as ApiRecord).data && typeof (payload as ApiRecord).data === 'object'
      ? ((payload as ApiRecord).data as ApiRecord)
      : (payload as ApiRecord);

  if (!dataRecord || typeof dataRecord !== 'object') {
    return baseSummary;
  }

  const totalTagihan =
    toNumberOrZero(dataRecord.total_tagihan ?? dataRecord.totalTagihan) || baseSummary.totalTagihan;
  const totalLunas =
    toNumberOrZero(dataRecord.total_lunas ?? dataRecord.totalLunas ?? dataRecord.lunas) ||
    baseSummary.totalLunas;
  const totalCicilan =
    toNumberOrZero(dataRecord.total_cicilan ?? dataRecord.totalCicilan ?? dataRecord.cicilan) ||
    baseSummary.totalCicilan;

  const totalBelumBayar =
    toNumberOrZero(
      dataRecord.total_belum_bayar ?? dataRecord.totalBelumBayar ?? dataRecord.belum_bayar,
    ) || baseSummary.totalBelumBayar;

  const totalTerlambat =
    toNumberOrZero(
      dataRecord.total_terlambat ?? dataRecord.totalTerlambat ?? dataRecord.menunggak,
    ) || baseSummary.totalTerlambat;

  const totalNominal =
    toNumberOrZero(dataRecord.total_nominal ?? dataRecord.totalNominal ?? dataRecord.nominal) ||
    baseSummary.totalNominal;

  const totalTerbayar =
    toNumberOrZero(dataRecord.total_terbayar ?? dataRecord.totalTerbayar ?? dataRecord.terbayar) ||
    baseSummary.totalTerbayar;

  const explicitSisa = toNumberOrZero(dataRecord.total_sisa ?? dataRecord.totalSisa ?? dataRecord.total_tunggakan);
  const totalSisa = explicitSisa || Math.max(totalNominal - totalTerbayar, 0);

  return {
    periode: toStringOrEmpty(dataRecord.periode ?? dataRecord.bulan ?? dataRecord.period),
    totalTagihan,
    totalLunas,
    totalCicilan,
    totalBelumBayar,
    totalTerlambat,
    totalNominal,
    totalTerbayar,
    totalSisa,
    jatuhTempoBerikutnya: toStringOrEmpty(
      dataRecord.jatuh_tempo_berikutnya ?? dataRecord.jatuhTempoBerikutnya ?? dataRecord.next_due_date,
    ) || baseSummary.jatuhTempoBerikutnya,
  };
};

const mapPaymentPayload = (data: CreateSppPaymentRequest | UpdateSppPaymentRequest): ApiRecord => {
  const payload: ApiRecord = {};

  if (data.noTagihan !== undefined) payload.no_tagihan = data.noTagihan;
  if (data.nis !== undefined) payload.nis = data.nis;
  if (data.nama !== undefined) payload.nama = data.nama;
  if (data.kelas !== undefined) payload.kelas = data.kelas;
  if (data.bulan !== undefined) payload.bulan = data.bulan;
  if (data.jatuhTempo !== undefined) payload.jatuh_tempo = data.jatuhTempo;
  if (data.nominal !== undefined) payload.nominal = data.nominal;
  if (data.terbayar !== undefined) payload.terbayar = data.terbayar;
  if (data.status !== undefined) payload.status = data.status;

  return payload;
};

const mapSettingPayload = (data: CreateSppSettingRequest | UpdateSppSettingRequest): ApiRecord => {
  const payload: ApiRecord = {};

  if (data.nama !== undefined) payload.nama = data.nama;
  if (data.jenjang !== undefined) payload.jenjang = data.jenjang;
  if (data.kelas !== undefined) payload.kelas = data.kelas;
  if (data.tahunAjaran !== undefined) payload.tahun_ajaran = data.tahunAjaran;
  if (data.nominal !== undefined) payload.nominal = data.nominal;
  if (data.jatuhTempoHari !== undefined) payload.jatuh_tempo_hari = data.jatuhTempoHari;
  if (data.aktif !== undefined) payload.aktif = data.aktif;
  if (data.keterangan !== undefined) payload.keterangan = data.keterangan;

  return payload;
};

export const sppService = {
  getTunggakanSummary: async (): Promise<SppTunggakanSummary> => {
    const pathCandidates = ['/tunggakan-ringkasan', '/tunggakan'];
    let lastError: unknown;

    for (const path of pathCandidates) {
      try {
        const response = await requestWithBasePathFallback((basePath) =>
          api.get(buildPath(basePath, path)),
        );

        const normalizedPayments = extractList(response.data).map(normalizePayment);
        return normalizeSummary(response.data, normalizedPayments);
      } catch (error) {
        lastError = error;
        const status = getErrorStatus(error);
        if (status !== 404 && status !== 405) {
          const message = extractErrorMessage(error, 'Failed to fetch tunggakan summary');
          throw new Error(message);
        }
      }
    }

    const message = extractErrorMessage(lastError, 'Failed to fetch tunggakan summary');
    throw new Error(message);
  },

  getPayments: async (): Promise<SppPaymentListResponse> => {
    try {
      const response = await requestWithBasePathFallback((basePath) =>
        api.get(buildPath(basePath, '/pembayaran')),
      );
      const data = extractList(response.data).map(normalizePayment);

      return {
        data,
        message: 'success',
      };
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to fetch SPP payments');
      throw new Error(message);
    }
  },

  getPaymentDetail: async (id: string): Promise<SppPayment> => {
    try {
      const response = await requestWithBasePathFallback((basePath) =>
        api.get(buildPath(basePath, `/pembayaran/${id}`)),
      );

      const payload = response.data as ApiRecord;
      const data =
        payload.data && typeof payload.data === 'object'
          ? (payload.data as ApiRecord)
          : (payload as ApiRecord);

      return normalizePayment(data);
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to fetch payment detail');
      throw new Error(message);
    }
  },

  createPayment: async (data: CreateSppPaymentRequest) => {
    try {
      const payload = mapPaymentPayload(data);
      const response = await requestWithBasePathFallback((basePath) =>
        api.post(buildPath(basePath, '/pembayaran'), payload),
      );
      return response.data;
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to create payment');
      throw new Error(message);
    }
  },

  updatePayment: async (id: string, data: UpdateSppPaymentRequest) => {
    try {
      const payload = mapPaymentPayload(data);
      const response = await requestWithBasePathFallback((basePath) =>
        api.put(buildPath(basePath, `/pembayaran/${id}`), payload),
      );
      return response.data;
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to update payment');
      throw new Error(message);
    }
  },

  verifyPayment: async (id: string, data?: VerifySppPaymentRequest) => {
    try {
      const payload = {
        status: data?.status ?? 'verified',
        verified: data?.verified ?? true,
        catatan: data?.catatan,
      };

      const response = await requestWithBasePathFallback((basePath) =>
        api.put(buildPath(basePath, `/pembayaran/${id}/verifikasi`), payload),
      );
      return response.data;
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to verify payment');
      throw new Error(message);
    }
  },

  deletePayment: async (id: string) => {
    try {
      const response = await requestWithBasePathFallback((basePath) =>
        api.delete(buildPath(basePath, `/pembayaran/${id}`)),
      );
      return response.data;
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to delete payment');
      throw new Error(message);
    }
  },

  getSettings: async (): Promise<SppSettingListResponse> => {
    try {
      const response = await requestWithBasePathFallback((basePath) =>
        api.get(buildPath(basePath, '/setting')),
      );

      const data = extractList(response.data).map(normalizeSetting);

      return {
        data,
        message: 'success',
      };
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to fetch SPP settings');
      throw new Error(message);
    }
  },

  getSettingDetail: async (id: string): Promise<SppSetting> => {
    try {
      const response = await requestWithBasePathFallback((basePath) =>
        api.get(buildPath(basePath, `/setting/${id}`)),
      );

      const payload = response.data as ApiRecord;
      const data =
        payload.data && typeof payload.data === 'object'
          ? (payload.data as ApiRecord)
          : (payload as ApiRecord);

      return normalizeSetting(data);
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to fetch setting detail');
      throw new Error(message);
    }
  },

  createSetting: async (data: CreateSppSettingRequest) => {
    try {
      const payload = mapSettingPayload(data);
      const response = await requestWithBasePathFallback((basePath) =>
        api.post(buildPath(basePath, '/setting'), payload),
      );
      return response.data;
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to create SPP setting');
      throw new Error(message);
    }
  },

  updateSetting: async (id: string, data: UpdateSppSettingRequest) => {
    try {
      const payload = mapSettingPayload(data);
      const response = await requestWithBasePathFallback((basePath) =>
        api.put(buildPath(basePath, `/setting/${id}`), payload),
      );
      return response.data;
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to update SPP setting');
      throw new Error(message);
    }
  },

  deleteSetting: async (id: string) => {
    try {
      const response = await requestWithBasePathFallback((basePath) =>
        api.delete(buildPath(basePath, `/setting/${id}`)),
      );
      return response.data;
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to delete SPP setting');
      throw new Error(message);
    }
  },
};
