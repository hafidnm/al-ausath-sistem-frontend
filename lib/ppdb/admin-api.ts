import api from '@/lib/axios';
import type {
  AddNotificationRequest,
  CreatePpdbRequest,
  PpdbDetail,
  PpdbListQuery,
  TesKonfigurasiJenjang,
  TesKonfigurasiJenjangKey,
  UpdatePpdbRequest,
  UpdateTestResultRequest,
  UpdateTesKonfigurasiJenjangRequest,
  UpdateVerificationRequest,
} from '@/types/ppdb/admin';

const PPDB_BASE_PATH = '/administrasi/ppdb/pendaftar';
const PPDB_BASE_PATHS = Array.from(
  new Set([
    PPDB_BASE_PATH,
    '/administrasi/ppdb/pendaftaran',
    '/administrasi/ppdb',
  ]),
);
const PPDB_TES_KONFIGURASI_PATHS = [
  '/administrasi/ppdb/tes/konfigurasi',
  '/administrasi/ppdb/tes-konfigurasi',
];

type Rec = Record<string, unknown>;

const asRecord = (value: unknown): Rec =>
  value && typeof value === 'object' ? (value as Rec) : {};

const toText = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  return '';
};

const toBool = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;

  const raw = toText(value).trim().toLowerCase();
  return ['1', 'true', 'yes', 'y', 'aktif', 'on'].includes(raw);
};

const normalizeStatus = (value: unknown): string => {
  const raw = toText(value).trim().toLowerCase();

  if (!raw) return 'Menunggu';
  if (['diterima', 'accepted', 'lulus', 'approve', 'approved'].includes(raw)) return 'Diterima';
  if (['ditolak', 'rejected', 'declined', 'gagal', 'reject'].includes(raw)) return 'Ditolak';
  if (['terverifikasi', 'verified', 'verifikasi', 'valid'].includes(raw)) return 'Terverifikasi';
  if (['menunggu', 'pending', 'process', 'submitted', 'baru', 'registrasi'].includes(raw)) {
    return 'Menunggu';
  }

  return 'Menunggu';
};

const normalizeTesJenjang = (value: unknown): TesKonfigurasiJenjangKey | null => {
  const normalized = toText(value).replace(/[^a-z]/gi, '').toUpperCase();
  if (normalized === 'MI') return 'MI';
  if (normalized === 'MTS') return 'MTS';
  if (normalized === 'MA') return 'MA';
  return null;
};

const mapVerificationStatus = (
  status: 'Terverifikasi' | 'Ditolak' | 'Diterima' | 'Menunggu',
): 'verified' | 'rejected' | 'accepted' | 'pending' => {
  if (status === 'Ditolak') return 'rejected';
  if (status === 'Diterima') return 'accepted';
  if (status === 'Menunggu') return 'pending';
  return 'verified';
};

const mapVerificationHasil = (
  status: 'Terverifikasi' | 'Ditolak' | 'Diterima' | 'Menunggu',
): 'terverifikasi' | 'ditolak' | 'diterima' | 'menunggu' => {
  if (status === 'Ditolak') return 'ditolak';
  if (status === 'Diterima') return 'diterima';
  if (status === 'Menunggu') return 'menunggu';
  return 'terverifikasi';
};

const getErrorStatus = (error: unknown): number | undefined => {
  if (!error || typeof error !== 'object') return undefined;
  const errObj = error as { response?: { status?: number } };
  return errObj.response?.status;
};

const normalizeBasePath = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, '');
};

const buildPath = (basePath: string, suffix?: string): string => {
  if (!suffix) return basePath;
  return `${basePath}${suffix}`;
};

const shouldTryNextPath = (error: unknown): boolean => {
  const status = getErrorStatus(error);
  return status === 404 || status === 405;
};

