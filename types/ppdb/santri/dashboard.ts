export type PpdbDashboardFormState = {
  program: string;
  namaLengkap: string;
  jenisKelamin: string;
  tempatLahir: string;
  tanggalLahir: string;
  nikCalonSantri: string;
  alamatLengkap: string;
  riwayatPenyakit: string;
  namaAyah: string;
  penghasilanAyah: string;
  noHpAyah: string;
  namaIbu: string;
  noHpIbu: string;
  suratPernyataanText: string;
  asalSekolah: string;
};

export type PpdbDashboardFileState = {
  dokumenAkta: File | null;
  dokumenKk: File | null;
  dokumenRekomendasiUstadz: File | null;
  dokumenSuratPernyataan: File | null;
};

export const initialPpdbDashboardForm: PpdbDashboardFormState = {
  program: '',
  namaLengkap: '',
  jenisKelamin: '',
  tempatLahir: '',
  tanggalLahir: '',
  nikCalonSantri: '',
  alamatLengkap: '',
  riwayatPenyakit: '',
  namaAyah: '',
  penghasilanAyah: '',
  noHpAyah: '',
  namaIbu: '',
  noHpIbu: '',
  suratPernyataanText: '',
  asalSekolah: '',
};

export const initialPpdbDashboardFiles: PpdbDashboardFileState = {
  dokumenAkta: null,
  dokumenKk: null,
  dokumenRekomendasiUstadz: null,
  dokumenSuratPernyataan: null,
};
