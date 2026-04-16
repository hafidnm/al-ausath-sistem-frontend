import api from '../axios';
import type {
  AddNotificationRequest,
  CreatePpdbRequest,
  PpdbAcceptedRecapResponse,
  PpdbDetail,
  PpdbListQuery,
  PpdbListResponse,
  PublicPpdbRegistrationRequest,
  TesKonfigurasiJenjang,
  TesKonfigurasiJenjangKey,
  TestQuestion,
  TestQuestionType,
  UpdateTesKonfigurasiRequest,
  UpdateTesKonfigurasiJenjangRequest,
  UpdatePpdbRequest,
  UpdateTestResultRequest,
  UpdateVerificationRequest,
} from './ppdb.types';

export type {
  AddNotificationRequest,
  CreatePpdbRequest,
  PpdbAcceptedRecapItem,
  PpdbAcceptedRecapResponse,
  PpdbDetail,
  PpdbListQuery,
  PpdbListResponse,
  PublicPpdbRegistrationRequest,
  TesKonfigurasiJenjang,
  TesKonfigurasiJenjangKey,
  TestQuestion,
  TestQuestionType,
  UpdateTesKonfigurasiRequest,
  UpdateTesKonfigurasiJenjangRequest,
  UpdatePpdbRequest,
  UpdateTestResultRequest,
  UpdateVerificationRequest,
} from './ppdb.types';

const PPDB_BASE_PATH = '/administrasi/ppdb/pendaftar';
const PPDB_PUBLIC_REGISTER_PATH = '/ppdb/register';
const PPDB_TES_KONFIGURASI_PATH = '/administrasi/ppdb/tes/konfigurasi';

type ApiPendaftar = Record<string, unknown>;
type ApiTesKonfigurasi = Record<string, unknown>;

const TES_KONFIG_JENJANG_VALUES: TesKonfigurasiJenjangKey[] = ['MI', 'MTS', 'MA'];

const toStringOrEmpty = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  return '';
};

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;

  const raw = toStringOrEmpty(value).trim().toLowerCase();
  return ['1', 'true', 'yes', 'y', 'aktif', 'on'].includes(raw);
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
    normalized === 'submitted' ||
    normalized === 'submited' ||
    normalized === 'waiting' ||
    normalized === 'process' ||
    normalized === 'in review' ||
    normalized === 'under_review' ||
    normalized === 'verification_pending' ||
    normalized === 'pending_verification' ||
    normalized === 'in_progress' ||
    normalized === 'draft' ||
    normalized === 'baru' ||
    normalized === 'registrasi'
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

  return 'Menunggu';
};

const normalizeTesKonfigurasiJenjangKey = (value: unknown): TesKonfigurasiJenjangKey | null => {
  const normalized = toStringOrEmpty(value).replace(/[^a-z]/gi, '').toUpperCase();

  if (normalized === 'MI') return 'MI';
  if (normalized === 'MTS') return 'MTS';
  if (normalized === 'MA') return 'MA';

  return null;
};

const mapVerificationStatus = (
  status: 'Terverifikasi' | 'Ditolak' | 'Diterima',
): 'verified' | 'rejected' | 'accepted' => {
  if (status === 'Ditolak') return 'rejected';
  if (status === 'Diterima') return 'accepted';
  return 'verified';
};

