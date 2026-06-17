import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import * as ticketsApi from '../api/tickets'

export function useTickets(params?: Record<string, unknown>) {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['tickets', params],
    queryFn: () => ticketsApi.getTickets(params),
    enabled: !!token,
  })
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ['tickets', id],
    queryFn: () => ticketsApi.getTicket(id),
    enabled: !!id,
  })
}

export function useCreateTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => ticketsApi.createTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export function useAddMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      ticketId,
      message,
    }: {
      ticketId: string
      message: string
    }) => ticketsApi.addMessage(ticketId, message),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['tickets', vars.ticketId] })
    },
  })
}

export function useCloseTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ticketsApi.closeTicket(id),
    onSuccess: (_res, id) => {
      queryClient.invalidateQueries({ queryKey: ['tickets', id] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}
