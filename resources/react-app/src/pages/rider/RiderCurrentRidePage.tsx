import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  Navigation, MapPin, Phone, Star, Car,
  XCircle, AlertTriangle, ChevronLeft,
  Clock, CheckCircle, User, Route, Bike,
} from 'lucide-react'
import { useCurrentRide, useCancelRide, useAcceptAnyDriver, useRecentCompletedPendingRating, useDismissCompleted } from '@/hooks/useRides'
import { useRideStore } from '@/stores/rideStore'
import { useDriverTracking } from '@/hooks/useDriverTracking'
import { formatCurrency, formatDuration, formatDistance } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/common/StatusBadge'
import { RouteMap } from '@/components/common/RouteMap'
import { RatingStars } from '@/components/common/RatingStars'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { useRideBroadcast } from '@/hooks/useRideBroadcast'
import { useRateDriver } from '@/hooks/useRatings'
import { useCancellationReasons } from '@/hooks/useCancellationReasons'
import { useCreateSavedPlace } from '@/hooks/useSavedPlaces'
import { toast } from 'sonner'
import { MapService } from '@/maps/MapService'
import type { CancellationReason, Ride } from '@/types'

const statusSteps = [
  { status: 'pending', label: 'Requested', icon: Clock },
  { status: 'searching_driver', label: 'Searching', icon: Navigation },
  { status: 'driver_assigned', label: 'Driver Assigned', icon: User },
  { status: 'driver_arrived', label: 'Driver Arrived', icon: MapPin },
  { status: 'ride_started', label: 'On Trip', icon: Route },
  { status: 'ride_completed', label: 'Completed', icon: CheckCircle },
] as const

const stepOrder = statusSteps.map((s) => s.status)
const FEMALE_SEARCH_TIMEOUT_MINUTES = 15

