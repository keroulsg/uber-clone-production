import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNotificationStore } from '../stores/notificationStore'
import * as notificationsApi from '../api/notifications'

interface UseNotificationsOptions {
  enabled?: boolean
  refetchInterval?: number | false
}

export function useNotifications(params?: Record<string, unknown>, options?: UseNotificationsOptions) {
  const setNotifications = useNotificationStore((s) => s.setNotifications)
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const res = await notificationsApi.getNotifications(params)
      setNotifications(res.data?.data ?? [])
      return res
    },
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval ?? false,
    refetchIntervalInBackground: true,
  })
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()
  const markAsRead = useNotificationStore((s) => s.markAsRead)
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: (_res, id) => {
      markAsRead(id)
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount)
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      setUnreadCount(0)
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useUnreadCount(options?: UseNotificationsOptions) {
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount)
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await notificationsApi.getUnreadCount()
      setUnreadCount(res.data.count)
      return res.data.count
    },
    enabled: options?.enabled,
    refetchInterval: 10000,
  })
}
