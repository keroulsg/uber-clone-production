import apiClient from './client'
import type { ApiResponse, SavedPlace } from '../types'

export const getSavedPlaces = (): Promise<ApiResponse<SavedPlace[]>> =>
  apiClient.get('/saved-places').then((r) => r.data)

export const createSavedPlace = (
  data: Record<string, unknown>
): Promise<ApiResponse<SavedPlace>> =>
  apiClient.post('/saved-places', data).then((r) => r.data)

export const getSavedPlace = (id: string): Promise<ApiResponse<SavedPlace>> =>
  apiClient.get(`/saved-places/${id}`).then((r) => r.data)

export const updateSavedPlace = (
  id: string,
  data: Record<string, unknown>
): Promise<ApiResponse<SavedPlace>> =>
  apiClient.put(`/saved-places/${id}`, data).then((r) => r.data)

export const deleteSavedPlace = (id: string): Promise<ApiResponse<null>> =>
  apiClient.delete(`/saved-places/${id}`).then((r) => r.data)
