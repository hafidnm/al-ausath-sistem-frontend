import api, { clearStoredPpdbToken, getCsrfToken, setPpdbAuthMarker, setStoredPpdbToken } from '@/lib/axios';
import type {
  PpdbPortalBillingInfo,
  PpdbPortalDashboard,
  PpdbPortalFormRequest,
  PpdbPortalLoginRequest,
  PpdbPortalRegisterRequest,
  PpdbPortalRegisterResponse,
  PpdbPortalTesJawabRequest,
  PpdbPortalTesStatus,
  PpdbPortalStep,
} from '@/types/ppdb/portal';

const PPDB_PORTAL_BASE_PATH = '/ppdb';

type Rec = Record<string, unknown>;

const asRecord = (value: unknown): Rec =>
  value && typeof value === 'object' ? (value as Rec) : {};

const asString = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  return '';
};

const asBool = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  const raw = asString(value).trim().toLowerCase();
  return ['1', 'true', 'yes', 'y', 'aktif', 'open'].includes(raw);
};

const isFileValue = (value: unknown): value is File =>
  typeof File !== 'undefined' && value instanceof File;

const hasOwn = Object.prototype.hasOwnProperty;

const resolveData = (payload: unknown): Rec => {
  const root = asRecord(payload);
  const data = root.data;
  return data && typeof data === 'object' ? asRecord(data) : root;
};

const appendSource = (sources: Rec[], value: unknown) => {
  if (!value || typeof value !== 'object') return;

  const record = asRecord(value);
  if (Object.keys(record).length === 0) return;
  if (sources.includes(record)) return;

  sources.push(record);
};

const resolveDashboardSources = (payload: unknown): Rec[] => {
  const root = asRecord(payload);
  const data = resolveData(payload);
  const user = asRecord(data.user ?? data.akun);
  const dataNested = asRecord(data.pendaftaran ?? data.pendaftar ?? data.identitas ?? data.biodata);
  const dataFlow = asRecord(data.flow);
  const dataTes = asRecord(data.tes);
  const userNested = asRecord(user.pendaftaran ?? user.pendaftar ?? user.identitas ?? user.biodata);
  const rootNested = asRecord(root.pendaftaran ?? root.pendaftar ?? root.identitas ?? root.biodata);
  const rootFlow = asRecord(root.flow);

  const sources: Rec[] = [];
  appendSource(sources, data);
  appendSource(sources, dataNested);
  appendSource(sources, dataFlow);
  appendSource(sources, dataTes);
  appendSource(sources, user);
  appendSource(sources, userNested);
  appendSource(sources, rootNested);
  appendSource(sources, rootFlow);
  appendSource(sources, root.data);
  appendSource(sources, root);

  return sources;
};

const pickText = (sources: Rec[], keys: string[]): string => {
  for (const source of sources) {
    for (const key of keys) {
      if (!hasOwn.call(source, key)) continue;
      const text = asString(source[key]).trim();
      if (text.length > 0) return text;
    }
  }

  return '';
};

const pickValue = (sources: Rec[], keys: string[]): unknown => {
  for (const source of sources) {
    for (const key of keys) {
      if (!hasOwn.call(source, key)) continue;

      const value = source[key];
      if (value !== undefined && value !== null) {
        return value;
      }
    }
  }

  return undefined;
};

const toMultipartFormData = (payload: PpdbPortalFormRequest): FormData => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (isFileValue(value)) {
      formData.append(key, value);
      return;
    }

    formData.append(key, String(value));
  });

  return formData;
};

const toJsonPayload = (payload: PpdbPortalFormRequest): Rec => {
  const normalized: Rec = {};

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (isFileValue(value)) return;

    normalized[key] = value;
  });

  return normalized;
};

const hasFilePayload = (payload: PpdbPortalFormRequest): boolean =>
  Object.values(payload).some((value) => isFileValue(value));

const shouldFallbackToCreateIdentitas = (status?: number): boolean =>
  status === 404 || status === 405 || status === 409;

