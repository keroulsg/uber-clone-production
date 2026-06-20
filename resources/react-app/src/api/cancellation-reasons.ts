import apiClient from './client'
import type { ApiResponse, CancellationReason } from '../types'

export const getCancellationReasons = (
  actor: string = 'rider'
): Promise<ApiResponse<CancellationReason[]>> =>
  apiClient.get('/cancellation-reasons', { params: { actor } }).then((r) => r.data)
