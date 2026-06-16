import apiClient from './client'
import type {
  ApiResponse,
  Driver,
  DriverBrief,
  PaginatedResponse,
  RideBrief,
} from '../types'

export const getDriverProfile = (): Promise<ApiResponse<Driver>> =>
  apiClient.get('/driver/profile').then((r) => r.data)

export const updateDriverProfile = (
  data: Record<string, unknown>
): Promise<ApiResponse<Driver>> =>
  apiClient.post('/driver/profile', data).then((r) => r.data)

export const toggleOnlineStatus = (): Promise<
  ApiResponse<{ is_online: boolean }>
> => apiClient.post('/driver/toggle-online').then((r) => r.data)

export const updateLocation = (
  lat: number,
  lng: number,
  bearing?: number
): Promise<ApiResponse<null>> =>
  apiClient.post('/driver/location', { latitude: lat, longitude: lng, bearing }).then((r) => r.data)

export const getEarnings = (
  from?: string,
  to?: string
): Promise<ApiResponse<unknown>> =>
  apiClient.get('/driver/earnings', { params: { from, to } }).then((r) => r.data)

export const getPerformance = (): Promise<ApiResponse<unknown>> =>
  apiClient.get('/driver/performance').then((r) => r.data)

export const getRideHistory = (
  params?: Record<string, unknown>
): Promise<ApiResponse<PaginatedResponse<RideBrief>>> =>
  apiClient.get('/driver/rides/history', { params }).then((r) => r.data)

export const uploadDriverDocument = (
  type: string,
  file: File
): Promise<ApiResponse<Driver>> => {
  const formData = new FormData()
  formData.append('type', type)
  formData.append('file', file)
  return apiClient.post('/driver/documents', formData).then((r) => r.data)
}

export const submitDriverVerification = (): Promise<ApiResponse<Driver>> =>
  apiClient.post('/driver/submit-verification').then((r) => r.data)

export const getNearbyDrivers = (
  params: Record<string, unknown>
): Promise<ApiResponse<DriverBrief[]>> =>
  apiClient.get('/driver/nearby', { params }).then((r) => r.data)

export interface PayoutInfo {
  payout_method: string | null
  payout_phone: string | null
  payout_account_name: string | null
  payout_notes: string | null
}

export const getDriverPayout = (): Promise<ApiResponse<PayoutInfo>> =>
  apiClient.get('/driver/payout').then((r) => r.data)

export const updateDriverPayout = (
  data: Partial<PayoutInfo>
): Promise<ApiResponse<PayoutInfo>> =>
  apiClient.post('/driver/payout', data).then((r) => r.data)
