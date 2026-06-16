import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

type StatusType = 'ride' | 'driver' | 'vehicle' | 'payment' | 'ticket'

interface StatusBadgeProps {
  status: string
  type?: StatusType
  className?: string
}

const statusMaps: Record<StatusType, Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' }>> = {
  ride: {
    pending: { label: 'Pending', variant: 'warning' },
    searching_driver: { label: 'Searching', variant: 'secondary' },
    driver_assigned: { label: 'Driver Assigned', variant: 'default' },
    driver_arrived: { label: 'Driver Arrived', variant: 'default' },
    ride_started: { label: 'In Progress', variant: 'default' },
    ride_completed: { label: 'Completed', variant: 'success' },
    cancelled: { label: 'Cancelled', variant: 'destructive' },
  },
  driver: {
    pending: { label: 'Pending', variant: 'warning' },
    approved: { label: 'Approved', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'destructive' },
    suspended: { label: 'Suspended', variant: 'destructive' },
  },
  vehicle: {
    pending: { label: 'Pending', variant: 'warning' },
    approved: { label: 'Approved', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'destructive' },
    active: { label: 'Active', variant: 'success' },
    maintenance: { label: 'Maintenance', variant: 'warning' },
    retired: { label: 'Retired', variant: 'default' },
  },
  payment: {
    pending: { label: 'Pending', variant: 'warning' },
    completed: { label: 'Completed', variant: 'success' },
    failed: { label: 'Failed', variant: 'destructive' },
    refunded: { label: 'Refunded', variant: 'default' },
  },
  ticket: {
    open: { label: 'Open', variant: 'default' },
    in_progress: { label: 'In Progress', variant: 'warning' },
    resolved: { label: 'Resolved', variant: 'success' },
    closed: { label: 'Closed', variant: 'default' },
  },
}

export function StatusBadge({ status, type = 'ride', className }: StatusBadgeProps) {
  const map = statusMaps[type]?.[status]
  if (!map) {
    return (
      <Badge variant="outline" className={cn('capitalize', className)}>
        {status.replace(/_/g, ' ')}
      </Badge>
    )
  }

  return (
    <Badge variant={map.variant} className={cn('capitalize', className)}>
      {map.label}
    </Badge>
  )
}
