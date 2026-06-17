import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import * as paymentsApi from '../api/payments'
import type { Transaction } from '../types'

export function usePayments(params?: Record<string, unknown>) {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['payments', params],
    queryFn: () => paymentsApi.getPayments(params),
    enabled: !!token,
  })
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: ['payments', id],
    queryFn: () => paymentsApi.getPayment(id),
    enabled: !!id,
  })
}

export function useWallet() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['wallet'],
    queryFn: () => paymentsApi.getWallet(),
    enabled: !!token,
  })
}

export function useAddFunds() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (amount: number) => paymentsApi.addFunds(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] })
    },
  })
}

export function useTransactions(params?: Record<string, unknown>) {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['wallet', 'transactions', params],
    queryFn: () => paymentsApi.getTransactions(params),
    enabled: !!token,
  })
}
