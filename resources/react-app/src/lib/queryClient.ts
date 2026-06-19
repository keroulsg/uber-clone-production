import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const status = (error as any)?.response?.status
        if (status === 401) return false
        if (status === 403) return false
        if (status === 404) return false
        if (status === 422) return false
        if (status === 429) return false
        return failureCount < 1
      },
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
})
