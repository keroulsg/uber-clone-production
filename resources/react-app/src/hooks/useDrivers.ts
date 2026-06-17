import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useDriverStore } from '../stores/driverStore'
import { useAuthStore } from '../stores/authStore'
import * as driversApi from '../api/drivers'
import type { Driver } from '../types'

export function useDriverProfile() {
  const token = useAuthStore((s) => s.token)
  const setDriver = useDriverStore((s) => s.setDriver)
  return useQuery({
    queryKey: ['driver', 'profile'],
    queryFn: async () => {
      const res = await driversApi.getDriverProfile()
      setDriver(res.data as Driver)
      return res.data as Driver
    },
    enabled: !!token,
  })
}

export function useUpdateDriverProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      driversApi.updateDriverProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver', 'profile'] })
    },
  })
}

export function useToggleOnlineStatus() {
  const queryClient = useQueryClient()
  const setOnlineStatus = useDriverStore((s) => s.setOnlineStatus)
  return useMutation({
    mutationFn: () => driversApi.toggleOnlineStatus(),
    onSuccess: (res) => {
      setOnlineStatus(res.is_online)
      toast.success(res.is_online ? 'You are now online' : 'You are now offline')
      queryClient.invalidateQueries({ queryKey: ['driver', 'profile'] })
    },
    onError: () => {
      toast.error('Failed to toggle online status. Please try again.')
    },
  })
}

export function useUpdateLocation() {
  return useMutation({
    mutationFn: ({
      lat,
      lng,
      bearing,
    }: {
      lat: number
      lng: number
      bearing?: number
    }) => driversApi.updateLocation(lat, lng, bearing),
  })
}

export function useEarnings(from?: string, to?: string) {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['driver', 'earnings', from, to],
    queryFn: () => driversApi.getEarnings(from, to),
    enabled: !!token,
  })
}

export function usePerformance() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['driver', 'performance'],
    queryFn: () => driversApi.getPerformance(),
    enabled: !!token,
  })
}

export function useUploadDriverDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ type, file }: { type: string; file: File }) =>
      driversApi.uploadDriverDocument(type, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver', 'profile'] })
    },
  })
}

export function useSubmitDriverVerification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => driversApi.submitDriverVerification(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver', 'profile'] })
    },
  })
}

export function useNearbyDrivers(params: Record<string, unknown>) {
  return useQuery({
    queryKey: ['drivers', 'nearby', params],
    queryFn: () => driversApi.getNearbyDrivers(params),
    enabled: !!params.latitude && !!params.longitude,
  })
}
