import api from "@/lib/axios"

export interface EkskulApiItem {
  id_ekskul: number
  kode_unit: string | null
  nama_ekskul: string
  deskripsi: string | null
  kuota: number | null
  status: string
  status_pendaftaran: string
  jumlah_pendaftar?: number
  unit?: { kode_unit: string; nama_unit: string } | null
}

export interface PendaftaranApiItem {
  id_pendaftaran: number
  id_santri: number
  id_ekskul: number
  created_at: string
  santri?: {
    nomor_induk: string
    nama_lengkap_santri: string
    kode_kelas: string
  }
  ekskul?: EkskulApiItem
}

export const ekskulService = {
  /** List semua ekskul (admin & santri) */
  getAll(params?: Record<string, unknown>) {
    return api.get("/akademik/ekskul", { params }).then((r) => r.data)
  },

  /** Buat ekskul baru */
  create(payload: Partial<EkskulApiItem>) {
    return api.post("/akademik/ekskul", payload).then((r) => r.data)
  },

  /** Update ekskul */
  update(id: number, payload: Partial<EkskulApiItem>) {
    return api.put(`/akademik/ekskul/${id}`, payload).then((r) => r.data)
  },

  /** Hapus ekskul */
  remove(id: number) {
    return api.delete(`/akademik/ekskul/${id}`).then((r) => r.data)
  },

  /** Rekap pendaftar (admin) */
  getRekap(params?: Record<string, unknown>) {
    return api.get("/akademik/ekskul/rekap", { params }).then((r) => r.data)
  },

  /** Export rekap (admin) — return blob URL */
  exportRekap(params?: Record<string, unknown>) {
    return api
      .get("/akademik/ekskul/rekap", {
        params: { ...params, export: true },
        responseType: "blob",
      })
      .then((r) => r.data as Blob)
  },

  /** Admin daftar santri ke ekskul */
  createPendaftaran(payload: { id_santri: number; id_ekskul: number }) {
    return api.post("/akademik/ekskul/pendaftaran", payload).then((r) => r.data)
  },

  /** Admin ubah ekskul santri */
  updatePendaftaran(id: number, payload: { id_ekskul: number }) {
    return api.put(`/akademik/ekskul/pendaftaran/${id}`, payload).then((r) => r.data)
  },

  /** Admin hapus pendaftaran santri */
  deletePendaftaran(id: number) {
    return api.delete(`/akademik/ekskul/pendaftaran/${id}`).then((r) => r.data)
  },

  /** Pilihan ekskul santri saat ini */
  getPilihanSaya() {
    return api.get("/akademik/ekskul/pilihan-saya").then((r) => r.data)
  },

  /** Santri daftar ekskul */
  daftar(idEkskul: number) {
    return api.post("/akademik/ekskul/daftar", { id_ekskul: idEkskul }).then((r) => r.data)
  },

  /** Santri batalkan pilihan */
  batal() {
    return api.post("/akademik/ekskul/batal").then((r) => r.data)
  },
}
