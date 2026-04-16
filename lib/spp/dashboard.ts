import { SppPayment, SppSetting, SppTunggakanSummary } from '@/lib/services/spp.service';
import { PaymentFormState, SettingFormState } from '@/types/spp/dashboard';

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatDate = (value: string) => {
  if (!value) return '-';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

export const parseNumberInput = (value: string): number => {
  const normalized = value.replace(/[^\d]/g, '');
  if (!normalized) return 0;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const summarizeFromPayments = (payments: SppPayment[]): SppTunggakanSummary => {
  const totalTagihan = payments.length;
  const totalLunas = payments.filter((item) => item.status === 'Lunas').length;
  const totalCicilan = payments.filter((item) => item.status === 'Cicilan').length;
  const totalBelumBayar = payments.filter((item) => item.status === 'Belum Bayar').length;
  const totalTerlambat = payments.filter((item) => item.status === 'Terlambat').length;
  const totalNominal = payments.reduce((sum, item) => sum + item.nominal, 0);
  const totalTerbayar = payments.reduce((sum, item) => sum + item.terbayar, 0);
  const totalSisa = Math.max(totalNominal - totalTerbayar, 0);

  const sortedDueDates = payments
    .map((item) => new Date(item.jatuhTempo))
    .filter((item) => !Number.isNaN(item.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  const now = new Date();
  const nextDue = sortedDueDates.find((date) => date.getTime() >= now.getTime()) ?? sortedDueDates[0];

  return {
    periode: payments[0]?.bulan ?? '',
    totalTagihan,
    totalLunas,
    totalCicilan,
    totalBelumBayar,
    totalTerlambat,
    totalNominal,
    totalTerbayar,
    totalSisa,
    jatuhTempoBerikutnya: nextDue ? nextDue.toISOString() : '',
  };
};

export const mergeSummary = (
  baseSummary: SppTunggakanSummary,
  apiSummary: SppTunggakanSummary | null,
): SppTunggakanSummary => {
  if (!apiSummary) return baseSummary;

  const pickNumber = (primary: number, fallback: number) => {
    return primary > 0 ? primary : fallback;
  };

  return {
    periode: apiSummary.periode || baseSummary.periode,
    totalTagihan: pickNumber(apiSummary.totalTagihan, baseSummary.totalTagihan),
    totalLunas: pickNumber(apiSummary.totalLunas, baseSummary.totalLunas),
    totalCicilan: pickNumber(apiSummary.totalCicilan, baseSummary.totalCicilan),
    totalBelumBayar: pickNumber(apiSummary.totalBelumBayar, baseSummary.totalBelumBayar),
    totalTerlambat: pickNumber(apiSummary.totalTerlambat, baseSummary.totalTerlambat),
    totalNominal: pickNumber(apiSummary.totalNominal, baseSummary.totalNominal),
    totalTerbayar: pickNumber(apiSummary.totalTerbayar, baseSummary.totalTerbayar),
    totalSisa: pickNumber(apiSummary.totalSisa, baseSummary.totalSisa),
    jatuhTempoBerikutnya: apiSummary.jatuhTempoBerikutnya || baseSummary.jatuhTempoBerikutnya,
  };
};

export const mapPaymentToForm = (payment: SppPayment): PaymentFormState => {
  return {
    noTagihan: payment.noTagihan,
    nis: payment.nis,
    nama: payment.nama,
    kelas: payment.kelas,
    bulan: payment.bulan,
    jatuhTempo: payment.jatuhTempo,
    nominal: payment.nominal.toString(),
    terbayar: payment.terbayar.toString(),
    status: payment.status,
  };
};

export const mapSettingToForm = (setting: SppSetting): SettingFormState => {
  return {
    nama: setting.nama,
    jenjang: setting.jenjang,
    kelas: setting.kelas,
    tahunAjaran: setting.tahunAjaran,
    nominal: setting.nominal.toString(),
    jatuhTempoHari: setting.jatuhTempoHari?.toString() ?? '',
    aktif: setting.aktif ? 'true' : 'false',
    keterangan: setting.keterangan,
  };
};
