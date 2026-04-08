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
  jenjang?: string;
  nomorUmi?: string;
  asalKota?: string;
  asalSekolah?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  jenisKelamin?: string;
  alamat?: string;
  emailPpdb?: string;
  idAkun?: string;
}

export interface PpdbPortalDashboard {
  idPendaftar: string;
  noPendaftaran: string;
  email: string;
  phone: string;
  namaCalon: string;
  jenjang: string;
  nomorUmi: string;
  asalKota: string;
  asalSekolah: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  alamat: string;
  status: PpdbVerificationStatus;
  tesRequired: boolean;
  tesAvailable: boolean;
  tesTitle: string;
  tesDescription: string;
  pengumumanDate: string;
  pengumumanOpen: boolean;
  formCompleted: boolean;
  step: PpdbPortalStep;
}

export interface PpdbPortalAnnouncementResult {
  idPendaftaran: string;
  namaCalon: string;
  status: PpdbVerificationStatus;
  message: string;
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
  tesRequired: boolean,
  pengumumanOpen: boolean,
  status: PpdbVerificationStatus,
): PpdbPortalStep => {
  if (!formCompleted) return 'lengkapi-form';

  if (status === 'Diterima' || status === 'Ditolak') {
    return 'pengumuman';
  }

  if (tesRequired) return 'tes';
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
    profile.asal_sekolah ?? identity.asal_sekolah ?? pendaftaran.asal_sekolah,
  );

  const resolvedTempatLahir = toStringOrEmpty(
    profile.tempat_lahir ?? identity.tempat_lahir ?? pendaftaran.tempat_lahir,
  );

  const resolvedTanggalLahir = toStringOrEmpty(
    profile.tanggal_lahir ?? identity.tanggal_lahir ?? pendaftaran.tanggal_lahir,
  );

  const resolvedJenisKelamin = toStringOrEmpty(
    profile.jenis_kelamin ?? identity.jenis_kelamin ?? pendaftaran.jenis_kelamin,
  );

  const resolvedAlamat = toStringOrEmpty(
    profile.alamat ?? identity.alamat ?? pendaftaran.alamat,
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

  const tesRequired = toBoolean(
    data.tes_required ??
      data.tes_wajib ??
      data.has_tes ??
      data.is_tes_required ??
        profile.tes_required ??
        pendaftaran.tes_required,
  );

  const tesAvailable = toBoolean(
    data.tes_available ??
      data.tes_dibuka ??
      data.tes_ready ??
      profile.tes_available ??
      pendaftaran.tes_available,
  );

  const pengumumanOpen = toBoolean(
    data.pengumuman_open ??
      data.pengumuman_dibuka ??
      data.is_pengumuman_open ??
      profile.pengumuman_open ??
      pendaftaran.pengumuman_open,
  );

  const formCompleted =
    data.form_completed !== undefined
      ? toBoolean(data.form_completed)
      : Boolean(
          resolvedNamaCalon &&
            resolvedJenjang &&
            resolvedNomorUmi &&
            (resolvedAsalKota || resolvedAsalSekolah),
        );

  const step = deriveStep(formCompleted, tesRequired, pengumumanOpen, status);

  return {
    idPendaftar,
    noPendaftaran,
    email: resolvedEmail,
    phone: resolvedPhone,
    namaCalon: resolvedNamaCalon,
    jenjang: resolvedJenjang,
    nomorUmi: resolvedNomorUmi,
    asalKota: resolvedAsalKota,
    asalSekolah: resolvedAsalSekolah,
    tempatLahir: resolvedTempatLahir,
    tanggalLahir: resolvedTanggalLahir,
    jenisKelamin: resolvedJenisKelamin,
    alamat: resolvedAlamat,
    status,
    tesRequired,
    tesAvailable,
    tesTitle: toStringOrEmpty(
      data.tes_title ?? data.judul_tes ?? profile.tes_title ?? pendaftaran.tes_title,
    ),
    tesDescription: toStringOrEmpty(
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
    try {
      await getCsrfToken();

      const payload = {
        email: data.email,
        email_ppdb: data.email,
        phone: data.phone,
        phone_ppdb: data.phone,
        password: data.password,
        password_confirmation: data.password_confirmation,
        nama_calon: data.namaCalon,
        nama: data.namaCalon,
      };

      const response = await api.post(`${PPDB_PORTAL_BASE_PATH}/register`, payload);
      return normalizeRegisterResponse(response.data);
    } catch (error) {
      const message = extractErrorMessage(error, 'Gagal mendaftarkan akun PPDB');
      throw new Error(message);
    }
  },

  login: async (data: PpdbPortalLoginRequest) => {
    let lastError: unknown = null;

    try {
      await getCsrfToken();

      const payloadCandidates = buildPpdbLoginPayloadCandidates(data.login, data.password);

      for (const payload of payloadCandidates) {
        try {
          const response = await api.post(`${PPDB_PORTAL_BASE_PATH}/login`, payload);
          const authToken = resolveAuthTokenFromResponse(response.data, response.headers);

          const identityFromResponse = resolveIdentityFromAuthPayload(response.data);
          setStoredPpdbIdentityHints({
            emailPpdb: identityFromResponse.emailPpdb || (EMAIL_PATTERN.test(data.login) ? data.login : ''),
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
          if (status !== 401 && status !== 422) {
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

  updateForm: async (data: PpdbPortalFormRequest) => {
    const identityHints = getStoredPpdbIdentityHints();
    const resolvedEmailPpdb =
      toStringOrEmpty(data.emailPpdb).trim() || identityHints.emailPpdb;
    const resolvedIdAkun = toStringOrEmpty(data.idAkun).trim() || identityHints.idAkun;

    const payload = {
      nama_calon: data.namaCalon,
      nama: data.namaCalon,
      jenjang: data.jenjang,
      nomor_umi: data.nomorUmi,
      asal_kota: data.asalKota,
      asal: data.asalKota,
      asal_sekolah: data.asalSekolah,
      tempat_lahir: data.tempatLahir,
      tanggal_lahir: data.tanggalLahir,
      jenis_kelamin: data.jenisKelamin,
      alamat: data.alamat,
      email_ppdb: resolvedEmailPpdb,
      id_akun: resolvedIdAkun,
      email: resolvedEmailPpdb,
    };

    // New backend flow: create identity first through dedicated endpoint.
    try {
      const response = await api.post(
        `${PPDB_PORTAL_BASE_PATH}/pendaftaran/create-identitas`,
        payload,
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

    try {
      const response = await api.put(`${PPDB_PORTAL_BASE_PATH}/form`, payload);
      return response.data;
    } catch (error) {
      const message = extractErrorMessage(error, 'Gagal menyimpan form PPDB');
      throw new Error(message);
    }
  },

  cekPengumuman: async (idPendaftaran: string): Promise<PpdbPortalAnnouncementResult> => {
    try {
      const payload = {
        id_pendaftaran: idPendaftaran,
        no_pendaftaran: idPendaftaran,
        id: idPendaftaran,
      };

      const response = await api.post(`${PPDB_PORTAL_BASE_PATH}/pengumuman/cek`, payload);
      return normalizeAnnouncement(response.data);
    } catch (error) {
      const message = extractErrorMessage(error, 'Gagal mengecek pengumuman PPDB');
      throw new Error(message);
    }
  },
};
