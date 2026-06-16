import { useState } from 'react'
import { Send, Eye, MoreHorizontal, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminTickets } from '@/hooks/useAdmin'
import { useTicket, useAddMessage, useCloseTicket } from '@/hooks/useTickets'
import { useAuthStore } from '@/stores/authStore'
import { formatDate, getInitials } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import type { Ticket, TicketPriority, TicketStatus } from '@/types'

const priorityBadgeVariant: Record<TicketPriority, 'default' | 'secondary' | 'warning' | 'destructive'> = {
  low: 'secondary',
  medium: 'default',
  high: 'warning',
  urgent: 'destructive',
}

const ticketTabs = [
  { value: 'all', label: 'All Tickets' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

export default function AdminSupportPage() {
  const user = useAuthStore((s) => s.user)
  const [tab, setTab] = useState('all')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [replyMessage, setReplyMessage] = useState('')

  const { data, isLoading, isError, refetch } = useAdminTickets({
    page,
    per_page: perPage,
    ...(tab !== 'all' ? { status: tab } : {}),
  })

  const { data: ticketDetail } = useTicket(selectedTicketId ?? '')
  const addMessage = useAddMessage()
  const closeTicket = useCloseTicket()

  const tickets = data?.data?.data ?? []
  const meta = data?.data?.meta
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

  const columns: Column<Ticket>[] = [
    {
      header: 'Ticket ID',
      accessor: 'ticketId' as keyof Ticket,
    },
    {
      header: 'Subject',
      accessor: 'subject' as keyof Ticket,
    },
    {
      header: 'User',
      accessor: (row) => row.user?.name ?? '—',
    },
    {
      header: 'Priority',
      accessor: 'priority' as keyof Ticket,
      cell: (row) => (
        <Badge variant={priorityBadgeVariant[row.priority]}>
          {row.priority}
        </Badge>
      ),
    },
    {
      header: 'Status',
      accessor: 'status' as keyof Ticket,
      cell: (row) => <StatusBadge status={row.status} type="ticket" />,
    },
    {
      header: 'Created',
      accessor: (row) => formatDate(row.createdAt),
      sortable: true,
    },
    {
      header: 'Actions',
      accessor: (row) => '',
      cell: (row) => (
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelectedTicketId(row.id) }}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  if (isLoading) return <LoadingScreen message="Loading tickets..." />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description="Manage support tickets and inquiries"
      />

      <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1) }}>
        <TabsList>
          {ticketTabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <DataTable<Ticket>
                columns={columns}
                data={tickets}
                keyExtractor={(t) => t.id}
                searchable
                searchPlaceholder="Search tickets..."
                page={page}
                lastPage={meta?.lastPage ?? 1}
                total={meta?.total ?? 0}
                from={meta?.from ?? 0}
                to={meta?.to ?? 0}
                perPage={perPage}
                onPageChange={setPage}
                onPerPageChange={setPerPage}
                onRowClick={(ticket) => setSelectedTicketId(ticket.id)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedTicketId} onOpenChange={() => setSelectedTicketId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject ?? 'Ticket'}</DialogTitle>
            <DialogDescription>
              Ticket ID: {selectedTicket?.ticketId} &middot;
              Priority: <Badge variant={selectedTicket ? priorityBadgeVariant[selectedTicket.priority] : 'default'}>{selectedTicket?.priority}</Badge>
              &middot; Status: <StatusBadge status={selectedTicket?.status ?? 'open'} type="ticket" />
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {selectedTicket?.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.isStaff ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs">{msg.user?.name ? getInitials(msg.user.name) : '?'}</AvatarFallback>
                </Avatar>
                <div className={`max-w-[80%] ${msg.isStaff ? 'items-end' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">{msg.user?.name ?? 'Unknown'}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(msg.createdAt)}</span>
                  </div>
                  <div className={`rounded-lg px-3 py-2 text-sm ${
                    msg.isStaff
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
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
              <div className="flex items-center gap-2">
                <Select defaultValue="">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Assign to..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    <SelectItem value="admin1">Admin 1</SelectItem>
                    <SelectItem value="admin2">Admin 2</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={handleCloseTicket}>
                  Close Ticket
                </Button>
              </div>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your reply..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="min-h-[60px]"
                />
                <Button
                  onClick={handleSendReply}
                  disabled={!replyMessage.trim() || addMessage.isPending}
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
