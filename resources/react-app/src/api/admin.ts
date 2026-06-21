import apiClient from './client'
import type {
  ApiResponse,
  PaginatedResponse,
  User,
  Ride,
  Driver,
  Payment,
  DashboardStats,
} from '../types'

interface Setting {
  id: string
  key: string
  value: string
}

export const getDashboard = (): Promise<ApiResponse<DashboardStats>> =>
  apiClient.get('/admin/dashboard').then((r) => r.data)

export const getStats = (): Promise<ApiResponse<unknown>> =>
  apiClient.get('/admin/stats').then((r) => r.data)

export const getCharts = (period?: string, from?: string, to?: string): Promise<ApiResponse<unknown>> =>
  apiClient.get('/admin/charts', { params: { period, from, to } }).then((r) => r.data)

export const getActivities = (): Promise<ApiResponse<unknown[]>> =>
  apiClient.get('/admin/activities').then((r) => r.data)

export const getSettings = (): Promise<ApiResponse<Setting[]>> =>
  apiClient.get('/admin/settings').then((r) => r.data)

export const updateSetting = (key: string, value: string): Promise<ApiResponse<Setting>> =>
  apiClient.post('/admin/settings', { key, value }).then((r) => r.data)

export const getAuditLogs = (params?: Record<string, unknown>): Promise<ApiResponse<PaginatedResponse<unknown>>> =>
  apiClient.get('/admin/audit-logs', { params }).then((r) => r.data)

export const getUsers = (params?: Record<string, unknown>): Promise<ApiResponse<PaginatedResponse<User>>> =>
  apiClient.get('/admin/users', { params }).then((r) => r.data)

export const getAllRides = (params?: Record<string, unknown>): Promise<ApiResponse<PaginatedResponse<Ride>>> =>
  apiClient.get('/admin/rides', { params }).then((r) => r.data)

export const getAdminRideDetail = (id: string): Promise<ApiResponse<unknown>> =>
  apiClient.get(`/admin/rides/${id}`).then((r) => r.data)

export const getPayments = (params?: Record<string, unknown>): Promise<ApiResponse<PaginatedResponse<Payment>>> =>
  apiClient.get('/admin/payments', { params }).then((r) => r.data)

export const getPaymentDetail = (id: string): Promise<ApiResponse<unknown>> =>
  apiClient.get(`/admin/payments/${id}`).then((r) => r.data)

export const getDrivers = (params?: Record<string, unknown>): Promise<ApiResponse<PaginatedResponse<Driver>>> =>
  apiClient.get('/admin/drivers', { params }).then((r) => r.data)

export const getDriverDetail = (id: string): Promise<ApiResponse<unknown>> =>
  apiClient.get(`/admin/drivers/${id}`).then((r) => r.data)

export const createDriver = (formData: FormData): Promise<ApiResponse<Driver>> =>
  apiClient.post('/admin/drivers', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)

export const updateDriver = (id: string, data: Record<string, unknown>): Promise<ApiResponse<Driver>> =>
  apiClient.put(`/admin/drivers/${id}`, data).then((r) => r.data)

export const approveDriver = (id: string): Promise<ApiResponse<Driver>> =>
  apiClient.post(`/admin/drivers/${id}/approve`).then((r) => r.data)

export const rejectDriver = (id: string, reason: string): Promise<ApiResponse<Driver>> =>
  apiClient.post(`/admin/drivers/${id}/reject`, { reason }).then((r) => r.data)

export const suspendDriver = (id: string): Promise<ApiResponse<Driver>> =>
  apiClient.post(`/admin/drivers/${id}/suspend`).then((r) => r.data)

export const reactivateDriver = (id: string): Promise<ApiResponse<Driver>> =>
  apiClient.post(`/admin/drivers/${id}/reactivate`).then((r) => r.data)

export const getDriverWarnings = (id: string): Promise<ApiResponse<unknown>> =>
  apiClient.get(`/admin/drivers/${id}/warnings`).then((r) => r.data)

export const addDriverWarning = (id: string, data: Record<string, unknown>): Promise<ApiResponse<unknown>> =>
  apiClient.post(`/admin/drivers/${id}/warnings`, data).then((r) => r.data)

export const getDriverPenalties = (id: string): Promise<ApiResponse<unknown>> =>
  apiClient.get(`/admin/drivers/${id}/penalties`).then((r) => r.data)

export const addDriverPenalty = (id: string, data: Record<string, unknown>): Promise<ApiResponse<unknown>> =>
  apiClient.post(`/admin/drivers/${id}/penalties`, data).then((r) => r.data)

export const getDriverRides = (id: string, params?: Record<string, unknown>): Promise<ApiResponse<PaginatedResponse<Ride>>> =>
  apiClient.get(`/admin/drivers/${id}/rides`, { params }).then((r) => r.data)

export const getDriverPayments = (id: string, params?: Record<string, unknown>): Promise<ApiResponse<PaginatedResponse<Payment>>> =>
  apiClient.get(`/admin/drivers/${id}/payments`, { params }).then((r) => r.data)

