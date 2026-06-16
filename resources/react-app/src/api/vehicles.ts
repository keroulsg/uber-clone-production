import apiClient from './client'
import type { ApiResponse, Vehicle, VehicleType } from '../types'

export const getVehicleTypes = (): Promise<ApiResponse<VehicleType[]>> =>
  apiClient.get('/vehicle-types').then((r) => r.data)

export const getVehicles = (): Promise<ApiResponse<Vehicle[]>> =>
  apiClient.get('/driver/vehicles').then((r) => r.data)

export const getVehicle = (id: string): Promise<ApiResponse<Vehicle>> =>
  apiClient.get(`/driver/vehicles/${id}`).then((r) => r.data)

export const registerVehicle = (
  data: Record<string, unknown>
): Promise<ApiResponse<Vehicle>> =>
  apiClient.post('/driver/vehicles', data).then((r) => r.data)

export const updateVehicle = (
  id: string,
  data: Record<string, unknown>
): Promise<ApiResponse<Vehicle>> =>
  apiClient.put(`/driver/vehicles/${id}`, data).then((r) => r.data)

export const uploadDocument = (
  id: string,
  formData: FormData
): Promise<ApiResponse<Vehicle>> =>
  apiClient.post(`/driver/vehicles/${id}/documents`, formData).then((r) => r.data)
