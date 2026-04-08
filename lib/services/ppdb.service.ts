import api from '../axios';

const PPDB_BASE_PATH = '/administrasi/ppdb/pendaftar';
const PPDB_PUBLIC_REGISTER_PATH = '/ppdb/register';

export interface CreatePpdbRequest {
  name: string;
  jenjang: string;
  asalSekolah: string;
  wali: string;
  phone: string;
  tanggalDaftar: string;
  status?: 'Menunggu' | 'Terverifikasi' | 'Diterima' | 'Ditolak';
}

export interface PublicPpdbRegistrationRequest {
  nama_calon: string;
  jenjang: string;
  nomor_umi: string;
  asal_kota: string;
  email_ppdb: string;
  phone_ppdb: string;
  password: string;
  password_confirmation: string;
  no_pendaftaran?: string;
  role?: 'ppdb';
}

export interface UpdatePpdbRequest {
  name?: string;
  jenjang?: string;
  asalSekolah?: string;
  wali?: string;
  phone?: string;
  tanggalDaftar?: string;
  status?: 'Menunggu' | 'Terverifikasi' | 'Diterima' | 'Ditolak';
}

export interface PpdbDetail {
  id: string;
  pendaftaranId?: string;
  userId?: string;
  noPendaftaran: string;
  name: string;
  jenjang: string;
  asalSekolah: string;
  wali: string;
  phone: string;
  email?: string;
  tanggalDaftar: string;
  status: string;
}

export interface PpdbListResponse {
  data: PpdbDetail[];
  message: string;
}

type ApiPendaftar = Record<string, unknown>;

const toStringOrEmpty = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  return '';
};

const normalizeStatus = (value: unknown): string => {
  if (typeof value === 'boolean') {
    return value ? 'Terverifikasi' : 'Menunggu';
  }

  if (typeof value === 'number') {
    if (value === 1) return 'Terverifikasi';
    if (value === 0) return 'Menunggu';
  }

  const raw = toStringOrEmpty(value).trim();
  const normalized = raw.toLowerCase();

  if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'y') {
    return 'Terverifikasi';
  }

  if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'n') {
    return 'Menunggu';
  }

  if (
    normalized === 'menunggu' ||
    normalized === 'pending' ||
    normalized === 'process' ||
    normalized === 'in_progress' ||
    normalized === 'draft'
  )
    return 'Menunggu';
  if (
    normalized === 'terverifikasi' ||
    normalized === 'verified' ||
    normalized === 'verifikasi' ||
    normalized === 'approved' ||
    normalized === 'approve' ||
    normalized === 'valid'
  )
    return 'Terverifikasi';
  if (normalized === 'diterima' || normalized === 'accepted' || normalized === 'lulus') return 'Diterima';
  if (
    normalized === 'ditolak' ||
    normalized === 'rejected' ||
    normalized === 'declined' ||
    normalized === 'gagal'
  )
    return 'Ditolak';

  return raw || 'Menunggu';
};

const mapVerificationStatus = (status: 'Terverifikasi' | 'Ditolak'): 'verified' | 'rejected' => {
  return status === 'Terverifikasi' ? 'verified' : 'rejected';
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

const normalizeBasePath = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, '');
};

const PPDB_BASE_PATHS = Array.from(
  new Set(
    [
      process.env.NEXT_PUBLIC_PPDB_ADMIN_BASE_PATH,
      PPDB_BASE_PATH,
      '/administrasi/ppdb/pendaftaran',
      '/administrasi/ppdb',
    ]
      .filter((item): item is string => typeof item === 'string')
      .map(normalizeBasePath)
      .filter((item) => item.length > 0),
  ),
);

const buildPath = (basePath: string, suffix?: string): string => {
  if (!suffix) return basePath;
  return `${basePath}${suffix}`;
};

const shouldTryNextBasePath = (error: unknown): boolean => {
  const status = getErrorStatus(error);
  return status === 404 || status === 405;
};

