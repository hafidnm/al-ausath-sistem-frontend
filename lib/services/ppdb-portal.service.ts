import api, {
  clearStoredPpdbToken,
  getCsrfToken,
  setPpdbAuthMarker,
  setStoredPpdbToken,
} from '../axios';

const PPDB_PORTAL_BASE_PATH = '/ppdb';
const PPDB_PORTAL_EMAIL_HINT_KEY = 'ppdb_portal_email_hint';
const PPDB_PORTAL_ACCOUNT_ID_HINT_KEY = 'ppdb_portal_account_id_hint';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const PHONE_PATTERN = /^\+?\d{8,15}$/;

import type { TestQuestion } from './ppdb.types';

export type PpdbVerificationStatus = 'Menunggu' | 'Terverifikasi' | 'Diterima' | 'Ditolak';

export type PpdbPortalStep =
  | 'lengkapi-form'
  | 'tes'
  | 'menunggu-pengumuman'
  | 'pengumuman';

export interface PpdbPortalRegisterRequest {
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  namaCalon?: string;
}

export interface PpdbPortalRegisterResponse {
  idPendaftar: string;
  noPendaftaran: string;
  message: string;
}

export interface PpdbPortalLoginRequest {
  login: string;
  password: string;
}

export interface PpdbPortalFormRequest {
  namaCalon?: string;
  namaLengkap?: string;
  program?: string;
  jenjang?: string;
  noHpCalon?: string;
  nomorUmi?: string;
  asalKota?: string;
  asalSekolah?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  jenisKelamin?: string;
  nikCalonSantri?: string;
  alamatLengkap?: string;
  riwayatPenyakit?: string;
  namaAyah?: string;
  penghasilanAyah?: string;
  noHpAyah?: string;
  namaIbu?: string;
  noHpIbu?: string;
  soalJawab?: string;
  suratPernyataanText?: string;
  dokumenAkta?: File | null;
  dokumenKk?: File | null;
  dokumenAktaKk?: File | null;
  dokumenRekomendasiUstadz?: File | null;
  dokumenSuratPernyataan?: File | null;
  fileAktaPath?: string;
  fileKkPath?: string;
  fileSuratRekomendasiPath?: string;
  suratPernyataanSetuju?: 'accepted';
  suratPernyataanFilePath?: string;
  alamat?: string;
  emailPpdb?: string;
  idAkun?: string;
  idPendaftaran?: string;
}

export interface PpdbPortalDashboard {
  idPendaftar: string;
  noPendaftaran: string;
  waktuPendaftaran: string;
  email: string;
  phone: string;
  namaCalon: string;
  namaLengkap: string;
  program: string;
  jenjang: string;
  nomorUmi: string;
  asalKota: string;
  asalSekolah: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  nikCalonSantri: string;
  alamatLengkap: string;
  riwayatPenyakit: string;
  namaAyah: string;
  penghasilanAyah: string;
  noHpAyah: string;
  namaIbu: string;
  noHpIbu: string;
  soalJawab: string;
  suratPernyataanText: string;
  berkasAktaUrl: string;
  berkasKkUrl: string;
  berkasAktaKkUrl: string;
  berkasRekomendasiUstadzUrl: string;
  berkasSuratPernyataanUrl: string;
  alamat: string;
  status: PpdbVerificationStatus;
  tesRequired: boolean;
  tesAvailable: boolean;
  fiturSoalAktif: boolean;
  showHalamanTes: boolean;
  pendaftaranSelesai: boolean;
  soalTes: string;
  tesTitle: string;
  tesDescription: string;
  pengumumanDate: string;
  pengumumanOpen: boolean;
  formCompleted: boolean;
  step: PpdbPortalStep;
}

export interface PpdbPortalTesStatus {
  canAccessTes: boolean;
  showHalamanTes: boolean;
  pendaftaranSelesai: boolean;
  fiturSoalAktif: boolean;
  soalTes: string;
  formSchema?: TestQuestion[];
  tesRequired: boolean;
  tesAvailable: boolean;
  tesFinished: boolean;
  tesSubmitted: boolean;
  tesTitle: string;
  tesDescription: string;
  step: PpdbPortalStep;
  message: string;
}

export interface PpdbPortalTesJawabRequest {
  soalJawab: string;
  idPendaftaran?: string;
}

export interface PpdbPortalAnnouncementResult {
  idPendaftaran: string;
  namaCalon: string;
  status: PpdbVerificationStatus;
  message: string;
}

export interface PpdbPortalPengumumanRekap {
  fileUrl: string;
  fileName: string;
  contentType: string;
}

type ApiRecord = Record<string, unknown>;

const isBrowser = typeof window !== 'undefined';

const toStringOrEmpty = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  return '';
};

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;

  const raw = toStringOrEmpty(value).trim().toLowerCase();
  return ['1', 'true', 'yes', 'y', 'aktif', 'open', 'dibuka', 'required'].includes(raw);
};

const normalizeStatus = (value: unknown): PpdbVerificationStatus => {
  const raw = toStringOrEmpty(value).trim().toLowerCase();

  if (!raw || raw === 'pending' || raw === 'menunggu' || raw === 'process') return 'Menunggu';
  if (
    raw === 'verified' ||
    raw === 'terverifikasi' ||
    raw === 'verifikasi' ||
    raw === 'approved' ||
    raw === 'approve'
  )
    return 'Terverifikasi';
  if (raw === 'accepted' || raw === 'diterima' || raw === 'lulus') return 'Diterima';
  if (raw === 'rejected' || raw === 'ditolak' || raw === 'gagal') return 'Ditolak';

  return 'Menunggu';
};

const toNullableString = (value: unknown): string => toStringOrEmpty(value).trim();

const getPublicApiBaseUrl = (): string => {
  return (process.env.NEXT_PUBLIC_API_URL || '')
    .replace(/\/api\/?$/, '')
    .replace(/\/+$/, '');
};

const resolvePublicFileUrl = (value: unknown): string => {
  const raw = toNullableString(value);

  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('blob:') || raw.startsWith('data:')) return raw;

  const baseApiUrl = getPublicApiBaseUrl();
  const normalizedRaw = raw.replace(/^public\//i, '');

  if (normalizedRaw.startsWith('/storage/')) {
    return baseApiUrl ? `${baseApiUrl}${normalizedRaw}` : normalizedRaw;
  }

  if (normalizedRaw.startsWith('storage/')) {
    return baseApiUrl ? `${baseApiUrl}/${normalizedRaw}` : `/${normalizedRaw}`;
  }

  if (normalizedRaw.startsWith('/')) {
    return baseApiUrl ? `${baseApiUrl}${normalizedRaw}` : normalizedRaw;
  }

  return baseApiUrl
    ? `${baseApiUrl}/storage/${normalizedRaw}`
    : `/storage/${normalizedRaw}`;
};

