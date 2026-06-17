import axios, { AxiosError } from 'axios'
import { toast } from 'sonner'
import { useAuthStore } from '../stores/authStore'
import { queryClient } from '../lib/queryClient'
import echo from '../lib/echo'

let isHandling401 = false
let isHandling403 = false

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token || localStorage.getItem('auth_token')
  if (token) { config.headers.Authorization = `Bearer ${token}` }

  const traceId = crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2)
  config.headers['X-Trace-Id'] = traceId

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status
    const data = error.response?.data

    if (!status) {
      toast.error('Network error. Please check your connection.')
      return Promise.reject(error)
    }

    const errorCode = data?.error?.code
    const errorMessage = data?.error?.message || data?.message || 'An unexpected error occurred'
    const validationErrors = data?.error?.details

    if (status === 401) {
      const url = error.config?.url ?? ''
      // Skip /auth/login and /auth/logout — they have their own error handling
      if (url.includes('/auth/login') || url.includes('/auth/logout')) {
        return Promise.reject(error)
      }
      // Guard against multiple 401 handlers firing simultaneously
      if (isHandling401) {
        return Promise.reject(error)
      }
      isHandling401 = true

      localStorage.removeItem('auth_token')
      queryClient.cancelQueries()
      queryClient.clear()
      useAuthStore.getState().logout()

      if (echo) echo.disconnect()

      toast.error('Session expired. Please login again.')

      const currentPath = window.location.pathname
      if (currentPath !== '/login') {
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    if (status === 403) {
      if (isHandling401) return Promise.reject(error)
      if (isHandling403) return Promise.reject(error)
      isHandling403 = true
      toast.error('Access denied. You do not have permission to perform this action.')
      setTimeout(() => { isHandling403 = false }, 3000)
      return Promise.reject(error)
    }

    if (status === 404) {
      return Promise.reject(error)
    }

    if (status === 409) {
      toast.error(errorMessage)
      return Promise.reject(error)
    }

    if (status === 422 && validationErrors) {
      return Promise.reject(new ValidationApiError(errorMessage, validationErrors))
    }

    if (status === 429) {
      toast.error('Too many requests. Please slow down.')
      return Promise.reject(error)
    }

    if (status >= 500) {
      toast.error('Something went wrong. Our team has been notified.')
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

export interface ApiErrorResponse {
  success: boolean
  message?: string
  error?: {
    code: string
    message: string
    details?: Record<string, string[]>
    status: number
  }
  trace_id?: string
  errors?: Record<string, string[]>
}

export class ValidationApiError extends Error {
  constructor(
    message: string,
    public validationErrors: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'ValidationApiError'
  }
}

export { apiClient }
export default apiClient