const requestWithBasePathFallback = async <T>(
  callback: (basePath: string) => Promise<T>,
): Promise<T> => {
  let lastError: unknown;

  for (let index = 0; index < PPDB_BASE_PATHS.length; index += 1) {
    const basePath = PPDB_BASE_PATHS[index];

    try {
      return await callback(basePath);
    } catch (error) {
      lastError = error;

      const isLast = index === PPDB_BASE_PATHS.length - 1;
      if (!shouldTryNextBasePath(error) || isLast) {
        throw error;
      }
    }
  }

  throw lastError;
};

const resolveNestedRecord = (record: ApiPendaftar, key: string): ApiPendaftar => {
  const value = record[key];
  if (!value || typeof value !== 'object') return {};
  return value as ApiPendaftar;
};

const hasRecordData = (record: ApiPendaftar): boolean => Object.keys(record).length > 0;

const resolveNestedRecordCandidates = (record: ApiPendaftar, keys: string[]): ApiPendaftar => {
  for (const key of keys) {
    const nested = resolveNestedRecord(record, key);
    if (hasRecordData(nested)) {
      return nested;
    }
  }

  return {};
};

const normalizePendaftar = (item: ApiPendaftar): PpdbDetail => {
  const user = resolveNestedRecordCandidates(item, ['user', 'akun']);
  const pendaftar = resolveNestedRecordCandidates(item, [
    'pendaftar',
    'peserta',
    'calon',
    'calon_santri',
  ]);

  const profile = hasRecordData(pendaftar)
    ? pendaftar
    : hasRecordData(user)
      ? user
      : item;

  const identityFromProfile = resolveNestedRecordCandidates(profile, [
    'identitas',
    'biodata',
    'profil',
    'profile',
  ]);
  const identityFromItem = resolveNestedRecordCandidates(item, [
    'identitas',
    'biodata',
    'profil',
    'profile',
  ]);
  const identity = hasRecordData(identityFromProfile) ? identityFromProfile : identityFromItem;

  const pendaftaranFromProfile = resolveNestedRecordCandidates(profile, [
    'pendaftaran',
    'data_pendaftaran',
  ]);
  const pendaftaranFromUser = resolveNestedRecordCandidates(user, [
    'pendaftaran',
    'data_pendaftaran',
  ]);
  const pendaftaranFromItem = resolveNestedRecordCandidates(item, [
    'pendaftaran',
    'data_pendaftaran',
  ]);
  const pendaftaran = hasRecordData(pendaftaranFromProfile)
    ? pendaftaranFromProfile
    : hasRecordData(pendaftaranFromUser)
      ? pendaftaranFromUser
      : pendaftaranFromItem;

  const noPendaftaran =
    toStringOrEmpty(
      profile.noPendaftaran ??
        profile.no_pendaftaran ??
        profile.no_pendaftaran_final ??
        profile.kode_pendaftaran ??
        profile.nomor_pendaftaran ??
        profile.registration_number ??
        identity.noPendaftaran ??
        identity.no_pendaftaran ??
        identity.no_pendaftaran_final ??
        identity.kode_pendaftaran ??
        identity.nomor_pendaftaran ??
        pendaftaran.noPendaftaran ??
        pendaftaran.no_pendaftaran ??
        pendaftaran.no_pendaftaran_final ??
        pendaftaran.kode_pendaftaran ??
        pendaftaran.nomor_pendaftaran ??
        pendaftaran.registration_number ??
        item.noPendaftaran ??
        item.no_pendaftaran ??
        item.no_pendaftaran_final ??
        item.kode_pendaftaran ??
        item.nomor_pendaftaran ??
        item.registration_number,
    ) || '';

  const pendaftaranId = toStringOrEmpty(
    profile.id_pendaftaran ??
      profile.pendaftaran_id ??
      profile.id_pendaftar ??
      identity.id_pendaftaran ??
      identity.pendaftaran_id ??
      identity.id_pendaftar ??
      pendaftaran.id_pendaftaran ??
      pendaftaran.pendaftaran_id ??
      pendaftaran.id ??
      item.id_pendaftaran ??
      item.pendaftaran_id,
  );

  const userId = toStringOrEmpty(
    profile.user_id ??
      profile.id_user ??
      user.user_id ??
      user.id_user ??
      user.id ??
      item.user_id ??
      item.id_user ??
      item.id ??
      item.uuid,
  );

  const primaryId = pendaftaranId || userId || noPendaftaran || '-';

  return {
    id: primaryId,
    pendaftaranId: pendaftaranId || undefined,
    userId: userId || undefined,
    noPendaftaran: noPendaftaran || primaryId,
    name: toStringOrEmpty(
      profile.name ??
        profile.nama ??
        profile.nama_lengkap ??
        profile.nama_calon ??
        identity.name ??
        identity.nama ??
        identity.nama_lengkap ??
        identity.nama_calon ??
        pendaftaran.nama_calon ??
        pendaftaran.nama,
    ),
    jenjang: toStringOrEmpty(
      profile.jenjang ??
        profile.jenjang_tujuan ??
        identity.jenjang ??
        pendaftaran.jenjang ??
        pendaftaran.jenjang_tujuan,
    ),
    asalSekolah: toStringOrEmpty(
      profile.asalSekolah ??
        profile.asal_sekolah ??
        profile.asal_kota ??
        identity.asalSekolah ??
        identity.asal_sekolah ??
        identity.asal_kota ??
        pendaftaran.asal_sekolah ??
        pendaftaran.asal_kota,
    ),
    wali: toStringOrEmpty(
      profile.wali ??
        profile.nama_wali ??
        profile.wali_murid ??
        profile.nomor_umi ??
        identity.wali ??
        identity.nama_wali ??
        identity.nomor_umi ??
        pendaftaran.nomor_umi ??
        pendaftaran.wali,
    ),
    phone: toStringOrEmpty(
      profile.phone ??
        profile.no_hp_wali ??
        profile.telepon ??
        profile.no_hp ??
        profile.phone_ppdb ??
        user.phone ??
        user.phone_ppdb ??
        identity.phone ??
        identity.phone_ppdb ??
        pendaftaran.phone_ppdb ??
        pendaftaran.phone,
    ),
    email: toStringOrEmpty(
      profile.email_ppdb ??
        profile.email ??
        user.email_ppdb ??
        user.email ??
        identity.email_ppdb ??
        identity.email ??
        pendaftaran.email_ppdb,
    ),
    tanggalDaftar: toStringOrEmpty(
      profile.tanggalDaftar ??
        profile.tanggal_daftar ??
        identity.tanggalDaftar ??
        identity.tanggal_daftar ??
        pendaftaran.tanggal_daftar ??
        pendaftaran.created_at ??
        item.tanggalDaftar ??
        item.tanggal_daftar ??
        item.created_at,
    ),
    status: normalizeStatus(
      profile.status_verifikasi ??
        profile.hasil_verifikasi ??
        profile.verifikasi ??
        profile.is_verified ??
        profile.verified ??
        profile.status ??
        profile.status_pendaftaran ??
        identity.status_verifikasi ??
        identity.hasil_verifikasi ??
        identity.verifikasi ??
        identity.is_verified ??
        identity.verified ??
        identity.status ??
        pendaftaran.status_verifikasi ??
        pendaftaran.hasil_verifikasi ??
        pendaftaran.verifikasi ??
        pendaftaran.is_verified ??
        pendaftaran.verified ??
        pendaftaran.status ??
        pendaftaran.status_pendaftaran ??
        item.status_verifikasi ??
        item.hasil_verifikasi ??
        item.verifikasi ??
        item.is_verified ??
        item.verified ??
        item.status,
    ),
  };
};

