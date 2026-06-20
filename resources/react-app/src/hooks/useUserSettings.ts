import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import * as settingsApi from '../api/settings'
import type { UserSettings } from '../types'

export function useUserSettings() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['user-settings'],
    queryFn: () => settingsApi.getSettings(),
    enabled: !!token,
  })
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<UserSettings>) => settingsApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] })
    },
  })
}
