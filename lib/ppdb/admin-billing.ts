import type { PpdbPortalBillingInfo } from '@/types/ppdb/portal';

type InfaqConfig = {
  uang_pangkal_a: number;
  uang_pangkal_b: number;
  infaq_bulanan_a: number;
  infaq_bulanan_b: number;
};

const INFAQ_CONFIGS: Record<string, InfaqConfig> = {
  PAUD: { uang_pangkal_a: 500000, uang_pangkal_b: 500000, infaq_bulanan_a: 200000, infaq_bulanan_b: 250000 },
  TK: { uang_pangkal_a: 1000000, uang_pangkal_b: 1500000, infaq_bulanan_a: 300000, infaq_bulanan_b: 350000 },
  PRATAHFIDZ: { uang_pangkal_a: 1800000, uang_pangkal_b: 2000000, infaq_bulanan_a: 350000, infaq_bulanan_b: 400000 },
  MTS: { uang_pangkal_a: 1500000, uang_pangkal_b: 2000000, infaq_bulanan_a: 600000, infaq_bulanan_b: 650000 },
  MA: { uang_pangkal_a: 1500000, uang_pangkal_b: 2000000, infaq_bulanan_a: 650000, infaq_bulanan_b: 700000 },
};

const formatRupiah = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;

export const normalizeAdminProgramKey = (program: string): string => {
  const raw = (program || '').trim().toUpperCase();
  if (raw === 'MI' || raw === 'SD') return 'PRATAHFIDZ';
  if (raw === 'MTS' || raw === 'SMP') return 'MTS';
  if (raw === 'MA' || raw === 'SMA' || raw === 'SMK') return 'MA';
  if (raw === 'PAUD') return 'PAUD';
  if (raw === 'TK' || raw === 'RA') return 'TK';
  return raw;
};

export const getAdminBillingInfo = (program?: string): PpdbPortalBillingInfo | null => {
  const key = normalizeAdminProgramKey(program || '');
  const config = INFAQ_CONFIGS[key];
  if (!config) return null;

  const buildOption = (value: 1 | 2, label: string, amount: number) => ({
    value,
    label,
    amount,
    display: formatRupiah(amount),
  });

  return {
    isAnakGuru: false,
    pilihanUangGedung: null,
    pilihanInfaqBulanan: null,
    uangGedungOptions: [
      buildOption(1, 'Pilihan A', config.uang_pangkal_a),
      buildOption(2, 'Pilihan B', config.uang_pangkal_b),
    ],
    infaqBulananOptions: [
      buildOption(1, 'Pilihan A', config.infaq_bulanan_a),
      buildOption(2, 'Pilihan B', config.infaq_bulanan_b),
    ],
    selectedUangGedung: null,
    selectedInfaqBulanan: null,
    uangGedungLabel: null,
    uangGedungAmount: null,
    infaqBulananLabel: null,
    infaqBulananAmount: null,
    perlengkapanAmount: 0,
    uangModulAmount: 0,
  };
};
