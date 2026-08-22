import api from "@/lib/axios"

export interface BackupFile {
  filename: string
  size: number
  size_label: string
  created_at: string
  compressed: boolean
}

export interface BackupListResponse {
  success: boolean
  data: BackupFile[]
  total: number
}

export interface BackupCreateResponse {
  success: boolean
  message: string
  data: BackupFile
  log: string
}

export const backupService = {
  /**
   * Ambil daftar semua file backup yang tersimpan
   */
  async list(): Promise<BackupListResponse> {
    const res = await api.get("/admin/backup")
    return res.data
  },

  /**
   * Buat backup baru (manual)
   */
  async create(compress = true): Promise<BackupCreateResponse> {
    const res = await api.post("/admin/backup/create", { compress })
    return res.data
  },

  /**
   * Download file backup — return URL download
   */
  getDownloadUrl(filename: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""
    return `${baseUrl}/admin/backup/${encodeURIComponent(filename)}/download`
  },

  /**
   * Download file backup dengan authentication (menggunakan fetch + blob)
   */
  async download(filename: string): Promise<void> {
    const res = await api.get(`/admin/backup/${encodeURIComponent(filename)}/download`, {
      responseType: "blob",
    })

    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  /**
   * Hapus file backup
   */
  async delete(filename: string): Promise<{ success: boolean; message: string }> {
    const res = await api.delete(`/admin/backup/${encodeURIComponent(filename)}`)
    return res.data
  },
}
