import apiClient from './client'
import type { ApiResponse } from '../types'

export interface ChatMessageData {
  id: number
  ride_id: number
  user_id: number
  user_name: string
  message: string
  created_at: string
}

export const getMessages = (rideId: number | string): Promise<ApiResponse<ChatMessageData[]>> =>
  apiClient.get(`/rides/${rideId}/chat/index`).then((r) => r.data)

export const sendMessage = (
  rideId: number | string,
  message: string
): Promise<ApiResponse<ChatMessageData>> =>
  apiClient.post(`/rides/${rideId}/chat`, { message }).then((r) => r.data)
