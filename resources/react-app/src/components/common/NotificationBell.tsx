import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { formatDate } from '@/lib/utils'
import type { Notification } from '@/types'

interface NotificationBellProps {
  notifications?: Notification[]
  unreadCount?: number
  onMarkAllRead?: () => void
  onMarkAsRead?: (id: string) => void
  viewAllHref?: string
  isLoading?: boolean
  isError?: boolean
  className?: string
}

const notificationIcons: Record<string, string> = {
  ride_requested: '🚗',
  ride_accepted: '✅',
  driver_arrived: '📍',
  ride_started: '▶️',
  ride_completed: '🏁',
  payment_received: '💰',
  payment_completed: '💰',
  debt_created: '📋',
  ride_cancelled: '❌',
  driver_rated: '⭐',
  new_message: '💬',
  promo: '🎉',
}

function getNavigatePath(type: string): string {
  switch (type) {
    case 'ride_requested':
    case 'ride_offer':
      return '/driver/current-ride'
    case 'ride_accepted':
    case 'driver_accepted':
    case 'driver_arrived':
    case 'ride_started':
      return '/rider/current-ride'
    case 'ride_completed':
      return '/rider/history'
    case 'payment_completed':
    case 'payment_received':
      return '/rider/payments'
    case 'debt_created':
      return '/driver/wallet'
    case 'document_approved':
    case 'document_rejected':
      return '/driver/documents'
    default:
      return '/notifications'
  }
}

export function NotificationBell({
  notifications = [],
  unreadCount = 0,
  onMarkAllRead,
  onMarkAsRead,
  viewAllHref = '/notifications',
  isLoading = false,
  isError = false,
  className,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const prevCountRef = useRef(unreadCount)
  const prevIdsRef = useRef(new Set(notifications.map(n => n.id)))
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [soundBlocked, setSoundBlocked] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  useEffect(() => {
    if (!open && unreadCount > prevCountRef.current) {
      const currentIds = new Set(notifications.map(n => n.id))
      const newNotifs = notifications.filter(n => !prevIdsRef.current.has(n.id) && !n.readAt)
      if (newNotifs.length > 0) {
        if (!audioRef.current) {
          audioRef.current = new Audio()
        }
        audioRef.current.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAf39/f4B/f3+AgH9/f3+AgH9/f3+AgH9/f3+AgH9/f3+AgH9/f3+AgH9/f3+Af39/f4B/f3+AgH9/f3+AgH9/f3+AgH9/f3+AgH9/f3+Af39/f4B/f3+AgH9/f3+AgH9/f3+Af39/f4B/f3+AgH9/f3+AgH9/f38='
        try {
          if (hasInteracted) {
            audioRef.current.play().catch(() => setSoundBlocked(true))
          } else {
            setSoundBlocked(true)
          }
        } catch {
          setSoundBlocked(true)
        }
      }
    }
    prevCountRef.current = unreadCount
    prevIdsRef.current = new Set(notifications.map(n => n.id))
  }, [notifications, unreadCount, open, hasInteracted])

  useEffect(() => {
    const handler = () => setHasInteracted(true)
    window.addEventListener('click', handler, { once: true })
    window.addEventListener('touchstart', handler, { once: true })
    window.addEventListener('keydown', handler, { once: true })
    return () => {
      window.removeEventListener('click', handler)
      window.removeEventListener('touchstart', handler)
      window.removeEventListener('keydown', handler)
    }
  }, [])

  const handleNotificationClick = useCallback((notification: Notification) => {
    if (!notification.readAt && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
    setOpen(false)
    const path = getNavigatePath(notification.type)
    navigate(path)
  }, [navigate, onMarkAsRead])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={cn('relative', className)}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-[10px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          {soundBlocked && unreadCount > 0 && !hasInteracted && (
            <span className="absolute -top-1 -right-6 text-[8px] text-amber-500 whitespace-nowrap">
              ⚠️ Click to enable sounds
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && onMarkAllRead && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={() => { onMarkAllRead() }}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>
        <Separator />
        <div className="max-h-[320px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-8 w-8 text-destructive mb-2" />
              <p className="text-sm text-destructive">Failed to load</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            notifications.slice(0, 10).map((notification) => {
              const title = notification.title ?? notification.data?.title ?? ''
              const message = notification.message ?? notification.data?.message ?? ''
              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer border-b last:border-b-0',
                    !notification.readAt && 'bg-primary/5'
                  )}
                >
                  <span className="text-lg mt-0.5 shrink-0">
                    {notificationIcons[notification.type] ?? '🔔'}
                  </span>
                  <div className="flex-1 min-w-0">
                    {title && (
                      <p className="text-sm font-medium truncate">{title}</p>
                    )}
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {message || title || notification.type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.readAt && (
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  )}
                </div>
              )
            })
          )}
        </div>
        <Separator />
        <div className="p-2">
          <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
            <a href={viewAllHref} onClick={() => setOpen(false)}>
              View all notifications
            </a>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
