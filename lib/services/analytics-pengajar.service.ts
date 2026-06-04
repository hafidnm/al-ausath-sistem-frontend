import api from '@/lib/axios';

export interface ClassStatistics {
  kode_kelas: string;
  nama_kelas: string;
  kode_mapel: string;
  nama_mapel: string;
  rata_rata: number;
  tertinggi: number;
  terendah: number;
  jumlah_santri: number;
}

export interface SubjectRecap {
  kode_mapel: string;
  nama_mapel: string;
  rata_harian: number;
  rata_uts: number;
  rata_uas: number;
  rata_akhir: number;
  jumlah_santri: number;
}

export interface ScoreDistributionItem {
  range: string;
  min: number;
  max: number;
  count: number;
  percentage: number;
}

export interface ScoreDistributionResponse {
  data: ScoreDistributionItem[];
  total_santri: number;
  filters?: {
    tahun_ajaran?: string | null;
    semester?: number | null;
    kode_kelas?: string | null;
    kode_mapel?: string | null;
  };
}

export interface AnalyticsQuery {
  tahun_ajaran?: string;
  semester?: number | string;
  kode_kelas?: string;
  kode_mapel?: string;
}

class AnalyticsPengajarService {
  async getClassStatistics(query?: AnalyticsQuery) {
    const response = await api.get<{ data: ClassStatistics[] }>(
      `/akademik/analytics/class-statistics`,
      { params: query }
    );
    return response.data;
  }

  async getSubjectRecap(query?: AnalyticsQuery) {
    const response = await api.get<{ data: SubjectRecap[] }>(
      `/akademik/analytics/subject-recap`,
      { params: query }
    );
    return response.data;
  }

  async getScoreDistribution(query?: AnalyticsQuery) {
    const response = await api.get<ScoreDistributionResponse>(
      `/akademik/analytics/score-distribution`,
      { params: query }
    );
    return response.data;
  }
}

export const analyticsPengajarService = new AnalyticsPengajarService();
