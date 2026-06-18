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
  hasilTes: number;
  keterangan?: string;
  fiturSoalAktif?: boolean;
  soalTes?: string;
}

export type TestQuestionType = 'essay' | 'multiple_choice';

export interface TestQuestion {
  id: string;
  type: TestQuestionType;
  question: string;
  options?: string[]; // Used for multiple_choice
  correctAnswerIndex?: number;
}

export interface UpdateTesKonfigurasiRequest {
  fiturSoalAktif: boolean;
  soalTes?: string;
  formSchema?: TestQuestion[];
}

export type TesKonfigurasiJenjangKey = 'MI' | 'MTS' | 'MA';

export interface TesKonfigurasiJenjang {
  jenjang: TesKonfigurasiJenjangKey;
  fiturSoalAktif: boolean;
  soalTes?: string;
  formSchema?: TestQuestion[];
}

export interface UpdateTesKonfigurasiJenjangRequest {
  fiturSoalAktif: boolean;
  soalTes?: string;
  formSchema?: TestQuestion[];
}

export interface UpdateVerificationRequest {
  status: 'Terverifikasi' | 'Ditolak' | 'Diterima';
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