export default function RiderCurrentRidePage() {
  const navigate = useNavigate()
  const { currentRide } = useRideStore()
  const { isLoading, error, refetch } = useCurrentRide()
  const { data: pendingRatingRide, refetch: refetchPendingRating } = useRecentCompletedPendingRating()
  const dismissCompleted = useDismissCompleted()
  const queryClient = useQueryClient()
  const storedRide = currentRide
  const completedRideForRating = (!storedRide || storedRide.status === 'ride_completed' || storedRide.status === 'completed') 
    ? (pendingRatingRide as Ride | null) 
    : null
  const displayRide = storedRide && storedRide.status !== 'ride_completed' && storedRide.status !== 'completed' 
    ? storedRide 
    : null
  const cancelRide = useCancelRide()
  const acceptAnyDriver = useAcceptAnyDriver()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelReasonId, setCancelReasonId] = useState<number | undefined>(undefined)
  const [cancelComment, setCancelComment] = useState('')
  const { data: reasonsData } = useCancellationReasons('rider')
  const cancellationReasons = (reasonsData?.data ?? []) as CancellationReason[]
  const [fallbackOpen, setFallbackOpen] = useState(false)
  const [searchStartTime] = useState(() => Date.now())
  const [arrivedWaitingSeconds, setArrivedWaitingSeconds] = useState(0)
  const waitingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [driverPickupDistance, setDriverPickupDistance] = useState<number | null>(null)
  const [driverPickupEta, setDriverPickupEta] = useState<number | null>(null)
  const [driverDestDistance, setDriverDestDistance] = useState<number | null>(null)
  const [driverDestEta, setDriverDestEta] = useState<number | null>(null)
  const [routeError, setRouteError] = useState(false)
  const [trackingTimeout, setTrackingTimeout] = useState(false)
  const [rateDialogOpen, setRateDialogOpen] = useState(false)
  const [ratingValue, setRatingValue] = useState(0)
  const [ratingComment, setRatingComment] = useState('')
  const [ratingError, setRatingError] = useState('')
  const rateDriver = useRateDriver()
  const createSavedPlace = useCreateSavedPlace()

  useRideBroadcast(currentRide?.id ?? null, {
    onAccepted: useCallback(() => refetch(), [refetch]),
    onArrived: useCallback(() => {
      refetch()
      setArrivedWaitingSeconds(0)
    }, [refetch]),
    onStarted: useCallback(() => refetch(), [refetch]),
    onCompleted: useCallback(() => refetch(), [refetch]),
    onCancelled: useCallback(() => refetch(), [refetch]),
  })

  const { position: driverPosition, error: trackingError } = useDriverTracking({
    driverId: currentRide?.driver?.id,
    pollInterval: 3000,
    animate: true,
    animationDuration: 1500,
  })

  const currentStepIndex = currentRide ? stepOrder.indexOf(currentRide.status as typeof stepOrder[number]) : 0
  const isSearching = currentRide?.status === 'searching_driver' || currentRide?.status === 'pending'
  const isDriverAssigned = currentRide?.status === 'driver_assigned'
  const isArrived = currentRide?.status === 'driver_arrived'
  const isStarted = currentRide?.status === 'ride_started'
  const isCompleted = currentRide?.status === 'ride_completed'
  const isTerminal = isCompleted || currentRide?.status === 'cancelled'
  const hasDriver = !!currentRide?.driver
  const hasDriverPos = driverPosition?.lat != null && driverPosition?.lng != null
  const rideVehicle = currentRide?.vehicle || currentRide?.driver?.vehicle

  useEffect(() => {
    if (isArrived) {
      waitingTimerRef.current = setInterval(() => {
        setArrivedWaitingSeconds((s) => s + 1)
      }, 1000)
    } else {
      if (waitingTimerRef.current) clearInterval(waitingTimerRef.current)
      waitingTimerRef.current = null
      if (!isArrived) setArrivedWaitingSeconds(0)
    }
    return () => { if (waitingTimerRef.current) clearInterval(waitingTimerRef.current) }
  }, [isArrived])

  useEffect(() => {
    if (isDriverAssigned && hasDriverPos && currentRide) {
      setRouteError(false)
      const from = { lat: driverPosition.lat!, lng: driverPosition.lng! }
      const to = { lat: currentRide.pickup.lat, lng: currentRide.pickup.lng }
      const dist = MapService.haversineDistance(from, to)
      setDriverPickupDistance(dist)
      setDriverPickupEta(Math.ceil(dist / 0.5))
      MapService.getRoute(from, to).then((result) => {
        const path = result.points
        if (path.length < 2) return
        setDriverPickupDistance(Math.round(result.distance * 10) / 10)
        setDriverPickupEta(result.duration)
      }).catch(() => setRouteError(true))
    }
  }, [isDriverAssigned, hasDriverPos, driverPosition?.lat, driverPosition?.lng, currentRide?.pickup.lat, currentRide?.pickup.lng])

  useEffect(() => {
    if (isStarted && hasDriverPos && currentRide) {
      setRouteError(false)
      const from = { lat: driverPosition.lat!, lng: driverPosition.lng! }
      const to = { lat: currentRide.destination.lat, lng: currentRide.destination.lng }
      const dist = MapService.haversineDistance(from, to)
      setDriverDestDistance(dist)
      setDriverDestEta(Math.ceil(dist / 0.5))
      MapService.getRoute(from, to).then((result) => {
        const path = result.points
        if (path.length < 2) return
        setDriverDestDistance(Math.round(result.distance * 10) / 10)
        setDriverDestEta(result.duration)
      }).catch(() => setRouteError(true))
    }
  }, [isStarted, hasDriverPos, driverPosition?.lat, driverPosition?.lng, currentRide?.destination.lat, currentRide?.destination.lng])

  // "Calculating..." timeout: show fallback if no position after 15s
  useEffect(() => {
    setTrackingTimeout(false)
    if (!hasDriver || isTerminal) return
    const t = setTimeout(() => {
      if (!hasDriverPos) setTrackingTimeout(true)
    }, 15000)
    return () => clearTimeout(t)
  }, [hasDriver, isTerminal, hasDriverPos])

  useEffect(() => {
    if (currentRide && currentRide.femaleDriverPreferred && !currentRide.femaleDriverUnavailable && !currentRide.fallbackToAnyDriverAccepted && currentRide.status === 'searching_driver') {
      const elapsed = (Date.now() - searchStartTime) / 1000 / 60
      if (elapsed >= FEMALE_SEARCH_TIMEOUT_MINUTES) setFallbackOpen(true)
    }
  }, [currentRide, searchStartTime])

  const handleCancel = () => {
    if (currentRide && cancelReason) {
      cancelRide.mutate({
        id: currentRide.id,
        reason: cancelReason,
        reasonId: cancelReasonId,
        comment: cancelComment || undefined,
      })
      setCancelOpen(false)
      setCancelReason('')
      setCancelReasonId(undefined)
      setCancelComment('')
    }
  }

  const handleFallbackContinue = () => {
    if (currentRide) {
      acceptAnyDriver.mutate(currentRide.id, { onSuccess: () => { setFallbackOpen(false); refetch() } })
    }
  }

  const handleFallbackCancel = () => {
    if (currentRide) {
      cancelRide.mutate({ id: currentRide.id, reason: 'female_driver_unavailable' }, { onSuccess: () => { setFallbackOpen(false); refetch() } })
    }
  }

  const handleRateSubmit = () => {
    if (ratingValue === 0) {
      setRatingError('Please select a rating')
      return
    }
    if (!currentRide && !completedRideForRating) return
    const rideToRate = currentRide || completedRideForRating
    if (!rideToRate) return
    rateDriver.mutate(
      { ride_id: rideToRate.id, rating: ratingValue, comment: ratingComment },
      {
        onSuccess: () => {
          setRateDialogOpen(false)
          setRatingValue(0)
          setRatingComment('')
          setRatingError('')
          refetch()
          refetchPendingRating()
          queryClient.invalidateQueries({ queryKey: ['rides', 'recent-completed-pending-rating'] })
          useRideStore.getState().clearCurrentRide()
        },
      }
    )
  }

  const handleDismissCompleted = () => {
    const rideToDismiss = currentRide || completedRideForRating
    if (rideToDismiss) {
      dismissCompleted.mutate(rideToDismiss.id)
    }
    useRideStore.getState().clearCurrentRide()
  }

  const handleSavePickup = async () => {
    if (!currentRide) return
    try {
      await createSavedPlace.mutateAsync({
        label: 'custom',
        name: currentRide.pickup?.address?.split(',')[0]?.slice(0, 50) || 'Pickup',
        address: currentRide.pickup?.address || '',
        latitude: currentRide.pickup?.lat,
        longitude: currentRide.pickup?.lng,
      })
      toast.success('Pickup location saved')
    } catch {
      toast.error('Failed to save place')
    }
  }

  const handleSaveDestination = async () => {
    if (!currentRide) return
    try {
      await createSavedPlace.mutateAsync({
        label: 'custom',
        name: currentRide.destination?.address?.split(',')[0]?.slice(0, 50) || 'Destination',
        address: currentRide.destination?.address || '',
        latitude: currentRide.destination?.lat,
        longitude: currentRide.destination?.lng,
      })
      toast.success('Destination saved')
    } catch {
      toast.error('Failed to save place')
    }
  }

  const routeType = isDriverAssigned ? 'driver-pickup' : isStarted ? 'driver-dest' : 'pickup-dest'

  if (isLoading) return <LoadingScreen />
  if (error) return <ErrorState onRetry={() => refetch()} />

  if (!currentRide) {
    // Show completed ride needing rating if available
    if (completedRideForRating) {
      const cr = completedRideForRating
      return (
        <div className="space-y-4 pb-32">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/rider/dashboard')}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold">Ride Complete</h1>
              <p className="text-sm text-muted-foreground">Booking #{cr.bookingId}</p>
            </div>
            <StatusBadge status={cr.status} type="ride" />
          </div>
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-4 space-y-3">
              <div className="text-center">
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                <h2 className="text-xl font-bold text-green-700">Ride Completed</h2>
                <p className="text-sm text-muted-foreground">Thank you for riding with us!</p>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Fare</span>
                <span className="text-xl font-bold">{formatCurrency(cr.actualFare ?? cr.estimatedFare)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium capitalize">{cr.paymentMethod === 'wallet' ? 'Wallet' : cr.paymentMethod === 'cash' ? 'Cash' : cr.paymentMethod ?? 'N/A'}</span>
              </div>
              {cr.actualDistance != null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Distance</span>
                  <span className="font-medium">{formatDistance(cr.actualDistance)}</span>
                </div>
              )}
              {cr.actualDuration != null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{formatDuration(cr.actualDuration)}</span>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                {!cr.riderRated && (
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => setRateDialogOpen(true)}>
                    <Star className="h-4 w-4" />
                    Rate Driver
                  </Button>
                )}
                <Button variant="outline" className="flex-1" onClick={handleDismissCompleted}>
                  Done
                </Button>
                <Button className="flex-1" onClick={() => navigate('/rider/dashboard')}>
                  Book Again
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Pickup</p>
                  <p className="font-medium text-sm truncate">{cr.pickup?.address}</p>
                </div>
                <Button variant="ghost" size="sm" className="shrink-0 text-xs gap-1" onClick={handleSavePickup} disabled={createSavedPlace.isPending}>
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                  Save
                </Button>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Destination</p>
                  <p className="font-medium text-sm truncate">{cr.destination?.address}</p>
                </div>
                <Button variant="ghost" size="sm" className="shrink-0 text-xs gap-1" onClick={handleSaveDestination} disabled={createSavedPlace.isPending}>
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>

          <Dialog open={rateDialogOpen} onOpenChange={setRateDialogOpen}>
            <DialogContent aria-describedby="rate-driver-desc">
              <DialogHeader>
                <DialogTitle className="text-center">Rate {cr?.driver?.user?.name ?? 'Driver'}</DialogTitle>
              </DialogHeader>
              <p id="rate-driver-desc" className="text-sm text-muted-foreground text-center">
                How was your ride experience?
              </p>
              <div className="space-y-4">
                <div className="flex justify-center">
                  <RatingStars
                    rating={ratingValue}
                    size="lg"
                    interactive
                    onChange={(value) => { setRatingValue(value); setRatingError('') }}
                  />
                </div>
                <Input
                  placeholder="Leave a comment (optional)"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  maxLength={500}
                />
                {ratingError && <p className="text-sm text-destructive text-center">{ratingError}</p>}
                <Button className="w-full" onClick={handleRateSubmit} disabled={ratingValue === 0 || rateDriver.isPending}>
                  {rateDriver.isPending ? 'Submitting...' : 'Submit Rating'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/rider/dashboard')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">No Active Ride</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Car className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">No Active Ride</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">You don't have an active ride right now. Book a ride to get started.</p>
            <Button onClick={() => navigate('/rider/dashboard')}>Book a Ride</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-32">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/rider/dashboard')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">
            {isSearching && 'Finding Your Ride'}
            {isDriverAssigned && 'Driver is Coming'}
            {isArrived && 'Driver Has Arrived'}
            {isStarted && 'Ride in Progress'}
            {isCompleted && 'Ride Complete'}
            {currentRide.status === 'cancelled' && 'Ride Cancelled'}
          </h1>
          {!isCompleted && currentRide.status !== 'cancelled' && (
            <p className="text-sm text-muted-foreground">Booking #{currentRide.bookingId}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {currentRide.vehicleType && (
            <Badge variant="outline" className="gap-1">
              {currentRide.vehicleType.slug === 'motorcycle' ? <Bike className="h-3 w-3" /> : <Car className="h-3 w-3" />}
              {currentRide.vehicleType.name}
            </Badge>
          )}
          <StatusBadge status={currentRide.status} type="ride" />
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {statusSteps.map((step, index) => {
              const StepIcon = step.icon
              const isActive = index <= currentStepIndex
              const isCurrent = index === currentStepIndex
              return (
                <div key={step.status} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                      {isActive && index < currentStepIndex ? <CheckCircle className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                    </div>
                    <span className={`text-[10px] mt-1 text-center leading-tight ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>{step.label}</span>
                  </div>
                  {index < statusSteps.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${index < currentStepIndex ? 'bg-primary' : 'bg-muted'}`} />}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="relative">
        <RouteMap
          pickupLat={currentRide.pickup.lat}
          pickupLng={currentRide.pickup.lng}
          destLat={currentRide.destination.lat}
          destLng={currentRide.destination.lng}
          driverLat={driverPosition?.lat}
          driverLng={driverPosition?.lng}
          routeType={routeType}
          height={isSearching ? 280 : 240}
        />

        {isSearching && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
            <div className="text-center space-y-3 px-6 py-8">
              <div className="flex justify-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="h-3 w-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="h-3 w-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="text-lg font-semibold">Searching for nearby drivers...</p>
              <p className="text-sm text-muted-foreground">Please wait while we find the nearest available driver</p>
              <Separator className="my-3" />
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Car className="h-4 w-4" />
                  <span>{currentRide.vehicleType?.name ?? 'Car'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatCurrency(currentRide.estimatedFare)}</span>
                </div>
              </div>
              {currentRide.surge_multiplier != null && currentRide.surge_multiplier > 1 && (
                <div className="mt-2">
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                    🔥 {currentRide.surge_multiplier}x Surge
                  </Badge>
                </div>
              )}
              {currentRide.paymentMethod && (
                <p className="text-xs text-muted-foreground">
                  Paying with {currentRide.paymentMethod === 'wallet' ? 'Wallet' : currentRide.paymentMethod === 'cash' ? 'Cash' : currentRide.paymentMethod}
                </p>
              )}
            </div>
          </div>
        )}

        {isArrived && (
          <div className="absolute top-3 left-3 right-3 z-10">
            <div className="bg-primary text-primary-foreground rounded-lg px-4 py-3 text-center shadow-lg">
              <p className="text-lg font-bold">Driver Has Arrived</p>
              <p className="text-sm opacity-90">Your driver is waiting at the pickup location</p>
              {arrivedWaitingSeconds > 0 && (
                <p className="text-xs mt-1 opacity-75">Waiting {formatDuration(Math.round(arrivedWaitingSeconds / 60) * 60 || 1)}</p>
              )}
            </div>
          </div>
        )}

        {isCompleted && (
          <div className="absolute inset-0 bg-background/40 flex items-center justify-center z-10 rounded-lg">
            <div className="bg-green-500 text-white rounded-full h-16 w-16 flex items-center justify-center shadow-lg">
              <CheckCircle className="h-10 w-10" />
            </div>
          </div>
        )}
      </div>

      {hasDriver && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={currentRide.driver?.user?.avatarUrl || currentRide.driver?.profilePhotoUrl} alt={currentRide.driver?.user?.name} />
                  <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">{currentRide.driver?.user?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="font-semibold">{currentRide.driver?.user?.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {currentRide.driver?.averageRating ? currentRide.driver.averageRating.toFixed(1) : 'New driver'}
                    <span className="text-xs">({currentRide.driver?.totalRides ?? 0} rides)</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-full shrink-0" asChild>
                <a href={`tel:${currentRide.driver?.user?.phone}`}>
                  <Phone className="h-4 w-4" />
                </a>
              </Button>
            </div>
            {rideVehicle && (
              <div className="flex flex-wrap items-center gap-3 mt-2 p-3 rounded-lg bg-muted text-sm">
                {rideVehicle.vehicleType?.slug === 'motorcycle' ? <Bike className="h-4 w-4 text-muted-foreground" /> : <Car className="h-4 w-4 text-muted-foreground" />}
                <span className="font-medium">{rideVehicle.make} {rideVehicle.model}</span>
                {rideVehicle.color && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <span className="inline-block h-3 w-3 rounded-full border" style={{ backgroundColor: rideVehicle.color }} />
                    {rideVehicle.color}
                  </span>
                )}
                {rideVehicle.vehicleType?.name && (
                  <span className="text-xs text-muted-foreground">{rideVehicle.vehicleType.name}</span>
                )}
              </div>
            )}
            {rideVehicle?.licensePlate && (
              <div className="mt-2 p-3 rounded-lg bg-primary/5 border-2 border-primary/20 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">License Plate</p>
                <p className="text-xl font-bold text-primary tracking-[0.2em]">{rideVehicle.licensePlate}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ETA / Status Info */}
      {isDriverAssigned && hasDriver && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Driver is coming to you</p>
                {driverPickupEta != null ? (
                  <p className="text-2xl font-bold">{formatDuration(driverPickupEta)}</p>
                ) : trackingTimeout ? (
                  <p className="text-base font-medium text-muted-foreground">Tracking unavailable</p>
                ) : (
                  <p className="text-base font-medium">Calculating...</p>
                )}
              </div>
              {driverPickupDistance != null && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Distance</p>
                  <p className="text-lg font-semibold">{formatDistance(driverPickupDistance)}</p>
                </div>
              )}
            </div>
            {!hasDriverPos && !trackingError && (
              <p className="text-xs text-muted-foreground mt-2">Waiting for driver location...</p>
            )}
            {(trackingError || (!hasDriverPos && !isTerminal && isDriverAssigned)) && (
              <p className="text-xs text-amber-500 mt-2">Waiting for driver location...</p>
            )}
            {routeError && (
              <p className="text-xs text-amber-500 mt-1">Route estimation unavailable, showing approximate distance</p>
            )}
          </CardContent>
        </Card>
      )}

      {isArrived && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-green-600">Driver Has Arrived</p>
                <p className="text-sm text-muted-foreground">Your driver is waiting at the pickup location</p>
              </div>
              {arrivedWaitingSeconds > 0 && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Waiting</p>
                  <p className="text-lg font-semibold">{formatDuration(Math.round(arrivedWaitingSeconds / 60) * 60 || 1)}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>Payment: {currentRide.paymentMethod === 'wallet' ? 'Wallet' : currentRide.paymentMethod === 'cash' ? 'Cash' : currentRide.paymentMethod ?? 'N/A'}</span>
              <span>Fare: {formatCurrency(currentRide.estimatedFare)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {isStarted && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En route to destination</p>
                {driverDestEta != null ? (
                  <p className="text-2xl font-bold">{formatDuration(driverDestEta)}</p>
                ) : trackingTimeout ? (
                  <p className="text-base font-medium text-muted-foreground">Tracking unavailable</p>
                ) : (
                  <p className="text-base font-medium">Calculating...</p>
                )}
              </div>
              {driverDestDistance != null && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className="text-lg font-semibold">{formatDistance(driverDestDistance)}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>Payment: {currentRide.paymentMethod === 'wallet' ? 'Wallet' : currentRide.paymentMethod === 'cash' ? 'Cash' : currentRide.paymentMethod ?? 'N/A'}</span>
              <span>Fare: {formatCurrency(currentRide.estimatedFare)}</span>
            </div>
            {rideVehicle && (
              <div className="text-xs mt-1 flex items-center gap-2">
                <span className="text-muted-foreground">{rideVehicle.make} {rideVehicle.model}</span>
                {rideVehicle.color && <span className="text-muted-foreground"> &middot; {rideVehicle.color}</span>}
                <span className="font-bold text-foreground tracking-wider bg-muted px-1.5 py-0.5 rounded">{rideVehicle.licensePlate}</span>
              </div>
            )}
            {routeError && (
              <p className="text-xs text-amber-500 mt-1">Route data unavailable, showing straight-line estimate</p>
            )}
          </CardContent>
        </Card>
      )}

      {isCompleted && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4 space-y-3">
            <div className="text-center">
              <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
              <h2 className="text-xl font-bold text-green-700">Ride Completed</h2>
              <p className="text-sm text-muted-foreground">Thank you for riding with us!</p>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Fare</span>
              <span className="text-xl font-bold">{formatCurrency(currentRide.actualFare ?? currentRide.estimatedFare)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Payment Method</span>
              <span className="font-medium capitalize">{currentRide.paymentMethod === 'wallet' ? 'Wallet' : currentRide.paymentMethod === 'cash' ? 'Cash' : currentRide.paymentMethod ?? 'N/A'}</span>
            </div>
            {currentRide.actualDistance != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Distance</span>
                <span className="font-medium">{formatDistance(currentRide.actualDistance)}</span>
              </div>
            )}
            {currentRide.actualDuration != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">{formatDuration(currentRide.actualDuration)}</span>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              {!currentRide.driverRated && (
                <Button variant="outline" className="flex-1 gap-2" onClick={() => setRateDialogOpen(true)}>
                  <Star className="h-4 w-4" />
                  Rate Driver
                </Button>
              )}
              <Button variant="outline" className="flex-1" onClick={() => navigate('/rider/rides')}>
                Ride History
              </Button>
              <Button className="flex-1" onClick={() => navigate('/rider/dashboard')}>
                Book Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Pickup</p>
              <p className="font-medium text-sm truncate">{currentRide.pickup?.address}</p>
            </div>
            <Button variant="ghost" size="sm" className="shrink-0 text-xs gap-1" onClick={handleSavePickup} disabled={createSavedPlace.isPending}>
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
              Save
            </Button>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Destination</p>
              <p className="font-medium text-sm truncate">{currentRide.destination?.address}</p>
            </div>
            <Button variant="ghost" size="sm" className="shrink-0 text-xs gap-1" onClick={handleSaveDestination} disabled={createSavedPlace.isPending}>
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-3 space-y-2 z-20">
        {!isTerminal && (
          <Button
            variant="outline" size="lg" className="w-full gap-2 text-destructive border-destructive hover:bg-destructive/10"
            onClick={() => setCancelOpen(true)}
            disabled={cancelRide.isPending}
          >
            <XCircle className="h-5 w-5" />
            Cancel Ride
          </Button>
        )}
        <Button
          variant="destructive" size="lg" className="w-full gap-2"
          onClick={() => window.alert('In an emergency, please contact local emergency services.')}
        >
          <AlertTriangle className="h-5 w-5" />
          SOS Emergency
        </Button>
      </div>

      <Dialog open={cancelOpen} onOpenChange={(open) => { setCancelOpen(open); if (!open) { setCancelReason(''); setCancelReasonId(undefined); setCancelComment('') } }}>
        <DialogContent aria-describedby="cancel-ride-desc">
          <DialogHeader>
            <DialogTitle>Cancel Ride</DialogTitle>
          </DialogHeader>
          <p id="cancel-ride-desc" className="text-sm text-muted-foreground">
            Please select a reason for cancelling. A cancellation fee may apply if the driver is nearby.
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason for cancellation <span className="text-destructive">*</span></Label>
                <Select value={cancelReason} onValueChange={(value) => {
                  setCancelReason(value)
                  const selected = cancellationReasons.find((r) => r.reason === value)
                  setCancelReasonId(selected ? parseInt(selected.id) : undefined)
                }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  {cancellationReasons.map((r) => (
                    <SelectItem key={r.id} value={r.reason}>{r.reason}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Additional comment (optional)</Label>
              <Textarea
                placeholder="Add more details..."
                value={cancelComment}
                onChange={(e) => setCancelComment(e.target.value)}
                maxLength={300}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setCancelOpen(false); setCancelReason(''); setCancelReasonId(undefined); setCancelComment('') }}>
                Keep Ride
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={!cancelReason || cancelRide.isPending}
              >
                {cancelRide.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={fallbackOpen} onOpenChange={setFallbackOpen}>
        <AlertDialogContent aria-describedby="fallback-desc">
          <AlertDialogHeader>
            <AlertDialogTitle>No Female Driver Available</AlertDialogTitle>
            <AlertDialogDescription id="fallback-desc">No female driver is available right now. Would you like to continue with any available driver?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={handleFallbackCancel} className="mt-0">Cancel Without Fee</AlertDialogCancel>
            <AlertDialogAction onClick={handleFallbackContinue}>Continue with Any Driver</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={rateDialogOpen} onOpenChange={setRateDialogOpen}>
        <DialogContent aria-describedby="rate-driver-desc-active">
          <DialogHeader>
            <DialogTitle className="text-center">Rate {currentRide?.driver?.user?.name ?? 'Driver'}</DialogTitle>
          </DialogHeader>
          <p id="rate-driver-desc-active" className="text-sm text-muted-foreground text-center">
            How was your ride experience?
          </p>
          <div className="space-y-4">
            <div className="flex justify-center">
              <RatingStars
                rating={ratingValue}
                size="lg"
                interactive
                onChange={(value) => { setRatingValue(value); setRatingError('') }}
              />
            </div>
            <Input
              placeholder="Leave a comment (optional)"
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              maxLength={500}
            />
            {ratingError && <p className="text-sm text-destructive text-center">{ratingError}</p>}
            <Button className="w-full" onClick={handleRateSubmit} disabled={ratingValue === 0 || rateDriver.isPending}>
              {rateDriver.isPending ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
