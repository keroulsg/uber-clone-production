import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRideStore } from '../stores/rideStore'
import { useAuthStore } from '../stores/authStore'
import * as driverRidesApi from '../api/driver-rides'
import type { RideSummary } from '../api/driver-rides'
import type { Ride } from '../types'

export function usePendingRides() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['driver-rides', 'pending'],
    queryFn: () => driverRidesApi.getPendingRides(),
    enabled: !!token,
    refetchInterval: 15000,
  })
}

export function useAcceptRide() {
  const queryClient = useQueryClient()
  const setCurrentRide = useRideStore((s) => s.setCurrentRide)
  return useMutation({
    mutationFn: (rideId: string) => driverRidesApi.acceptRide(rideId),
    onSuccess: (res) => {
      setCurrentRide(res.data as Ride)
      queryClient.invalidateQueries({ queryKey: ['driver-rides'] })
    },
  })
}

export function useRejectRide() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rideId: string) => driverRidesApi.rejectRide(rideId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-rides', 'pending'] })
    },
  })
}

export function useArrivedRide() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rideId: string) => driverRidesApi.arrivedRide(rideId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-rides'] })
    },
  })
}

export function useStartRide() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rideId: string) => driverRidesApi.startRide(rideId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['driver-rides'] })
      queryClient.invalidateQueries({ queryKey: ['rides', res.data.id] })
    },
  })
}

export function useCompleteRide() {
  const queryClient = useQueryClient()
  const clearCurrentRide = useRideStore((s) => s.clearCurrentRide)
  return useMutation({
    mutationFn: ({
      rideId,
      data,
    }: {
      rideId: string
      data: Record<string, unknown>
    }) => driverRidesApi.completeRide(rideId, data),
    onSuccess: () => {
      clearCurrentRide()
      queryClient.invalidateQueries({ queryKey: ['driver-rides'] })
    },
  })
}

export function useRideSummary() {
  return useMutation({
    mutationFn: ({
      rideId,
      actualDistance,
      actualDuration,
    }: {
      rideId: string
      actualDistance: number
      actualDuration: number
    }): Promise<import('../api/driver-rides').RideSummary> =>
      driverRidesApi.getRideSummary(rideId, {
        actual_distance: actualDistance,
        actual_duration: actualDuration,
      }).then((r) => r.data),
  })
}

export function useDriverCurrentRide() {
  const token = useAuthStore((s) => s.token)
  const setCurrentRide = useRideStore((s) => s.setCurrentRide)
  const clearCurrentRide = useRideStore((s) => s.clearCurrentRide)
  return useQuery({
    queryKey: ['driver-rides', 'current'],
    queryFn: async () => {
      const res = await driverRidesApi.getCurrentRide()
      if (res.data) setCurrentRide(res.data as Ride)
      else clearCurrentRide()
      return res.data as Ride | null
    },
    enabled: !!token,
    refetchInterval: 10000,
  })
}
