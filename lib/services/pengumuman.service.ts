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
  id_unit?: number | null;
  judul: string;
  konten: string;
  lampiran_path: string | null;
  lampiran_nama_asli: string | null;
  lampiran_mime: string | null;
  lampiran_size: number | null;
  lampiran_url: string | null;
  kategori: PengumumanKategori | string;
  is_aktif: boolean;
  is_pinned: boolean;
  urutan: number;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  created_at: string;
  updated_at: string;
  created_by?: number;
  unit?: {
    id_unit: number;
    kode_unit: string;
    nama_unit: string;
  };
}

export interface PengumumanListQuery {
  per_page?: number;
  id_unit?: number;
  kategori?: PengumumanKategori | string;
  is_aktif?: boolean;
  q?: string;
}

export interface CreatePengumumanRequest {
  id_unit?: number | null;
  judul: string;
  konten: string;
  kategori: PengumumanKategori | string;
  is_aktif: boolean;
  is_pinned: boolean;
  urutan: number;
  tanggal_mulai?: string | null;
  tanggal_selesai: string | null;
  lampiran?: File | null;
  hapus_lampiran?: boolean;
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

const toBool = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const raw = value.trim().toLowerCase();
    return ['1', 'true', 'yes', 'y', 'on', 'aktif'].includes(raw);
  }
  return false;
};

const normalizePengumuman = (item: ApiRecord): Pengumuman => ({
  id: Number(item.id ?? item.id_pengumuman ?? 0),
  judul: String(item.judul ?? ''),
  konten: String(item.konten ?? ''),
  lampiran_path: item.lampiran_path ? String(item.lampiran_path) : null,
  lampiran_nama_asli: item.lampiran_nama_asli ? String(item.lampiran_nama_asli) : null,
  lampiran_mime: item.lampiran_mime ? String(item.lampiran_mime) : null,
  lampiran_size: item.lampiran_size !== undefined && item.lampiran_size !== null
    ? Number(item.lampiran_size)
    : null,
  lampiran_url: item.lampiran_url ? String(item.lampiran_url) : null,
  kategori: String(item.kategori ?? 'umum') as PengumumanKategori,
  is_aktif: toBool(item.is_aktif ?? item.aktif ?? false),
  is_pinned: toBool(item.is_pinned ?? item.pinned ?? false),
  urutan: Number(item.urutan ?? 0),
  tanggal_mulai: item.tanggal_mulai ? String(item.tanggal_mulai) : null,
  tanggal_selesai: item.tanggal_selesai ? String(item.tanggal_selesai) : null,
  created_at: String(item.created_at ?? ''),
  updated_at: String(item.updated_at ?? ''),
  created_by: item.created_by !== undefined ? Number(item.created_by) : undefined,
  unit: item.unit ? (item.unit as any) : undefined,
  id_unit: item.id_unit !== undefined && item.id_unit !== null ? Number(item.id_unit) : null,
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
    buildFormData(data: CreatePengumumanRequest | UpdatePengumumanRequest): FormData {
      const fd = new FormData();
      const rec = data as Record<string, unknown>;

      Object.entries(rec).forEach(([key, value]) => {
        if (value === undefined) return;

        if (key === 'lampiran' && value instanceof File) {
          fd.append('lampiran', value);
          return;
        }

        if (value === null) {
          fd.append(key, '');
          return;
        }

        if (typeof value === 'boolean') {
          fd.append(key, value ? '1' : '0');
          return;
        }

        fd.append(key, String(value));
      });

      return fd;
    },

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
      const response = await api.post(ADMIN_BASE, this.buildFormData(data), {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const raw = response.data as ApiRecord;
      const item = (raw.data && typeof raw.data === 'object' ? raw.data : raw) as ApiRecord;
      return normalizePengumuman(item);
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal membuat pengumuman'));
    }
  },

  async update(id: number, data: UpdatePengumumanRequest): Promise<Pengumuman> {
    try {
      const response = await api.post(`${ADMIN_BASE}/${id}?_method=PUT`, this.buildFormData(data), {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
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

  async getPublicDetail(id: number): Promise<Pengumuman> {
    try {
      // Try public endpoint first, fall back to admin endpoint if needed
      try {
        const response = await api.get(`${PUBLIC_BASE}/${id}`);
        const raw = response.data as ApiRecord;
        const item = (raw.data && typeof raw.data === 'object' ? raw.data : raw) as ApiRecord;
        return normalizePengumuman(item);
      } catch {
        // Fallback to admin endpoint for detail retrieval
        const response = await api.get(`${ADMIN_BASE}/${id}`);
        const raw = response.data as ApiRecord;
        const item = (raw.data && typeof raw.data === 'object' ? raw.data : raw) as ApiRecord;
        return normalizePengumuman(item);
      }
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal memuat detail pengumuman'));
    }
  },
};
