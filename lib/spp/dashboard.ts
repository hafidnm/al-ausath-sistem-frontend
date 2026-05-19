import type { SppPayment, SppSetting, SppTunggakanSummary } from '@/lib/services/spp.service';
import type { PaymentFormState, SettingFormState } from '@/types/spp/dashboard';

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);

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

export const formatDateTime = (value: string) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export const parseNumberInput = (value: string): number => {
  const cleaned = value.replace(/[^\d]/g, '');
  if (!cleaned) return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const summarizeFromPayments = (payments: SppPayment[]): SppTunggakanSummary => {
  const totalTagihan = payments.length;
  const totalLunas = payments.filter((p) => p.status === 'Lunas').length;
  const totalCicilan = payments.filter((p) => p.status === 'Cicilan').length;
  const totalBelumBayar = payments.filter((p) => p.status === 'Belum Bayar').length;
  const totalTerlambat = payments.filter((p) => p.status === 'Terlambat').length;
  const totalNominal = payments.reduce((s, p) => s + p.nominal, 0);
  const totalTerbayar = payments.reduce((s, p) => s + p.terbayar, 0);
  const totalSisa = Math.max(totalNominal - totalTerbayar, 0);

  const sortedDues = payments
    .map((p) => new Date(p.jatuhTempo))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  const now = new Date();
  const nextDue = sortedDues.find((d) => d >= now) ?? sortedDues[0] ?? null;

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

  const pick = (primary: number, fallback: number) => (primary > 0 ? primary : fallback);

  return {
    periode: apiSummary.periode || baseSummary.periode,
    totalTagihan: pick(apiSummary.totalTagihan, baseSummary.totalTagihan),
    totalLunas: pick(apiSummary.totalLunas, baseSummary.totalLunas),
    totalCicilan: pick(apiSummary.totalCicilan, baseSummary.totalCicilan),
    totalBelumBayar: pick(apiSummary.totalBelumBayar, baseSummary.totalBelumBayar),
    totalTerlambat: pick(apiSummary.totalTerlambat, baseSummary.totalTerlambat),
    totalNominal: pick(apiSummary.totalNominal, baseSummary.totalNominal),
    totalTerbayar: pick(apiSummary.totalTerbayar, baseSummary.totalTerbayar),
    totalSisa: pick(apiSummary.totalSisa, baseSummary.totalSisa),
    jatuhTempoBerikutnya:
      apiSummary.jatuhTempoBerikutnya || baseSummary.jatuhTempoBerikutnya,
  };
};

/** Map payment for the edit form (populate fields that can be edited) */
export const mapPaymentToForm = (payment: SppPayment): PaymentFormState => ({
  idSantri: payment.idSantri,
  idSetting: payment.idSetting,
  nominalBayar: payment.nominalBayar.toString(),
  tanggalBayar: payment.tanggalBayar,
  metodeBayar: payment.metodeBayar || 'transfer',
});

/** Map setting for the edit form */
export const mapSettingToForm = (setting: SppSetting): SettingFormState => ({
  kodeKelas: setting.kodeKelas ?? "",
  idGolonganSpp: setting.idGolonganSpp ?? "",
  nominal: setting.nominal.toString(),
});
