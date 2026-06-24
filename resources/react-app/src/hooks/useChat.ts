import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEcho } from '@/lib/echo'
import * as chatApi from '../api/chat'
import type { ChatMessageData } from '../api/chat'

interface UseChatOptions {
  enabled?: boolean
}

export function useChat(rideId: number | string | null, options?: UseChatOptions) {
  const queryClient = useQueryClient()
  const [realtimeMessages, setRealtimeMessages] = useState<ChatMessageData[]>([])

  const query = useQuery({
    queryKey: ['chat', rideId],
    queryFn: async () => {
      if (!rideId) return []
      const res = await chatApi.getMessages(rideId)
      return res.data ?? []
    },
    enabled: !!rideId && (options?.enabled ?? true),
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (!rideId) return
    setRealtimeMessages([])
  }, [rideId])

  useEffect(() => {
    const e = getEcho()
    if (!rideId || !e) return

    const channel = e.private(`chat.${rideId}`)

    const handler = (data: unknown) => {
      const msg = data as ChatMessageData & { user_name?: string }
      setRealtimeMessages((prev) => [...prev, msg])
    }

    channel.listen('.message.sent', handler)

    return () => {
      try { channel.stopListening('.message.sent', handler) } catch { /* ok */ }
      try { e.leave(`chat.${rideId}`) } catch { /* ok */ }
    }
  }, [rideId])

  const allMessages = [...(query.data ?? []), ...realtimeMessages].filter(
    (msg, index, self) => index === self.findIndex((m) => m.id === msg.id)
  )

  return {
    messages: allMessages,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}

export function useSendMessage(rideId: number | string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (message: string) => {
      if (!rideId) throw new Error('No ride ID')
      return chatApi.sendMessage(rideId, message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', rideId] })
    },
  })
}
