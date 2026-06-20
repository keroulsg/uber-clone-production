import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import * as authApi from '../api/auth'
import type { AuthResponse, User } from '../types'

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  return useMutation({
    retry: false,
    mutationFn: ({
      email,
      password,
      deviceToken,
    }: {
      email: string
      password: string
      deviceToken?: string
    }) => authApi.login(email, password, deviceToken),
    onSuccess: (res) => {
      const { user, token } = res.data as AuthResponse
      localStorage.setItem('auth_token', token)
      setAuth(user, token)
    },
  })
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth)
  return useMutation({
    mutationFn: ({
      name,
      email,
      phone,
      password,
      passwordConfirmation,
      role,
    }: {
      name: string
      email: string
      phone: string
      password: string
      passwordConfirmation: string
      role: string
    }) => authApi.register(name, email, phone, password, passwordConfirmation, role),
    onSuccess: (res) => {
      const { user, token } = res.data as AuthResponse
      localStorage.setItem('auth_token', token)
      setAuth(user, token)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const logout = useAuthStore((s) => s.logout)
  return useMutation({
    mutationFn: async () => {
      // 1. Clear auth state immediately — causes ProtectedRoute to render <Navigate />
      logout()
      localStorage.removeItem('auth_token')

      // 2. Wait for React to process the state update and unmount protected children
      await new Promise((resolve) => setTimeout(resolve, 0))

      // 3. Now all protected components are torn down — safe to clear cache
      queryClient.cancelQueries()
      queryClient.clear()

      // 4. Disconnect Echo
      const { destroyEcho } = await import('../lib/echo')
      destroyEcho()

      // 5. Fire the API call silently — best effort, ignore errors
      try {
        return await authApi.logout()
      } catch {
        return null
      }
    },
  })
}

export function useUser() {
  const setUser = useAuthStore((s) => s.setUser)
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const res = await authApi.getUser()
      setUser(res.data as User)
      return res.data as User
    },
    enabled: !!token,
  })
}

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: (data: FormData) => authApi.updateProfile(data),
    onSuccess: (res) => {
      setUser(res.data as User)
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
      newPasswordConfirmation,
    }: {
      currentPassword: string
      newPassword: string
      newPasswordConfirmation: string
    }) => authApi.changePassword(currentPassword, newPassword, newPasswordConfirmation),
  })
}

export function useUploadAvatar() {
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: (file: File) => authApi.uploadAvatar(file),
    onSuccess: (res) => {
      setUser(res.data as User)
    },
  })
}

export function useDeleteAvatar() {
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: () => authApi.deleteAvatar(),
    onSuccess: (res) => {
      setUser(res.data as User)
    },
  })
}
