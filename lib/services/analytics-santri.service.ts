import api from '@/lib/axios'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SubjectScore {
  kode_mapel: string
  nama_mapel: string
  nilai_harian: number
  nilai_uts: number
  nilai_uas: number
  nilai_akhir: number
  nilai_rapor_tampil: number
  status_ketuntasan: string
}

export interface SubjectScoresResponse {
  data: SubjectScore[]
  filters: {
    tahun_ajaran?: string
    semester?: number
  }
}

export interface ScoreTrendPoint {
  semester: number
  tahun_ajaran: string
  nilai_akhir: number
  status_ketuntasan: string
}

export interface ScoreTrendItem {
  kode_mapel: string
  nama_mapel: string
  trend: ScoreTrendPoint[]
}

export interface ScoresTrendResponse {
  data: ScoreTrendItem[]
  filters: {
    kode_mapel?: string
    tahun_ajaran?: string
  }
}

export interface AcademicProgressItem {
  kode_mapel: string
  nama_mapel: string
  nilai_akhir: number
  kkm: number
  tuntas: boolean
  status_ketuntasan: string
  perubahan: {
    nilai_sebelumnya: number | null
    selisih: number | null
    persentase_perubahan: number | null
    trend: 'naik' | 'turun' | 'tetap' | 'N/A'
  }
}

export interface AcademicProgressSummary {
  total_mapel: number
  tuntas: number
  belum_tuntas: number
  persentase_tuntas: number
}

export interface AcademicProgressResponse {
  data: AcademicProgressItem[]
  summary: AcademicProgressSummary
  filters: {
    tahun_ajaran?: string
    semester?: number
  }
}

export interface SantriAnalyticsQuery {
  tahun_ajaran?: string
  semester?: number
  kode_mapel?: string
}

// ─── Service ─────────────────────────────────────────────────────────────────

class AnalyticsSantriService {
  async getSubjectScores(query?: SantriAnalyticsQuery): Promise<SubjectScoresResponse> {
    const response = await api.get<SubjectScoresResponse>(
      '/akademik/santri-analytics/subject-scores',
      { params: query }
    )
    return response.data
  }

  async getScoresTrend(query?: SantriAnalyticsQuery): Promise<ScoresTrendResponse> {
    const response = await api.get<ScoresTrendResponse>(
      '/akademik/santri-analytics/scores-trend',
      { params: query }
    )
    return response.data
  }

  async getAcademicProgress(query?: SantriAnalyticsQuery): Promise<AcademicProgressResponse> {
    const response = await api.get<AcademicProgressResponse>(
      '/akademik/santri-analytics/academic-progress',
      { params: query }
    )
    return response.data
  }
}

export const analyticsSantriService = new AnalyticsSantriService()
