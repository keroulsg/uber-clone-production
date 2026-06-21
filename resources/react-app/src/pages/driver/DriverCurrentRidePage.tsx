import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  Navigation, MapPin, Phone, Star, User, Car,
  ChevronLeft, CheckCircle, Play, ArrowRight,
  DollarSign, Clock, Route, Wallet,
} from 'lucide-react'
import { useDriverCurrentRide, useArrivedRide, useStartRide, useCompleteRide, useRideSummary } from '@/hooks/useDriverRides'
import { useUpdateLocation } from '@/hooks/useDrivers'
import { useRideStore } from '@/stores/rideStore'
import { formatCurrency, formatDistance, formatDuration } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/common/StatusBadge'
import { RatingStars } from '@/components/common/RatingStars'
import { RouteMap } from '@/components/common/RouteMap'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useRateRider } from '@/hooks/useRatings'
import { useRecentCompletedPendingRating, useDismissCompleted } from '@/hooks/useRides'

const steps = [
  { key: 'navigate_to_pickup', label: 'Navigate to Pickup', icon: Navigation },
  { key: 'arrived', label: 'Pickup Rider', icon: User },
  { key: 'navigate_to_destination', label: 'Navigate to Destination', icon: Route },
  { key: 'review_summary', label: 'Review', icon: DollarSign },
  { key: 'complete', label: 'Complete', icon: CheckCircle },
] as const

type StepKey = (typeof steps)[number]['key']

