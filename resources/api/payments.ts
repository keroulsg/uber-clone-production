import apiClient from './client'
import type {
  ApiResponse,
  PaginatedResponse,
  Payment,
  Transaction,
  Wallet,
} from '../types'

interface PaymentsResponse {
  payments: Payment[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export const getPayments = (
  params?: Record<string, unknown>
): Promise<ApiResponse<PaymentsResponse>> =>
  apiClient.get('/payments', { params }).then((r) => r.data)

export const getPayment = (id: string): Promise<ApiResponse<Payment>> =>
  apiClient.get(`/payments/${id}`).then((r) => r.data)

export const getWallet = (): Promise<ApiResponse<Wallet>> =>
  apiClient.get('/payments/wallet').then((r) => r.data)

export const addFunds = (amount: number): Promise<ApiResponse<Transaction>> =>
  apiClient.post('/payments/wallet/fund', { amount }).then((r) => r.data)

export const getTransactions = (
  params?: Record<string, unknown>
): Promise<ApiResponse<PaginatedResponse<Transaction>>> =>
  apiClient.get('/payments/transactions', { params }).then((r) => r.data)
