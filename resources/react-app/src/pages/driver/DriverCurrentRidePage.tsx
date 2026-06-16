import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Navigation, MapPin, Phone, Star, User, Car,
  ChevronLeft, CheckCircle, Play, ArrowRight,
  DollarSign, Clock, Route,
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
import { RouteMap } from '@/components/common/RouteMap'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

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
  const arrivedRide = useArrivedRide()
  const startRide = useStartRide()
  const completeRide = useCompleteRide()
  const rideSummary = useRideSummary()
  const updateLocation = useUpdateLocation()

  const [driverPosition, setDriverPosition] = useState<{ lat: number; lng: number } | null>(null)
  const driverPositionRef = useRef<{ lat: number; lng: number } | null>(null)
  const locationWatchRef = useRef<number | null>(null)
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Keep ref in sync with state
  useEffect(() => {
    driverPositionRef.current = driverPosition
  }, [driverPosition])

  // Start geolocation watch for navigation and location updates
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

    // Send location updates every 5 seconds
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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  const [actualDistance, setActualDistance] = useState(() => currentRide?.estimatedDistance ?? 0)
  const [actualDuration, setActualDuration] = useState(() => currentRide?.estimatedDuration ?? 0)

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
        { rideId: currentRide.id, actualDistance, actualDuration },
        {
          onSuccess: () => setCurrentStep('review_summary'),
        }
      )
    }
  }

  const handleCompleteRide = () => {
    if (currentRide && rideSummary.data) {
      completeRide.mutate(
        {
          rideId: currentRide.id,
          data: { actual_distance: actualDistance, actual_duration: actualDuration },
        },
        {
          onSuccess: () => {
            setCurrentStep('complete')
            setTimeout(() => navigate('/driver/dashboard'), 2000)
          },
        }
      )
    }
  }

  if (isLoading) return <LoadingScreen />
  if (error) return <ErrorState onRetry={() => refetch()} />
  if (!currentRide) {
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
            <Button onClick={() => navigate('/driver/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const summary = rideSummary.data?.fare_breakdown

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Step Indicator */}
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

      {/* Map (hide on summary/review step) */}
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

      {/* Rider Info */}
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

      {/* Trip Info */}
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
          </CardContent>
        </Card>
      )}

      {/* Review Summary */}
      {currentStep === 'review_summary' && summary && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="actual-distance">Actual Distance (km)</Label>
                <Input
                  id="actual-distance"
                  type="number"
                  step="0.1"
                  value={actualDistance}
                  onChange={(e) => setActualDistance(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actual-duration">Actual Duration (min)</Label>
                <Input
                  id="actual-duration"
                  type="number"
                  step="1"
                  value={actualDuration}
                  onChange={(e) => setActualDuration(Number(e.target.value))}
                />
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
              Payment method: {rideSummary.data?.payment_method === 'cash' ? 'Cash (paid to you)' : rideSummary.data?.payment_method === 'wallet' ? 'Wallet' : rideSummary.data?.payment_method}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
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
              disabled={completeRide.isPending}
            >
              <CheckCircle className="h-5 w-5" />
              {completeRide.isPending ? 'Completing...' : 'Confirm & Complete'}
            </Button>
          </div>
        )}
        {currentStep === 'complete' && (
          <div className="flex items-center justify-center gap-2 py-3 text-emerald-600 font-semibold">
            <CheckCircle className="h-6 w-6" />
            Ride Completed Successfully
          </div>
        )}
      </div>
    </div>
  )
}
