import type { PpdbPortalDashboard, PpdbPortalFormRequest, PpdbPortalStep } from '@/types/ppdb/portal';
import { PpdbDashboardFileState, PpdbDashboardFormState } from '@/types/ppdb/santri/dashboard';

export const ppdbStatusBadgeClass: Record<string, string> = {
  Menunggu: 'bg-chart-3/20 text-chart-4 border-0',
  Terverifikasi: 'bg-accent/20 text-accent border-0',
  Diterima: 'bg-primary/10 text-primary border-0',
  Ditolak: 'bg-destructive/10 text-destructive border-0',
};

export const SURAT_PERNYATAAN_TEMPLATE_URL = '/templates/SURAT%20PERNYATAAN%20ALIYAH.pdf';

export const formatAnnouncementDate = (value: string): string => {
  if (!value) return '-';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export const formatDateTime = (value: string): string => {
  if (!value) return '-';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const normalizeProgramValue = (value: string): string => {
  const raw = (value || '').trim();
  if (!raw) return '';

  const upper = raw.toUpperCase();
  if (upper === 'MTS') return 'MTs';
  if (upper === 'PAUD' || upper === 'TK' || upper === 'MI' || upper === 'MA') {
    return upper;
  }

  return raw;
};

const normalizeJenisKelaminValue = (value: string): string => {
  const raw = (value || '').trim().toLowerCase();

  if (['l', 'lk', 'laki', 'laki-laki', 'laki laki', 'pria', 'male', 'm'].includes(raw)) {
    return 'L';
  }

  if (['p', 'pr', 'perempuan', 'wanita', 'female', 'f'].includes(raw)) {
    return 'P';
  }

  return '';
};

const normalizeDateInputValue = (value: string): string => {
  const raw = (value || '').trim();
  if (!raw) return '';

  const directMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (directMatch?.[1]) {
    return directMatch[1];
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const mapDashboardToForm = (data: PpdbPortalDashboard): PpdbDashboardFormState => ({
  program: normalizeProgramValue(data.program || data.jenjang),
  namaLengkap: data.namaLengkap || data.namaCalon,
  jenisKelamin: normalizeJenisKelaminValue(data.jenisKelamin),
  tempatLahir: data.tempatLahir,
  tanggalLahir: normalizeDateInputValue(data.tanggalLahir),
  nikCalonSantri: data.nikCalonSantri,
  alamatLengkap: data.alamatLengkap,
  riwayatPenyakit: data.riwayatPenyakit,
  namaAyah: data.namaAyah,
  penghasilanAyah: data.penghasilanAyah,
  noHpAyah: data.noHpAyah,
  namaIbu: data.namaIbu,
  noHpIbu: data.noHpIbu,
  suratPernyataanText: data.suratPernyataanText,
  asalSekolah: data.asalSekolah,
});

export const isPpdbFormIncomplete = (form: PpdbDashboardFormState): boolean => {
  const normalizedProgram = normalizeProgramValue(form.program);
  const normalizedJenisKelamin = normalizeJenisKelaminValue(form.jenisKelamin);

  const requiresSekolah = ['mi', 'mts', 'ma'].includes(
    normalizedProgram.trim().toLowerCase(),
  );

  return (
    !normalizedProgram ||
    !form.namaLengkap.trim() ||
    !normalizedJenisKelamin ||
    !form.nikCalonSantri.trim() ||
    !form.alamatLengkap.trim() ||
    !form.tempatLahir.trim() ||
    !form.tanggalLahir ||
    !form.namaAyah.trim() ||
    !form.noHpAyah.trim() ||
    !form.namaIbu.trim() ||
    !form.noHpIbu.trim() ||
    (requiresSekolah && !form.asalSekolah.trim())
  );
};

export const buildPpdbUpdatePayload = (
  form: PpdbDashboardFormState,
  files: PpdbDashboardFileState,
  data?: PpdbPortalDashboard | null,
): PpdbPortalFormRequest => {
  const normalizedProgram = normalizeProgramValue(form.program);
  const normalizedJenisKelamin = normalizeJenisKelaminValue(form.jenisKelamin);
  const normalizedTanggalLahir = normalizeDateInputValue(form.tanggalLahir);

  const idPendaftaran = data?.idPendaftar && data.idPendaftar !== '-' ? data.idPendaftar : undefined;
  const namaLengkap = form.namaLengkap.trim();
  const tempatLahir = form.tempatLahir.trim();
  const nikCalonSantri = form.nikCalonSantri.trim();
  const alamatLengkap = form.alamatLengkap.trim();
  const riwayatPenyakit = form.riwayatPenyakit.trim();
  const namaAyah = form.namaAyah.trim();
  const penghasilanAyah = form.penghasilanAyah.trim();
  const noHpAyah = form.noHpAyah.trim();
  const namaIbu = form.namaIbu.trim();
  const noHpIbu = form.noHpIbu.trim();
  const suratPernyataanText = form.suratPernyataanText.trim();
  const asalSekolah = form.asalSekolah.trim();
  const emailPpdb = data?.email?.trim() || undefined;

  return {
    idPendaftaran,
    id_pendaftaran: idPendaftaran,
    namaCalon: namaLengkap,
    nama_calon: namaLengkap,
    namaLengkap,
    nama_lengkap: namaLengkap,
    program: normalizedProgram,
    program_pendaftaran: normalizedProgram,
    jenjang: normalizedProgram,
    tempatLahir,
    tempat_lahir: tempatLahir,
    tanggalLahir: normalizedTanggalLahir,
    tanggal_lahir: normalizedTanggalLahir,
    jenisKelamin: normalizedJenisKelamin,
    jenis_kelamin: normalizedJenisKelamin,
    nikCalonSantri,
    nik_calon_santri: nikCalonSantri,
    alamatLengkap,
    alamat_lengkap: alamatLengkap,
    riwayatPenyakit,
    riwayat_penyakit: riwayatPenyakit,
    namaAyah,
    nama_ayah: namaAyah,
    penghasilanAyah,
    penghasilan_ayah: penghasilanAyah,
    noHpCalon: noHpAyah,
    no_hp_calon: noHpAyah,
    noHpAyah,
    no_hp_ayah: noHpAyah,
    namaIbu,
    nama_ibu: namaIbu,
    noHpIbu,
    no_hp_ibu: noHpIbu,
    suratPernyataanText,
    surat_pernyataan_text: suratPernyataanText,
    asalSekolah,
    asal_sekolah: asalSekolah,
    asalKota: asalSekolah,
    asal_kota: asalSekolah,
    suratPernyataanSetuju: 'accepted',
    surat_pernyataan_setuju: 'accepted',
    dokumenAkta: files.dokumenAkta,
    dokumen_akta: files.dokumenAkta,
    dokumenKk: files.dokumenKk,
    dokumen_kk: files.dokumenKk,
    dokumenRekomendasiUstadz: files.dokumenRekomendasiUstadz,
    dokumen_rekomendasi_ustadz: files.dokumenRekomendasiUstadz,
    dokumenSuratPernyataan: files.dokumenSuratPernyataan,
    dokumen_surat_pernyataan: files.dokumenSuratPernyataan,
    emailPpdb,
    email_ppdb: emailPpdb,
  };
};

export const portalStepRoute = (step: PpdbPortalStep): string | null => {
  if (step === 'infaq') return '/ppdb/dashboard/infaq';
  if (step === 'tes') return '/ppdb/tes';
  if (step === 'pembayaran-ppdb') return '/ppdb/dashboard/pembayaran';
  if (step === 'siap-menjadi-santri') return '/ppdb/dashboard/siap-menjadi-santri';
  if (step === 'pengumuman' || step === 'menunggu-pengumuman') return '/ppdb/dashboard/pengumuman';
  return null;
};

export const getCorrectFrontendStep = (data: PpdbPortalDashboard | null): PpdbPortalStep => {
  if (!data) return 'lengkapi-form';

  const statusVerifikasi = (data.statusVerifikasi || data.status || '').toLowerCase();
  const isDecided = ['diterima', 'lulus', 'accepted', 'ditolak', 'rejected', 'tidak_diterima', 'tidak diterima'].includes(statusVerifikasi);

  // If candidate's status is decided, they should go to pengumuman (or siap-menjadi-santri if accepted)
  if (isDecided || data.step === 'siap-menjadi-santri') {
    if (statusVerifikasi === 'diterima' || statusVerifikasi === 'accepted' || statusVerifikasi === 'lulus' || data.step === 'siap-menjadi-santri') {
      return 'siap-menjadi-santri';
    }
    return 'pengumuman';
  }

  // Step 1: Lengkapi Form
  if (!data.formCompleted) {
    return 'lengkapi-form';
  }

  // Step 2: Infaq
  // Treat undefined/null/0 as "belum dipilih" — API may return undefined if never set
  const hasSelectedInfaq =
    (data.pilihanUangGedung === 1 || data.pilihanUangGedung === 2) &&
    (data.pilihanInfaqBulanan === 1 || data.pilihanInfaqBulanan === 2);
  if (!hasSelectedInfaq) {
    return 'infaq';
  }

  // Step 3: Tes PPDB (Opsional)
  // Only if test is active/enabled.
  const hasSubmittedTes = Boolean((data.soalJawab || '').trim());
  if (data.fiturSoalAktif && !hasSubmittedTes) {
    return 'tes';
  }

  // Step 4: Pembayaran Biaya Pendaftaran
  // Only if they haven't paid or payment is not verified/submitted
  const ppdbAdminPaid = ['menunggu_verifikasi', 'menunggu_konfirmasi', 'terverifikasi', 'lunas', 'dp'].includes(
    data.pembayaranPpdb?.status || ''
  );
  if (!ppdbAdminPaid) {
    return 'pembayaran-ppdb';
  }

  // Step 5: Pengumuman
  if (data.step === 'menunggu-pengumuman') {
    return 'menunggu-pengumuman';
  }
  return 'pengumuman';
};