const requestWithBasePathFallback = async <T>(
  callback: (basePath: string) => Promise<T>,
): Promise<T> => {
  let lastError: unknown;

  for (let index = 0; index < PPDB_BASE_PATHS.length; index += 1) {
    const basePath = normalizeBasePath(PPDB_BASE_PATHS[index]);
    if (!basePath) continue;

    try {
      return await callback(basePath);
    } catch (error) {
      lastError = error;
      const isLast = index === PPDB_BASE_PATHS.length - 1;
      if (!shouldTryNextPath(error) || isLast) {
        throw error;
      }
    }
  }

  throw lastError;
};

const requestWithPathFallback = async <T>(
  paths: string[],
  callback: (path: string) => Promise<T>,
): Promise<T> => {
  let lastError: unknown;

  for (let index = 0; index < paths.length; index += 1) {
    const path = normalizeBasePath(paths[index]);
    if (!path) continue;

    try {
      return await callback(path);
    } catch (error) {
      lastError = error;
      const isLast = index === paths.length - 1;
      if (!shouldTryNextPath(error) || isLast) {
        throw error;
      }
    }
  }

  throw lastError;
};

const resolveNestedRecord = (record: Rec, key: string): Rec => {
  const value = record[key];
  return value && typeof value === 'object' ? (value as Rec) : {};
};

const hasRecordData = (record: Rec): boolean => Object.keys(record).length > 0;

const resolveNestedRecordCandidates = (record: Rec, keys: string[]): Rec => {
  for (const key of keys) {
    const nested = resolveNestedRecord(record, key);
    if (hasRecordData(nested)) {
      return nested;
    }
  }

  return {};
};

const hasPpdbRootFields = (record: Rec): boolean => {
  const keys = [
    'id_pendaftaran',
    'pendaftaran_id',
    'no_pendaftaran',
    'nama_calon',
    'program_pendaftaran',
    'jenjang',
    'status_verifikasi',
    'hasil_verifikasi',
  ];

  return keys.some((key) => {
    const value = record[key];
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
  });
};

const pickValue = (records: Rec[], keys: string[]): unknown => {
  for (const record of records) {
    for (const key of keys) {
      const value = record[key];
      if (value !== undefined && value !== null) {
        return value;
      }
    }
  }

  return undefined;
};

const pickText = (records: Rec[], keys: string[]): string => {
  const value = pickValue(records, keys);
  return toText(value).trim();
};

const extractList = (payload: unknown): Rec[] => {
  const visited = new Set<unknown>();

  const walk = (value: unknown): Rec[] => {
    if (!value || typeof value !== 'object' || visited.has(value)) {
      return [];
    }

    visited.add(value);

    if (Array.isArray(value)) {
      return value
        .filter((item) => item && typeof item === 'object')
        .map((item) => asRecord(item));
    }

    const record = asRecord(value);
    const preferredKeys = ['data', 'items', 'results', 'rows', 'pendaftar', 'list'];

    for (const key of preferredKeys) {
      const candidate = record[key];
      if (Array.isArray(candidate)) {
        return candidate
          .filter((item) => item && typeof item === 'object')
          .map((item) => asRecord(item));
      }
    }

    for (const key of preferredKeys) {
      const nested = walk(record[key]);
      if (nested.length > 0) {
        return nested;
      }
    }

    for (const nestedValue of Object.values(record)) {
      const nested = walk(nestedValue);
      if (nested.length > 0) {
        return nested;
      }
    }

    return [];
  };

  return walk(payload);
};

