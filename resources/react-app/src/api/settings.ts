import apiClient from './client'
import type { ApiResponse, UserSettings } from '../types'

export const getSettings = (): Promise<ApiResponse<UserSettings>> =>
  apiClient.get('/auth/settings').then((r) => r.data)

export const updateSettings = (
  data: Partial<UserSettings>
): Promise<ApiResponse<UserSettings>> =>
  apiClient.post('/auth/settings', data).then((r) => r.data)
