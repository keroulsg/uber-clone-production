import { useCallback } from 'react'
import { toast } from 'sonner'
import type { ApiErrorResponse } from '@/types'

interface UseApiErrorOptions {
  formErrors?: (errors: Record<string, string[]>) => void
  onError?: (error: ApiErrorResponse) => void
}

export function useApiError(options?: UseApiErrorOptions) {
  const handleError = useCallback(
    (error: unknown) => {
      const apiError = (error as { response?: { data?: ApiErrorResponse } })?.response?.data

      if (!apiError || !apiError.error) {
        toast.error('An unexpected error occurred')
        return
      }

      const { error: err } = apiError

      if (err.details && options?.formErrors) {
        options.formErrors(err.details)
      }

      if (err.status === 400 || err.status === 409) {
        toast.error(err.message)
      }

      options?.onError?.(apiError)
    },
    [options?.formErrors],
  )

  return { handleError }
}
