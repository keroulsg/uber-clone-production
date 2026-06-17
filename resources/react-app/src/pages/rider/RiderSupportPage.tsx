import { useState } from 'react'
import { Send, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useTickets, useTicket, useCreateTicket, useAddMessage, useCloseTicket } from '@/hooks/useTickets'
import { formatDate } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { Ticket } from '@/types'

const priorityBadgeVariant: Record<string, 'default' | 'secondary' | 'warning' | 'destructive'> = {
  low: 'secondary',
  medium: 'default',
  high: 'warning',
  urgent: 'destructive',
}

export default function RiderSupportPage() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState('medium')

  const { data, isLoading, isError, refetch } = useTickets()
  const { data: ticketDetail } = useTicket(selectedTicketId ?? '')
  const createTicket = useCreateTicket()
  const addMessage = useAddMessage()
  const closeTicket = useCloseTicket()

  const tickets = data?.data?.data ?? []
  const selectedTicket = ticketDetail?.data as Ticket | undefined

  const handleSendReply = async () => {
    if (!selectedTicketId || !replyMessage.trim()) return
    try {
      await addMessage.mutateAsync({ ticketId: selectedTicketId, message: replyMessage.trim() })
      setReplyMessage('')
      toast.success('Message sent')
    } catch {
      toast.error('Failed to send message')
    }
  }

  const handleCloseTicket = async () => {
    if (!selectedTicketId) return
    try {
      await closeTicket.mutateAsync(selectedTicketId)
      toast.success('Ticket closed')
    } catch {
      toast.error('Failed to close ticket')
    }
  }

  const handleCreateTicket = async () => {
    if (!subject.trim() || !message.trim()) return
    try {
      await createTicket.mutateAsync({ subject, message, priority })
      setCreateOpen(false)
      setSubject('')
      setMessage('')
      setPriority('medium')
      toast.success('Ticket created')
    } catch {
      toast.error('Failed to create ticket')
    }
  }

  if (isLoading) return <LoadingScreen message="Loading tickets..." />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader title="Support" description="View and manage your support tickets" actions={[{ label: 'New Ticket', onClick: () => setCreateOpen(true), icon: Plus }]} />

      {tickets.length === 0 ? (
        <EmptyState
          title="No support tickets"
          description="Create a ticket and our support team will help you"
          actionLabel="Create Ticket"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket: Ticket) => (
            <Card key={ticket.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setSelectedTicketId(ticket.id)}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{ticket.subject}</p>
                    <p className="text-sm text-muted-foreground">{ticket.ticketId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={priorityBadgeVariant[ticket.priority]}>{ticket.priority}</Badge>
                    <StatusBadge status={ticket.status} type="ticket" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{ticket.message}</p>
                <p className="text-xs text-muted-foreground mt-2">{formatDate(ticket.createdAt)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedTicketId} onOpenChange={() => setSelectedTicketId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject ?? 'Ticket'}</DialogTitle>
            <DialogDescription>
              Ticket ID: {selectedTicket?.ticketId} &middot;
              Status: <StatusBadge status={selectedTicket?.status ?? 'open'} type="ticket" />
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {selectedTicket?.messages?.map((msg: any) => (
              <div key={msg.id} className={`flex gap-3 ${msg.isStaff ? 'flex-row-reverse' : ''}`}>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs">{msg.user?.name?.[0] ?? '?'}</AvatarFallback>
                </Avatar>
                <div className={`max-w-[80%] ${msg.isStaff ? 'items-end' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">{msg.user?.name ?? 'Unknown'}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(msg.createdAt)}</span>
                  </div>
                  <div className={`rounded-lg px-3 py-2 text-sm ${
                    msg.isStaff ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    {msg.message}
                  </div>
                </div>
              </div>
            ))}
            {(!selectedTicket?.messages || selectedTicket.messages.length === 0) && (
              <p className="text-center text-sm text-muted-foreground">No messages yet</p>
            )}
          </div>

          {selectedTicket && selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
            <div className="border-t pt-4 space-y-3">
              <Button variant="outline" size="sm" onClick={handleCloseTicket}>Close Ticket</Button>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your reply..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="min-h-[60px]"
                />
                <Button onClick={handleSendReply} disabled={!replyMessage.trim() || addMessage.isPending} className="self-end">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>Describe your issue and our team will get back to you</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief description of the issue" />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your issue in detail" className="min-h-[120px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTicket} disabled={!subject.trim() || !message.trim() || createTicket.isPending}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}