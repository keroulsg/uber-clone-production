import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as ratingsApi from '../api/ratings'

export function useRateDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => ratingsApi.rateDriver(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings'] })
    },
  })
}

export function useRateRider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => ratingsApi.rateRider(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings'] })
    },
  })
}

export function useDriverRatings(
  driverId: string,
  params?: Record<string, unknown>
) {
  return useQuery({
    queryKey: ['ratings', 'drivers', driverId, params],
    queryFn: () => ratingsApi.getDriverRatings(driverId, params),
    enabled: !!driverId,
  })
}

export function useRiderRatings(
  riderId: string,
  params?: Record<string, unknown>
) {
  return useQuery({
    queryKey: ['ratings', 'riders', riderId, params],
    queryFn: () => ratingsApi.getRiderRatings(riderId, params),
    enabled: !!riderId,
  })
}