const mapVerificationHasil = (
  status: 'Terverifikasi' | 'Ditolak' | 'Diterima',
): 'terverifikasi' | 'ditolak' | 'diterima' => {
  if (status === 'Ditolak') return 'ditolak';
  if (status === 'Diterima') return 'diterima';
  return 'terverifikasi';
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

const hasPpdbRootFields = (record: ApiPendaftar): boolean => {
  const keys = [
    'id_pendaftaran',
    'pendaftaran_id',
    'no_pendaftaran',
    'nama_calon',
    'program_pendaftaran',
    'jenjang',
    'status_verifikasi',
    'asal_sekolah',
    'asal_kota',
  ];

  return keys.some((key) => {
    const value = record[key];
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
  });
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
    : hasPpdbRootFields(item)
      ? item
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
      item.pendaftaran_id ??
      item.id,
  );

  const userId = toStringOrEmpty(
    profile.user_id ??
      profile.id_user ??
      user.user_id ??
      user.id_user ??
      user.id ??
      item.user_id ??
      item.id_user ??
      item.uuid,
  );

  const primaryId = pendaftaranId || userId || noPendaftaran || '-';

  return {
    id: primaryId,
    pendaftaranId: pendaftaranId || undefined,
    userId: userId || undefined,
    waktuPendaftaran: toStringOrEmpty(
      item.waktu_pendaftaran ??
        item.waktuPendaftaran ??
        pendaftaran.waktu_pendaftaran ??
        pendaftaran.waktuPendaftaran ??
        pendaftaran.created_at ??
        profile.created_at,
    ),
    noPendaftaran: noPendaftaran || primaryId,
    noPendaftaranFinal: toStringOrEmpty(
      profile.no_pendaftaran_final ??
        identity.no_pendaftaran_final ??
        pendaftaran.no_pendaftaran_final ??
        item.no_pendaftaran_final,
    ),
    nomorIndukGenerated: toStringOrEmpty(
      profile.nomor_induk_generated ??
        identity.nomor_induk_generated ??
        pendaftaran.nomor_induk_generated ??
        item.nomor_induk_generated,
    ),
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
    programPendaftaran: toStringOrEmpty(
      profile.program_pendaftaran ??
        profile.program ??
        identity.program_pendaftaran ??
        identity.program ??
        pendaftaran.program_pendaftaran ??
        pendaftaran.program ??
        item.program_pendaftaran ??
        item.program,
    ),
    jenjang: toStringOrEmpty(
      profile.jenjang ??
        profile.jenjang_tujuan ??
        identity.jenjang ??
        pendaftaran.jenjang ??
        pendaftaran.jenjang_tujuan,
    ),
    jenisKelamin: toStringOrEmpty(
      profile.jenis_kelamin ??
        identity.jenis_kelamin ??
        pendaftaran.jenis_kelamin ??
        item.jenis_kelamin,
    ),
    tempatLahir: toStringOrEmpty(
      profile.tempat_lahir ??
        identity.tempat_lahir ??
        pendaftaran.tempat_lahir ??
        item.tempat_lahir,
    ),
    tanggalLahir: toStringOrEmpty(
      profile.tanggal_lahir ??
        identity.tanggal_lahir ??
        pendaftaran.tanggal_lahir ??
        item.tanggal_lahir,
    ),
    nikCalonSantri: toStringOrEmpty(
      profile.nik_calon_santri ??
        profile.nik ??
        identity.nik_calon_santri ??
        pendaftaran.nik_calon_santri ??
        item.nik_calon_santri,
    ),
    alamatLengkap: toStringOrEmpty(
      profile.alamat_lengkap ??
        profile.alamat ??
        identity.alamat_lengkap ??
        identity.alamat ??
        pendaftaran.alamat_lengkap ??
        pendaftaran.alamat ??
        item.alamat_lengkap ??
        item.alamat,
    ),
    riwayatPenyakit: toStringOrEmpty(
      profile.riwayat_penyakit ??
        identity.riwayat_penyakit ??
        pendaftaran.riwayat_penyakit ??
        item.riwayat_penyakit,
    ),
    namaAyah: toStringOrEmpty(
      profile.nama_ayah ?? identity.nama_ayah ?? pendaftaran.nama_ayah ?? item.nama_ayah,
    ),
    penghasilanAyah: toStringOrEmpty(
      profile.penghasilan_ayah ??
        identity.penghasilan_ayah ??
        pendaftaran.penghasilan_ayah ??
        item.penghasilan_ayah,
    ),
    noHpCalon: toStringOrEmpty(
      profile.no_hp_calon ??
        profile.no_hp ??
        identity.no_hp_calon ??
        pendaftaran.no_hp_calon ??
        item.no_hp_calon,
    ),
    namaIbu: toStringOrEmpty(
      profile.nama_ibu ?? identity.nama_ibu ?? pendaftaran.nama_ibu ?? item.nama_ibu,
    ),
    noHpIbu: toStringOrEmpty(
      profile.no_hp_ibu ?? identity.no_hp_ibu ?? pendaftaran.no_hp_ibu ?? item.no_hp_ibu,
    ),
    soalJawab: toStringOrEmpty(
      profile.soal_jawab ?? identity.soal_jawab ?? pendaftaran.soal_jawab ?? item.soal_jawab,
    ),
    fileAktaPath: toStringOrEmpty(
      profile.file_akta_path ?? pendaftaran.file_akta_path ?? item.file_akta_path,
    ),
    fileKkPath: toStringOrEmpty(
      profile.file_kk_path ?? pendaftaran.file_kk_path ?? item.file_kk_path,
    ),
    fileSuratRekomendasiPath: toStringOrEmpty(
      profile.file_surat_rekomendasi_path ??
        pendaftaran.file_surat_rekomendasi_path ??
        item.file_surat_rekomendasi_path,
    ),
    suratPernyataanSetuju: toStringOrEmpty(
      profile.surat_pernyataan_setuju ??
        pendaftaran.surat_pernyataan_setuju ??
        item.surat_pernyataan_setuju,
    ),
    suratPernyataanFilePath: toStringOrEmpty(
      profile.surat_pernyataan_file_path ??
        pendaftaran.surat_pernyataan_file_path ??
        item.surat_pernyataan_file_path,
    ),
    fiturSoalAktif: typeof (
      item.fitur_soal_aktif ?? pendaftaran.fitur_soal_aktif ?? profile.fitur_soal_aktif
    ) === 'boolean'
      ? Boolean(item.fitur_soal_aktif ?? pendaftaran.fitur_soal_aktif ?? profile.fitur_soal_aktif)
      : toBoolean(
          item.fitur_soal_aktif ?? pendaftaran.fitur_soal_aktif ?? profile.fitur_soal_aktif,
        ),
    soalTes: toStringOrEmpty(item.soal_tes ?? pendaftaran.soal_tes ?? profile.soal_tes),
    showHalamanTes: toBoolean(
      item.show_halaman_tes ?? pendaftaran.show_halaman_tes ?? profile.show_halaman_tes,
    ),
    pendaftaranSelesai: toBoolean(
      item.pendaftaran_selesai ?? pendaftaran.pendaftaran_selesai ?? profile.pendaftaran_selesai,
    ),
    tanggalPengumuman: toStringOrEmpty(
      profile.tanggal_pengumuman ??
        pendaftaran.tanggal_pengumuman ??
        item.tanggal_pengumuman,
    ),
    tanggalDiterima: toStringOrEmpty(
      profile.tanggal_diterima ?? pendaftaran.tanggal_diterima ?? item.tanggal_diterima,
    ),
    isFormLengkap:
      typeof (item.is_form_lengkap ?? pendaftaran.is_form_lengkap ?? profile.is_form_lengkap) === 'boolean'
        ? Boolean(item.is_form_lengkap ?? pendaftaran.is_form_lengkap ?? profile.is_form_lengkap)
        : undefined,
    asalSekolah: toStringOrEmpty(
      profile.asalSekolah ??
        profile.asal_sekolah ??
        profile.sekolah_asal ??
        profile.asal_kota ??
        identity.asalSekolah ??
        identity.asal_sekolah ??
        identity.sekolah_asal ??
        identity.asal_kota ??
        pendaftaran.asalSekolah ??
        pendaftaran.asal_sekolah ??
        pendaftaran.sekolah_asal ??
        pendaftaran.asal_kota ??
        item.asalSekolah ??
        item.asal_sekolah ??
        item.sekolah_asal ??
        item.asal_kota,
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

const normalizeTesKonfigurasiItem = (item: ApiTesKonfigurasi): TesKonfigurasiJenjang | null => {
  const jenjang = normalizeTesKonfigurasiJenjangKey(
    item.jenjang ?? item.kode_jenjang ?? item.tingkat ?? item.level,
  );

  if (!jenjang) return null;

  const fiturSoalAktif = toBoolean(
    item.fitur_soal_aktif ?? item.fiturSoalAktif ?? item.is_active ?? item.aktif,
  );
  const soalTes = toStringOrEmpty(item.soal_tes ?? item.soalTes ?? item.pertanyaan ?? item.form_soal);

  let formSchema: any[] | undefined = undefined;
  try {
    const rawFormSchema = item.form_schema ?? item.formSchema;
    if (typeof rawFormSchema === 'string') {
      formSchema = JSON.parse(rawFormSchema);
    } else if (Array.isArray(rawFormSchema)) {
      formSchema = rawFormSchema;
    }
  } catch (err) {
    console.warn('Failed to parse formSchema for jenjang', jenjang, err);
  }

  return {
    jenjang,
    fiturSoalAktif,
    soalTes,
    formSchema,
  };
};

const extractTesKonfigurasiList = (payload: unknown): TesKonfigurasiJenjang[] => {
  const root =
    payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)
      ? (payload as Record<string, unknown>).data
      : payload;

  const candidates: ApiTesKonfigurasi[] = [];

  if (Array.isArray(root)) {
    root.forEach((item) => {
      if (item && typeof item === 'object') {
        candidates.push(item as ApiTesKonfigurasi);
      }
    });
  } else if (root && typeof root === 'object') {
    const record = root as Record<string, unknown>;
    candidates.push(record);

    TES_KONFIG_JENJANG_VALUES.forEach((jenjang) => {
      const keyed = record[jenjang] ?? record[jenjang.toLowerCase()];
      if (keyed && typeof keyed === 'object') {
        candidates.push({ ...(keyed as ApiTesKonfigurasi), jenjang });
        return;
      }

      if (typeof keyed === 'boolean' || typeof keyed === 'number') {
        candidates.push({ jenjang, fitur_soal_aktif: keyed });
      }

      if (typeof keyed === 'string') {
        candidates.push({ jenjang, soal_tes: keyed });
      }
    });

    Object.values(record).forEach((item) => {
      if (item && typeof item === 'object') {
        candidates.push(item as ApiTesKonfigurasi);
      }
    });
  }

  const mapped = candidates
    .map(normalizeTesKonfigurasiItem)
    .filter((item): item is TesKonfigurasiJenjang => item !== null);

  const byJenjang = new Map<TesKonfigurasiJenjangKey, TesKonfigurasiJenjang>();
  mapped.forEach((item) => byJenjang.set(item.jenjang, item));

  return TES_KONFIG_JENJANG_VALUES.map((jenjang) =>
    byJenjang.get(jenjang) ?? {
      jenjang,
      fiturSoalAktif: false,
      soalTes: '',
    },
  );
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

export const ppdbService = {
  // Get list of all PPDB applicants
  getList: async (query?: PpdbListQuery) => {
    try {
      const response = await requestWithBasePathFallback((basePath) =>
        api.get(basePath, {
          params: query,
        }),
      );
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
        program_pendaftaran: data.programPendaftaran ?? data.jenjang,
        jenjang: data.jenjang,
        jenis_kelamin: data.jenisKelamin,
        tempat_lahir: data.tempatLahir,
        tanggal_lahir: data.tanggalLahir,
        nik_calon_santri: data.nikCalonSantri,
        alamat_lengkap: data.alamatLengkap,
        riwayat_penyakit: data.riwayatPenyakit,
        nama_ayah: data.namaAyah,
        penghasilan_ayah: data.penghasilanAyah,
        no_hp_calon: data.noHpCalon ?? data.phone,
        nama_ibu: data.namaIbu,
        no_hp_ibu: data.noHpIbu,
        soal_jawab: data.soalJawab,
        file_akta_path: data.fileAktaPath,
        file_kk_path: data.fileKkPath,
        file_surat_rekomendasi_path: data.fileSuratRekomendasiPath,
        surat_pernyataan_setuju: data.suratPernyataanSetuju,
        surat_pernyataan_file_path: data.suratPernyataanFilePath,
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
        program_pendaftaran: data.programPendaftaran ?? data.jenjang,
        jenjang: data.jenjang,
        jenis_kelamin: data.jenisKelamin,
        tempat_lahir: data.tempatLahir,
        tanggal_lahir: data.tanggalLahir,
        nik_calon_santri: data.nikCalonSantri,
        alamat_lengkap: data.alamatLengkap,
        riwayat_penyakit: data.riwayatPenyakit,
        nama_ayah: data.namaAyah,
        penghasilan_ayah: data.penghasilanAyah,
        no_hp_calon: data.noHpCalon ?? data.phone,
        nama_ibu: data.namaIbu,
        no_hp_ibu: data.noHpIbu,
        soal_jawab: data.soalJawab,
        file_akta_path: data.fileAktaPath,
        file_kk_path: data.fileKkPath,
        file_surat_rekomendasi_path: data.fileSuratRekomendasiPath,
        surat_pernyataan_setuju: data.suratPernyataanSetuju,
        surat_pernyataan_file_path: data.suratPernyataanFilePath,
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

  // Toggle test-question feature for PPDB applicant
  getTesKonfigurasiPerJenjang: async () => {
    try {
      const response = await api.get(PPDB_TES_KONFIGURASI_PATH);
      return extractTesKonfigurasiList(response.data);
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to fetch tes configuration');
      console.error('Error fetching tes configuration:', message);
      throw new Error(message);
    }
  },

  updateTesKonfigurasiPerJenjang: async (
    jenjang: TesKonfigurasiJenjangKey,
    data: UpdateTesKonfigurasiJenjangRequest,
  ) => {
    try {
      const payload = {
        fitur_soal_aktif: data.fiturSoalAktif,
        fitur_soal_aktif_text: data.fiturSoalAktif ? 'true' : 'false',
        soal_tes: data.fiturSoalAktif ? data.soalTes ?? '' : '',
        soalTes: data.soalTes ?? '',
        form_schema: data.formSchema,
      };

      const response = await api.put(`${PPDB_TES_KONFIGURASI_PATH}/${jenjang}`, payload);
      const normalized = normalizeTesKonfigurasiItem(
        ((response.data as Record<string, unknown>)?.data as ApiTesKonfigurasi | undefined) ||
          (response.data as ApiTesKonfigurasi),
      );

      return (
        normalized ?? {
          jenjang,
          fiturSoalAktif: data.fiturSoalAktif,
          soalTes: data.soalTes ?? '',
        }
      );
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to update tes configuration');
      console.error('Error updating tes configuration:', message);
      throw new Error(message);
    }
  },

  // Toggle test-question feature for PPDB applicant
  updateTesKonfigurasi: async (id: string, data: UpdateTesKonfigurasiRequest) => {
    try {
      const payload = {
        fitur_soal_aktif: data.fiturSoalAktif,
        fitur_soal_aktif_text: data.fiturSoalAktif ? 'true' : 'false',
        soal_tes: data.fiturSoalAktif ? data.soalTes : '',
        soalTes: data.soalTes,
      };

      const endpointSuffixes = ['/tes/konfigurasi', '/tes'];

      let lastError: unknown;

      for (const endpointSuffix of endpointSuffixes) {
        try {
          const response = await requestWithBasePathFallback((basePath) =>
            api.put(buildPath(basePath, `/${id}${endpointSuffix}`), payload),
          );
          return response.data;
        } catch (error) {
          lastError = error;
          const statusCode = getErrorStatus(error);

          if (statusCode === 404 || statusCode === 405) {
            continue;
          }

          if (statusCode === 400 || statusCode === 422) {
            continue;
          }

          throw error;
        }
      }

      const message = extractErrorMessage(lastError, 'Failed to update tes configuration');
      throw new Error(message);
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to update tes configuration');
      console.error('Error updating tes configuration:', message);
      throw new Error(message);
    }
  },

  // Update verification status (upsert)
  updateVerification: async (id: string, data: UpdateVerificationRequest) => {
    const normalizedStatus = mapVerificationStatus(data.status);
    const hasilStatus = mapVerificationHasil(data.status);
    const endpointSuffixes = ['/verifikasi', '/status-verifikasi', '/validasi'];

    const candidates = [
      {
        hasil: hasilStatus,
        catatan: data.catatan ?? data.keterangan,
        id_petugas: data.idPetugas,
        tanggal_verif: data.tanggalVerif,
        kode_kelas_diterima: data.kodeKelasDiterima,
        integrasikan_langsung_ke_santri: data.integrasikanLangsungKeSantri,
        auto_buat_akun_santri: data.autoBuatAkunSantri,
      },
      {
        hasil: normalizedStatus,
        status: normalizedStatus,
        catatan: data.catatan ?? data.keterangan,
        id_petugas: data.idPetugas,
        tanggal_verif: data.tanggalVerif,
        kode_kelas_diterima: data.kodeKelasDiterima,
      },
      {
        hasil: hasilStatus,
        status: hasilStatus,
        status_verifikasi: hasilStatus,
        hasil_verifikasi: hasilStatus,
        catatan: data.catatan ?? data.keterangan,
        keterangan: data.keterangan ?? data.catatan,
        kode_kelas_diterima: data.kodeKelasDiterima,
      },
      {
        status: normalizedStatus,
        hasil: hasilStatus,
        status_verifikasi: normalizedStatus,
        status_verifikasi_text: data.status,
        hasil_verifikasi: normalizedStatus,
        hasil_verifikasi_text: data.status,
        verifikasi: normalizedStatus,
        verified: normalizedStatus === 'verified' ? 1 : 0,
        is_verified: normalizedStatus === 'verified' ? 1 : 0,
        keterangan: data.keterangan ?? data.catatan,
      },
      {
        hasil: hasilStatus,
        status_verifikasi: normalizedStatus,
        hasil_verifikasi: normalizedStatus,
        verifikasi: normalizedStatus,
        catatan: data.catatan ?? data.keterangan,
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

    // Fallback: update pendaftar status directly when verifikasi-specific routes are unavailable.
    try {
      const response = await requestWithBasePathFallback((basePath) =>
        api.put(buildPath(basePath, `/${id}`), {
          status_verifikasi: hasilStatus,
          kode_kelas_diterima: data.kodeKelasDiterima,
        }),
      );

      return response.data;
    } catch (error) {
      lastError = error;
    }

    const message = extractErrorMessage(lastError, 'Failed to update verification');
    console.error('Error updating verification:', message);
    throw new Error(message);
  },

  // Add notification for applicant
  addNotification: async (id: string, data: AddNotificationRequest) => {
    try {
      const payload = {
        type: data.type,
        konten: data.message,
        title: data.title,
        message: data.message,
        sent_at: data.sentAt,
        status_kirim: data.statusKirim,
        kirim_email: data.kirimEmail,
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

  getAcceptedRecap: async (query?: { jenjang?: string; tahun_masuk?: string }) => {
    try {
      const response = await requestWithBasePathFallback((basePath) =>
        api.get(buildPath(basePath, '/rekap/diterima'), {
          params: query,
        }),
      );

      const list = extractList(response.data);
      const data = list.map((item) => ({
        idPendaftaran: toStringOrEmpty(item.id_pendaftaran ?? item.idPendaftaran),
        waktuPendaftaran: toStringOrEmpty(item.waktu_pendaftaran ?? item.waktuPendaftaran),
        noPendaftaran: toStringOrEmpty(item.no_pendaftaran ?? item.noPendaftaran),
        nomorInduk: toStringOrEmpty(item.nomor_induk ?? item.nomorInduk),
        namaAnak: toStringOrEmpty(item.nama_anak ?? item.namaAnak ?? item.nama_calon),
        jenjang: toStringOrEmpty(item.jenjang),
        tempatLahir: toStringOrEmpty(item.tempat_lahir ?? item.tempatLahir),
        tanggalLahir: toStringOrEmpty(item.tanggal_lahir ?? item.tanggalLahir),
        namaOrtu: toStringOrEmpty(item.nama_ortu ?? item.namaOrtu),
        alamat: toStringOrEmpty(item.alamat),
        noHpOrtu: toStringOrEmpty(item.no_hp_ortu ?? item.noHpOrtu),
        statusVerifikasi: normalizeStatus(item.status_verifikasi ?? item.status),
      }));

      const payload = response.data as Record<string, unknown>;
      const meta = (payload.meta as Record<string, unknown> | undefined) ?? {};

      return {
        data,
        jumlahDiterima: Number(meta.jumlah_diterima ?? data.length),
      } as PpdbAcceptedRecapResponse;
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to fetch PPDB accepted recap');
      throw new Error(message);
    }
  },

  exportPendaftar: async (query?: { jenjang?: string; tahun_masuk?: string }) => {
    try {
      const response = await requestWithBasePathFallback((basePath) =>
        api.get(buildPath(basePath, '/export'), {
          params: query,
          responseType: 'blob',
        }),
      );

      return response.data as Blob;
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to export PPDB pendaftar');
      throw new Error(message);
    }
  },
};
