import { useState } from 'react'
import { CheckCheck, Bell, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications'
import { formatDate, cn } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import type { Notification } from '@/types'

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
}

const typeColors: Record<string, string> = {
  info: 'text-blue-500 bg-blue-100 dark:bg-blue-900',
  warning: 'text-amber-500 bg-amber-100 dark:bg-amber-900',
  success: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900',
  error: 'text-red-500 bg-red-100 dark:bg-red-900',
}

export default function DriverNotificationsPage() {
  const [filter, setFilter] = useState('all')
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)

  const { data, isLoading, isError, refetch } = useNotifications({
    ...(filter === 'unread' ? { unread: true } : {}),
  })

  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()

  const notifications: Notification[] = data?.data?.data ?? []

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync()
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    setSelectedNotification(notification)
    if (!notification.readAt) {
      try {
        await markAsRead.mutateAsync(notification.id)
      } catch {
        // silent
      }
    }
  }

  if (isLoading) return <LoadingScreen message="Loading notifications..." />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const Icon = selectedNotification ? typeIcons[selectedNotification.type] || Bell : Bell

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="View and manage your notifications"
        actions={[
          { label: 'Mark All as Read', onClick: handleMarkAllAsRead, icon: CheckCheck },
        ]}
      />

      <div className="flex items-center gap-3 mb-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {notifications.filter((n) => !n.readAt).length} unread
        </span>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up!"
        />
      ) : (
        <div className="rounded-lg border divide-y">
          {notifications.map((notification) => {
            const TypeIcon = typeIcons[notification.type] || Bell
            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  'w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-start gap-3',
                  !notification.readAt && 'bg-primary/5'
                )}
              >
                <div className={cn(
                  'rounded-full p-2 shrink-0',
                  typeColors[notification.type] || 'text-muted-foreground bg-muted'
                )}>
                  <TypeIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-sm font-medium', !notification.readAt && 'text-foreground')}>
                      {notification.title ?? notification.type}
                    </span>
                    {!notification.readAt && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {notification.message ?? JSON.stringify(notification.data)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(notification.createdAt)}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className={cn(
                'rounded-full p-2',
                selectedNotification ? typeColors[selectedNotification.type] || 'bg-muted' : 'bg-muted'
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <DialogTitle>{selectedNotification?.title ?? 'Notification'}</DialogTitle>
            </div>
            <DialogDescription>
              {selectedNotification && formatDate(selectedNotification.createdAt)}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm">
            {selectedNotification?.message ?? JSON.stringify(selectedNotification?.data)}
          </p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