const resolveRecord = (payload: unknown): ApiRecord => {
  if (!payload || typeof payload !== 'object') return {};

  const record = payload as ApiRecord;
  if (record.data && typeof record.data === 'object') {
    return record.data as ApiRecord;
  }

  return record;
};

const resolveNestedRecord = (record: ApiRecord, key: string): ApiRecord => {
  const value = record[key];
  if (!value || typeof value !== 'object') return {};
  return value as ApiRecord;
};

const hasRecordData = (record: ApiRecord): boolean => Object.keys(record).length > 0;

const resolveNestedRecordCandidates = (record: ApiRecord, keys: string[]): ApiRecord => {
  for (const key of keys) {
    const nested = resolveNestedRecord(record, key);
    if (hasRecordData(nested)) {
      return nested;
    }
  }

  return {};
};

const setStoredPpdbIdentityHints = (identity: { emailPpdb?: string; idAkun?: string }) => {
  if (!isBrowser) return;

  const email = toStringOrEmpty(identity.emailPpdb).trim();
  const idAkun = toStringOrEmpty(identity.idAkun).trim();

  if (email) {
    window.localStorage.setItem(PPDB_PORTAL_EMAIL_HINT_KEY, email);
  }

  if (idAkun) {
    window.localStorage.setItem(PPDB_PORTAL_ACCOUNT_ID_HINT_KEY, idAkun);
  }
};

const getStoredPpdbIdentityHints = (): { emailPpdb: string; idAkun: string } => {
  if (!isBrowser) return { emailPpdb: '', idAkun: '' };

  return {
    emailPpdb: (
      window.localStorage.getItem(PPDB_PORTAL_EMAIL_HINT_KEY) ||
      window.sessionStorage.getItem(PPDB_PORTAL_EMAIL_HINT_KEY) ||
      ''
    ).trim(),
    idAkun: (
      window.localStorage.getItem(PPDB_PORTAL_ACCOUNT_ID_HINT_KEY) ||
      window.sessionStorage.getItem(PPDB_PORTAL_ACCOUNT_ID_HINT_KEY) ||
      ''
    ).trim(),
  };
};

const resolveIdentityFromAuthPayload = (
  payload: unknown,
): { emailPpdb: string; idAkun: string } => {
  const data = resolveRecord(payload);
  const user = resolveNestedRecord(data, 'user');

  const root = payload && typeof payload === 'object' ? (payload as ApiRecord) : {};

  const emailPpdb = toStringOrEmpty(
    user.email_ppdb ?? user.email ?? data.email_ppdb ?? data.email ?? root.email_ppdb ?? root.email,
  ).trim();

  const idAkun = toStringOrEmpty(
    user.id_akun ?? user.user_id ?? data.id_akun ?? data.user_id ?? root.id_akun ?? root.user_id,
  ).trim();

  return { emailPpdb, idAkun };
};

const extractNoPendaftaranFromMessage = (message: string): string => {
  if (!message) return '';

  const match = message.match(/(?:nomor|no)\s*pendaftaran[^A-Za-z0-9]*([A-Za-z0-9\/-]+)/i);
  return match?.[1]?.trim() || '';
};

const extractIdPendaftarFromMessage = (message: string): string => {
  if (!message) return '';

  const match = message.match(/(?:id|kode)\s*pendaftar(?:an)?[^A-Za-z0-9]*([A-Za-z0-9\/-]+)/i);
  return match?.[1]?.trim() || '';
};

const buildPpdbLoginPayloadCandidates = (loginValue: string, password: string): ApiRecord[] => {
  const login = loginValue.trim();

  const authAlias = {
    login,
    login_ppdb: login,
    loginppdb: login,
    auth_loginppdb: login,
  };

  const asEmail = {
    ...authAlias,
    email: login,
  };

  const asNoPendaftaran = {
    ...authAlias,
    no_pendaftaran: login,
    id_pendaftaran: login,
    id_pendaftar: login,
    kode_pendaftaran: login,
    nomor_pendaftaran: login,
    registration_number: login,
    username: login,
  };

  const asIdentifier = {
    ...authAlias,
    identifier: login,
    login_identifier: login,
    credential: login,
    username: login,
  };

  const asPhone = {
    ...authAlias,
    phone_ppdb: login,
  };

  const fallback = {
    ...authAlias,
    email: login,
    username: login,
    phone_ppdb: login,
    identifier: login,
    login_identifier: login,
    credential: login,
    id_pendaftar: login,
    kode_pendaftaran: login,
    nomor_pendaftaran: login,
    registration_number: login,
    id_pendaftaran: login,
    no_pendaftaran: login,
  };

  const looksLikeEmail = EMAIL_PATTERN.test(login);
  const looksLikePhone = PHONE_PATTERN.test(login);

  if (looksLikeEmail) {
    return [
      { ...asEmail, password },
      { ...asIdentifier, password },
      { ...asNoPendaftaran, password },
      { ...fallback, password },
    ];
  }

  if (looksLikePhone) {
    return [
      { ...asPhone, password },
      { ...asIdentifier, password },
      { ...asNoPendaftaran, password },
      { ...fallback, password },
    ];
  }

  return [
    { ...asNoPendaftaran, password },
    { ...asIdentifier, password },
    { ...asEmail, password },
    { ...fallback, password },
  ];
};

const resolveAuthToken = (payload: unknown): string => {
  const data = resolveRecord(payload);
  const tokenRecord =
    data.token && typeof data.token === 'object' ? (data.token as ApiRecord) : {};

  const root = payload && typeof payload === 'object' ? (payload as ApiRecord) : {};

  return (
    toStringOrEmpty(
      data.access_token ??
        data.api_token ??
        data.auth_token ??
        data.bearer_token ??
        data.plain_text_token ??
        data.plainTextToken ??
        data.token,
    ) ||
    toStringOrEmpty(
      tokenRecord.access_token ??
        tokenRecord.api_token ??
        tokenRecord.auth_token ??
        tokenRecord.bearer_token ??
        tokenRecord.plain_text_token ??
        tokenRecord.plainTextToken ??
        tokenRecord.token,
    ) ||
    toStringOrEmpty(
      root.access_token ??
        root.api_token ??
        root.auth_token ??
        root.bearer_token ??
        root.plain_text_token ??
        root.plainTextToken ??
        root.token,
    )
  ).trim();
};