const extractValidationMessage = (error: unknown): string | null => {
  const responseData = asRecord((error as { response?: { data?: unknown } })?.response?.data);
  const message = asString(responseData.message).trim();
  const errors = asRecord(responseData.errors);

  const firstError = Object.values(errors)
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .map((value) => asString(value).trim())
    .find(Boolean);

  return firstError || message || null;
};

const normalizeStep = (value: unknown): PpdbPortalStep => {
  const step = asString(value).trim().toLowerCase();
  if (!step) return 'lengkapi-form';

  if (step.includes('tes')) return 'tes';
  if (step === 'infaq') return 'infaq';
  if (step === 'pengumuman' || step === 'announcement') return 'pengumuman';
  if (step === 'pembayaran-ppdb' || step === 'pembayaran_ppdb' || step === 'pembayaran') return 'pembayaran-ppdb';
  if (step === 'pembayaran-uang-pangkal' || step === 'pembayaran_uang_pangkal') return 'pembayaran-uang-pangkal';
  if (step === 'pembayaran-spp' || step === 'pembayaran_spp') return 'pembayaran-spp';
  if (step === 'gagal-bayar-uang-pangkal' || step === 'gagal_bayar_uang_pangkal') return 'gagal-bayar-uang-pangkal';
  if (step === 'gagal-bayar-spp' || step === 'gagal_bayar_spp') return 'gagal-bayar-spp';
  if (step === 'siap-menjadi-santri' || step === 'siap_menjadi_santri' || step === 'diterima' || step === 'accepted') return 'siap-menjadi-santri';
  if (
    step === 'menunggu-pengumuman'
    || step === 'menunggu_pengumuman'
    || step === 'menunggu pengumuman'
    || step === 'waiting-announcement'
    || step === 'waiting_announcement'
    || step === 'menunggu'
    || step === 'submitted'
    || step === 'selesai'
    || step === 'completed'
    || step === 'done'
  ) {
    return 'menunggu-pengumuman';
  }

  return 'lengkapi-form';
};

