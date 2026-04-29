/**
 * Pengumuman Service — aligned with backend API
 *
 * Base path: /api/administrasi/pengumuman
 * Public:    /api/pengumuman
 *
 * Admin endpoints:
 *   GET    /api/administrasi/pengumuman          - List (with filters)
 *   POST   /api/administrasi/pengumuman          - Create
 *   GET    /api/administrasi/pengumuman/{id}     - Detail
 *   PUT    /api/administrasi/pengumuman/{id}     - Update
 *   DELETE /api/administrasi/pengumuman/{id}     - Delete
 *
 * Public:
 *   GET    /api/pengumuman                       - Public list (landing page)
 */
import api from '@/lib/axios';

const ADMIN_BASE = '/administrasi/pengumuman';
const PUBLIC_BASE = '/pengumuman';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PengumumanKategori = 'ppdb' | 'akademik' | 'umum' | 'kegiatan';

export interface Pengumuman {
  id: number;
  judul: string;
  konten: string;
  kategori: PengumumanKategori | string;
  is_aktif: boolean;
  is_pinned: boolean;
  urutan: number;
  tanggal_selesai: string | null;
  created_at: string;
  updated_at: string;
  created_by?: number;
}

export interface PengumumanListQuery {
  per_page?: number;
  kategori?: PengumumanKategori | string;
  is_aktif?: boolean;
  q?: string;
}

export interface CreatePengumumanRequest {
  judul: string;
  konten: string;
  kategori: PengumumanKategori | string;
  is_aktif: boolean;
  is_pinned: boolean;
  urutan: number;
  tanggal_selesai: string | null;
}

export type UpdatePengumumanRequest = Partial<CreatePengumumanRequest>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object') {
    const e = error as {
      response?: { data?: { message?: string; error?: string } };
      message?: string;
    };
    return e.response?.data?.message ?? e.response?.data?.error ?? e.message ?? fallback;
  }
  return fallback;
};

type ApiRecord = Record<string, unknown>;

const normalizePengumuman = (item: ApiRecord): Pengumuman => ({
  id: Number(item.id ?? item.id_pengumuman ?? 0),
  judul: String(item.judul ?? ''),
  konten: String(item.konten ?? ''),
  kategori: String(item.kategori ?? 'umum') as PengumumanKategori,
  is_aktif: Boolean(item.is_aktif ?? item.aktif ?? false),
  is_pinned: Boolean(item.is_pinned ?? item.pinned ?? false),
  urutan: Number(item.urutan ?? 0),
  tanggal_selesai: item.tanggal_selesai ? String(item.tanggal_selesai) : null,
  created_at: String(item.created_at ?? ''),
  updated_at: String(item.updated_at ?? ''),
  created_by: item.created_by !== undefined ? Number(item.created_by) : undefined,
});

const extractList = (payload: unknown): ApiRecord[] => {
  if (!payload || typeof payload !== 'object') return [];
  const rec = payload as ApiRecord;
  if (Array.isArray(rec)) return rec.filter((i): i is ApiRecord => !!i && typeof i === 'object');
  if (Array.isArray(rec.data)) return (rec.data as unknown[]).filter((i): i is ApiRecord => !!i && typeof i === 'object');
  return [];
};

// ─── Service ──────────────────────────────────────────────────────────────────

export const pengumumanService = {
  // ── Admin operations ────────────────────────────────────────────────────────

  async getList(query?: PengumumanListQuery): Promise<Pengumuman[]> {
    try {
      const response = await api.get(ADMIN_BASE, { params: query });
      return extractList(response.data).map(normalizePengumuman);
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal memuat daftar pengumuman'));
    }
  },

  async getDetail(id: number): Promise<Pengumuman> {
    try {
      const response = await api.get(`${ADMIN_BASE}/${id}`);
      const raw = response.data as ApiRecord;
      const item = (raw.data && typeof raw.data === 'object' ? raw.data : raw) as ApiRecord;
      return normalizePengumuman(item);
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal memuat detail pengumuman'));
    }
  },

  async create(data: CreatePengumumanRequest): Promise<Pengumuman> {
    try {
      const response = await api.post(ADMIN_BASE, data);
      const raw = response.data as ApiRecord;
      const item = (raw.data && typeof raw.data === 'object' ? raw.data : raw) as ApiRecord;
      return normalizePengumuman(item);
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal membuat pengumuman'));
    }
  },

  async update(id: number, data: UpdatePengumumanRequest): Promise<Pengumuman> {
    try {
      const response = await api.put(`${ADMIN_BASE}/${id}`, data);
      const raw = response.data as ApiRecord;
      const item = (raw.data && typeof raw.data === 'object' ? raw.data : raw) as ApiRecord;
      return normalizePengumuman(item);
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal memperbarui pengumuman'));
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await api.delete(`${ADMIN_BASE}/${id}`);
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal menghapus pengumuman'));
    }
  },

  // ── Public operations ───────────────────────────────────────────────────────

  async getPublic(): Promise<Pengumuman[]> {
    try {
      const response = await api.get(PUBLIC_BASE);
      return extractList(response.data).map(normalizePengumuman);
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal memuat pengumuman publik'));
    }
  },
};
