"use client"

import { useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { notificationsService, type NotificationItem } from "@/lib/services/notifications.service"

export function useNotifications(options?: { perPage?: number; onlyUnread?: boolean }) {
  const perPage = options?.perPage ?? 10
  const onlyUnread = options?.onlyUnread ?? false
  const queryClient = useQueryClient()

  const queryKey = ["notifications", { perPage, onlyUnread }]

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => notificationsService.list({ per_page: perPage, only_unread: onlyUnread }),
    refetchInterval: 30_000,
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: (_data, id) => {
      // update cached notifications optimistically
      queryClient.setQueryData<any>(queryKey, (old) => {
        if (!old?.data) return old
        return {
          ...old,
          data: old.data.map((n: NotificationItem) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
        }
      })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      queryClient.setQueryData<any>(["notifications"], (old) => {
        if (!old?.data) return old
        return { ...old, data: old.data.map((n: NotificationItem) => ({ ...n, read_at: new Date().toISOString() })) }
      })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  const markRead = useCallback(async (id: string) => {
    return markReadMutation.mutateAsync(id)
  }, [markReadMutation])

  const markAll = useCallback(async () => {
    return markAllMutation.mutateAsync()
  }, [markAllMutation])

  return {
    data: data ?? { data: [], total: 0 },
    loading: isLoading,
    error: isError ? "Failed to load notifications" : null,
    refetch,
    markRead,
    markAll,
  }
}

export default useNotifications
