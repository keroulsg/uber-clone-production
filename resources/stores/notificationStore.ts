import { create } from 'zustand'
import type { Notification } from '../types'

interface NotificationState {
  unreadCount: number
  notifications: Notification[]
  setUnreadCount: (count: number) => void
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  unreadCount: 0,
  notifications: [],
  setUnreadCount: (count) => set({ unreadCount: count }),
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notification) =>
    set((s) => ({
      notifications: [notification, ...s.notifications],
      unreadCount: s.unreadCount + 1,
    })),
  markAsRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n
      ),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),
}))
