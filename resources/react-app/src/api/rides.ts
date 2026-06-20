import apiClient from './client'
import type {
  ApiResponse,
  PaginatedResponse,
  RideBrief,
  Ride,
  FareBreakdown,
} from '../types'

export const getRides = (
  params?: Record<string, unknown>
): Promise<ApiResponse<PaginatedResponse<RideBrief>>> =>
  apiClient.get('/rides', { params }).then((r) => r.data)

export const getRide = (id: string): Promise<ApiResponse<Ride>> =>
  apiClient.get(`/rides/${id}`).then((r) => r.data)

const normalizeCreateRidePayload = (data: Record<string, unknown>) => {
  const pickup = data.pickup as Record<string, unknown> | undefined
  const destination = data.destination as Record<string, unknown> | undefined
  const payload: Record<string, unknown> = {
    pickup_latitude: (pickup?.lat as number) ?? data.pickupLat,
    pickup_longitude: (pickup?.lng as number) ?? data.pickupLng,
    pickup_address: (pickup?.address as string) ?? '',
    destination_latitude: (destination?.lat as number) ?? data.destinationLat,
    destination_longitude: (destination?.lng as number) ?? data.destinationLng,
    destination_address: (destination?.address as string) ?? '',
    vehicle_type_id: (data.vehicleTypeId as number | string) ?? data.vehicle_type_id,
    promo_code: data.promo_code as string | undefined,
  }
  if (data.female_driver_preferred !== undefined) {
    payload.female_driver_preferred = data.female_driver_preferred
  }
  if (data.payment_method !== undefined) {
    payload.payment_method = data.payment_method
  }
  return payload
}

export const createRide = (
  data: Record<string, unknown>
): Promise<ApiResponse<Ride>> =>
  apiClient.post('/rides', normalizeCreateRidePayload(data)).then((r) => r.data)

export const cancelRide = (
  id: string,
  cancellationReason?: string
): Promise<ApiResponse<Ride>> =>
  apiClient
    .post(`/rides/${id}/cancel`, { cancellation_reason: cancellationReason })
    .then((r) => r.data)

const normalizeEstimateFareParams = (params: Record<string, unknown>) => {
  return {
    pickup_latitude: (params.pickupLat ?? params.pickup_latitude) as number,
    pickup_longitude: (params.pickupLng ?? params.pickup_longitude) as number,
    destination_latitude: (params.destinationLat ?? params.destLat ?? params.destination_latitude) as number,
    destination_longitude: (params.destinationLng ?? params.destLng ?? params.destination_longitude) as number,
    vehicle_type_id: (params.vehicleTypeId ?? params.vehicle_type_id) as number | string,
    distance: params.distance as number | undefined,
    duration: params.duration as number | undefined,
  }
}

export const estimateFare = (
  params: Record<string, unknown>
): Promise<ApiResponse<{ fare: number; breakdown: FareBreakdown }>> =>
  apiClient.post('/rides/estimate-fare', normalizeEstimateFareParams(params)).then((r) => r.data)

export const getCurrentRide = (): Promise<ApiResponse<Ride | null>> =>
  apiClient.get('/rides/current').then((r) => r.data)

export const trackDriver = (
  driverId: string
): Promise<ApiResponse<{ latitude: number; longitude: number; bearing: number }>> =>
  apiClient.get(`/rides/track-driver/${driverId}`).then((r) => r.data)

export const acceptAnyDriver = (
  rideId: string
): Promise<ApiResponse<Ride>> =>
  apiClient.post(`/rides/${rideId}/accept-any-driver`).then((r) => r.data)
