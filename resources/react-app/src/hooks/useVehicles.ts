import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import * as vehiclesApi from '../api/vehicles'

export function useVehicleTypes() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['vehicle-types'],
    queryFn: () => vehiclesApi.getVehicleTypes(),
    enabled: !!token,
    staleTime: 1000 * 60 * 30,
  })
}

export function useVehicles() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['driver', 'vehicles'],
    queryFn: () => vehiclesApi.getVehicles(),
    enabled: !!token,
  })
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: ['driver', 'vehicles', id],
    queryFn: () => vehiclesApi.getVehicle(id),
    enabled: !!id,
  })
}

export function useRegisterVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      vehiclesApi.registerVehicle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver', 'vehicles'] })
    },
  })
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Record<string, unknown>
    }) => vehiclesApi.updateVehicle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver', 'vehicles'] })
    },
  })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      formData,
    }: {
      id: string
      formData: FormData
    }) => vehiclesApi.uploadDocument(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver', 'vehicles'] })
    },
  })
}