export const getDriverSettlements = (id: string): Promise<ApiResponse<unknown>> =>
  apiClient.get(`/admin/drivers/${id}/settlements`).then((r) => r.data)

export const getSettlements = (params?: Record<string, unknown>): Promise<ApiResponse<unknown>> =>
  apiClient.get('/admin/settlements', { params }).then((r) => r.data)

export const approveSettlement = (id: string): Promise<ApiResponse<unknown>> =>
  apiClient.post(`/admin/settlements/${id}/approve`).then((r) => r.data)

export const rejectSettlement = (id: string, reason: string): Promise<ApiResponse<unknown>> =>
  apiClient.post(`/admin/settlements/${id}/reject`, { rejection_reason: reason }).then((r) => r.data)

export const getFeatures = (): Promise<ApiResponse<unknown>> =>
  apiClient.get('/admin/features').then((r) => r.data)

export const toggleFeature = (code: string, isEnabled: boolean): Promise<ApiResponse<unknown>> =>
  apiClient.post(`/admin/features/${code}`, { is_enabled: isEnabled }).then((r) => r.data)

export const getRiders = (params?: Record<string, unknown>): Promise<ApiResponse<PaginatedResponse<unknown>>> =>
  apiClient.get('/admin/riders', { params }).then((r) => r.data)

export const getRiderDetail = (id: string): Promise<ApiResponse<unknown>> =>
  apiClient.get(`/admin/riders/${id}`).then((r) => r.data)

export const suspendRider = (id: string): Promise<ApiResponse<unknown>> =>
  apiClient.post(`/admin/riders/${id}/suspend`).then((r) => r.data)

export const reactivateRider = (id: string): Promise<ApiResponse<unknown>> =>
  apiClient.post(`/admin/riders/${id}/reactivate`).then((r) => r.data)

export const getRiderRides = (id: string, params?: Record<string, unknown>): Promise<ApiResponse<PaginatedResponse<Ride>>> =>
  apiClient.get(`/admin/riders/${id}/rides`, { params }).then((r) => r.data)

export const getRiderPayments = (id: string, params?: Record<string, unknown>): Promise<ApiResponse<PaginatedResponse<Payment>>> =>
  apiClient.get(`/admin/riders/${id}/payments`, { params }).then((r) => r.data)

export const getAdminVehicles = (params?: Record<string, unknown>): Promise<ApiResponse<PaginatedResponse<unknown>>> =>
  apiClient.get('/admin/vehicles', { params }).then((r) => r.data)

export const getAdminVehicleDetail = (id: string): Promise<ApiResponse<unknown>> =>
  apiClient.get(`/admin/vehicles/${id}`).then((r) => r.data)

export const approveVehicle = (id: string): Promise<ApiResponse<unknown>> =>
  apiClient.post(`/admin/vehicles/${id}/approve`).then((r) => r.data)

export const rejectVehicle = (id: string): Promise<ApiResponse<unknown>> =>
  apiClient.post(`/admin/vehicles/${id}/reject`).then((r) => r.data)

export const suspendVehicle = (id: string): Promise<ApiResponse<unknown>> =>
  apiClient.post(`/admin/vehicles/${id}/suspend`).then((r) => r.data)

export const getAdminTickets = (params?: Record<string, unknown>): Promise<ApiResponse<unknown>> =>
  apiClient.get('/admin/support-tickets', { params }).then((r) => r.data)

export const blockDriver = (id: string, reason: string): Promise<ApiResponse<unknown>> =>
  apiClient.post(`/admin/drivers/${id}/block`, { reason }).then((r) => r.data)

export const unblockDriver = (id: string, reason?: string): Promise<ApiResponse<unknown>> =>
  apiClient.post(`/admin/drivers/${id}/unblock`, { reason }).then((r) => r.data)

export const blockRider = (id: string, reason: string): Promise<ApiResponse<unknown>> =>
  apiClient.post(`/admin/riders/${id}/block`, { reason }).then((r) => r.data)

export const unblockRider = (id: string, reason?: string): Promise<ApiResponse<unknown>> =>
  apiClient.post(`/admin/riders/${id}/unblock`, { reason }).then((r) => r.data)

export const getBanHistory = (userId: string): Promise<ApiResponse<unknown>> =>
  apiClient.get(`/admin/users/${userId}/ban-history`).then((r) => r.data)

export interface LiveDriver {
  driver_id: number
  user_id: number
  driver_name: string
  vehicle_type: string | null
  vehicle_class: string | null
  vehicle_plate: string | null
  latitude: number
  longitude: number
  bearing: number
  is_online: boolean
  status: string | null
  location_updated_at: string | null
}

export const getLiveDrivers = (): Promise<ApiResponse<LiveDriver[]>> =>
  apiClient.get('/admin/live-drivers').then((r) => r.data)

export const getSurgeData = (lat?: number, lng?: number): Promise<ApiResponse<any>> =>
  apiClient.get('/admin/surge-data', { params: { lat, lng } }).then((r) => r.data)
