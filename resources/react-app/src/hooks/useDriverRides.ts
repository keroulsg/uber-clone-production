import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRideStore } from '../stores/rideStore'
import { useAuthStore } from '../stores/authStore'
import * as driverRidesApi from '../api/driver-rides'
import type { RideSummary } from '../api/driver-rides'
import type { Ride } from '../types'
import { stopAllSoundLoops } from '../lib/notificationSound'

export function usePendingRides() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['driver-rides', 'pending'],
    queryFn: () => driverRidesApi.getPendingRides(),
    enabled: !!token,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  })
}

export function useAcceptRide() {
  const queryClient = useQueryClient()
  const setCurrentRide = useRideStore((s) => s.setCurrentRide)
  return useMutation({
    mutationFn: (rideId: string) => driverRidesApi.acceptRide(rideId),
    onSuccess: (res) => {
      stopAllSoundLoops()
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
      stopAllSoundLoops()
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

export type CompleteResult =
  | { kind: 'completed' }
  | { kind: 'insufficient_wallet'; currentBalance: number; requiredAmount: number }
  | { kind: 'cash_underpaid'; totalFare: number; cashReceived: number }

export function useCompleteRide() {
  const queryClient = useQueryClient()
  const clearCurrentRide = useRideStore((s) => s.clearCurrentRide)
  return useMutation({
    mutationFn: async ({
      rideId,
      data,
    }: {
      rideId: string
      data: Record<string, unknown>
    }): Promise<CompleteResult> => {
      try {
        await driverRidesApi.completeRide(rideId, data)
        return { kind: 'completed' }
      } catch (err: any) {
        const errData = err?.response?.data
        if (err?.response?.status === 402 && errData?.error_code === 'INSUFFICIENT_WALLET_BALANCE') {
          return {
            kind: 'insufficient_wallet',
            currentBalance: errData.data?.current_balance ?? 0,
            requiredAmount: errData.data?.required_amount ?? 0,
          }
        }
        if (err?.response?.status === 400 && errData?.error_code === 'CASH_UNDERPAID') {
          return {
            kind: 'cash_underpaid',
            totalFare: errData.data?.total_fare ?? 0,
            cashReceived: errData.data?.cash_received ?? 0,
          }
        }
        throw err
      }
    },
    onSuccess: (result) => {
      if (result.kind === 'completed') {
        clearCurrentRide()
        queryClient.invalidateQueries({ queryKey: ['driver-rides'] })
        queryClient.invalidateQueries({ queryKey: ['driver'] })
        queryClient.invalidateQueries({ queryKey: ['driver', 'rides', 'history'] })
        queryClient.invalidateQueries({ queryKey: ['rides', 'recent-completed-pending-rating'] })
      }
    },
  })
}

export function useRideSummary() {
  return useMutation({
    mutationFn: ({
      rideId,
    }: {
      rideId: string
    }): Promise<import('../api/driver-rides').RideSummary> =>
      driverRidesApi.getRideSummary(rideId).then((r) => r.data),
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
    refetchInterval: 5000,
  })
}
