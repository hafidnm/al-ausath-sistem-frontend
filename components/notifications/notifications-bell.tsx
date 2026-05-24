"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu"
import { Bell } from "lucide-react"
import useNotifications from "@/hooks/use-notifications"
import NotificationsList from "./notifications-list"

export function NotificationsBell() {
  const { data, loading, error, refetch, markRead, markAll } = useNotifications({ perPage: 20, onlyUnread: false })

  const items = data?.data ?? []
  const unreadCount = useMemo(() => items.filter((i: any) => !i.read_at).length, [items])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white bg-destructive rounded-full">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 p-0">
        <NotificationsList items={items} onMarkRead={(id) => markRead(id)} onMarkAll={() => markAll()} loading={loading} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default NotificationsBell