const normalizePpdbDetail = (item: Rec): PpdbDetail => {
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
  const identityFromRoot = resolveNestedRecordCandidates(item, [
    'identitas',
    'biodata',
    'profil',
    'profile',
  ]);
  const identity = hasRecordData(identityFromProfile) ? identityFromProfile : identityFromRoot;

  const pendaftaranFromProfile = resolveNestedRecordCandidates(profile, ['pendaftaran', 'data_pendaftaran']);
  const pendaftaranFromUser = resolveNestedRecordCandidates(user, ['pendaftaran', 'data_pendaftaran']);
  const pendaftaranFromRoot = resolveNestedRecordCandidates(item, ['pendaftaran', 'data_pendaftaran']);
  const pendaftaran = hasRecordData(pendaftaranFromProfile)
    ? pendaftaranFromProfile
    : hasRecordData(pendaftaranFromUser)
      ? pendaftaranFromUser
      : pendaftaranFromRoot;

  const tesFromProfile = resolveNestedRecord(profile, 'tes');
  const tesFromPendaftaran = resolveNestedRecord(pendaftaran, 'tes');
  const tesFromRoot = resolveNestedRecord(item, 'tes');
  const tes = hasRecordData(tesFromProfile)
    ? tesFromProfile
    : hasRecordData(tesFromPendaftaran)
      ? tesFromPendaftaran
      : tesFromRoot;

  const records = [profile, identity, pendaftaran, user, item];

  const pendaftaranId = pickText(records, ['id_pendaftaran', 'pendaftaran_id', 'id_pendaftar']);
  const userId = pickText(records, ['user_id', 'id_user']);
  const rawId = pickText(records, ['id']);
  const id = pendaftaranId || userId || rawId || '-';

  const status = normalizeStatus(
    pickValue(records, [
      'status_verifikasi',
      'hasil_verifikasi',
      'status',
      'status_pendaftaran',
      'verifikasi',
      'verified',
      'is_verified',
    ]),
  );

  return {
    id,
    pendaftaranId: pendaftaranId || undefined,
    userId: userId || undefined,
    waktuPendaftaran: pickText(records, ['waktu_pendaftaran', 'waktuPendaftaran', 'created_at']) || undefined,
    noPendaftaran: pickText(records, [
      'no_pendaftaran',
      'noPendaftaran',
      'no_pendaftaran_final',
      'nomor_pendaftaran',
      'kode_pendaftaran',
      'registration_number',
    ]) || id,
    noPendaftaranFinal: pickText(records, ['no_pendaftaran_final']) || undefined,
    nomorIndukGenerated: pickText(records, ['nomor_induk_generated']) || undefined,
    name: pickText(records, ['name', 'nama_lengkap', 'nama_calon', 'nama']) || '-',
    programPendaftaran: pickText(records, ['program_pendaftaran', 'program', 'jenjang']) || undefined,
    jenjang: pickText(records, ['jenjang', 'program_pendaftaran', 'program']) || '-',
    jenisKelamin: pickText(records, ['jenis_kelamin', 'jenisKelamin']) || undefined,
    tempatLahir: pickText(records, ['tempat_lahir', 'tempatLahir']) || undefined,
    tanggalLahir: pickText(records, ['tanggal_lahir', 'tanggalLahir']) || undefined,
    nikCalonSantri: pickText(records, ['nik_calon_santri', 'nik']) || undefined,
    alamatLengkap: pickText(records, ['alamat_lengkap', 'alamatLengkap', 'alamat']) || undefined,
    riwayatPenyakit: pickText(records, ['riwayat_penyakit', 'riwayatPenyakit']) || undefined,
    namaAyah: pickText(records, ['nama_ayah', 'namaAyah']) || undefined,
    penghasilanAyah: pickText(records, ['penghasilan_ayah', 'penghasilanAyah']) || undefined,
    noHpCalon: pickText(records, ['no_hp_calon', 'phone', 'phone_ppdb']) || undefined,
    namaIbu: pickText(records, ['nama_ibu', 'namaIbu']) || undefined,
    noHpIbu: pickText(records, ['no_hp_ibu', 'noHpIbu']) || undefined,
    soalJawab: pickText(records, ['soal_jawab', 'soalJawab']) || undefined,
    nilaiTes: (() => {
      const raw = pickValue([tes, ...records], ['nilai']);
      if (raw === undefined || raw === null || raw === '') return undefined;

      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : undefined;
    })(),
    statusTes: pickText([tes, ...records], ['status_tes', 'statusTes']) || undefined,
    metodeTes: pickText([tes, ...records], ['metode_tes', 'metodeTes']) || undefined,
    catatanTes: pickText([tes, ...records], ['catatan_tes', 'catatan']) || undefined,
    fileAktaPath: pickText(records, ['file_akta_path']) || undefined,
    fileKkPath: pickText(records, ['file_kk_path']) || undefined,
    fileSuratRekomendasiPath: pickText(records, ['file_surat_rekomendasi_path']) || undefined,
    suratPernyataanSetuju: pickText(records, ['surat_pernyataan_setuju']) || undefined,
    suratPernyataanFilePath: pickText(records, ['surat_pernyataan_file_path']) || undefined,
    fiturSoalAktif: toBool(pickValue(records, ['fitur_soal_aktif', 'fiturSoalAktif'])),
    soalTes: pickText(records, ['soal_tes', 'soalTes']) || undefined,
    showHalamanTes: toBool(pickValue(records, ['show_halaman_tes', 'showHalamanTes'])),
    pendaftaranSelesai: toBool(pickValue(records, ['pendaftaran_selesai', 'pendaftaranSelesai'])),
    tanggalPengumuman: pickText(records, ['tanggal_pengumuman']) || undefined,
    tanggalDiterima: pickText(records, ['tanggal_diterima']) || undefined,
    isFormLengkap: toBool(pickValue(records, ['is_form_lengkap', 'form_completed'])),
    asalSekolah: pickText(records, ['asal_sekolah', 'asalSekolah', 'sekolah_asal', 'asal_kota']) || '-',
    wali: pickText(records, ['wali', 'nama_wali', 'wali_murid', 'nomor_umi']) || '',
    phone: pickText(records, ['phone', 'phone_ppdb', 'no_hp', 'no_hp_calon']) || '',
    email: pickText(records, ['email', 'email_ppdb']) || undefined,
    tanggalDaftar: pickText(records, ['tanggal_daftar', 'tanggalDaftar', 'created_at']) || '',
    status,
    statusUangPangkal: pickText(records, ['status_uang_pangkal', 'statusUangPangkal']) || undefined,
    statusSpp: pickText(records, ['status_spp', 'statusSpp']) || undefined,
    buktiUangPangkalPath: pickText(records, ['bukti_uang_pangkal_path', 'buktiUangPangkalPath']) || undefined,
    buktiSppPath: pickText(records, ['bukti_spp_path', 'buktiSppPath']) || undefined,
    isAnakGuru: toBool(pickValue(records, ['is_anak_guru', 'isAnakGuru'])) || false,
    pilihanUangGedung: (() => {
      const v = pickValue(records, ['pilihan_uang_gedung', 'pilihanUangGedung']);
      return v !== null && v !== undefined ? Number(v) : null;
    })(),
    pilihanInfaqBulanan: (() => {
      const v = pickValue(records, ['pilihan_infaq_bulanan', 'pilihanInfaqBulanan']);
      return v !== null && v !== undefined ? Number(v) : null;
    })(),
  };
};

