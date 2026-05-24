import api from "@/lib/axios"

export interface NotificationItem {
  id: string
  type?: string
  notifiable_type?: string
  notifiable_id?: number
  data?: Record<string, any>
  read_at?: string | null
  created_at?: string
}

export interface NotificationListResponse {
  data: NotificationItem[]
  current_page?: number
  per_page?: number
  total?: number
  [key: string]: unknown
}

export const notificationsService = {
  async list(params?: { per_page?: number; page?: number; only_unread?: boolean }) {
    const response = await api.get<NotificationListResponse>("notifications", { params })
    return response.data
  },

  async markRead(id: string) {
    const response = await api.patch(`notifications/${id}/mark-read`)
    return response.data
  },

  async markAllRead() {
    const response = await api.post(`notifications/read-all`)
    return response.data
  },
}

export default notificationsService
