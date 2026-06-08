import type { TestQuestion } from '@/types/ppdb/admin';

export type PpdbVerificationStatus = 'Menunggu' | 'Terverifikasi' | 'Diterima' | 'Ditolak';

export type PpdbPortalStep =
  | 'lengkapi-form'
  | 'tes'
  | 'infaq'
  | 'menunggu-pengumuman'
  | 'pengumuman'
  | 'pembayaran-ppdb'
  | 'pembayaran-uang-pangkal'
  | 'pembayaran-spp'
  | 'gagal-bayar-uang-pangkal'
  | 'gagal-bayar-spp'
  | 'siap-menjadi-santri';

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
  nama_calon?: string;
  namaLengkap?: string;
  nama_lengkap?: string;
  program?: string;
  jenjang?: string;
  program_pendaftaran?: string;
  noHpCalon?: string;
  no_hp_calon?: string;
  nomorUmi?: string;
  asalKota?: string;
  asal_kota?: string;
  asalSekolah?: string;
  asal_sekolah?: string;
  tempatLahir?: string;
  tempat_lahir?: string;
  tanggalLahir?: string;
  tanggal_lahir?: string;
  jenisKelamin?: string;
  jenis_kelamin?: string;
  nikCalonSantri?: string;
  nik_calon_santri?: string;
  alamatLengkap?: string;
  alamat_lengkap?: string;
  riwayatPenyakit?: string;
  riwayat_penyakit?: string;
  namaAyah?: string;
  nama_ayah?: string;
  penghasilanAyah?: string;
  penghasilan_ayah?: string;
  noHpAyah?: string;
  no_hp_ayah?: string;
  namaIbu?: string;
  nama_ibu?: string;
  noHpIbu?: string;
  no_hp_ibu?: string;
  soalJawab?: string;
  soal_jawab?: string;
  suratPernyataanText?: string;
  surat_pernyataan_text?: string;
  dokumenAkta?: File | null;
  dokumen_akta?: File | null;
  dokumenKk?: File | null;
  dokumen_kk?: File | null;
  dokumenAktaKk?: File | null;
  dokumen_akta_kk?: File | null;
  dokumenRekomendasiUstadz?: File | null;
  dokumen_rekomendasi_ustadz?: File | null;
  dokumenSuratPernyataan?: File | null;
  dokumen_surat_pernyataan?: File | null;
  fileAktaPath?: string;
  file_akta_path?: string;
  fileKkPath?: string;
  file_kk_path?: string;
  fileSuratRekomendasiPath?: string;
  file_surat_rekomendasi_path?: string;
  suratPernyataanSetuju?: 'accepted';
  surat_pernyataan_setuju?: 'accepted';
  suratPernyataanFilePath?: string;
  surat_pernyataan_file_path?: string;
  alamat?: string;
  emailPpdb?: string;
  email_ppdb?: string;
  idAkun?: string;
  idPendaftaran?: string;
  id_pendaftaran?: string;
  bukti_uang_pangkal?: File | null;
  bukti_spp?: File | null;
  is_anak_guru?: boolean;
  pilihan_uang_gedung?: number;
  pilihan_infaq_bulanan?: number;
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
  /** Data tagihan PPDB (biaya administrasi Rp 100.000) */
  pembayaranPpdb: {
    id_pembayaran: number | null;
    status: string | null;
    nominal_bayar: number;
    has_tagihan: boolean;
  } | null;
  statusVerifikasi: string;
  isAnakGuru?: boolean;
  pilihanUangGedung?: number | null;
  pilihanInfaqBulanan?: number | null;
  tanggalDiterima?: string;
  batasBayarUangPangkal?: string;
  batasBayarSpp?: string;
  statusUangPangkal?: string;
  statusSpp?: string;
  namaGelombang?: string;
  tahunAjaran?: string;
  buktiUangPangkalUrl?: string;
  buktiSppUrl?: string;
  nomorIndukGenerated?: string;
  kodeKelasDiterima?: string;
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