const extractList = (payload: unknown): ApiPendaftar[] => {
  const visited = new Set<unknown>();

  const isObjectArray = (value: unknown): value is ApiPendaftar[] => {
    return Array.isArray(value) && value.every((item) => item && typeof item === 'object');
  };

  const walk = (value: unknown): ApiPendaftar[] => {
    if (!value || typeof value !== 'object' || visited.has(value)) {
      return [];
    }

    visited.add(value);

    if (isObjectArray(value)) {
      return value;
    }

    const record = value as Record<string, unknown>;
    const preferredKeys = ['data', 'items', 'pendaftar', 'results', 'rows'];

    for (const key of preferredKeys) {
      const candidate = record[key];
      if (isObjectArray(candidate)) {
        return candidate;
      }
    }

    for (const key of preferredKeys) {
      const candidate = record[key];
      const nested = walk(candidate);
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

    return (
      errObj.response?.data?.message ||
      errObj.response?.data?.error ||
      errObj.message ||
      fallback
    );
  }

  return fallback;
};

const generateNoPendaftaran = (): string => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `PPDB-${datePart}-${randomPart}`;
};

export interface UpdateTestResultRequest {
  hasilTes: number;
  keterangan?: string;
}

export interface UpdateVerificationRequest {
  status: 'Terverifikasi' | 'Ditolak';
  keterangan?: string;
}

