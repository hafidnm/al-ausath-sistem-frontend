import { PpdbPortalDashboard, PpdbPortalFormRequest } from '@/lib/services/ppdb-portal.service';
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

export const mapDashboardToForm = (data: PpdbPortalDashboard): PpdbDashboardFormState => ({
  program: data.program,
  namaLengkap: data.namaLengkap || data.namaCalon,
  jenisKelamin: data.jenisKelamin,
  tempatLahir: data.tempatLahir,
  tanggalLahir: data.tanggalLahir,
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
  const requiresSekolah = ['mi', 'mts', 'ma'].includes(
    (form.program || '').trim().toLowerCase(),
  );
  return (
    !form.namaLengkap.trim() ||
    !form.jenisKelamin ||
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
): PpdbPortalFormRequest & { program_pendaftaran?: string } => ({
  idPendaftaran: data?.idPendaftar && data.idPendaftar !== '-' ? data.idPendaftar : undefined,
  namaCalon: form.namaLengkap.trim(),
  namaLengkap: form.namaLengkap.trim(),
  program: form.program.trim(),
  program_pendaftaran: form.program.trim(),
  jenjang: form.program.trim(),
  tempatLahir: form.tempatLahir.trim(),
  tanggalLahir: form.tanggalLahir,
  jenisKelamin: form.jenisKelamin,
  nikCalonSantri: form.nikCalonSantri.trim(),
  alamatLengkap: form.alamatLengkap.trim(),
  riwayatPenyakit: form.riwayatPenyakit.trim(),
  namaAyah: form.namaAyah.trim(),
  penghasilanAyah: form.penghasilanAyah.trim(),
  noHpCalon: form.noHpAyah.trim(),
  noHpAyah: form.noHpAyah.trim(),
  namaIbu: form.namaIbu.trim(),
  noHpIbu: form.noHpIbu.trim(),
  suratPernyataanText: form.suratPernyataanText.trim(),
  asalSekolah: form.asalSekolah.trim(),
  suratPernyataanSetuju: 'accepted',
  dokumenAkta: files.dokumenAkta,
  dokumenKk: files.dokumenKk,
  dokumenRekomendasiUstadz: files.dokumenRekomendasiUstadz,
  dokumenSuratPernyataan: files.dokumenSuratPernyataan,
  emailPpdb: data?.email?.trim(),
});