const normalizeDashboard = (payload: unknown): PpdbPortalDashboard => {
  const sources = resolveDashboardSources(payload);
  const status =
    pickText(sources, ['status', 'status_verifikasi', 'hasil_verifikasi']) ||
    'Menunggu';

  const soalJawab = pickText(sources, ['soalJawab', 'soal_jawab']);
  const showHalamanTes = asBool(pickValue(sources, ['showHalamanTes', 'show_halaman_tes']));
  const formCompleted = asBool(pickValue(sources, ['formCompleted', 'form_completed', 'is_form_lengkap']));
  const pendaftaranSelesai = asBool(pickValue(sources, ['pendaftaranSelesai', 'pendaftaran_selesai']));
  const pengumumanOpen = asBool(pickValue(sources, ['pengumumanOpen', 'pengumuman_open', 'is_pengumuman_dibuka']));

  const statusVerifikasi = pickText(sources, [
    'statusVerifikasi', 'status_verifikasi', 'hasil_verifikasi',
  ]);

  // Resolve pembayaranPpdb — BE returns nested under data.pembayaran_ppdb, data.flow.pembayaran_ppdb, dll
  const root = asRecord(payload);
  const dataRoot = resolveData(payload);
  const flowData = asRecord(dataRoot.flow ?? root.flow);
  
  const rawPembayaran = asRecord(
    dataRoot.pembayaran_ppdb ?? dataRoot.pembayaranPpdb ??
    dataRoot.tagihan_ppdb ?? dataRoot.tagihanPpdb ??
    flowData.pembayaran_ppdb ?? flowData.pembayaranPpdb ??
    root.pembayaran_ppdb ?? root.pembayaranPpdb ?? null
  );
  const hasPembayaran = Boolean(rawPembayaran.id_pembayaran ?? rawPembayaran.id);

  // Resolve correct step — ALWAYS trust the step returned by the backend.
  // derivedStep is only used as a last-resort fallback when the backend
  // returns no step at all (e.g. legacy endpoints).
  // We must NOT override payment/post-acceptance steps with a derived value
  // because that would hide the pembayaran-uang-pangkal / pembayaran-spp flow.
  const rawStep = pickValue(sources, ['step', 'tahap']);
  const derivedStep = showHalamanTes
    ? 'tes'
    : formCompleted || pendaftaranSelesai || soalJawab.trim().length > 0
      ? (pengumumanOpen ? 'pengumuman' : 'menunggu-pengumuman')
      : 'lengkapi-form';
  // Only fall back to derivedStep when rawStep is genuinely absent
  const step = rawStep != null ? normalizeStep(rawStep) : normalizeStep(derivedStep);

  return {
    idPendaftar: pickText(sources, ['idPendaftar', 'id_pendaftar', 'id_pendaftaran', 'pendaftaran_id', 'id']),
    noPendaftaran: pickText(sources, ['noPendaftaran', 'no_pendaftaran', 'nomor_pendaftaran', 'registration_number']),
    waktuPendaftaran: pickText(sources, [
      'waktuPendaftaran',
      'waktu_pendaftaran',
      'waktuDaftar',
      'waktu_daftar',
      'tanggalDaftar',
      'tanggal_daftar',
      'created_at',
      'createdAt',
      'registered_at',
      'registeredAt',
    ]),
    email: pickText(sources, ['email', 'email_ppdb']),
    phone: pickText(sources, ['phone', 'phone_ppdb', 'no_hp_calon', 'noHpCalon']),
    namaCalon: pickText(sources, ['namaCalon', 'nama_calon', 'nama_calon_santri', 'nama']),
    namaLengkap: pickText(sources, ['namaLengkap', 'nama_lengkap', 'nama_calon', 'nama_calon_santri', 'nama']),
    program: pickText(sources, ['program', 'program_pendaftaran', 'jenjang']),
    jenjang: pickText(sources, ['jenjang', 'program_pendaftaran', 'program']),
    nomorUmi: pickText(sources, ['nomorUmi', 'nomor_umi']),
    asalKota: pickText(sources, ['asalKota', 'asal_kota', 'asalSekolah', 'asal_sekolah', 'sekolah_asal']),
    asalSekolah: pickText(sources, ['asalSekolah', 'asal_sekolah', 'sekolah_asal', 'asalKota', 'asal_kota']),
    tempatLahir: pickText(sources, ['tempatLahir', 'tempat_lahir']),
    tanggalLahir: pickText(sources, ['tanggalLahir', 'tanggal_lahir']),
    jenisKelamin: pickText(sources, ['jenisKelamin', 'jenis_kelamin']),
    nikCalonSantri: pickText(sources, ['nikCalonSantri', 'nik_calon_santri', 'nik']),
    alamatLengkap: pickText(sources, ['alamatLengkap', 'alamat_lengkap', 'alamat']),
    riwayatPenyakit: pickText(sources, ['riwayatPenyakit', 'riwayat_penyakit']),
    namaAyah: pickText(sources, ['namaAyah', 'nama_ayah']),
    penghasilanAyah: pickText(sources, ['penghasilanAyah', 'penghasilan_ayah']),
    noHpAyah: pickText(sources, ['noHpAyah', 'no_hp_ayah', 'no_hp_calon']),
    namaIbu: pickText(sources, ['namaIbu', 'nama_ibu']),
    noHpIbu: pickText(sources, ['noHpIbu', 'no_hp_ibu']),
    soalJawab,
    suratPernyataanText: pickText(sources, ['suratPernyataanText', 'surat_pernyataan_text']),
    berkasAktaUrl: pickText(sources, ['berkasAktaUrl', 'berkas_akta_url', 'fileAktaPath', 'file_akta_path']),
    berkasKkUrl: pickText(sources, ['berkasKkUrl', 'berkas_kk_url', 'fileKkPath', 'file_kk_path']),
    berkasAktaKkUrl: pickText(sources, ['berkasAktaKkUrl', 'berkas_akta_kk_url', 'fileAktaKkPath', 'file_akta_kk_path']),
    berkasRekomendasiUstadzUrl: pickText(sources, [
      'berkasRekomendasiUstadzUrl',
      'berkas_rekomendasi_ustadz_url',
      'fileSuratRekomendasiPath',
      'file_surat_rekomendasi_path',
    ]),
    berkasSuratPernyataanUrl: pickText(sources, [
      'berkasSuratPernyataanUrl',
      'berkas_surat_pernyataan_url',
      'suratPernyataanFilePath',
      'surat_pernyataan_file_path',
    ]),
    alamat: pickText(sources, ['alamat', 'alamat_lengkap']),
    status: status as PpdbPortalDashboard['status'],
    statusVerifikasi,
    tesRequired: asBool(pickValue(sources, ['tesRequired', 'tes_required'])),
    tesAvailable: asBool(pickValue(sources, ['tesAvailable', 'tes_available'])),
    fiturSoalAktif: asBool(pickValue(sources, ['fiturSoalAktif', 'fitur_soal_aktif'])),
    showHalamanTes,
    pendaftaranSelesai,
    soalTes: pickText(sources, ['soalTes', 'soal_tes']),
    tesTitle: pickText(sources, ['tesTitle', 'tes_title']),
    tesDescription: pickText(sources, ['tesDescription', 'tes_description']),
    pengumumanDate: pickText(sources, ['pengumumanDate', 'pengumuman_date', 'tanggal_pengumuman']),
    pengumumanOpen,
    formCompleted,
    step,
    pembayaranPpdb: hasPembayaran ? {
      id_pembayaran: Number(rawPembayaran.id_pembayaran ?? rawPembayaran.id) || null,
      status: asString(rawPembayaran.status) || null,
      nominal_bayar: Number(rawPembayaran.nominal_bayar ?? rawPembayaran.nominal ?? 0),
      has_tagihan: true,
    } : null,
    namaGelombang: pickText(sources, ['nama_gelombang', 'namaGelombang']) || undefined,
    tahunAjaran: pickText(sources, ['tahun_ajaran', 'tahunAjaran']) || undefined,
    isAnakGuru: asBool(pickValue(sources, ['is_anak_guru', 'isAnakGuru'])),
    pilihanUangGedung: (() => {
      const v = pickValue(sources, ['pilihan_uang_gedung', 'pilihanUangGedung']);
      return v !== null && v !== undefined ? Number(v) : null;
    })(),
    pilihanInfaqBulanan: (() => {
      const v = pickValue(sources, ['pilihan_infaq_bulanan', 'pilihanInfaqBulanan']);
      return v !== null && v !== undefined ? Number(v) : null;
    })(),
    tanggalDiterima: pickText(sources, ['tanggal_diterima', 'tanggalDiterima']) || undefined,
    batasBayarUangPangkal: pickText(sources, ['batas_bayar_uang_pangkal', 'batasBayarUangPangkal']) || undefined,
    batasBayarSpp: pickText(sources, ['batas_bayar_spp', 'batasBayarSpp']) || undefined,
    statusUangPangkal: pickText(sources, ['status_uang_pangkal', 'statusUangPangkal']) || undefined,
    statusSpp: pickText(sources, ['status_spp', 'statusSpp']) || undefined,
    buktiUangPangkalUrl: pickText(sources, ['bukti_uang_pangkal_url', 'buktiUangPangkalUrl', 'bukti_uang_pangkal_path', 'buktiUangPangkalPath']),
    buktiSppUrl: pickText(sources, ['bukti_spp_url', 'buktiSppUrl', 'bukti_spp_path', 'buktiSppPath']),
    nomorIndukGenerated: pickText(sources, ['nomor_induk_generated', 'nomorIndukGenerated', 'nis_generated', 'nis']),
    kodeKelasDiterima: pickText(sources, ['kode_kelas_diterima', 'kodeKelasDiterima', 'kelas_diterima']),
    // Issue 5: Bukti orang tua guru
    buktiOrtuGuruUrl: pickText(sources, ['bukti_ortu_guru_url', 'buktiOrtuGuruUrl', 'bukti_ortu_guru_path']) || undefined,
    buktiOrtuGuruVerified: (() => {
      const v = pickValue(sources, ['bukti_ortu_guru_verified', 'buktiOrtuGuruVerified']);
      if (v === null || v === undefined) return null;
      return asBool(v);
    })(),
    // Issue 4: Sibling support — daftar semua pendaftaran dalam akun yang sama
    daftarPendaftaran: (() => {
      const raw = dataRoot.daftar_pendaftaran ?? root.daftar_pendaftaran;
      if (!Array.isArray(raw)) return undefined;
      return raw.map((item) => {
        const r = asRecord(item);
        return {
          id_pendaftaran: asString(r.id_pendaftaran ?? r.pendaftaran_id ?? r.id),
          nama_calon: asString(r.nama_calon ?? r.nama_lengkap ?? r.nama),
          step: asString(r.step ?? r.tahap),
        };
      });
    })(),
  };
};

