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

export const getDriverRatings = (
  driverId: string,
  params?: Record<string, unknown>
): Promise<ApiResponse<PaginatedResponse<Rating>>> =>
  apiClient.get(`/ratings/driver/${driverId}`, { params }).then((r) => r.data)

export const getRiderRatings = (
  riderId: string,
  params?: Record<string, unknown>
): Promise<ApiResponse<PaginatedResponse<Rating>>> =>
  apiClient.get(`/ratings/rider/${riderId}`, { params }).then((r) => r.data)