export interface AddNotificationRequest {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export const ppdbService = {
  // Get list of all PPDB applicants
  getList: async () => {
    try {
      const response = await requestWithBasePathFallback((basePath) => api.get(basePath));
      const list = extractList(response.data).map(normalizePendaftar);

      if (list.length === 0) {
        console.warn('PPDB list is empty after normalization. Check API response shape.', response.data);
      }

      return {
        data: list,
        message: 'success',
      } as PpdbListResponse;
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to fetch PPDB list');
      console.error('Error fetching PPDB list:', message);
      throw new Error(message);
    }
  },

  // Get detail of specific PPDB applicant
  getDetail: async (id: string) => {
    try {
      const response = await requestWithBasePathFallback((basePath) =>
        api.get(buildPath(basePath, `/${id}`)),
      );
      const payload = response.data as Record<string, unknown>;
      const data = (payload?.data as ApiPendaftar | undefined) || (payload as ApiPendaftar);
      return normalizePendaftar(data);
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to fetch PPDB detail');
      console.error('Error fetching PPDB detail:', message);
      throw new Error(message);
    }
  },

  // Create new PPDB applicant
  create: async (data: CreatePpdbRequest) => {
    try {
      const payload = {
        nama: data.name,
        nama_calon: data.name,
        jenjang: data.jenjang,
        asal_sekolah: data.asalSekolah,
        asal_kota: data.asalSekolah,
        nama_wali: data.wali,
        nomor_umi: data.wali,
        no_hp_wali: data.phone,
        phone_ppdb: data.phone,
        tanggal_daftar: data.tanggalDaftar,
        status: data.status,
      };

      const response = await requestWithBasePathFallback((basePath) =>
        api.post(basePath, payload),
      );
      return response.data;
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to create PPDB');
      console.error('Error creating PPDB:', message);
      throw new Error(message);
    }
  },

  // Public PPDB registration
  registerPublic: async (data: PublicPpdbRegistrationRequest) => {
    try {
      const payload = {
        role: data.role ?? 'ppdb',
        no_pendaftaran: data.no_pendaftaran ?? generateNoPendaftaran(),
        nama_calon: data.nama_calon,
        jenjang: data.jenjang,
        nomor_umi: data.nomor_umi,
        asal_kota: data.asal_kota,
        email_ppdb: data.email_ppdb,
        phone_ppdb: data.phone_ppdb,
        password: data.password,
        password_confirmation: data.password_confirmation,
      };

      const response = await api.post(PPDB_PUBLIC_REGISTER_PATH, payload);
      return response.data;
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to register PPDB');
      console.error('Error registering PPDB:', message);
      throw new Error(message);
    }
  },

  // Update PPDB applicant data
  update: async (id: string, data: UpdatePpdbRequest) => {
    try {
      const payload = {
        nama: data.name,
        nama_calon: data.name,
        jenjang: data.jenjang,
        asal_sekolah: data.asalSekolah,
        asal_kota: data.asalSekolah,
        nama_wali: data.wali,
        nomor_umi: data.wali,
        no_hp_wali: data.phone,
        phone_ppdb: data.phone,
        tanggal_daftar: data.tanggalDaftar,
        status: data.status,
      };

      const response = await requestWithBasePathFallback((basePath) =>
        api.put(buildPath(basePath, `/${id}`), payload),
      );
      return response.data;
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to update PPDB');
      console.error('Error updating PPDB:', message);
      throw new Error(message);
    }
  },

