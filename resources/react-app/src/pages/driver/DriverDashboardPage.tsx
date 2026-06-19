import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  DollarSign, TrendingUp, Clock, Star, MapPin,
  Navigation, Play, CheckCircle, X,
} from 'lucide-react'
import { useDriverStore } from '@/stores/driverStore'
import { useRideStore } from '@/stores/rideStore'
import { useToggleOnlineStatus, useDriverProfile, useEarnings, usePerformance } from '@/hooks/useDrivers'
import { usePendingRides, useAcceptRide, useRejectRide, useStartRide, useCompleteRide, useDriverCurrentRide } from '@/hooks/useDriverRides'
import { formatCurrency, formatDistance, formatDuration, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { StatCard } from '@/components/common/StatCard'
import { Map } from '@/components/common/Map'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useDriverBroadcast } from '@/hooks/useDriverBroadcast'
import type { IncomingRideRequest } from '@/hooks/useDriverBroadcast'
import { getRideHistory } from '@/api/drivers'
import type { RideBrief } from '@/types'

export default function DriverDashboardPage() {
  const navigate = useNavigate()
  const { isOnline, driverProfile } = useDriverStore()
  const { currentRide } = useRideStore()
  const toggleOnline = useToggleOnlineStatus()
  const acceptRide = useAcceptRide()
  const rejectRide = useRejectRide()
  const startRide = useStartRide()
  const completeRide = useCompleteRide()

  const { data: profileData, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useDriverProfile()
  const { data: pendingRidesData, isLoading: pendingLoading, refetch: refetchPending } = usePendingRides()
  const { data: currentRideData, isLoading: currentLoading } = useDriverCurrentRide()
  const { data: earningsData } = useEarnings()
  const { data: performanceData } = usePerformance()

  // Fallback polling interval to ensure pending rides UI updates
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    pollingRef.current = setInterval(() => { refetchPending() }, 5000)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [refetchPending])

  const stats = performanceData?.data as {
    acceptanceRate: number
    completionRate: number
    averageRating: number
    todayEarnings: number
    weeklyEarnings: number
  } | undefined

  const { data: historyData } = useQuery({
    queryKey: ['driver', 'rides', 'history', { page: 1, per_page: 5 }],
    queryFn: () => getRideHistory({ page: 1, per_page: 5 }),
  })
  const pendingRides = (Array.isArray(pendingRidesData?.data) ? pendingRidesData.data : []) as any[]
  const rideHistory = ((historyData?.data as any)?.data ?? []) as RideBrief[]
  const [selectedRide, setSelectedRide] = useState<RideBrief | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const handleToggleOnline = () => {
    toggleOnline.mutate()
  }

  // Listen for incoming ride requests via WebSocket
  useDriverBroadcast(
    driverProfile?.id ?? null,
    useCallback((ride: IncomingRideRequest) => {
      refetchProfile()
    }, [refetchProfile]),
  )

  if (profileLoading || currentLoading) return <LoadingScreen />
  if (profileError) return <ErrorState onRetry={() => refetchProfile()} />

  return (
    <div className="space-y-6">
      <PageHeader title="Driver Dashboard" description="Manage your rides and availability" />

      {/* Online Status Toggle */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`h-4 w-4 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
              <div>
                <h2 className="text-xl font-bold">{isOnline ? 'You are Online' : 'You are Offline'}</h2>
                <p className="text-sm text-muted-foreground">
                  {isOnline ? 'You can receive ride requests' : 'Toggle to start receiving ride requests'}
                </p>
              </div>
            </div>
            <Switch
              checked={isOnline}
              onCheckedChange={handleToggleOnline}
              disabled={toggleOnline.isPending}
              className="scale-150 data-[state=checked]:bg-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Current Ride Card */}
      {currentRide && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-blue-500" />
                Current Ride
              </CardTitle>
              <StatusBadge status={currentRide.status} type="ride" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Pickup</p>
                    <p className="font-medium">{currentRide.pickup?.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Destination</p>
                    <p className="font-medium">{currentRide.destination?.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {currentRide.estimatedDuration && <span>{formatDuration(currentRide.estimatedDuration)}</span>}
                  {currentRide.estimatedDistance && <span>({formatDistance(currentRide.estimatedDistance)})</span>}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {currentRide.rider?.name?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{currentRide.rider?.name}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {currentRide.rider?.rating?.toFixed(1) ?? 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Fare: </span>
                  <span className="font-bold text-lg">{formatCurrency(currentRide.estimatedFare)}</span>
                  {currentRide.surge_multiplier != null && currentRide.surge_multiplier > 1 && (
                    <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-300 text-[10px]">
                      🔥 {currentRide.surge_multiplier}x Surge
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {currentRide.status === 'driver_assigned' && (
                    <Button
                      className="flex-1"
                      onClick={() => navigate('/driver/current-ride')}
                    >
                      Navigate to Pickup
                    </Button>
                  )}
                  {currentRide.status === 'driver_arrived' && (
                    <Button className="flex-1" onClick={() => startRide.mutate(currentRide.id)}>
                      <Play className="h-4 w-4 mr-1" />
                      Start Ride
                    </Button>
                  )}
                  {currentRide.status === 'ride_started' && (
                    <Button className="flex-1" onClick={() => navigate('/driver/current-ride')}>
                      <Navigation className="h-4 w-4 mr-1" />
                      Navigate to Destination
                    </Button>
                  )}
                </div>
              </div>
            </div>
            {(() => {
              const debt = Number((earningsData?.data as any)?.outstandingDebt ?? 0)
              if (debt <= 0) return null
              return (
                <div className="mt-3 p-2 rounded bg-amber-50 border border-amber-200 text-xs">
                  <div className="flex justify-between text-amber-700 font-medium">
                    <span>Outstanding Debt</span>
                    <span>{formatCurrency(debt)}</span>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Ride Requests */}
        <div className="lg:col-span-2 space-y-4">
          {isOnline && pendingRides.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Ride Requests ({pendingRides.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingRides.map((ride: any) => (
                  <div key={ride.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">#{ride.bookingId}</span>
                        <Badge variant={ride.paymentMethod === 'cash' ? 'outline' : 'secondary'} className="text-[10px]">
                          {ride.paymentMethod === 'wallet' ? 'Wallet' : ride.paymentMethod === 'cash' ? 'Cash' : ride.paymentMethod ?? 'N/A'}
                        </Badge>
                        {ride.vehicleType && (
                          <Badge variant="outline" className="text-[10px]">{ride.vehicleType.name}</Badge>
                        )}
                      </div>
                      <p className="text-lg font-bold">{formatCurrency(ride.estimatedFare)}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-emerald-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Pickup</p>
                        <p className="text-sm font-medium">{ride.pickup?.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-red-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Destination</p>
                        <p className="text-sm font-medium">{ride.destination?.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {ride.estimatedDistance && <span>{formatDistance(ride.estimatedDistance)}</span>}
                        {ride.estimatedDuration && <span>{formatDuration(ride.estimatedDuration)}</span>}
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {ride.rider?.rating?.toFixed(1) ?? 'New'}
                        </div>
                      </div>
                      {ride.surge_multiplier != null && ride.surge_multiplier > 1 && (
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">
                          🔥 {ride.surge_multiplier}x Surge
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="default" size="sm" className="flex-1"
                        onClick={() => acceptRide.mutate(ride.id)}
                        disabled={acceptRide.isPending}>
                        Accept
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1"
                        onClick={() => rejectRide.mutate(ride.id)}
                        disabled={rejectRide.isPending}>
                        <X className="h-4 w-4 mr-1" />Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Map */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Live Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Map
                height={350}
                center={
                  driverProfile?.latitude != null
                    ? { lat: driverProfile.latitude, lng: driverProfile.longitude ?? 0 }
                    : undefined
                }
                markers={
                  driverProfile?.latitude != null
                    ? [{ lat: driverProfile.latitude, lng: driverProfile.longitude ?? 0, color: 'blue' }]
                    : []
                }
              />
            </CardContent>
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  title="Today"
                  value={formatCurrency(stats?.todayEarnings ?? 0)}
                  icon={DollarSign}
                  variant="green"
                />
                <StatCard
                  title="This Week"
                  value={formatCurrency(stats?.weeklyEarnings ?? 0)}
                  icon={TrendingUp}
                  variant="blue"
                />
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Acceptance Rate</span>
                  <span className="font-semibold">{stats?.acceptanceRate ?? 0}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completion Rate</span>
                  <span className="font-semibold">{stats?.completionRate ?? 0}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Average Rating</span>
                  <span className="font-semibold flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {stats?.averageRating?.toFixed(1) ?? 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mini Ride History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Rides</CardTitle>
            </CardHeader>
            <CardContent>
              {rideHistory.length === 0 ? (
                <EmptyState title="No rides yet" />
              ) : (
                <div className="space-y-3">
                  {rideHistory.slice(0, 5).map((ride: RideBrief) => (
                    <div
                      key={ride.id}
                      className="rounded-lg border p-3 space-y-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => { setSelectedRide(ride); setDetailOpen(true) }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-mono">#{ride.bookingId}</span>
                          <StatusBadge status={ride.status} type="ride" />
                        </div>
                        <span className="font-semibold">{formatCurrency(ride.actualFare ?? ride.estimatedFare)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                        <div className="truncate">
                          <span className="text-emerald-500">↑</span> {ride.pickup?.address}
                        </div>
                        <div className="truncate">
                          <span className="text-red-500">↓</span> {ride.destination?.address}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatDate(ride.createdAt)}</span>
                        <div className="flex items-center gap-1">
                          {ride.paymentMethod && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              {ride.paymentMethod === 'wallet' ? 'Wallet' : ride.paymentMethod === 'cash' ? 'Cash' : ride.paymentMethod}
                            </Badge>
                          )}
                          {(ride as any).driverAmount != null && Number((ride as any).driverAmount) > 0 && (
                            <span className="text-emerald-600 font-medium">+{formatCurrency((ride as any).driverAmount)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="link" className="w-full mt-2" onClick={() => navigate('/driver/rides/history')}>
                    View All Rides
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ride Details</DialogTitle>
            <DialogDescription>Booking ID: {selectedRide?.bookingId}</DialogDescription>
          </DialogHeader>
          {selectedRide && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={selectedRide.status} type="ride" />
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Pickup</p>
                <p className="font-medium">{selectedRide.pickup?.address}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Destination</p>
                <p className="font-medium">{selectedRide.destination?.address}</p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Fare</p>
                  <p className="font-bold text-lg">{formatCurrency(selectedRide.actualFare ?? selectedRide.estimatedFare)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment</p>
                  <p className="font-medium capitalize">{selectedRide.paymentMethod ?? 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Driver Earning</p>
                  <p className="font-medium text-emerald-600">{formatCurrency((selectedRide as any).driverAmount ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="font-medium">{selectedRide.completedAt ? formatDate(selectedRide.completedAt) : 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
