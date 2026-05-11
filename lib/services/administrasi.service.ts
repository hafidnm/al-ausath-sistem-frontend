import api from '@/lib/axios';

type DashboardStatus = 'waiting' | 'active' | 'done';

export interface AdministrasiFlowStep {
  key: string;
  label: string;
  description: string;
  status: DashboardStatus;
  count: number;
}

export interface AdministrasiQuickAction {
  label: string;
  href: string;
  description: string;
}

export interface AdministrasiDashboardData {
  ppdb: {
    total_pendaftar: number;
    menunggu_verifikasi: number;
    diterima: number;
    ditolak: number;
    terintegrasi_santri: number;
    perlu_integrasi_santri: number;
    tagihan_ppdb_terbuat: number;
    fitur_tes_aktif: number;
  };
  spp: {
    total_setting: number;
    total_golongan: number;
    total_santri: number;
    total_tagihan: number;
    tagihan_ppdb: number;
    tagihan_spp: number;
    menunggu_verifikasi: number;
    terverifikasi: number;
    ditolak: number;
  };
  pengumuman: {
    total: number;
    aktif: number;
    pinned: number;
    akan_berakhir: number;
  };
  pembayaran: {
    total: number;
    ppdb: number;
    spp: number;
    menunggu_verifikasi: number;
    terverifikasi: number;
    ditolak: number;
    nominal_total: number;
    nominal_terverifikasi: number;
  };
  flow: AdministrasiFlowStep[];
  quick_actions: AdministrasiQuickAction[];
}

export interface AdministrasiDashboardResponse {
  message: string;
  data: AdministrasiDashboardData;
}

export const administrasiService = {
  async getDashboard(): Promise<AdministrasiDashboardData> {
    const response = await api.get<AdministrasiDashboardResponse>('/administrasi/dashboard');
    return response.data.data;
  },
};