const getHeaderValue = (headers: unknown, key: string): string => {
  if (!headers || typeof headers !== 'object') return '';

  const normalizedKey = key.toLowerCase();
  const headerAccessor = headers as { get?: (name: string) => unknown };

  if (typeof headerAccessor.get === 'function') {
    return toStringOrEmpty(
      headerAccessor.get(key) ?? headerAccessor.get(normalizedKey),
    ).trim();
  }

  const headerRecord = headers as ApiRecord;
  const value =
    headerRecord[key] ??
    headerRecord[normalizedKey] ??
    headerRecord[key.toUpperCase()];

  if (Array.isArray(value)) {
    return toStringOrEmpty(value[0]).trim();
  }

  return toStringOrEmpty(value).trim();
};

const resolveTokenFromAuthorizationHeader = (headerValue: string): string => {
  if (!headerValue) return '';

  const match = headerValue.match(/^bearer\s+(.+)$/i);
  return (match?.[1] || headerValue).trim();
};

const resolveAuthTokenFromResponse = (payload: unknown, headers: unknown): string => {
  const tokenFromBody = resolveAuthToken(payload);
  if (tokenFromBody) return tokenFromBody;

  const authorizationToken = resolveTokenFromAuthorizationHeader(
    getHeaderValue(headers, 'authorization'),
  );
  if (authorizationToken) return authorizationToken;

  return (
    getHeaderValue(headers, 'x-auth-token') ||
    getHeaderValue(headers, 'x-access-token') ||
    getHeaderValue(headers, 'x-api-token')
  );
};

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object') {
    const errObj = error as {
      response?: {
        data?: {
          message?: string;
          error?: string;
          errors?: Record<string, string[]>;
        };
      };
      message?: string;
    };

    const firstFieldError = errObj.response?.data?.errors
      ? Object.values(errObj.response.data.errors).flat()[0]
      : undefined;

    return (
      errObj.response?.data?.message ||
      errObj.response?.data?.error ||
      firstFieldError ||
      errObj.message ||
      fallback
    );
  }

  return fallback;
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

const deriveStep = (
  formCompleted: boolean,
  showHalamanTes: boolean,
  pengumumanOpen: boolean,
  status: PpdbVerificationStatus,
): PpdbPortalStep => {
  if (!formCompleted) return 'lengkapi-form';

  if (status === 'Diterima' || status === 'Ditolak') {
    return 'pengumuman';
  }

  if (showHalamanTes) return 'tes';
  if (pengumumanOpen) return 'pengumuman';
  return 'menunggu-pengumuman';
};