const normalizeTesStatus = (payload: unknown): PpdbPortalTesStatus => {
  const row = resolveData(payload);
  return {
    canAccessTes: asBool(row.canAccessTes ?? row.can_access_tes),
    showHalamanTes: asBool(row.showHalamanTes ?? row.show_halaman_tes),
    pendaftaranSelesai: asBool(row.pendaftaranSelesai ?? row.pendaftaran_selesai),
    fiturSoalAktif: asBool(row.fiturSoalAktif ?? row.fitur_soal_aktif),
    soalTes: asString(row.soalTes ?? row.soal_tes),
    formSchema: Array.isArray(row.formSchema)
      ? (row.formSchema as PpdbPortalTesStatus['formSchema'])
      : Array.isArray(row.form_schema)
        ? (row.form_schema as PpdbPortalTesStatus['formSchema'])
        : [],
    tesRequired: asBool(row.tesRequired ?? row.tes_required),
    tesAvailable: asBool(row.tesAvailable ?? row.tes_available),
    tesFinished: asBool(row.tesFinished ?? row.tes_finished),
    tesSubmitted: asBool(row.tesSubmitted ?? row.tes_submitted),
    tesTitle: asString(row.tesTitle ?? row.tes_title),
    tesDescription: asString(row.tesDescription ?? row.tes_description),
    step: normalizeStep(row.step),
    message: asString(row.message),
    // Issue 1: RTL/Arab support
    is_rtl: asBool(row.is_rtl ?? row.isRtl) || undefined,
    bahasa: (row.bahasa === 'ar' ? 'ar' : row.bahasa === 'id' ? 'id' : undefined),
  };
};


