import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRideStore } from '../stores/rideStore'
import { useAuthStore } from '../stores/authStore'
import * as ridesApi from '../api/rides'
import type { Ride } from '../types'

export function useRides(params?: Record<string, unknown>) {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['rides', params],
    queryFn: () => ridesApi.getRides(params),
    enabled: !!token,
  })
}

export function useRide(id: string) {
  return useQuery({
    queryKey: ['rides', id],
    queryFn: () => ridesApi.getRide(id),
    enabled: !!id,
  })
}

export function useCreateRide() {
  const queryClient = useQueryClient()
  const setCurrentRide = useRideStore((s) => s.setCurrentRide)
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => ridesApi.createRide(data),
    onSuccess: (res) => {
      setCurrentRide(res.data as Ride)
      queryClient.invalidateQueries({ queryKey: ['rides'] })
    },
  })
}

export function useCancelRide() {
  const queryClient = useQueryClient()
  const clearCurrentRide = useRideStore((s) => s.clearCurrentRide)
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      ridesApi.cancelRide(id, reason),
    onSuccess: (_res, vars) => {
      clearCurrentRide()
      queryClient.invalidateQueries({ queryKey: ['rides', vars.id] })
      queryClient.invalidateQueries({ queryKey: ['rides'] })
    },
  })
}

export function useEstimateFare() {
  return useMutation({
    mutationFn: (params: Record<string, unknown>) => ridesApi.estimateFare(params),
  })
}

export function useAcceptAnyDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rideId: string) => ridesApi.acceptAnyDriver(rideId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides', 'current'] })
    },
  })
}

export function useCurrentRide() {
  const token = useAuthStore((s) => s.token)
  const setCurrentRide = useRideStore((s) => s.setCurrentRide)
  const clearCurrentRide = useRideStore((s) => s.clearCurrentRide)
  return useQuery({
    queryKey: ['rides', 'current'],
    queryFn: async () => {
      const res = await ridesApi.getCurrentRide()
      if (res.data) {
        setCurrentRide(res.data as Ride)
        return res.data as Ride | null
      }
      return null
    },
    enabled: !!token,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
  })
}
