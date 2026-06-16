import apiClient from './client'
import type { ApiResponse, Ride } from '../types'

export interface FareBreakdownDetail {
  base_fare: number
  distance_fare: number
  time_fare: number
  fuel_cost?: number
  class_multiplier: number
  vehicle_multiplier?: number
  surge_multiplier?: number
  surge_amount: number
  peak_surcharge: number
  night_surcharge: number
  waiting_fee: number
  total_fare: number
  commission_rate: number
  company_commission: number
  driver_amount: number
}

export interface RideSummary {
  ride_id: number
  booking_id: string
  actual_distance: number
  actual_duration: number
  fare_breakdown: FareBreakdownDetail
  driver_outstanding_debt: number
  payment_method: string
}

export const getPendingRides = (): Promise<ApiResponse<Ride[]>> =>
  apiClient.get('/driver/rides/pending').then((r) => r.data)

export const acceptRide = (rideId: string): Promise<ApiResponse<Ride>> =>
  apiClient.post(`/driver/rides/${rideId}/accept`).then((r) => r.data)

export const rejectRide = (rideId: string): Promise<ApiResponse<Ride>> =>
  apiClient.post(`/driver/rides/${rideId}/reject`).then((r) => r.data)

export const startRide = (rideId: string): Promise<ApiResponse<Ride>> =>
  apiClient.post(`/driver/rides/${rideId}/start`).then((r) => r.data)

export const completeRide = (
  rideId: string,
  data: Record<string, unknown>
): Promise<ApiResponse<Ride>> =>
  apiClient.post(`/driver/rides/${rideId}/complete`, data).then((r) => r.data)

export const arrivedRide = (rideId: string): Promise<ApiResponse<Ride>> =>
  apiClient.post(`/driver/rides/${rideId}/arrived`).then((r) => r.data)

export const getCurrentRide = (): Promise<ApiResponse<Ride | null>> =>
  apiClient.get('/driver/rides/current').then((r) => r.data)

export const getRideSummary = (
  rideId: string,
  params?: Record<string, unknown>
): Promise<ApiResponse<RideSummary>> =>
  apiClient.get(`/driver/rides/${rideId}/summary`, { params }).then((r) => r.data)