const normalizeDashboard = (payload: unknown): PpdbPortalDashboard => {
  const data = resolveRecord(payload);
  const user = resolveNestedRecord(data, 'user');

  const pendaftar = resolveNestedRecordCandidates(data, [
    'pendaftar',
    'peserta',
    'calon',
    'calon_santri',
    'profil',
    'profile',
    'biodata',
    'identitas',
  ]);

  const profile = hasRecordData(pendaftar)
    ? pendaftar
    : hasRecordData(user)
      ? user
      : data;

  const identityFromProfile = resolveNestedRecordCandidates(profile, [
    'identitas',
    'biodata',
    'profil',
    'profile',
  ]);
  const identityFromData = resolveNestedRecordCandidates(data, [
    'identitas',
    'biodata',
    'profil',
    'profile',
  ]);
  const identity = hasRecordData(identityFromProfile) ? identityFromProfile : identityFromData;

  const pendaftaranFromProfile = resolveNestedRecordCandidates(profile, [
    'pendaftaran',
    'data_pendaftaran',
  ]);
  const pendaftaranFromUser = resolveNestedRecordCandidates(user, ['pendaftaran', 'data_pendaftaran']);
  const pendaftaranFromData = resolveNestedRecordCandidates(data, ['pendaftaran', 'data_pendaftaran']);
  const pendaftaran =
    hasRecordData(pendaftaranFromProfile)
      ? pendaftaranFromProfile
      : hasRecordData(pendaftaranFromUser)
        ? pendaftaranFromUser
        : pendaftaranFromData;

  const flow = resolveNestedRecord(data, 'flow');
  const tesData = resolveNestedRecord(data, 'tes');

  const resolvedNamaCalon = toStringOrEmpty(
    profile.nama_calon ??
      identity.nama_calon ??
      profile.nama ??
      identity.nama ??
      profile.name ??
      identity.name ??
      pendaftaran.nama_calon ??
      pendaftaran.nama,
  );

  const resolvedJenjang = toStringOrEmpty(
    profile.jenjang ?? identity.jenjang ?? pendaftaran.jenjang,
  );

  const resolvedNomorUmi = toStringOrEmpty(
    profile.nomor_umi ??
      identity.nomor_umi ??
      profile.wali ??
      identity.wali ??
      profile.nama_wali ??
      identity.nama_wali ??
      pendaftaran.nomor_umi ??
      pendaftaran.wali,
  );

  const resolvedAsalKota = toStringOrEmpty(
    profile.asal_kota ??
      identity.asal_kota ??
      profile.asal ??
      identity.asal ??
      pendaftaran.asal_kota,
  );

  const resolvedAsalSekolah = toStringOrEmpty(
    profile.asalSekolah ??
      profile.asal_sekolah ??
      profile.sekolah_asal ??
      identity.asalSekolah ??
      identity.asal_sekolah ??
      identity.sekolah_asal ??
      pendaftaran.asalSekolah ??
      pendaftaran.asal_sekolah ??
      pendaftaran.sekolah_asal ??
      data.asalSekolah ??
      data.asal_sekolah ??
      data.sekolah_asal,
  );

  const resolvedTempatLahir = toStringOrEmpty(
    profile.tempatLahir ??
      profile.tempat_lahir ??
      identity.tempatLahir ??
      identity.tempat_lahir ??
      pendaftaran.tempatLahir ??
      pendaftaran.tempat_lahir ??
      data.tempatLahir ??
      data.tempat_lahir,
  );

  const resolvedTanggalLahir = toStringOrEmpty(
    profile.tanggalLahir ??
      profile.tanggal_lahir ??
      identity.tanggalLahir ??
      identity.tanggal_lahir ??
      pendaftaran.tanggalLahir ??
      pendaftaran.tanggal_lahir ??
      data.tanggalLahir ??
      data.tanggal_lahir,
  );

  const resolvedJenisKelamin = toStringOrEmpty(
    profile.jenisKelamin ??
      profile.jenis_kelamin ??
      identity.jenisKelamin ??
      identity.jenis_kelamin ??
      pendaftaran.jenisKelamin ??
      pendaftaran.jenis_kelamin ??
      data.jenisKelamin ??
      data.jenis_kelamin,
  );

  const resolvedAlamat = toStringOrEmpty(
    profile.alamatLengkap ??
      profile.alamat_lengkap ??
      profile.alamat ??
      identity.alamatLengkap ??
      identity.alamat_lengkap ??
      identity.alamat ??
      pendaftaran.alamatLengkap ??
      pendaftaran.alamat_lengkap ??
      pendaftaran.alamat ??
      data.alamatLengkap ??
      data.alamat_lengkap ??
      data.alamat,
  );

  const resolvedProgram = toStringOrEmpty(
    profile.program_pendaftaran ??
      profile.program ??
      profile.program_daftar ??
      profile.program_pilihan ??
      identity.program_pendaftaran ??
      identity.program ??
      identity.program_daftar ??
      pendaftaran.program_pendaftaran ??
      pendaftaran.program ??
      pendaftaran.program_daftar,
  );

  const resolvedNikCalonSantri = toStringOrEmpty(
    profile.nik_calon_santri ??
      profile.nik ??
      identity.nik_calon_santri ??
      identity.nik ??
      pendaftaran.nik_calon_santri ??
      pendaftaran.nik,
  );

  const resolvedRiwayatPenyakit = toStringOrEmpty(
    profile.riwayat_penyakit ??
      profile.riwayatPenyakit ??
      identity.riwayat_penyakit ??
      pendaftaran.riwayat_penyakit,
  );

  const resolvedNamaAyah = toStringOrEmpty(
    profile.nama_ayah ?? identity.nama_ayah ?? pendaftaran.nama_ayah,
  );

  const resolvedPenghasilanAyah = toStringOrEmpty(
    profile.penghasilan_ayah ??
      profile.penghasilan ??
      identity.penghasilan_ayah ??
      pendaftaran.penghasilan_ayah ??
      pendaftaran.penghasilan,
  );

  const resolvedNoHpAyah = toStringOrEmpty(
    profile.no_hp_ayah ??
      profile.hp_ayah ??
      profile.no_hp_calon ??
      identity.no_hp_ayah ??
      identity.no_hp_calon ??
      pendaftaran.no_hp_ayah ??
      pendaftaran.no_hp_calon,
  );

  const resolvedNamaIbu = toStringOrEmpty(
    profile.nama_ibu ?? identity.nama_ibu ?? pendaftaran.nama_ibu,
  );

  const resolvedNoHpIbu = toStringOrEmpty(
    profile.no_hp_ibu ??
      profile.hp_ibu ??
      identity.no_hp_ibu ??
      pendaftaran.no_hp_ibu,
  );

  const resolvedSoalJawab = toStringOrEmpty(
    profile.soal_jawab ??
      profile.jawaban_soal ??
      identity.soal_jawab ??
      pendaftaran.soal_jawab,
  );

  const fiturSoalAktif = toBoolean(
    flow.fitur_soal_aktif ??
      flow.fiturSoalAktif ??
      tesData.fitur_soal_aktif ??
      tesData.fiturSoalAktif ??
    data.fitur_soal_aktif ??
      data.fiturSoalAktif ??
      data.tes_aktif ??
      data.soal_aktif ??
      profile.fitur_soal_aktif ??
      pendaftaran.fitur_soal_aktif,
  );

  const soalTes = toStringOrEmpty(
    tesData.soal_tes ??
      tesData.soalTes ??
      tesData.pertanyaan_tes ??
    data.soal_tes ??
      data.soalTes ??
      data.pertanyaan_tes ??
      profile.soal_tes ??
      profile.soalTes ??
      pendaftaran.soal_tes ??
      pendaftaran.soalTes,
  );

  const tesFinished = toBoolean(
    flow.tes_selesai ??
      flow.tesSelesai ??
      tesData.tes_selesai ??
      tesData.tesSubmitted ??
      tesData.tes_submitted ??
      tesData.jawaban_sudah_diisi ??
    data.tes_selesai ??
      data.tes_sudah_selesai ??
      data.tes_submitted ??
      data.tes_dikerjakan ??
      profile.tes_selesai ??
      profile.tes_submitted ??
      pendaftaran.tes_selesai ??
      pendaftaran.tes_submitted,
  );

  const resolvedSuratPernyataanText = toStringOrEmpty(
    profile.surat_pernyataan_text ??
      profile.surat_pernyataan ??
      identity.surat_pernyataan_text ??
      pendaftaran.surat_pernyataan_text,
  );

  const resolvedBerkasAktaPath = toStringOrEmpty(
    profile.berkas_akta_url ??
      profile.akta_url ??
      profile.file_akta ??
      profile.file_akta_path ??
      identity.berkas_akta_url ??
      identity.file_akta_path ??
      pendaftaran.berkas_akta_url ??
      pendaftaran.file_akta_path,
  );

  const resolvedBerkasKkPath = toStringOrEmpty(
    profile.berkas_kk_url ??
      profile.kk_url ??
      profile.file_kk ??
      profile.file_kk_path ??
      identity.berkas_kk_url ??
      identity.file_kk_path ??
      pendaftaran.berkas_kk_url ??
      pendaftaran.file_kk_path,
  );

  const resolvedBerkasAktaKkPath = toStringOrEmpty(
    profile.berkas_akta_kk_url ??
      profile.akta_kk_url ??
      profile.file_akta_kk ??
      identity.berkas_akta_kk_url ??
      pendaftaran.berkas_akta_kk_url,
  );

  const resolvedBerkasRekomendasiUstadzPath = toStringOrEmpty(
    profile.berkas_rekomendasi_ustadz_url ??
      profile.rekomendasi_ustadz_url ??
      profile.file_rekomendasi_ustadz ??
      profile.file_surat_rekomendasi_path ??
      identity.berkas_rekomendasi_ustadz_url ??
      identity.file_surat_rekomendasi_path ??
      pendaftaran.berkas_rekomendasi_ustadz_url ??
      pendaftaran.file_surat_rekomendasi_path,
  );

  const resolvedBerkasSuratPernyataanPath = toStringOrEmpty(
    profile.berkas_surat_pernyataan_url ??
      profile.file_surat_pernyataan ??
      profile.surat_pernyataan_file_path ??
      identity.berkas_surat_pernyataan_url ??
      identity.surat_pernyataan_file_path ??
      pendaftaran.berkas_surat_pernyataan_url ??
      pendaftaran.surat_pernyataan_file_path,
  );

  const resolvedEmail = toStringOrEmpty(
    profile.email_ppdb ??
      profile.email ??
      user.email_ppdb ??
      user.email ??
      identity.email_ppdb ??
      identity.email ??
      data.email_ppdb ??
      data.email,
  );

  const resolvedPhone = toStringOrEmpty(
    profile.phone_ppdb ??
      profile.phone ??
      profile.no_hp ??
      user.phone_ppdb ??
      user.phone ??
      user.no_hp ??
      identity.phone_ppdb ??
      identity.phone ??
      data.phone_ppdb ??
      data.phone,
  );

  const idPendaftar =
    toStringOrEmpty(
      profile.id_pendaftaran ??
        profile.pendaftaran_id ??
        profile.id_pendaftar ??
        identity.id_pendaftaran ??
        identity.pendaftaran_id ??
        identity.id_pendaftar ??
        user.id_pendaftaran ??
        user.pendaftaran_id ??
        user.id_pendaftar ??
        profile.id ??
        pendaftaran.id_pendaftaran ??
        pendaftaran.pendaftaran_id ??
        pendaftaran.id ??
        data.id_pendaftaran ??
        data.pendaftaran_id ??
        data.id,
    ) || '-';

  const noPendaftaran =
    toStringOrEmpty(
      profile.no_pendaftaran ??
        profile.noPendaftaran ??
        profile.kode_pendaftaran ??
        profile.no_pendaftaran_final ??
        profile.nomor_pendaftaran ??
        profile.registration_number ??
        pendaftaran.no_pendaftaran ??
        pendaftaran.noPendaftaran ??
        pendaftaran.kode_pendaftaran ??
        pendaftaran.no_pendaftaran_final ??
        pendaftaran.nomor_pendaftaran ??
        pendaftaran.registration_number ??
        data.no_pendaftaran ??
        data.no_pendaftaran_final ??
        data.nomor_pendaftaran ??
        data.registration_number ??
        data.noPendaftaran,
    ) || idPendaftar;

  const status = normalizeStatus(
    profile.status_verifikasi ??
      profile.hasil_verifikasi ??
      identity.status_verifikasi ??
      identity.hasil_verifikasi ??
      pendaftaran.status_verifikasi ??
      pendaftaran.hasil_verifikasi ??
      profile.status ??
      identity.status ??
      pendaftaran.status ??
      data.status_verifikasi ??
      data.hasil_verifikasi ??
      data.status,
  );

  const formCompleted =
    toBoolean(
      flow.is_form_lengkap ??
        flow.isFormLengkap ??
        data.is_form_lengkap ??
        data.form_completed ??
        data.pendaftaran_selesai,
    )
      ? true
      : Boolean(
          resolvedNamaCalon &&
            resolvedJenjang &&
            resolvedNikCalonSantri &&
            resolvedAlamat,
        );

  const explicitShowHalamanTes = toBoolean(
    flow.show_halaman_tes ??
      flow.showHalamanTes ??
      tesData.show_halaman_tes ??
      tesData.showHalamanTes ??
      tesData.can_access_tes,
  );

  const tesRequired = explicitShowHalamanTes
    ? true
    : toBoolean(
      flow.tes_required ??
        flow.tesRequired ??
        tesData.tes_required ??
        tesData.tesRequired ??
        data.tes_required ??
        data.tes_wajib ??
        data.has_tes ??
        data.is_tes_required ??
        profile.tes_required ??
        pendaftaran.tes_required,
    );

  const tesAvailable = toBoolean(
    flow.tes_available ??
      flow.tesAvailable ??
      tesData.soal_tersedia ??
      tesData.tes_available ??
      tesData.tesAvailable ??
    data.tes_available ??
      data.tes_dibuka ??
      data.tes_ready ??
      data.can_access_tes ??
      profile.tes_available ??
      pendaftaran.tes_available,
  );

  const derivedShowHalamanTes = Boolean(
    formCompleted
      && fiturSoalAktif
      && soalTes.trim().length > 0
      && tesRequired
      && !tesFinished,
  );

  const hasExplicitShowHalamanTes =
    flow.show_halaman_tes !== undefined
    || flow.showHalamanTes !== undefined
    || tesData.show_halaman_tes !== undefined
    || tesData.showHalamanTes !== undefined
    || tesData.can_access_tes !== undefined;

  const showHalamanTes = hasExplicitShowHalamanTes
    ? explicitShowHalamanTes
    : derivedShowHalamanTes;

  const pendaftaranSelesaiFlag = toBoolean(
    flow.pendaftaran_selesai ??
      flow.pendaftaranSelesai ??
      data.pendaftaran_selesai ??
      data.pendaftaranSelesai ??
      profile.pendaftaran_selesai ??
      pendaftaran.pendaftaran_selesai,
  );

  const hasExplicitPendaftaranSelesai =
    flow.pendaftaran_selesai !== undefined
    || flow.pendaftaranSelesai !== undefined
    || data.pendaftaran_selesai !== undefined
    || data.pendaftaranSelesai !== undefined;

  const pendaftaranSelesai = hasExplicitPendaftaranSelesai
    ? pendaftaranSelesaiFlag
    : (!showHalamanTes && formCompleted);

  const pengumumanOpen = toBoolean(
    flow.is_pengumuman_dibuka ??
      flow.isPengumumanDibuka ??
    data.pengumuman_open ??
      data.pengumuman_dibuka ??
      data.is_pengumuman_open ??
      profile.pengumuman_open ??
      pendaftaran.pengumuman_open,
  );

  const step = deriveStep(formCompleted, showHalamanTes, pengumumanOpen, status);

  return {
    idPendaftar,
    noPendaftaran,
    waktuPendaftaran: toStringOrEmpty(
      data.waktu_pendaftaran ??
        data.waktuPendaftaran ??
        data.tanggal_daftar ??
        data.tanggalDaftar ??
        data.registered_at ??
        data.created_at ??
        pendaftaran.waktu_pendaftaran ??
        pendaftaran.waktuPendaftaran ??
        pendaftaran.tanggal_daftar ??
        pendaftaran.tanggalDaftar ??
        pendaftaran.registered_at ??
        pendaftaran.created_at ??
        profile.waktu_pendaftaran ??
        profile.waktuPendaftaran ??
        profile.tanggal_daftar ??
        profile.tanggalDaftar ??
        profile.registered_at ??
        profile.created_at,
    ),
    email: resolvedEmail,
    phone: resolvedPhone,
    namaCalon: resolvedNamaCalon,
    namaLengkap: resolvedNamaCalon,
    program: resolvedProgram,
    jenjang: resolvedJenjang,
    nomorUmi: resolvedNomorUmi,
    asalKota: resolvedAsalKota,
    asalSekolah: resolvedAsalSekolah,
    tempatLahir: resolvedTempatLahir,
    tanggalLahir: resolvedTanggalLahir,
    jenisKelamin: resolvedJenisKelamin,
    nikCalonSantri: resolvedNikCalonSantri,
    alamatLengkap: resolvedAlamat,
    riwayatPenyakit: resolvedRiwayatPenyakit,
    namaAyah: resolvedNamaAyah,
    penghasilanAyah: resolvedPenghasilanAyah,
    noHpAyah: resolvedNoHpAyah,
    namaIbu: resolvedNamaIbu,
    noHpIbu: resolvedNoHpIbu,
    soalJawab: resolvedSoalJawab,
    suratPernyataanText: resolvedSuratPernyataanText,
    berkasAktaUrl: resolvePublicFileUrl(resolvedBerkasAktaPath || resolvedBerkasAktaKkPath),
    berkasKkUrl: resolvePublicFileUrl(resolvedBerkasKkPath || resolvedBerkasAktaKkPath),
    berkasAktaKkUrl: resolvePublicFileUrl(resolvedBerkasAktaKkPath),
    berkasRekomendasiUstadzUrl: resolvePublicFileUrl(resolvedBerkasRekomendasiUstadzPath),
    berkasSuratPernyataanUrl: resolvePublicFileUrl(resolvedBerkasSuratPernyataanPath),
    alamat: resolvedAlamat,
    status,
    tesRequired,
    tesAvailable,
    fiturSoalAktif,
    showHalamanTes,
    pendaftaranSelesai,
    soalTes,
    tesTitle: toStringOrEmpty(
      tesData.tes_title ??
        tesData.judul_tes ??
        data.tes_title ??
        data.judul_tes ??
        profile.tes_title ??
        pendaftaran.tes_title,
    ),
    tesDescription: toStringOrEmpty(
      tesData.tes_description ??
        tesData.deskripsi_tes ??
        data.tes_description ??
        data.deskripsi_tes ??
        profile.tes_description ??
        pendaftaran.tes_description,
    ),
    pengumumanDate: toStringOrEmpty(
      data.pengumuman_date ??
        data.tanggal_pengumuman ??
        profile.tanggal_pengumuman ??
        pendaftaran.tanggal_pengumuman,
    ),
    pengumumanOpen,
    formCompleted,
    step,
  };
};

