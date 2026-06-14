export interface CreatePpdbRequest {
  name: string;
  programPendaftaran?: string;
  jenjang: string;
  jenisKelamin?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  nikCalonSantri?: string;
  alamatLengkap?: string;
  riwayatPenyakit?: string;
  namaAyah?: string;
  penghasilanAyah?: string;
  noHpCalon?: string;
  namaIbu?: string;
  noHpIbu?: string;
  soalJawab?: string;
  fileAktaPath?: string;
  fileKkPath?: string;
  fileSuratRekomendasiPath?: string;
  suratPernyataanSetuju?: string;
  suratPernyataanFilePath?: string;
  asalSekolah: string;
  wali: string;
  phone: string;
  tanggalDaftar: string;
  status?: 'Menunggu' | 'Terverifikasi' | 'Diterima' | 'Ditolak';
}

export interface UpdatePpdbRequest {
  name?: string;
  programPendaftaran?: string;
  jenjang?: string;
  jenisKelamin?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  nikCalonSantri?: string;
  alamatLengkap?: string;
  riwayatPenyakit?: string;
  namaAyah?: string;
  penghasilanAyah?: string;
  noHpCalon?: string;
  namaIbu?: string;
  noHpIbu?: string;
  soalJawab?: string;
  fileAktaPath?: string;
  fileKkPath?: string;
  fileSuratRekomendasiPath?: string;
  suratPernyataanSetuju?: string;
  suratPernyataanFilePath?: string;
  asalSekolah?: string;
  wali?: string;
  phone?: string;
  tanggalDaftar?: string;
  status?: 'Menunggu' | 'Terverifikasi' | 'Diterima' | 'Ditolak';
}

export interface PpdbDetail {
  buktiOrtuGuruUrl: any;
  id: string;
  pendaftaranId?: string;
  userId?: string;
  waktuPendaftaran?: string;
  noPendaftaran: string;
  noPendaftaranFinal?: string;
  nomorIndukGenerated?: string;
  name: string;
  programPendaftaran?: string;
  jenjang: string;
  jenisKelamin?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  nikCalonSantri?: string;
  alamatLengkap?: string;
  riwayatPenyakit?: string;
  namaAyah?: string;
  penghasilanAyah?: string;
  noHpCalon?: string;
  namaIbu?: string;
  noHpIbu?: string;
  soalJawab?: string;
  nilaiTes?: number;
  statusTes?: string;
  metodeTes?: string;
  catatanTes?: string;
  fileAktaPath?: string;
  fileKkPath?: string;
  fileSuratRekomendasiPath?: string;
  suratPernyataanSetuju?: string;
  suratPernyataanFilePath?: string;
  fiturSoalAktif?: boolean;
  soalTes?: string;
  showHalamanTes?: boolean;
  pendaftaranSelesai?: boolean;
  tanggalPengumuman?: string;
  tanggalDiterima?: string;
  isFormLengkap?: boolean;
  asalSekolah: string;
  wali: string;
  phone: string;
  email?: string;
  tanggalDaftar: string;
  status: string;
  statusUangPangkal?: string;
  statusSpp?: string;
  buktiUangPangkalPath?: string;
  buktiSppPath?: string;
  isAnakGuru?: boolean;
  pilihanUangGedung?: number | null;
  pilihanInfaqBulanan?: number | null;
  buktiOrtuGuruPath?: string;
  buktiOrtuGuruVerified?: boolean | null;
}

export interface PpdbListResponse {
  data: PpdbDetail[];
  message: string;
}

export interface PpdbListQuery {
  page?: number;
  per_page?: number;
  status_verifikasi?: string;
  status?: string;
  hasil_verifikasi?: string;
  jenjang?: string;
  tanggal_daftar_mulai?: string;
  tanggal_daftar_selesai?: string;
  pendaftaran_selesai?: boolean;
  q?: string;
}

export interface UpdateTestResultRequest {
  nilai?: number;
  statusTes?: string;
  metodeTes?: string;
  catatan?: string;
  soalTes?: string;
  // Backward compatibility keys.
  hasilTes?: number;
  keterangan?: string;
  fiturSoalAktif?: boolean;
}

export type TestQuestionType = 'essay' | 'multiple_choice';

export interface TestQuestion {
  id: string;
  type: TestQuestionType;
  question: string;
  options?: string[];
  /** URL gambar pendukung soal (opsional) */
  image_url?: string;
  /** Bahasa soal per-pertanyaan: 'id' (Indonesia) atau 'ar' (Arab) */
  bahasa?: 'id' | 'ar';
}

export interface UpdateTesKonfigurasiRequest {
  fiturSoalAktif: boolean;
  soalTes?: string;
  formSchema?: TestQuestion[];
  /** Global bahasa untuk jenjang (deprecated, use per-question bahasa instead) */
  bahasa?: 'id' | 'ar';
  /** Global RTL flag untuk jenjang (deprecated, use per-question bahasa instead) */
  is_rtl?: boolean;
}

export type TesKonfigurasiJenjangKey = 'MI' | 'MTS' | 'MA';

export interface TesKonfigurasiJenjang {
  jenjang: TesKonfigurasiJenjangKey;
  fiturSoalAktif: boolean;
  soalTes?: string;
  formSchema?: TestQuestion[];
  /** Bahasa soal: 'id' (Indonesia) atau 'ar' (Arab) */
  bahasa?: 'id' | 'ar';
  /** Apakah soal menggunakan tata letak RTL */
  is_rtl?: boolean;
}

export interface UpdateTesKonfigurasiJenjangRequest {
  fiturSoalAktif: boolean;
  soalTes?: string;
  formSchema?: TestQuestion[];
  bahasa?: 'id' | 'ar';
  is_rtl?: boolean;
}

export interface UpdateVerificationRequest {
  status: 'Terverifikasi' | 'Ditolak' | 'Diterima' | 'Menunggu';
  keterangan?: string;
  idPetugas?: string;
  tanggalVerif?: string;
  catatan?: string;
  kodeKelasDiterima?: string;
  integrasikanLangsungKeSantri?: boolean;
  autoBuatAkunSantri?: boolean;
}

export interface AddNotificationRequest {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  sentAt?: string;
  statusKirim?: string;
  kirimEmail?: boolean;
}

export interface PpdbAcceptedRecapItem {
  idPendaftaran: string;
  waktuPendaftaran: string;
  noPendaftaran: string;
  nomorInduk: string;
  namaAnak: string;
  jenjang: string;
  tempatLahir: string;
  tanggalLahir: string;
  namaOrtu: string;
  alamat: string;
  noHpOrtu: string;
  statusVerifikasi: string;
}

export interface PpdbAcceptedRecapResponse {
  data: PpdbAcceptedRecapItem[];
  jumlahDiterima: number;
}