const normalizeTesKonfigurasiItem = (
  item: Rec,
  jenjangHint?: TesKonfigurasiJenjangKey,
): TesKonfigurasiJenjang | null => {
  const jenjang = normalizeTesJenjang(item.jenjang ?? item.kode_jenjang ?? jenjangHint);
  if (!jenjang) return null;

  const rawSchema = item.form_schema ?? item.formSchema;
  const formSchema = Array.isArray(rawSchema)
    ? (rawSchema as TesKonfigurasiJenjang['formSchema'])
    : undefined;

  return {
    jenjang,
    fiturSoalAktif: toBool(item.fitur_soal_aktif ?? item.fiturSoalAktif),
    soalTes: toText(item.soal_tes ?? item.soalTes).trim(),
    formSchema,
  };
};

const extractTesKonfigurasiList = (payload: unknown): TesKonfigurasiJenjang[] => {
  const root = asRecord(payload);
  const rootData = asRecord(root.data);
  const candidates: Array<{ item: Rec; jenjangHint?: TesKonfigurasiJenjangKey }> = [];

  const pushCandidate = (value: unknown, jenjangHint?: TesKonfigurasiJenjangKey) => {
    const record = asRecord(value);
    if (!hasRecordData(record)) return;
    candidates.push({ item: record, jenjangHint });
  };

  const inspectJenjangBuckets = (record: Rec) => {
    (['MI', 'MTS', 'MA'] as TesKonfigurasiJenjangKey[]).forEach((jenjang) => {
      const value = record[jenjang] ?? record[jenjang.toLowerCase()];
      if (value && typeof value === 'object') {
        pushCandidate(value, jenjang);
        return;
      }

      if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
        pushCandidate({ jenjang, fitur_soal_aktif: value, soal_tes: value }, jenjang);
      }
    });
  };

  inspectJenjangBuckets(root);
  inspectJenjangBuckets(rootData);
  extractList(payload).forEach((item) => pushCandidate(item));
  pushCandidate(rootData);
  pushCandidate(root);

  const byJenjang = new Map<TesKonfigurasiJenjangKey, TesKonfigurasiJenjang>();

  candidates.forEach((candidate) => {
    const normalized = normalizeTesKonfigurasiItem(candidate.item, candidate.jenjangHint);
    if (!normalized) return;

    const current = byJenjang.get(normalized.jenjang);
    if (!current) {
      byJenjang.set(normalized.jenjang, normalized);
      return;
    }

    const nextHasSchema = Array.isArray(normalized.formSchema) && normalized.formSchema.length > 0;
    const currentHasSchema = Array.isArray(current.formSchema) && current.formSchema.length > 0;
    const nextHasSoal = Boolean(normalized.soalTes?.trim());
    const currentHasSoal = Boolean(current.soalTes?.trim());

    if ((!currentHasSchema && nextHasSchema) || (!currentHasSoal && nextHasSoal)) {
      byJenjang.set(normalized.jenjang, normalized);
    }
  });

  return (['MI', 'MTS', 'MA'] as TesKonfigurasiJenjangKey[]).map((jenjang) =>
    byJenjang.get(jenjang) ?? {
      jenjang,
      fiturSoalAktif: false,
      soalTes: '',
      formSchema: [],
    },
  );
};

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export const ppdbAdminApi = {
  async getList(query?: PpdbListQuery): Promise<{ data: PpdbDetail[], meta?: PaginationMeta }> {
    const response = await requestWithBasePathFallback((basePath) =>
      api.get(basePath, {
        params: query,
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      }),
    );

    const list = extractList(response.data).map(normalizePpdbDetail);
    const meta = response.data?.meta || response.data;
    
    return { 
      data: list,
      meta: meta?.current_page ? {
        current_page: meta.current_page,
        last_page: meta.last_page,
        per_page: meta.per_page,
        total: meta.total,
      } : undefined
    };
  },

  async getDetail(id: string): Promise<PpdbDetail> {
    const response = await requestWithBasePathFallback((basePath) =>
      api.get(buildPath(basePath, `/${id}`), {
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      }),
    );

    const payload = asRecord(asRecord(response.data).data || response.data);
    return normalizePpdbDetail(payload);
  },

  async create(payload: CreatePpdbRequest): Promise<unknown> {
    const response = await requestWithBasePathFallback((basePath) =>
      api.post(basePath, payload),
    );

    return response.data;
  },

  async update(id: string, payload: UpdatePpdbRequest): Promise<unknown> {
    const response = await requestWithBasePathFallback((basePath) =>
      api.put(buildPath(basePath, `/${id}`), payload),
    );

    return response.data;
  },

  async delete(id: string): Promise<unknown> {
    const response = await requestWithBasePathFallback((basePath) =>
      api.delete(buildPath(basePath, `/${id}`)),
    );

    return response.data;
  },

  async uploadFile(id: string, file: File, tipeFile: string): Promise<unknown> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('jenis_berkas', tipeFile);

    const response = await requestWithBasePathFallback((basePath) =>
      api.post(buildPath(basePath, `/${id}/berkas`), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
    );

    return response.data;
  },

  async updateTestResult(id: string, payload: UpdateTestResultRequest): Promise<unknown> {
    const endpointSuffixes = ['/tes', '/hasil-tes'];
    const normalizedNilai = payload.nilai ?? payload.hasilTes;
    const normalizedCatatan = payload.catatan ?? payload.keterangan;
    const payloadCandidates: Rec[] = [
      {
        nilai: normalizedNilai,
        status_tes: payload.statusTes,
        metode_tes: payload.metodeTes,
        catatan: normalizedCatatan,
        soal_tes: payload.soalTes,
      },
      {
        hasil_tes: normalizedNilai,
        hasilTes: normalizedNilai,
        keterangan: normalizedCatatan,
        fitur_soal_aktif: payload.fiturSoalAktif,
        fiturSoalAktif: payload.fiturSoalAktif,
        soal_tes: payload.soalTes,
        soalTes: payload.soalTes,
      },
      payload as unknown as Rec,
    ];

    let lastError: unknown;

    for (const endpointSuffix of endpointSuffixes) {
      for (const body of payloadCandidates) {
        try {
          const response = await requestWithBasePathFallback((basePath) =>
            api.put(buildPath(basePath, `/${id}${endpointSuffix}`), body),
          );
          return response.data;
        } catch (error) {
          lastError = error;
          const status = getErrorStatus(error);
          if (status === 400 || status === 422) {
            continue;
          }
          if (status === 404 || status === 405) {
            break;
          }
          throw error;
        }
      }
    }

    throw lastError;
  },

  async updateVerification(id: string, payload: UpdateVerificationRequest): Promise<unknown> {
    // Backend accepts: { status_verifikasi: 'diterima'|'ditolak', catatan: string, kode_kelas_diterima?, ... }
    const hasil = mapVerificationHasil(payload.status); // 'diterima' | 'ditolak' | 'terverifikasi'

    const body: Rec = {
      status_verifikasi: hasil,
      catatan: payload.catatan ?? payload.keterangan ?? '',
    };

    if (payload.kodeKelasDiterima) body.kode_kelas_diterima = payload.kodeKelasDiterima;
    if (payload.idPetugas) body.id_petugas = payload.idPetugas;
    if (payload.tanggalVerif) body.tanggal_verif = payload.tanggalVerif;
    if (payload.integrasikanLangsungKeSantri !== undefined)
      body.integrasikan_langsung_ke_santri = payload.integrasikanLangsungKeSantri;
    if (payload.autoBuatAkunSantri !== undefined)
      body.auto_buat_akun_santri = payload.autoBuatAkunSantri;

    const response = await requestWithBasePathFallback((basePath) =>
      api.put(buildPath(basePath, `/${id}/verifikasi`), body),
    );

    return response.data;
  },

  async addNotification(id: string, payload: AddNotificationRequest): Promise<unknown> {
    const response = await requestWithBasePathFallback((basePath) =>
      api.post(buildPath(basePath, `/${id}/notifikasi`), payload),
    );

    return response.data;
  },

  /**
   * POST /api/administrasi/ppdb/pendaftar/{id}/tagihan
   * Buat tagihan PPDB untuk pendaftar yang sudah diterima.
   */
  async createTagihanPpdb(id: string): Promise<unknown> {
    const response = await requestWithBasePathFallback((basePath) =>
      api.post(buildPath(basePath, `/${id}/tagihan`), {}),
    );

    return response.data;
  },

  async exportPendaftar(query?: { jenjang?: string; tahun_masuk?: string; status_verifikasi?: string; q?: string }): Promise<Blob> {
    const response = await requestWithBasePathFallback((basePath) =>
      api.get(buildPath(basePath, '/export'), {
        params: query,
        responseType: 'blob',
      }),
    );

    return response.data as Blob;
  },

  async getTesKonfigurasiPerJenjang(): Promise<TesKonfigurasiJenjang[]> {
    const response = await requestWithPathFallback(PPDB_TES_KONFIGURASI_PATHS, (path) =>
      api.get(path),
    );

    return extractTesKonfigurasiList(response.data);
  },

  async updateTesKonfigurasiPerJenjang(
    jenjang: TesKonfigurasiJenjangKey,
    payload: UpdateTesKonfigurasiJenjangRequest,
  ): Promise<TesKonfigurasiJenjang> {
    const normalizedFormSchema = Array.isArray(payload.formSchema) ? payload.formSchema : [];
    // Menggunakan 1 / 0 untuk nilai boolean agar lebih aman dan ter-persist di backend
    const isAktifVal = payload.fiturSoalAktif ? 1 : 0;
    const requestPayload: Rec = {
      jenjang,
      fitur_soal_aktif: isAktifVal,
      fiturSoalAktif: isAktifVal,
      soal_tes: payload.soalTes?.trim() ?? '',
      soalTes: payload.soalTes?.trim() ?? '',
      form_schema: normalizedFormSchema,
      formSchema: normalizedFormSchema,
    };

    const attempts: Array<{ path: string; suffix?: string; body: Rec }> = [];
    PPDB_TES_KONFIGURASI_PATHS.forEach((path) => {
      attempts.push({ path, suffix: jenjang, body: requestPayload });
      attempts.push({ path, suffix: jenjang.toLowerCase(), body: requestPayload });
      attempts.push({ path, body: requestPayload });
    });

    let lastError: unknown;

    for (const attempt of attempts) {
      const normalizedPath = normalizeBasePath(attempt.path);
      if (!normalizedPath) continue;

      const url = attempt.suffix
        ? `${normalizedPath}/${attempt.suffix}`
        : normalizedPath;

      try {
        const response = await api.put(url, attempt.body);

        const fromList = extractTesKonfigurasiList(response.data).find((item) => item.jenjang === jenjang);
        if (fromList) return fromList;

        const row = asRecord(asRecord(response.data).data || response.data);
        const normalizedRow = normalizeTesKonfigurasiItem(row, jenjang);

        return normalizedRow ?? {
          jenjang,
          fiturSoalAktif: Boolean(payload.fiturSoalAktif),
          soalTes: payload.soalTes ?? '',
          formSchema: normalizedFormSchema,
        };
      } catch (error) {
        lastError = error;
        const status = getErrorStatus(error);
        if (status === 404 || status === 405 || status === 400 || status === 422) {
          continue;
        }
        throw error;
      }
    }

    throw lastError;
  },

  async getPeriods(): Promise<any[]> {
    const response = await api.get('/administrasi/ppdb/periods');
    return response.data?.data || [];
  },

  async getPeriodDetail(id: number | string): Promise<any> {
    const response = await api.get(`/administrasi/ppdb/periods/${id}`);
    return response.data?.data;
  },

  async createPeriod(payload: any): Promise<any> {
    const response = await api.post('/administrasi/ppdb/periods', payload);
    return response.data?.data;
  },

  async updatePeriod(id: number | string, payload: any): Promise<any> {
    const response = await api.put(`/administrasi/ppdb/periods/${id}`, payload);
    return response.data?.data;
  },

  async deletePeriod(id: number | string): Promise<any> {
    const response = await api.delete(`/administrasi/ppdb/periods/${id}`);
    return response.data;
  },

  async updateUangPangkalVerification(id: string, status: string): Promise<unknown> {
    const response = await requestWithBasePathFallback((basePath) =>
      api.put(buildPath(basePath, `/${id}/verifikasi-uang-pangkal`), { status }),
    );
    return response.data;
  },

  async updateSppVerification(id: string, status: string): Promise<unknown> {
    const response = await requestWithBasePathFallback((basePath) =>
      api.put(buildPath(basePath, `/${id}/verifikasi-spp`), { status }),
    );
    return response.data;
  },
};
