import apiClient from './client'
import type {
  ApiResponse,
  PaginatedResponse,
  Rating,
} from '../types'

export const rateDriver = (
  data: Record<string, unknown>
): Promise<ApiResponse<Rating>> =>
  apiClient.post('/ratings/driver', data).then((r) => r.data)

export const rateRider = (
  data: Record<string, unknown>
): Promise<ApiResponse<Rating>> =>
  apiClient.post('/ratings/rider', data).then((r) => r.data)

export const getMyDriverRatings = (): Promise<ApiResponse<PaginatedResponse<Rating>>> =>
  apiClient.get('/ratings/driver/me').then((r) => r.data)

export const getMyRiderRatings = (): Promise<ApiResponse<PaginatedResponse<Rating>>> =>
  apiClient.get('/ratings/rider/me').then((r) => r.data)
