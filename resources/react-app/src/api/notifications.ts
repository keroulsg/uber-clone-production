import apiClient from './client'
import type {
  ApiResponse,
  PaginatedResponse,
  Notification,
} from '../types'

export const getNotifications = (
  params?: Record<string, unknown>
): Promise<ApiResponse<PaginatedResponse<Notification>>> =>
  apiClient.get('/notifications', { params }).then((r) => r.data)

export const markAsRead = (id: string): Promise<ApiResponse<null>> =>
  apiClient.post(`/notifications/${id}/read`).then((r) => r.data)

export const markAllAsRead = (): Promise<ApiResponse<null>> =>
  apiClient.post('/notifications/read-all').then((r) => r.data)

export const getUnreadCount = (): Promise<ApiResponse<{ count: number }>> =>
  apiClient.get('/notifications/unread-count').then((r) => r.data)
