import { ArrowRight, Clock, DollarSign } from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { Ride, RideBrief } from '@/types'

interface RideCardProps {
  ride: Ride | RideBrief
  onViewDetails?: (rideId: string) => void
  onAction?: (rideId: string, action: string) => void
  actions?: { label: string; value: string; variant?: 'default' | 'outline' | 'destructive' | 'secondary' }[]
  className?: string
}

export function RideCard({ ride, onViewDetails, onAction, actions, className }: RideCardProps) {
  const pickup = ride.pickup?.address ?? ''
  const destination = ride.destination?.address ?? ''
  const fare = ride.actualFare ?? ride.estimatedFare

  return (
    <Card className={cn('hover:shadow-md transition-shadow cursor-pointer', className)} onClick={() => onViewDetails?.(ride.id)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <span className="text-muted-foreground truncate">{pickup}</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground truncate">{destination}</span>
            </div>
            <StatusBadge status={ride.status} type="ride" />
          </div>
          <span className="text-lg font-bold tabular-nums ml-3">{formatCurrency(fare)}</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatDate(ride.createdAt)}
          </span>
          {'bookingId' in ride && (
            <span className="font-mono text-[10px]">#{ride.bookingId}</span>
          )}
        </div>

        {actions && actions.length > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            {actions.map((action) => (
              <Button
                key={action.value}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onAction?.(ride.id, action.value)
                }}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