const resolveToken = (payload: unknown): string => {
  const row = resolveData(payload);
  return asString(
    row.access_token || row.token || row.api_token || row.bearer_token || row.plain_text_token,
  ).trim();
};

export const ppdbPortalApi = {
  async checkOpen(): Promise<{ is_open: boolean; is_kuota_penuh: boolean; period: any }> {
    const response = await api.get(`${PPDB_PORTAL_BASE_PATH}/period/check-open`);
    return response.data.data;
  },

  async register(data: PpdbPortalRegisterRequest): Promise<PpdbPortalRegisterResponse> {
    await getCsrfToken();
    const response = await api.post(`${PPDB_PORTAL_BASE_PATH}/register`, data);
    const row = resolveData(response.data);

    return {
      idPendaftar: asString(row.idPendaftar ?? row.id_pendaftar ?? row.id_pendaftaran),
      noPendaftaran: asString(row.noPendaftaran ?? row.no_pendaftaran ?? row.nomor_pendaftaran),
      message: asString(row.message || asRecord(response.data).message || 'Registrasi berhasil'),
    };
  },

  async login(data: PpdbPortalLoginRequest): Promise<unknown> {
    await getCsrfToken();
    const response = await api.post(`${PPDB_PORTAL_BASE_PATH}/login`, {
      identifier: data.login,
      password: data.password,
    });

    const token = resolveToken(response.data);
    if (token) {
      setStoredPpdbToken(token);
    }
    setPpdbAuthMarker();

    return response.data;
  },

  async getDashboard(): Promise<PpdbPortalDashboard> {
    const response = await api.get(`${PPDB_PORTAL_BASE_PATH}/dashboard`);
    return normalizeDashboard(response.data);
  },

  async getPembayaranStatus(): Promise<PpdbPortalDashboard> {
    const response = await api.get(`${PPDB_PORTAL_BASE_PATH}/pembayaran`);
    return normalizeDashboard(response.data);
  },

  async getBillingInfo(program?: string): Promise<PpdbPortalBillingInfo> {
    const params: Record<string, string> = {};
    if (program) {
      params.program = program;
      params.jenjang = program;
    }
    const response = await api.get(`${PPDB_PORTAL_BASE_PATH}/billing`, { params });
    const data = resolveData(response.data);
    const selectedUangGedung = asRecord(data.selected_uang_gedung);
    const selectedInfaqBulanan = asRecord(data.selected_infaq_bulanan);

    return {
      isAnakGuru: asBool(data.is_anak_guru),
      pilihanUangGedung: (data.pilihan_uang_gedung === 1 || data.pilihan_uang_gedung === 2)
        ? data.pilihan_uang_gedung
        : null,
      pilihanInfaqBulanan: (data.pilihan_infaq_bulanan === 1 || data.pilihan_infaq_bulanan === 2)
        ? data.pilihan_infaq_bulanan
        : null,
      uangGedungOptions: Array.isArray(data.uang_gedung_options)
        ? data.uang_gedung_options.map((item) => {
            const option = asRecord(item);
            return {
            value: option.value === 2 ? 2 : 1,
            label: asString(option.label),
            amount: Number(option.amount ?? 0),
            display: asString(option.display),
          };
          })
        : [],
      infaqBulananOptions: Array.isArray(data.infaq_bulanan_options)
        ? data.infaq_bulanan_options.map((item) => {
            const option = asRecord(item);
            return {
            value: option.value === 2 ? 2 : 1,
            label: asString(option.label),
            amount: Number(option.amount ?? 0),
            display: asString(option.display),
          };
          })
        : [],
      selectedUangGedung: Object.keys(selectedUangGedung).length > 0
        ? {
            value: selectedUangGedung.value === 2 ? 2 : 1,
            label: asString(selectedUangGedung.label),
            amount: Number(selectedUangGedung.amount ?? 0),
            display: asString(selectedUangGedung.display),
          }
        : null,
      selectedInfaqBulanan: Object.keys(selectedInfaqBulanan).length > 0
        ? {
            value: selectedInfaqBulanan.value === 2 ? 2 : 1,
            label: asString(selectedInfaqBulanan.label),
            amount: Number(selectedInfaqBulanan.amount ?? 0),
            display: asString(selectedInfaqBulanan.display),
          }
        : null,
      uangGedungLabel: asString(data.uang_gedung_label) || null,
      uangGedungAmount: data.uang_gedung_amount != null ? Number(data.uang_gedung_amount) : null,
      infaqBulananLabel: asString(data.infaq_bulanan_label) || null,
      infaqBulananAmount: data.infaq_bulanan_amount != null ? Number(data.infaq_bulanan_amount) : null,
      perlengkapanAmount: data.perlengkapan_amount != null ? Number(data.perlengkapan_amount) : 0,
      uangModulAmount: data.uang_modul_amount != null ? Number(data.uang_modul_amount) : 0,
    };
  },

  async updateForm(payload: PpdbPortalFormRequest): Promise<unknown> {
    const containsFile = hasFilePayload(payload);
    const requestConfig = containsFile
      ? {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'multipart/form-data',
          },
        }
      : undefined;

    const requestBody = containsFile
      ? (() => {
        const formData = toMultipartFormData(payload);
        // Upload berkas perlu method spoof supaya PHP membaca file sebagai POST multipart.
        formData.append('_method', 'PUT');
        return formData;
      })()
      : toJsonPayload(payload);

    try {
      const formUpdateResponse = containsFile
        ? await api.post(`${PPDB_PORTAL_BASE_PATH}/form`, requestBody, requestConfig)
        : await api.put(`${PPDB_PORTAL_BASE_PATH}/form`, requestBody, requestConfig);

      return formUpdateResponse.data;
    } catch (error) {
      const status =
        (error as { response?: { status?: number } })?.response?.status;

      if (status === 422) {
        throw new Error(extractValidationMessage(error) ?? 'Data yang dikirim belum sesuai validasi backend.');
      }

      if (!shouldFallbackToCreateIdentitas(status)) {
        throw error;
      }
    }

    const fallbackBody = containsFile ? toMultipartFormData(payload) : requestBody;
    const response = await api.post(`${PPDB_PORTAL_BASE_PATH}/pendaftaran/create-identitas`, fallbackBody, requestConfig);

    return response.data;
  },

  async previewNomor(): Promise<string> {
    try {
      const response = await api.get(`${PPDB_PORTAL_BASE_PATH}/nomor/preview`);
      const row = resolveData(response.data);
      return asString(row.noPendaftaran ?? row.no_pendaftaran ?? row.nomor_pendaftaran);
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status !== 404 && status !== 405) {
        throw error;
      }
    }

    const fallbackResponse = await api.get(`${PPDB_PORTAL_BASE_PATH}/preview-nomor`);
    const fallbackRow = resolveData(fallbackResponse.data);
    return asString(fallbackRow.noPendaftaran ?? fallbackRow.no_pendaftaran ?? fallbackRow.nomor_pendaftaran);
  },

  async getTesStatus(): Promise<PpdbPortalTesStatus> {
    const response = await api.get(`${PPDB_PORTAL_BASE_PATH}/tes`);
    return normalizeTesStatus(response.data);
  },

  async submitTesJawab(payload: PpdbPortalTesJawabRequest): Promise<unknown> {
    const response = await api.put(`${PPDB_PORTAL_BASE_PATH}/form`, {
      id_pendaftaran: payload.idPendaftaran,
      soal_jawab: payload.soalJawab,
    });
    return response.data;
  },

  async forgotPassword(email: string): Promise<{ message: string; otp_code?: string }> {
    const response = await api.post(`${PPDB_PORTAL_BASE_PATH}/forgot-password`, { email });
    return response.data as { message: string; otp_code?: string };
  },

  async resetPassword(data: Record<string, string>): Promise<{ message: string }> {
    const response = await api.post(`${PPDB_PORTAL_BASE_PATH}/reset-password`, data);
    return response.data as { message: string };
  },

  /**
   * Issue 4: Satu email untuk beberapa siswa — daftarkan sibling baru
   * POST /api/ppdb/pendaftaran/tambah-siswa
   */
  async tambahSiswaPpdb(namaCalon: string, program: string): Promise<{ id_pendaftaran: string; no_pendaftaran: string; message: string }> {
    const response = await api.post(`${PPDB_PORTAL_BASE_PATH}/pendaftaran/tambah-siswa`, {
      nama_calon: namaCalon,
      program_pendaftaran: program,
      jenjang: program,
    });
    const row = resolveData(response.data);
    return {
      id_pendaftaran: asString(row.id_pendaftaran ?? row.pendaftaran_id ?? row.id),
      no_pendaftaran: asString(row.no_pendaftaran ?? row.nomor_pendaftaran),
      message: asString(row.message || asRecord(response.data).message || 'Pendaftaran siswa baru berhasil'),
    };
  },

  /**
   * Issue 5: Upload bukti orang tua guru
   * POST /api/ppdb/form (multipart dengan field bukti_ortu_guru)
   */
  async uploadBuktiOrtuGuru(file: File): Promise<unknown> {
    const formData = new FormData();
    formData.append('bukti_ortu_guru', file);
    formData.append('_method', 'PUT');
    const response = await api.post(`${PPDB_PORTAL_BASE_PATH}/form`, formData, {
      headers: { Accept: 'application/json', 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Issue 3: Pemilihan kelas dipermudah
   * GET /api/ppdb/available-kelas
   */
  async getAvailableKelas(params?: { jenjang?: string }): Promise<Array<{ id?: string | number; kode_kelas?: string; nama_kelas?: string; tahun_ajaran?: string; kuota_sisa?: number }>> {
    const response = await api.get(`${PPDB_PORTAL_BASE_PATH}/available-kelas`, { params });
    const data = resolveData(response.data);
    const list = Array.isArray(data.data) ? data.data : Array.isArray(data.kelas) ? data.kelas : Array.isArray(data) ? data : [];
    return list;
  },

  logout() {
    clearStoredPpdbToken();
  },
};

