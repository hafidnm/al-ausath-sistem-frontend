"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { NotificationItem } from "@/lib/services/notifications.service"

interface NotificationsListProps {
  items: NotificationItem[]
  onMarkRead: (id: string) => void
  onMarkAll: () => void
  loading?: boolean
}

export function NotificationsList({ items, onMarkRead, onMarkAll, loading }: NotificationsListProps) {
  const unreadCount = useMemo(() => items.filter((i) => !i.read_at).length, [items])

  return (
    <div className="w-80 max-w-full p-2">
      <div className="flex items-center justify-between px-2">
        <h4 className="text-sm font-medium">Notifikasi</h4>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{unreadCount} baru</Badge>
          <Button size="sm" variant="ghost" onClick={onMarkAll} disabled={loading || items.length === 0}>
            Tandai semua
          </Button>
        </div>
      </div>

      <Separator className="my-2" />

      <div className="max-h-64 overflow-auto">
        {items.length === 0 && <div className="p-4 text-sm text-muted-foreground">Tidak ada notifikasi</div>}
        {items.map((n) => (
          <div key={n.id} className={`p-2 hover:bg-muted/30 rounded-md ${n.read_at ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-medium">{n.data?.pesan ?? n.type}</div>
                <div className="text-xs text-muted-foreground">{n.data?.nama_mapel ?? ''} • {n.created_at}</div>
              </div>
              {!n.read_at && (
                <Button size="sm" variant="outline" onClick={() => onMarkRead(n.id)}>
                  Baca
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default NotificationsList