export default function DriverCurrentRidePage() {
  const navigate = useNavigate()
  const { currentRide } = useRideStore()
  const { isLoading, error, refetch } = useDriverCurrentRide()
  const { data: pendingRatingRide, refetch: refetchPendingRating } = useRecentCompletedPendingRating()
  const dismissCompleted = useDismissCompleted()
  const queryClient = useQueryClient()
  const arrivedRide = useArrivedRide()
  const startRide = useStartRide()
  const completeRide = useCompleteRide()
  const rideSummary = useRideSummary()
  const updateLocation = useUpdateLocation()

  const [driverPosition, setDriverPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [walletError, setWalletError] = useState<{ currentBalance: number; requiredAmount: number } | null>(null)
  const [cashError, setCashError] = useState<string | null>(null)
  const [cashReceived, setCashReceived] = useState<number | null>(null)
  const [creditChange, setCreditChange] = useState(false)
  const driverPositionRef = useRef<{ lat: number; lng: number } | null>(null)
  const locationWatchRef = useRef<number | null>(null)
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isCompletingRef = useRef(false)
  const [rateDialogOpen, setRateDialogOpen] = useState(false)
  const [ratingValue, setRatingValue] = useState(0)
  const [ratingComment, setRatingComment] = useState('')
  const [ratingError, setRatingError] = useState('')
  const rateRider = useRateRider()

  useEffect(() => {
    driverPositionRef.current = driverPosition
  }, [driverPosition])

  useEffect(() => {
    if (!navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setDriverPosition({ lat, lng })
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    )
    locationWatchRef.current = watchId

    locationIntervalRef.current = setInterval(() => {
      const pos = driverPositionRef.current
      if (pos && currentRide) {
        updateLocation.mutate({
          lat: pos.lat,
          lng: pos.lng,
          bearing: undefined,
        })
      }
    }, 5000)

    return () => {
      if (locationWatchRef.current != null) {
        navigator.geolocation.clearWatch(locationWatchRef.current)
      }
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current)
      }
    }
  }, [])

  const [currentStep, setCurrentStep] = useState<StepKey>(() => {
    if (!currentRide) return 'navigate_to_pickup'
    switch (currentRide.status) {
      case 'driver_assigned': return 'navigate_to_pickup'
      case 'driver_arrived': return 'arrived'
      case 'ride_started': return 'navigate_to_destination'
      case 'ride_completed': return 'complete'
      default: return 'navigate_to_pickup'
    }
  })

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep)

  const handleArrived = () => {
    if (currentRide) {
      arrivedRide.mutate(currentRide.id, {
        onSuccess: () => setCurrentStep('arrived'),
      })
    }
  }

  const handleStartRide = () => {
    if (currentRide) {
      startRide.mutate(currentRide.id, {
        onSuccess: () => setCurrentStep('navigate_to_destination'),
      })
    }
  }

  const handlePreviewSummary = () => {
    if (currentRide) {
      rideSummary.mutate(
        { rideId: currentRide.id },
        {
          onSuccess: () => {
            setCurrentStep('review_summary')
            setWalletError(null)
            setCashError(null)
            setCashReceived(null)
            setCreditChange(false)
          },
        }
      )
    }
  }

  const handleCompleteRide = () => {
    if (isCompletingRef.current) return
    if (!currentRide || !rideSummary.data) return
    isCompletingRef.current = true
    setWalletError(null)
    setCashError(null)

    const data: Record<string, unknown> = {}
    if (rideSummary.data.payment_method === 'cash' && cashReceived != null) {
      data.cash_received = cashReceived
      data.credit_change = creditChange
    }

    completeRide.mutate(
      { rideId: currentRide.id, data },
      {
          onSuccess: (result) => {
            isCompletingRef.current = false
            if (result.kind === 'completed') {
              setCurrentStep('complete')
            } else if (result.kind === 'insufficient_wallet') {
            setWalletError({
              currentBalance: result.currentBalance,
              requiredAmount: result.requiredAmount,
            })
          } else if (result.kind === 'cash_underpaid') {
            setCashError(
              `Cash received (${formatCurrency(result.cashReceived)}) is less than total fare (${formatCurrency(result.totalFare)}). Please collect the full fare.`
            )
          }
        },
        onError: () => {
          isCompletingRef.current = false
        },
      }
    )
  }

  const handleRateSubmit = () => {
    if (ratingValue === 0) {
      setRatingError('Please select a rating')
      return
    }
    const rideToRate = currentRide || pendingRatingRide
    if (!rideToRate) return
    rateRider.mutate(
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
        onError: (err: any) => {
          const msg = err?.response?.data?.message || 'Rating failed'
          setRatingError(msg)
        },
      }
    )
  }

  const handleDismissCompleted = () => {
    const rideToDismiss = currentRide || pendingRatingRide
    if (rideToDismiss) {
      dismissCompleted.mutate(rideToDismiss.id)
    }
    useRideStore.getState().clearCurrentRide()
  }

  if (isLoading) return <LoadingScreen />
  if (error) return <ErrorState onRetry={() => refetch()} />
  if (!currentRide) {
    // Show completed ride needing rating if available
    if (pendingRatingRide) {
      const cr = pendingRatingRide
      return (
        <div className="space-y-6 pb-32">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold">Ride Completed</h1>
              <p className="text-sm text-muted-foreground">Booking #{cr.bookingId}</p>
            </div>
            <StatusBadge status={cr.status} type="ride" />
          </div>
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-4 space-y-3">
              <div className="text-center">
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                <h2 className="text-xl font-bold text-green-700">Ride Completed Successfully</h2>
                <p className="text-sm text-muted-foreground">Rider: {cr.rider?.name ?? 'N/A'}</p>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Fare</span>
                <span className="text-xl font-bold">{formatCurrency(cr.actualFare ?? cr.estimatedFare)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium capitalize">{cr.paymentMethod ?? 'N/A'}</span>
              </div>
              <div className="flex gap-2 pt-2">
                {!cr.riderRated && (
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => setRateDialogOpen(true)}>
                    <Star className="h-4 w-4" />
                    Rate Rider
                  </Button>
                )}
                <Button variant="outline" className="flex-1" onClick={handleDismissCompleted}>
                  Done
                </Button>
                <Button className="flex-1" onClick={() => navigate('/driver')}>
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>

          <Dialog open={rateDialogOpen} onOpenChange={setRateDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-center">Rate {cr?.rider?.name ?? 'Rider'}</DialogTitle>
                <DialogDescription className="text-center">
                  How was your experience with this rider?
                </DialogDescription>
              </DialogHeader>
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
                <Button className="w-full" onClick={handleRateSubmit} disabled={ratingValue === 0 || rateRider.isPending}>
                  {rateRider.isPending ? 'Submitting...' : 'Submit Rating'}
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
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">No Active Ride</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Car className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">No Active Ride</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              You don't have an active ride right now. Wait for ride requests or go back to dashboard.
            </p>
            <Button onClick={() => navigate('/driver')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const summary = rideSummary.data?.fare_breakdown
  const isCash = rideSummary.data?.payment_method === 'cash'
  const totalFare = summary?.total_fare ?? 0
  const changeDue = cashReceived != null ? Math.max(0, cashReceived - totalFare) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Current Ride</h1>
          <p className="text-sm text-muted-foreground">
            Booking #{currentRide.bookingId}
          </p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={currentRide.status} type="ride" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const StepIcon = step.icon
          const isActive = index <= currentStepIndex
          const isCurrent = index === currentStepIndex
          return (
            <div key={step.key} className="flex items-center gap-2 flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                >
                  {isActive && index < currentStepIndex ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>
                <span className={`text-xs mt-1 text-center ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${index < currentStepIndex ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          )
        })}
      </div>

      {currentStep !== 'review_summary' && currentStep !== 'complete' && (
        <RouteMap
          pickupLat={currentRide.pickup?.lat}
          pickupLng={currentRide.pickup?.lng}
          destLat={currentRide.destination?.lat}
          destLng={currentRide.destination?.lng}
          driverLat={driverPosition?.lat}
          driverLng={driverPosition?.lng}
          height={400}
        />
      )}

      {currentStep !== 'review_summary' && currentStep !== 'complete' && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {currentRide.rider?.name?.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{currentRide.rider?.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {currentRide.rider?.rating?.toFixed(1) ?? 'N/A'}
                  </div>
                </div>
              </div>
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" asChild>
                <a href={`tel:${currentRide.rider?.phone}`}>
                  <Phone className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep !== 'review_summary' && currentStep !== 'complete' && (
        <Card>
          <CardContent className="p-5 space-y-4">
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
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Route className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="font-medium">
                    {currentRide.estimatedDistance
                      ? formatDistance(currentRide.estimatedDistance)
                      : '--'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {currentRide.estimatedDuration
                      ? formatDuration(currentRide.estimatedDuration)
                      : '--'}
                  </p>
                </div>
              </div>
            </div>

            <Card className="bg-muted">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Base Fare</span>
                  <span>{formatCurrency(currentRide.fareBreakdown?.base ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Distance</span>
                  <span>{formatCurrency(currentRide.fareBreakdown?.distance ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Time</span>
                  <span>{formatCurrency(currentRide.fareBreakdown?.time ?? 0)}</span>
                </div>
                {(currentRide.fareBreakdown?.surge ?? 0) > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Surge {(currentRide as any).fareBreakdown?.surge_multiplier != null && `(×${(currentRide as any).fareBreakdown.surge_multiplier})`}
                    </span>
                    <span className="text-amber-600 font-semibold">{formatCurrency(currentRide.fareBreakdown?.surge ?? 0)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between font-bold">
                  <span>Total</span>
                  <span className="text-lg">{formatCurrency(currentRide.estimatedFare)}</span>
                </div>
              </CardContent>
            </Card>

            {currentRide.paymentMethod === 'wallet' && currentStep === 'navigate_to_destination' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                Payment method is <strong>Wallet</strong>. Ensure the rider has sufficient balance before completing.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Review Summary — READONLY financials + Cash handling */}
      {currentStep === 'review_summary' && summary && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Distance</p>
                <p className="font-semibold">{formatDistance(rideSummary.data?.actual_distance ?? 0)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-semibold">{formatDuration(rideSummary.data?.actual_duration ?? 0)}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Base Fare</span>
                <span>{formatCurrency(summary.base_fare)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Distance Fare</span>
                <span>{formatCurrency(summary.distance_fare)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Time Fare</span>
                <span>{formatCurrency(summary.time_fare)}</span>
              </div>
              {summary.surge_amount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Surge {summary.surge_multiplier != null && `(×${summary.surge_multiplier})`}
                  </span>
                  <span className="text-amber-600 font-semibold">{formatCurrency(summary.surge_amount)}</span>
                </div>
              )}
              {summary.peak_surcharge > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Peak Surcharge</span>
                  <span>{formatCurrency(summary.peak_surcharge)}</span>
                </div>
              )}
              {summary.night_surcharge > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Night Surcharge</span>
                  <span>{formatCurrency(summary.night_surcharge)}</span>
                </div>
              )}
              {summary.waiting_fee > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Waiting Fee</span>
                  <span>{formatCurrency(summary.waiting_fee)}</span>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between font-bold text-base">
                <span>Total Fare</span>
                <span>{formatCurrency(summary.total_fare)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-emerald-600">
                <span>Your Earnings</span>
                <span className="font-semibold">{formatCurrency(summary.driver_amount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-destructive">
                <span>Company Commission</span>
                <span>{formatCurrency(summary.company_commission)}</span>
              </div>
            </div>

            {rideSummary.data && rideSummary.data.driver_outstanding_debt > 0 && (
              <div className="bg-destructive/10 p-3 rounded-lg text-sm text-destructive">
                Outstanding debt: {formatCurrency(rideSummary.data.driver_outstanding_debt)}
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Payment method: {isCash ? 'Cash (paid to you)' : 'Wallet'}
            </div>

            {/* Cash collection UI */}
            {isCash && (
              <div className="space-y-3 rounded-lg border p-4">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Cash Collection
                </p>
                <div className="space-y-2">
                  <Label htmlFor="cash-received">Cash Received from Rider</Label>
                  <Input
                    id="cash-received"
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="Enter cash amount received"
                    value={cashReceived ?? ''}
                    onChange={(e) => setCashReceived(e.target.value ? Number(e.target.value) : null)}
                  />
                </div>
                {cashReceived != null && cashReceived > 0 && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total fare</span>
                      <span>{formatCurrency(totalFare)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cash received</span>
                      <span>{formatCurrency(cashReceived)}</span>
                    </div>
                    {changeDue > 0 && (
                      <>
                        <div className="flex justify-between text-amber-600 font-medium">
                          <span>Change due</span>
                          <span>{formatCurrency(changeDue)}</span>
                        </div>
                        <div className="flex items-start gap-2 pt-1">
                          <input
                            type="checkbox"
                            id="credit-change"
                            checked={creditChange}
                            onChange={(e) => setCreditChange(e.target.checked)}
                            className="mt-0.5"
                          />
                          <label htmlFor="credit-change" className="text-xs text-muted-foreground">
                            I cannot return {formatCurrency(changeDue)} change. Credit this amount to rider wallet.
                            (This creates a {formatCurrency(changeDue)} debt/liability on your account.)
                          </label>
                        </div>
                      </>
                    )}
                    {changeDue === 0 && (
                      <div className="text-xs text-emerald-600">
                        Exact payment — no change needed.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {walletError && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold text-amber-800">Insufficient Wallet Balance</p>
                <div className="text-xs text-amber-700 space-y-1">
                  <p>Wallet balance: <strong>{formatCurrency(walletError.currentBalance)}</strong></p>
                  <p>Total fare: <strong>{formatCurrency(walletError.requiredAmount)}</strong></p>
                  <p>Shortfall: <strong>{formatCurrency(walletError.requiredAmount - walletError.currentBalance)}</strong></p>
                </div>
                <p className="text-xs text-amber-700">
                  The rider must top up their wallet. Ride remains active — retry after top-up.
                </p>
              </div>
            )}

            {cashError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
                {cashError}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="sticky bottom-0 bg-background pb-4 pt-2 border-t">
        {currentStep === 'navigate_to_pickup' && (
          <Button size="lg" className="w-full gap-2" onClick={handleArrived} disabled={arrivedRide.isPending}>
            <Navigation className="h-5 w-5" />
            {arrivedRide.isPending ? 'Arriving...' : 'I Have Arrived at Pickup'}
          </Button>
        )}
        {currentStep === 'arrived' && (
          <Button size="lg" className="w-full gap-2" onClick={handleStartRide} disabled={startRide.isPending}>
            <Play className="h-5 w-5" />
            {startRide.isPending ? 'Starting...' : 'Start Ride'}
          </Button>
        )}
        {currentStep === 'navigate_to_destination' && (
          <Button size="lg" className="w-full gap-2" onClick={handlePreviewSummary} disabled={rideSummary.isPending}>
            <ArrowRight className="h-5 w-5" />
            {rideSummary.isPending ? 'Calculating...' : 'Complete Ride'}
          </Button>
        )}
        {currentStep === 'review_summary' && (
          <div className="flex gap-3">
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              onClick={() => setCurrentStep('navigate_to_destination')}
            >
              Back
            </Button>
            <Button
              size="lg"
              className="flex-1 gap-2"
              onClick={handleCompleteRide}
              disabled={completeRide.isPending || isCompletingRef.current}
            >
              <CheckCircle className="h-5 w-5" />
              {completeRide.isPending ? 'Completing...' : 'Confirm & Complete'}
            </Button>
          </div>
        )}
        {currentStep === 'complete' && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 py-3 text-emerald-600 font-semibold">
              <CheckCircle className="h-6 w-6" />
              Ride Completed Successfully
            </div>
            {currentRide && !currentRide.riderRated && (
              <Button variant="outline" className="w-full gap-2" onClick={() => setRateDialogOpen(true)}>
                <Star className="h-4 w-4" />
                Rate Rider
              </Button>
            )}
            <Button className="w-full" variant="default" onClick={() => navigate('/driver')}>
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>

      <Dialog open={rateDialogOpen} onOpenChange={setRateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">Rate {currentRide?.rider?.name ?? 'Rider'}</DialogTitle>
            <DialogDescription className="text-center">
              How was your experience with this rider?
            </DialogDescription>
          </DialogHeader>
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
            <Button className="w-full" onClick={handleRateSubmit} disabled={ratingValue === 0 || rateRider.isPending}>
              {rateRider.isPending ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