const normalizeAnnouncement = (payload: unknown): PpdbPortalAnnouncementResult => {
  const data = resolveRecord(payload);

  return {
    idPendaftaran: toStringOrEmpty(
      data.no_pendaftaran ?? data.id_pendaftaran ?? data.noPendaftaran,
    ),
    namaCalon: toStringOrEmpty(data.nama_calon ?? data.nama ?? data.name),
    status: normalizeStatus(data.status_verifikasi ?? data.hasil_verifikasi ?? data.status),
    message: toStringOrEmpty(data.message ?? (payload as ApiRecord)?.message),
  };
};

const normalizeTesStatus = (payload: unknown): PpdbPortalTesStatus => {
  const data = resolveRecord(payload);
  const pendaftar = resolveNestedRecordCandidates(data, ['pendaftar', 'peserta', 'calon', 'profil', 'profile']);
  const source = hasRecordData(pendaftar) ? pendaftar : data;

  const soalTes = toStringOrEmpty(
    data.soal_tes ??
      data.soalTes ??
      data.pertanyaan_tes ??
      source.soal_tes ??
      source.soalTes ??
      source.pertanyaan_tes,
  );

  let formSchema: TestQuestion[] | undefined = undefined;
  try {
    const rawSchema = data.form_schema ?? data.formSchema ?? source.form_schema ?? source.formSchema;
    if (typeof rawSchema === 'string') {
      formSchema = JSON.parse(rawSchema);
    } else if (Array.isArray(rawSchema)) {
      formSchema = rawSchema;
    }
  } catch (err) {
    console.warn('Failed to parse form schema', err);
  }

  const tesRequired = toBoolean(
    data.tes_required ??
      data.tes_wajib ??
      data.has_tes ??
      data.is_tes_required ??
      source.tes_required,
  );

  const fiturSoalAktif = toBoolean(
    data.fitur_soal_aktif ??
      data.fiturSoalAktif ??
      data.tes_aktif ??
      source.fitur_soal_aktif ??
      source.fiturSoalAktif,
  );

  const tesSubmitted = toBoolean(
    data.tes_submitted ??
      data.tes_selesai ??
      data.tes_sudah_selesai ??
      source.tes_submitted ??
      source.tes_selesai,
  );

  const showHalamanTes = toBoolean(
    data.show_halaman_tes ??
      data.showHalamanTes ??
      data.can_access_tes ??
      source.show_halaman_tes ??
      source.can_access_tes,
  );

  const pendaftaranSelesai = toBoolean(
    data.pendaftaran_selesai ??
      data.pendaftaranSelesai ??
      source.pendaftaran_selesai ??
      source.pendaftaranSelesai,
  );

  const tesAvailable = toBoolean(
    data.tes_available ??
      data.tes_dibuka ??
      data.tes_ready ??
      data.can_access_tes ??
      source.tes_available ??
      source.can_access_tes,
  );

  const canAccessTes = Boolean(showHalamanTes || (tesRequired && fiturSoalAktif && soalTes && !tesSubmitted));
  const step = canAccessTes ? 'tes' : pendaftaranSelesai ? 'menunggu-pengumuman' : 'lengkapi-form';

  return {
    canAccessTes,
    showHalamanTes: canAccessTes,
    pendaftaranSelesai,
    fiturSoalAktif,
    soalTes,
    formSchema,
    tesRequired,
    tesAvailable,
    tesFinished: tesSubmitted,
    tesSubmitted,
    tesTitle: toStringOrEmpty(data.tes_title ?? data.judul_tes ?? source.tes_title),
    tesDescription: toStringOrEmpty(data.tes_description ?? data.deskripsi_tes ?? source.tes_description),
    step,
    message: toStringOrEmpty(data.message ?? (payload as ApiRecord)?.message),
  };
};

