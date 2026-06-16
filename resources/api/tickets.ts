import apiClient from './client'
import type {
  ApiResponse,
  PaginatedResponse,
  Ticket,
  TicketMessage,
} from '../types'

export const getTickets = (
  params?: Record<string, unknown>
): Promise<ApiResponse<PaginatedResponse<Ticket>>> =>
  apiClient.get('/tickets', { params }).then((r) => r.data)

export const getTicket = (id: string): Promise<ApiResponse<Ticket>> =>
  apiClient.get(`/tickets/${id}`).then((r) => r.data)

export const createTicket = (
  data: Record<string, unknown>
): Promise<ApiResponse<Ticket>> =>
  apiClient.post('/tickets', data).then((r) => r.data)

export const addMessage = (
  ticketId: string,
  message: string
): Promise<ApiResponse<TicketMessage>> =>
  apiClient.post(`/tickets/${ticketId}/messages`, { message }).then((r) => r.data)

export const closeTicket = (id: string): Promise<ApiResponse<Ticket>> =>
  apiClient.post(`/tickets/${id}/close`).then((r) => r.data)
