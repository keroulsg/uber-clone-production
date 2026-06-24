import { useState, useRef, useEffect } from 'react'
import { Send, MessageSquare, X } from 'lucide-react'
import { toast } from 'sonner'
import { useChat, useSendMessage } from '@/hooks/useChat'
import { useAuthStore } from '@/stores/authStore'
import { formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import type { ChatMessageData } from '@/api/chat'

interface ChatPanelProps {
  rideId: number | string | null
  isOpen: boolean
  onToggle: () => void
}

export function ChatPanel({ rideId, isOpen, onToggle }: ChatPanelProps) {
  const user = useAuthStore((s) => s.user)
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, isLoading } = useChat(rideId, { enabled: isOpen })
  const sendMessage = useSendMessage(rideId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!message.trim()) return
    try {
      await sendMessage.mutateAsync(message.trim())
      setMessage('')
    } catch {
      toast.error('Failed to send message')
    }
  }

  if (!isOpen) return null

  return (
    <div className="border rounded-lg flex flex-col h-[400px] bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span className="font-medium text-sm">Chat</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggle}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <LoadingScreen message="Loading messages..." />
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No messages yet. Say hello!
          </p>
        ) : (
          messages.map((msg: ChatMessageData) => {
            const isMine = msg.user_id === Number(user?.id)
            return (
              <div key={msg.id} className={cn('flex gap-2', isMine ? 'flex-row-reverse' : '')}>
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="text-xs">
                    {(msg.user_name ?? '?')[0]}
                  </AvatarFallback>
                </Avatar>
                <div className={cn('max-w-[75%]', isMine ? 'items-end' : '')}>
                  <div className={cn(
                    'rounded-lg px-3 py-2 text-sm',
                    isMine ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    {msg.message}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {isMine ? 'You' : msg.user_name} &middot; {formatDate(msg.created_at)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-3">
        <div className="flex gap-2">
          <Textarea
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            className="min-h-[40px] max-h-[80px] text-sm"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessage.isPending}
            className="self-end shrink-0"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