const isNotFoundAliasError = (error: unknown): boolean => {
  const status = getErrorStatus(error);
  return status === 404 || status === 405;
};

const normalizeRegisterResponse = (payload: unknown): PpdbPortalRegisterResponse => {
  const data = resolveRecord(payload);
  const user = resolveNestedRecord(data, 'user');

  const pendaftar =
    data.pendaftar && typeof data.pendaftar === 'object'
      ? (data.pendaftar as ApiRecord)
      : data.peserta && typeof data.peserta === 'object'
        ? (data.peserta as ApiRecord)
        : Object.keys(user).length > 0
          ? user
      : data;

  const pendaftaranFromPendaftar = resolveNestedRecord(pendaftar, 'pendaftaran');
  const pendaftaranFromData = resolveNestedRecord(data, 'pendaftaran');
  const pendaftaran =
    Object.keys(pendaftaranFromPendaftar).length > 0
      ? pendaftaranFromPendaftar
      : pendaftaranFromData;

  const idPendaftar =
    toStringOrEmpty(
      pendaftar.id_pendaftaran ??
        pendaftar.pendaftaran_id ??
        pendaftar.id ??
        user.id_pendaftaran ??
        user.pendaftaran_id ??
        user.id ??
        pendaftaran.id_pendaftaran ??
        pendaftaran.pendaftaran_id ??
        pendaftaran.id ??
        data.id_pendaftaran ??
        data.pendaftaran_id ??
        data.id,
    ) || '';

  const rootMessage =
    payload && typeof payload === 'object'
      ? toStringOrEmpty((payload as ApiRecord).message)
      : '';

  const message = toStringOrEmpty(data.message) || rootMessage;
  const idFromMessage = extractIdPendaftarFromMessage(message);

  const resolvedIdPendaftar = idPendaftar || idFromMessage || '-';

  const noPendaftaran =
    toStringOrEmpty(
      pendaftar.no_pendaftaran ??
        pendaftar.noPendaftaran ??
        pendaftar.kode_pendaftaran ??
        pendaftar.no_pendaftaran_final ??
        pendaftar.nomor_pendaftaran ??
        pendaftar.registration_number ??
        user.no_pendaftaran ??
        user.noPendaftaran ??
        user.kode_pendaftaran ??
        user.no_pendaftaran_final ??
        user.nomor_pendaftaran ??
        user.registration_number ??
        pendaftaran.no_pendaftaran ??
        pendaftaran.noPendaftaran ??
        pendaftaran.kode_pendaftaran ??
        pendaftaran.no_pendaftaran_final ??
        pendaftaran.nomor_pendaftaran ??
        pendaftaran.registration_number ??
        data.no_pendaftaran ??
        data.no_pendaftaran_final ??
        data.nomor_pendaftaran ??
        data.registration_number ??
        data.noPendaftaran,
    ) ||
    extractNoPendaftaranFromMessage(message) ||
    resolvedIdPendaftar;

  return {
    idPendaftar: resolvedIdPendaftar,
    noPendaftaran,
    message,
  };
};

