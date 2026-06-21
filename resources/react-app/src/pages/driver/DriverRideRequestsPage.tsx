import { useState, useEffect, useCallback, useRef } from 'react'
import {
  MapPin, Star, Clock, Timer, X, Check,
} from 'lucide-react'
import { usePendingRides, useAcceptRide, useRejectRide } from '@/hooks/useDriverRides'
import { formatCurrency, formatDistance, formatDuration } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/PageHeader'
import { stopAllSoundLoops } from '@/lib/notificationSound'
import { useNewRequestSound } from '@/hooks/useNewRequestSound'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { EmptyState } from '@/components/common/EmptyState'

const REQUEST_EXPIRY_SECONDS = 30

function RequestTimer({ createdAt, onExpire }: { createdAt: string; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(REQUEST_EXPIRY_SECONDS)

  useEffect(() => {
    const created = new Date(createdAt).getTime()
    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - created) / 1000)
      const left = Math.max(0, REQUEST_EXPIRY_SECONDS - elapsed)
      setRemaining(left)
      if (left <= 0) onExpire()
    }
    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [createdAt, onExpire])

  const isLow = remaining <= 10

  return (
    <div className={`flex items-center gap-1 text-sm font-medium ${isLow ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}`}>
      <Timer className="h-4 w-4" />
      <span>{remaining}s</span>
    </div>
  )
}

export default function DriverRideRequestsPage() {
  const { data, isLoading, refetch } = usePendingRides()
  const acceptRide = useAcceptRide()
  const rejectRide = useRejectRide()
  const [expiredIds, setExpiredIds] = useState<Set<string>>(new Set())
  const [acceptedId, setAcceptedId] = useState<string | null>(null)
  const [rejectedId, setRejectedId] = useState<string | null>(null)

  // Fallback polling interval to ensure UI updates
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    pollingRef.current = setInterval(() => { refetch() }, 5000)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [refetch])

  useNewRequestSound(data?.data ?? [])

  const pendingRides = (data?.data ?? []).filter(
    (ride: any) => !expiredIds.has(ride.id) && ride.id !== rejectedId
  )

  const handleExpire = useCallback((rideId: string) => {
    setExpiredIds((prev) => new Set(prev).add(rideId))
  }, [])

  const handleAccept = async (rideId: string) => {
    stopAllSoundLoops()
    setAcceptedId(rideId)
    acceptRide.mutate(rideId)
  }

  const handleReject = (rideId: string) => {
    stopAllSoundLoops()
    setRejectedId(rideId)
    rejectRide.mutate(rideId)
  }

  if (isLoading) return <LoadingScreen />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ride Requests"
        description="Incoming ride requests — accept or reject"
      />

      {pendingRides.length === 0 ? (
        <EmptyState
          title="No ride requests"
          description="You'll see incoming requests here when they arrive"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {pendingRides.map((ride: any) => (
            <Card
              key={ride.id}
              className={`relative overflow-hidden transition-all duration-300 ${
                acceptedId === ride.id ? 'ring-2 ring-emerald-500 scale-[1.02] opacity-50' : ''
              } ${rejectedId === ride.id ? 'opacity-30 scale-95' : ''}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">
                        {ride.rider?.name?.charAt(0) ?? '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{ride.rider?.name}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {ride.rider?.rating?.toFixed(1) ?? 'New'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <RequestTimer
                      createdAt={ride.createdAt}
                      onExpire={() => handleExpire(ride.id)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3 text-xs">
                  <span className="text-muted-foreground font-mono">#{ride.bookingId}</span>
                  <Badge variant={ride.paymentMethod === 'cash' ? 'outline' : 'secondary'} className="text-[10px]">
                    {ride.paymentMethod === 'wallet' ? 'Wallet' : ride.paymentMethod === 'cash' ? 'Cash' : ride.paymentMethod ?? 'N/A'}
                  </Badge>
                  {ride.vehicleType && (
                    <Badge variant="outline" className="text-[10px]">{ride.vehicleType.name}</Badge>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <p className="text-sm">{ride.pickup?.address}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm">{ride.destination?.address}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                  {ride.estimatedDistance != null && (
                    <Badge variant="secondary">{formatDistance(ride.estimatedDistance)}</Badge>
                  )}
                  {ride.estimatedDuration != null && (
                    <Badge variant="secondary">{formatDuration(ride.estimatedDuration)}</Badge>
                  )}
                  <Badge variant="default" className="ml-auto text-sm">
                    {formatCurrency(ride.estimatedFare)}
                  </Badge>
                </div>

                {acceptedId === ride.id ? (
                  <div className="flex items-center justify-center gap-2 py-2 text-emerald-600 font-medium">
                    <Check className="h-5 w-5" />
                    Accepted!
                  </div>
                ) : rejectedId === ride.id ? (
                  <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground font-medium">
                    Rejected
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      className="flex-1 gap-2"
                      onClick={() => handleAccept(ride.id)}
                      disabled={acceptRide.isPending}
                    >
                      <Check className="h-4 w-4" />
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => handleReject(ride.id)}
                      disabled={rejectRide.isPending}
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
