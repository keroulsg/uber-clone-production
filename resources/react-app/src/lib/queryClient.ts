import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if ((error as any)?.response?.status === 401) return false
        if ((error as any)?.response?.status === 403) return false
        return failureCount < 1
      },
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
})
