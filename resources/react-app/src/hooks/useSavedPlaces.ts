import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import * as savedPlacesApi from '../api/saved-places'

export function useSavedPlaces() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['saved-places'],
    queryFn: () => savedPlacesApi.getSavedPlaces(),
    enabled: !!token,
  })
}

export function useCreateSavedPlace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => savedPlacesApi.createSavedPlace(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-places'] })
    },
  })
}

export function useUpdateSavedPlace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      savedPlacesApi.updateSavedPlace(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-places'] })
    },
  })
}

export function useDeleteSavedPlace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => savedPlacesApi.deleteSavedPlace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-places'] })
    },
  })
}
