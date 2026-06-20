import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import * as ratingsApi from '../api/ratings'

export function useRateDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => ratingsApi.rateDriver(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings'] })
      queryClient.invalidateQueries({ queryKey: ['rides', 'recent-completed-pending-rating'] })
      queryClient.invalidateQueries({ queryKey: ['rides'] })
      queryClient.invalidateQueries({ queryKey: ['driver'] })
    },
  })
}

export function useRateRider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => ratingsApi.rateRider(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings'] })
      queryClient.invalidateQueries({ queryKey: ['rides', 'recent-completed-pending-rating'] })
      queryClient.invalidateQueries({ queryKey: ['rides'] })
    },
  })
}

export function useMyDriverRatings() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['ratings', 'driver', 'me'],
    queryFn: () => ratingsApi.getMyDriverRatings(),
    enabled: !!token,
  })
}

export function useMyRiderRatings() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['ratings', 'rider', 'me'],
    queryFn: () => ratingsApi.getMyRiderRatings(),
    enabled: !!token,
  })
}