  // Delete PPDB applicant
  delete: async (id: string) => {
    try {
      const response = await requestWithBasePathFallback((basePath) =>
        api.delete(buildPath(basePath, `/${id}`)),
      );
      return response.data;
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to delete PPDB');
      console.error('Error deleting PPDB:', message);
      throw new Error(message);
    }
  },

  // Upload file/berkas for PPDB applicant
  uploadFile: async (id: string, file: File, fileType: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);

      const response = await requestWithBasePathFallback((basePath) =>
        api.post(buildPath(basePath, `/${id}/berkas`), formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }),
      );
      return response.data;
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to upload file');
      console.error('Error uploading file:', message);
      throw new Error(message);
    }
  },

  // Update test result (upsert)
  updateTestResult: async (id: string, data: UpdateTestResultRequest) => {
    try {
      const pathSuffixes = ['/tes', '/hasil-tes'];
      let lastError: unknown;

      for (const pathSuffix of pathSuffixes) {
        try {
          const response = await requestWithBasePathFallback((basePath) =>
            api.put(buildPath(basePath, `/${id}${pathSuffix}`), data),
          );
          return response.data;
        } catch (error) {
          lastError = error;
          const status = getErrorStatus(error);

          if (status !== 404 && status !== 405) {
            throw error;
          }
        }
      }

      throw lastError;
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to update test result');
      console.error('Error updating test result:', message);
      throw new Error(message);
    }
  },

  // Update verification status (upsert)
  updateVerification: async (id: string, data: UpdateVerificationRequest) => {
    const normalizedStatus = mapVerificationStatus(data.status);
    const endpointSuffixes = ['/verifikasi', '/status-verifikasi', '/validasi'];

    const candidates = [
      {
        status: data.status,
        keterangan: data.keterangan,
      },
      {
        status: normalizedStatus,
        status_verifikasi: normalizedStatus,
        status_verifikasi_text: data.status,
        hasil_verifikasi: normalizedStatus,
        hasil_verifikasi_text: data.status,
        verifikasi: normalizedStatus,
        verified: normalizedStatus === 'verified' ? 1 : 0,
        is_verified: normalizedStatus === 'verified' ? 1 : 0,
        keterangan: data.keterangan,
      },
      {
        status_verifikasi: normalizedStatus,
        hasil_verifikasi: normalizedStatus,
        verifikasi: normalizedStatus,
        keterangan: data.keterangan,
      },
    ];

    let lastError: unknown;

    for (const endpointSuffix of endpointSuffixes) {
      for (const payload of candidates) {
        try {
          const response = await requestWithBasePathFallback((basePath) =>
            api.put(buildPath(basePath, `/${id}${endpointSuffix}`), payload),
          );
          return response.data;
        } catch (error) {
          lastError = error;
          const statusCode = getErrorStatus(error);

          // Try next payload shape for validation mismatch.
          if (statusCode === 400 || statusCode === 422) {
            continue;
          }

          // Try next endpoint alias when route is not found.
          if (statusCode === 404 || statusCode === 405) {
            break;
          }

          throw error;
        }
      }
    }

    const message = extractErrorMessage(lastError, 'Failed to update verification');
    console.error('Error updating verification:', message);
    throw new Error(message);
  },

  // Add notification for applicant
  addNotification: async (id: string, data: AddNotificationRequest) => {
    try {
      const payload = {
        title: data.title,
        message: data.message,
        type: data.type,
      };

      const response = await requestWithBasePathFallback((basePath) =>
        api.post(buildPath(basePath, `/${id}/notifikasi`), payload),
      );
      return response.data;
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to add notification');
      console.error('Error adding notification:', message);
      throw new Error(message);
    }
  },
};