export const ppdbPortalService = {
  previewNomor: async () => {
    try {
      const response = await api.get(`${PPDB_PORTAL_BASE_PATH}/nomor/preview`);
      const record = resolveRecord(response.data);
      return (
        toStringOrEmpty(
          record.no_pendaftaran ??
            record.no_pendaftaran_final ??
            record.noPendaftaran ??
            record.nomor_pendaftaran ??
            record.registration_number ??
            record.nomor,
        ) ||
        toStringOrEmpty((response.data as ApiRecord)?.message)
      );
    } catch (error) {
      const message = extractErrorMessage(error, 'Gagal mengambil preview nomor pendaftaran');
      throw new Error(message);
    }
  },

  register: async (data: PpdbPortalRegisterRequest): Promise<PpdbPortalRegisterResponse> => {
    const endpointCandidates = [
      `${PPDB_PORTAL_BASE_PATH}/auth/register`,
      `${PPDB_PORTAL_BASE_PATH}/register`,
    ];

    try {
      await getCsrfToken();

      const payload = {
        email_ppdb: data.email,
        phone_ppdb: data.phone,
        password: data.password,
        password_confirmation: data.password_confirmation,
        role: 'ppdb',
        nama_calon: data.namaCalon,
        nama: data.namaCalon,
      };

      let lastError: unknown;

      for (const endpoint of endpointCandidates) {
        try {
          const response = await api.post(endpoint, payload);
          return normalizeRegisterResponse(response.data);
        } catch (error) {
          lastError = error;
          if (!isNotFoundAliasError(error)) {
            throw error;
          }
        }
      }

      throw lastError ?? new Error('Gagal mendaftarkan akun PPDB');
    } catch (error) {
      const message = extractErrorMessage(error, 'Gagal mendaftarkan akun PPDB');
      throw new Error(message);
    }
  },

  login: async (data: PpdbPortalLoginRequest) => {
    let lastError: unknown = null;
    const endpointCandidates = [`${PPDB_PORTAL_BASE_PATH}/auth/login`, `${PPDB_PORTAL_BASE_PATH}/login`];

    try {
      await getCsrfToken();

      const payloadCandidates = buildPpdbLoginPayloadCandidates(data.login, data.password);

      for (const endpoint of endpointCandidates) {
        for (const payload of payloadCandidates) {
          try {
            const response = await api.post(endpoint, payload);
            const authToken = resolveAuthTokenFromResponse(response.data, response.headers);

            const identityFromResponse = resolveIdentityFromAuthPayload(response.data);
            setStoredPpdbIdentityHints({
              emailPpdb:
                identityFromResponse.emailPpdb || (EMAIL_PATTERN.test(data.login) ? data.login : ''),
              idAkun: identityFromResponse.idAkun,
            });

            if (authToken) {
              setStoredPpdbToken(authToken);
            }

            // Marker cookie helps middleware allow PPDB protected pages even when backend session cookie name differs.
            setPpdbAuthMarker();

            return response.data;
          } catch (error) {
            lastError = error;

            const status = getErrorStatus(error);
            if (status === 401 || status === 422) {
              continue;
            }

            if (isNotFoundAliasError(error)) {
              break;
            }

            throw error;
          }
        }
      }

      throw lastError ?? new Error('Login PPDB gagal');
    } catch (error) {
      clearStoredPpdbToken();
      const message = extractErrorMessage(error, 'Login PPDB gagal');
      throw new Error(message);
    }
  },

  getDashboard: async (): Promise<PpdbPortalDashboard> => {
    try {
      const response = await api.get(`${PPDB_PORTAL_BASE_PATH}/dashboard`);
      const normalized = normalizeDashboard(response.data);
      const identityFromResponse = resolveIdentityFromAuthPayload(response.data);

      setStoredPpdbIdentityHints({
        emailPpdb: normalized.email || identityFromResponse.emailPpdb,
        idAkun: identityFromResponse.idAkun,
      });

      return normalized;
    } catch (error) {
      const message = extractErrorMessage(error, 'Gagal memuat dashboard PPDB');
      throw new Error(message);
    }
  },

  getTesStatus: async (): Promise<PpdbPortalTesStatus> => {
    try {
      const response = await api.get(`${PPDB_PORTAL_BASE_PATH}/tes`);
      return normalizeTesStatus(response.data);
    } catch (error) {
      const message = extractErrorMessage(error, 'Gagal memuat status tes PPDB');
      throw new Error(message);
    }
  },

  submitTesJawab: async (data: PpdbPortalTesJawabRequest) => {
    try {
      const payload = {
        soal_jawab: data.soalJawab,
        id_pendaftaran: data.idPendaftaran,
        soalJawab: data.soalJawab,
      };

      const response = await api.put(`${PPDB_PORTAL_BASE_PATH}/tes/jawab`, payload);
      return response.data;
    } catch (error) {
      const message = extractErrorMessage(error, 'Gagal menyimpan jawaban tes PPDB');
      throw new Error(message);
    }
  },

  updateForm: async (data: PpdbPortalFormRequest) => {
    const identityHints = getStoredPpdbIdentityHints();
    const resolvedEmailPpdb =
      toStringOrEmpty(data.emailPpdb).trim() || identityHints.emailPpdb;
    const resolvedIdAkun = toStringOrEmpty(data.idAkun).trim() || identityHints.idAkun;

    const resolvedNoHpCalon = toStringOrEmpty(data.noHpCalon).trim() || toStringOrEmpty(data.noHpAyah).trim();

    const payload = {
      nama_calon: data.namaCalon ?? data.namaLengkap,
      nama: data.namaLengkap ?? data.namaCalon,
      nama_lengkap: data.namaLengkap ?? data.namaCalon,
      program_pendaftaran: data.program,
      program: data.program,
      program_daftar: data.program,
      jenjang: data.jenjang,
      jenis_kelamin: data.jenisKelamin,
      tempat_lahir: data.tempatLahir,
      tanggal_lahir: data.tanggalLahir,
      nik_calon_santri: data.nikCalonSantri,
      nik: data.nikCalonSantri,
      alamat_lengkap: data.alamatLengkap ?? data.alamat,
      alamat: data.alamatLengkap ?? data.alamat,
      riwayat_penyakit: data.riwayatPenyakit,
      nama_ayah: data.namaAyah,
      penghasilan_ayah: data.penghasilanAyah,
      penghasilan: data.penghasilanAyah,
      no_hp_calon: resolvedNoHpCalon,
      no_hp_ayah: data.noHpAyah,
      nama_ibu: data.namaIbu,
      no_hp_ibu: data.noHpIbu,
      file_akta_path: data.fileAktaPath,
      file_kk_path: data.fileKkPath,
      file_surat_rekomendasi_path: data.fileSuratRekomendasiPath,
      surat_pernyataan_setuju: data.suratPernyataanSetuju ?? 'accepted',
      surat_pernyataan_file_path: data.suratPernyataanFilePath,
      surat_pernyataan_text: data.suratPernyataanText,
      surat_pernyataan: data.suratPernyataanText,
      soal_jawab: data.soalJawab,
      jawaban_soal: data.soalJawab,
      nomor_umi: data.nomorUmi,
      asal_kota: data.asalKota,
      asal: data.asalKota,
      asal_sekolah: data.asalSekolah,
      phone_ppdb: resolvedNoHpCalon,
      id_pendaftaran: data.idPendaftaran,
      email_ppdb: resolvedEmailPpdb,
      id_akun: resolvedIdAkun,
      email: resolvedEmailPpdb,
    };

    const hasFilePayload = Boolean(
      data.dokumenAkta ||
        data.dokumenKk ||
        data.dokumenAktaKk ||
        data.dokumenRekomendasiUstadz ||
        data.dokumenSuratPernyataan,
    );

    const requestBody: FormData | ApiRecord = hasFilePayload
      ? (() => {
          const formData = new FormData();

          Object.entries(payload).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              formData.append(key, String(value));
            }
          });

          if (data.dokumenAkta) {
            formData.append('akta', data.dokumenAkta);
            formData.append('berkas_akta', data.dokumenAkta);
          }
          if (data.dokumenKk) {
            formData.append('kk', data.dokumenKk);
            formData.append('berkas_kk', data.dokumenKk);
          }
          if (data.dokumenAktaKk) {
            formData.append('akta_kk', data.dokumenAktaKk);
          }
          if (data.dokumenRekomendasiUstadz) {
            formData.append('surat_rekomendasi_ustadz', data.dokumenRekomendasiUstadz);
          }
          if (data.dokumenSuratPernyataan) {
            formData.append('surat_pernyataan_file', data.dokumenSuratPernyataan);
          }

          return formData;
        })()
      : payload;

    const requestConfig = hasFilePayload
      ? {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      : undefined;

    // Primary endpoint on latest backend.
    try {
      const response = await api.put(
        `${PPDB_PORTAL_BASE_PATH}/form`,
        requestBody,
        requestConfig,
      );
      return response.data;
    } catch (error) {
      const status = getErrorStatus(error);
      if (status !== 404 && status !== 405) {
        const message = extractErrorMessage(error, 'Gagal menyimpan form PPDB');
        throw new Error(message);
      }
    }

    // Backward-compatibility flow for deployments still using upload on legacy form endpoints.
    try {
      const response = await api.post(
        `${PPDB_PORTAL_BASE_PATH}/pendaftaran/create-identitas`,
        requestBody,
        requestConfig,
      );
      return response.data;
    } catch (error) {
      const status = getErrorStatus(error);

      // Backward compatibility for deployments that still use legacy endpoint.
      if (status !== 404 && status !== 405 && status !== 409) {
        const message = extractErrorMessage(error, 'Gagal menyimpan form PPDB');
        throw new Error(message);
      }
    }

    const response = await api.put(`${PPDB_PORTAL_BASE_PATH}/form`, requestBody, requestConfig);
    return response.data;
  },

  getStatus: async (idPendaftaran?: string): Promise<PpdbPortalAnnouncementResult> => {
    try {
      const response = await api.get(`${PPDB_PORTAL_BASE_PATH}/status`, {
        params: idPendaftaran ? { id_pendaftaran: idPendaftaran } : undefined,
      });
      return normalizeAnnouncement(response.data);
    } catch (error) {
      const message = extractErrorMessage(error, 'Gagal mengambil status PPDB');
      throw new Error(message);
    }
  },

  getRekapPengumuman: async (): Promise<PpdbPortalPengumumanRekap> => {
    try {
      const response = await api.get(`${PPDB_PORTAL_BASE_PATH}/pengumuman/rekap`);
      const data = resolveRecord(response.data);

      const fileUrl = toStringOrEmpty(
        data.file_url ?? data.url ?? data.download_url ?? data.link,
      );

      const fileName = toStringOrEmpty(data.file_name ?? data.nama_file ?? data.filename);
      const contentType = toStringOrEmpty(data.content_type ?? data.mime_type);

      if (fileUrl) {
        return {
          fileUrl,
          fileName,
          contentType,
        };
      }
    } catch {
      // Fallback to direct endpoint URL below.
    }

    const baseApiUrl = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
    const fallbackUrl = baseApiUrl
      ? `${baseApiUrl}${PPDB_PORTAL_BASE_PATH}/pengumuman/rekap`
      : `${PPDB_PORTAL_BASE_PATH}/pengumuman/rekap`;

    return {
      fileUrl: fallbackUrl,
      fileName: '',
      contentType: '',
    };
  },
};
