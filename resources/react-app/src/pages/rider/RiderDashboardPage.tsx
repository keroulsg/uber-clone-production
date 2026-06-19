import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  MapPin, Navigation, Crosshair, Car, Bike,
  DollarSign,
  Clock, Route, Heart, Wallet, Search,
} from 'lucide-react'
import { useCreateRide, useEstimateFare } from '@/hooks/useRides'
import { useVehicleTypes } from '@/hooks/useVehicles'
import { useWallet } from '@/hooks/usePayments'
import { useAuthStore } from '@/stores/authStore'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Map } from '@/components/common/Map'
import { PageHeader } from '@/components/common/PageHeader'
import { cn } from '@/lib/utils'
import { MapService } from '@/maps/MapService'
import type { VehicleType, FareBreakdown, Wallet as WalletType, RoutePoint } from '@/types'

const vehicleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  car: Car,
  motorcycle: Bike,
}

const DEFAULT_CENTER = { lat: 30.0444, lng: 31.2357 }

const PAYMENT_METHODS = [
  { value: 'wallet', label: 'Wallet', icon: Wallet, desc: 'Pay from wallet balance' },
  { value: 'cash', label: 'Cash', icon: DollarSign, desc: 'Pay with cash' },
] as const

export default function RiderDashboardPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const createRide = useCreateRide()
  const estimateFare = useEstimateFare()
  const { data: vehicleTypesData, isLoading: vehicleTypesLoading } = useVehicleTypes()
  const user = useAuthStore((s) => s.user)
  const { data: walletData } = useWallet()

  const wallet = walletData?.data as WalletType | undefined
  const vehicleTypes = ((vehicleTypesData?.data ?? []) as VehicleType[]).filter((vt) => vt.is_active)

  const [pickupAddress, setPickupAddress] = useState('')
  const [pickupLat, setPickupLat] = useState<number | null>(null)
  const [pickupLng, setPickupLng] = useState<number | null>(null)
  const [destAddress, setDestAddress] = useState('')
  const [destLat, setDestLat] = useState<number | null>(null)
  const [destLng, setDestLng] = useState<number | null>(null)
  const [selectedVehicleType, setSelectedVehicleType] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string>('wallet')
  const [isLocating, setIsLocating] = useState(false)
  const [geoDenied, setGeoDenied] = useState(false)
  const [femaleDriverPreferred, setFemaleDriverPreferred] = useState(false)
  const geoInitRef = useRef(false)
  const [routePath, setRoutePath] = useState<RoutePoint[]>([])
  const [routeDistance, setRouteDistance] = useState<number | null>(null)
  const [routeDuration, setRouteDuration] = useState<number | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [destSearchResults, setDestSearchResults] = useState<{ lat: number; lng: number; address: string }[]>([])
  const [destSearching, setDestSearching] = useState(false)
  const [destSearchOpen, setDestSearchOpen] = useState(false)
  const destSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [pickupSearchResults, setPickupSearchResults] = useState<{ lat: number; lng: number; address: string }[]>([])
  const [pickupSearching, setPickupSearching] = useState(false)
  const [pickupSearchOpen, setPickupSearchOpen] = useState(false)
  const pickupSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isReversing, setIsReversing] = useState(false)

  const isFemale = user?.gender === 'female'

  // Pre-fill from rebook URL params
  useEffect(() => {
    const pAddr = searchParams.get('pickupAddress')
    const pLat = searchParams.get('pickupLat')
    const pLng = searchParams.get('pickupLng')
    const dAddr = searchParams.get('destAddress')
    const dLat = searchParams.get('destLat')
    const dLng = searchParams.get('destLng')
    if (pAddr) setPickupAddress(pAddr)
    if (pLat) setPickupLat(Number(pLat))
    if (pLng) setPickupLng(Number(pLng))
    if (dAddr) setDestAddress(dAddr)
    if (dLat) setDestLat(Number(dLat))
    if (dLng) setDestLng(Number(dLng))
    // Clear params after reading to prevent re-fill on re-render
    if (pAddr || dAddr) {
      window.history.replaceState({}, '', '/rider/dashboard')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const canEstimate = pickupLat != null && destLat != null && selectedVehicleType != null
  const canRequest = pickupLat != null && destLat != null && selectedVehicleType != null && paymentMethod != null

  // Browser geolocation on mount
  useEffect(() => {
    if (geoInitRef.current) return
    geoInitRef.current = true

    if (!navigator.geolocation) {
      setGeoDenied(true)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setPickupLat(lat)
        setPickupLng(lng)
        const addr = await MapService.reverseGeocode(lat, lng)
        setPickupAddress(addr)
      },
      () => {
        setGeoDenied(true)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  // Reverse geocode pickup when map-clicked
  useEffect(() => {
    if (pickupLat != null && pickupLng != null && isReversing) {
      MapService.reverseGeocode(pickupLat, pickupLng).then(setPickupAddress)
      setIsReversing(false)
    }
  }, [pickupLat, pickupLng, isReversing])

  // Reverse geocode destination when map-clicked
  useEffect(() => {
    if (destLat != null && destLng != null && destAddress === `${destLat.toFixed(4)}, ${destLng.toFixed(4)}`) {
      MapService.reverseGeocode(destLat, destLng).then(setDestAddress)
    }
  }, [destLat, destLng]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch OSRM route when both points are set
  useEffect(() => {
    if (pickupLat == null || pickupLng == null || destLat == null || destLng == null) {
      setRoutePath([])
      setRouteDistance(null)
      setRouteDuration(null)
      return
    }
    let cancelled = false
    setRouteLoading(true)
    ;(async () => {
      const result = await MapService.getRoute(
        { lat: pickupLat, lng: pickupLng },
        { lat: destLat, lng: destLng },
      )
      if (cancelled) return
      setRoutePath(result.points)
      setRouteDistance(Math.round(result.distance * 10) / 10)
      setRouteDuration(result.duration)
      setRouteLoading(false)
    })()
    return () => { cancelled = true }
  }, [pickupLat, pickupLng, destLat, destLng])

  // Fetch fare estimate when vehicle type or coordinates change
  useEffect(() => {
    if (!canEstimate || !pickupLat || !pickupLng || !destLat || !destLng) return
    estimateFare.mutate({
      pickupLat,
      pickupLng,
      destinationLat: destLat,
      destinationLng: destLng,
      vehicleTypeId: selectedVehicleType,
    })
  }, [selectedVehicleType, pickupLat, pickupLng, destLat, destLng]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    if (!pickupLat) {
      setPickupLat(lat)
      setPickupLng(lng)
      setIsReversing(true)
      const addr = await MapService.reverseGeocode(lat, lng)
      setPickupAddress(addr)
    } else {
      setDestLat(lat)
      setDestLng(lng)
      const addr = await MapService.reverseGeocode(lat, lng)
      setDestAddress(addr)
    }
  }, [pickupLat])

  const handleGetCurrentLocation = useCallback(async () => {
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setPickupLat(lat)
        setPickupLng(lng)
        const addr = await MapService.reverseGeocode(lat, lng)
        setPickupAddress(addr)
        setIsLocating(false)
        setGeoDenied(false)
      },
      () => {
        setIsLocating(false)
        setGeoDenied(true)
      },
      { enableHighAccuracy: true }
    )
  }, [])

  const handleDestSearch = useCallback((value: string) => {
    setDestAddress(value)
    if (destSearchTimeoutRef.current) clearTimeout(destSearchTimeoutRef.current)
    if (!value.trim()) {
      setDestSearchResults([])
      setDestSearchOpen(false)
      return
    }
    destSearchTimeoutRef.current = setTimeout(async () => {
      setDestSearching(true)
      const results = await MapService.searchLocation(value)
      setDestSearchResults(results)
      setDestSearchOpen(results.length > 0)
      setDestSearching(false)
    }, 400)
  }, [])

  const handlePickupSearch = useCallback((value: string) => {
    setPickupAddress(value)
    if (pickupSearchTimeoutRef.current) clearTimeout(pickupSearchTimeoutRef.current)
    if (!value.trim()) {
      setPickupSearchResults([])
      setPickupSearchOpen(false)
      return
    }
    pickupSearchTimeoutRef.current = setTimeout(async () => {
      setPickupSearching(true)
      const results = await MapService.searchLocation(value)
      setPickupSearchResults(results)
      setPickupSearchOpen(results.length > 0)
      setPickupSearching(false)
    }, 400)
  }, [])

  const handleSelectDestResult = (result: { lat: number; lng: number; address: string }) => {
    setDestLat(result.lat)
    setDestLng(result.lng)
    setDestAddress(result.address)
    setDestSearchResults([])
    setDestSearchOpen(false)
  }

  const handleSelectPickupResult = (result: { lat: number; lng: number; address: string }) => {
    setPickupLat(result.lat)
    setPickupLng(result.lng)
    setPickupAddress(result.address)
    setPickupSearchResults([])
    setPickupSearchOpen(false)
  }

  const handleRequestRide = () => {
    if (!canRequest || !pickupLat || !pickupLng || !destLat || !destLng || !selectedVehicleType) return
    createRide.mutate(
      {
        pickup: { address: pickupAddress, lat: pickupLat, lng: pickupLng },
        destination: { address: destAddress, lat: destLat, lng: destLng },
        vehicleTypeId: selectedVehicleType,
        payment_method: paymentMethod,
        female_driver_preferred: femaleDriverPreferred || undefined,
      },
      {
        onSuccess: () => navigate('/rider/current-ride'),
      }
    )
  }

  const selectedType = vehicleTypes.find((vt) => vt.id === selectedVehicleType)
  const fareEstimate = estimateFare.data?.data as { fare: number; breakdown: FareBreakdown } | undefined
  const surgeMultiplier = fareEstimate?.breakdown?.surge_multiplier ?? 1.0
  const hasSurge = surgeMultiplier > 1.0

  const mapCenter = useMemo(() => {
    if (pickupLat != null && pickupLng != null) return { lat: pickupLat, lng: pickupLng }
    return DEFAULT_CENTER
  }, [pickupLat, pickupLng])

  return (
    <div className="space-y-6 pb-24">
      <PageHeader title="Book a Ride" description="Set your pickup and destination to get started" />

      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Wallet Balance</p>
              <p className="text-xl font-bold">{formatCurrency(wallet?.balance ?? 0)}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/rider/wallet')}>
            Add Funds
          </Button>
        </CardContent>
      </Card>

      {geoDenied && !pickupLat && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          <p className="font-medium">Location access denied</p>
          <p className="text-amber-600 mt-1">
            Please enable location services or click on the map to set your pickup location.
          </p>
        </div>
      )}

      <Card className="relative">
        <CardContent className="p-5 space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-500" />
              Pickup Location
            </Label>
            <div className="flex gap-2 relative">
              <div className="flex-1 relative">
                <Input
                  value={pickupAddress}
                  onChange={(e) => handlePickupSearch(e.target.value)}
                  onFocus={() => pickupSearchResults.length > 0 && setPickupSearchOpen(true)}
                  onBlur={() => setTimeout(() => setPickupSearchOpen(false), 200)}
                  placeholder="Search pickup location"
                  className="w-full pr-8"
                />
                {pickupSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Search className="h-4 w-4 animate-pulse text-muted-foreground" />
                  </div>
                )}
                {pickupSearchOpen && pickupSearchResults.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {pickupSearchResults.map((r, i) => (
                      <button
                        key={i}
                        type="button"
                        className="w-full text-left px-4 py-3 hover:bg-accent text-sm border-b last:border-0"
                        onMouseDown={() => handleSelectPickupResult(r)}
                      >
                        <p className="font-medium truncate">{r.address.split(',')[0]}</p>
                        <p className="text-xs text-muted-foreground truncate">{r.address}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleGetCurrentLocation}
                disabled={isLocating}
                title="Use current location"
              >
                <Crosshair className={`h-4 w-4 ${isLocating ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-red-500" />
              Destination
            </Label>
            <div className="relative">
              <Input
                value={destAddress}
                onChange={(e) => handleDestSearch(e.target.value)}
                onFocus={() => destSearchResults.length > 0 && setDestSearchOpen(true)}
                onBlur={() => setTimeout(() => setDestSearchOpen(false), 200)}
                placeholder="Search destination (e.g. Shubra, Warraq, Dokki)"
                className="w-full pr-8"
              />
              {destSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Search className="h-4 w-4 animate-pulse text-muted-foreground" />
                </div>
              )}
              {destSearchOpen && destSearchResults.length > 0 && (
                <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {destSearchResults.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-accent text-sm border-b last:border-0"
                      onMouseDown={() => handleSelectDestResult(r)}
                    >
                      <p className="font-medium truncate">{r.address.split(',')[0]}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.address}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Map
        key={`${pickupLat ?? 'no'}-${pickupLng ?? 'no'}-${destLat ?? 'no'}-${destLng ?? 'no'}`}
        center={mapCenter}
        zoom={13}
        height={350}
        onMapClick={handleMapClick}
        markers={[
          ...(pickupLat != null && pickupLng != null
            ? [{ lat: pickupLat, lng: pickupLng, color: 'green' as const, label: 'A' }]
            : []),
          ...(destLat != null && destLng != null
            ? [{ lat: destLat, lng: destLng, color: 'red' as const, label: 'B' }]
            : []),
        ]}
        polyline={routePath.length > 0 ? routePath : undefined}
      />

      {routeDistance != null && routeDuration != null && (
        <div className="flex gap-4 justify-center text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Route className="h-4 w-4" />
            <span>{routeDistance.toFixed(1)} km</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>~{routeDuration} min</span>
          </div>
        </div>
      )}

      {routeLoading && pickupLat != null && destLat != null && (
        <div className="text-center text-sm text-muted-foreground animate-pulse">Loading route...</div>
      )}

      {hasSurge && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-amber-600 font-bold text-lg">⚠</span>
            <p className="font-semibold text-amber-800">High Demand in This Area</p>
            <Badge variant="outline" className="ml-auto bg-amber-100 text-amber-800 border-amber-300 font-bold">
              {surgeMultiplier}x Surge
            </Badge>
          </div>
          <p className="text-sm text-amber-700">
            Fares are {Math.round((surgeMultiplier - 1) * 100)}% higher due to high demand
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Select Vehicle Type</CardTitle>
          <CardDescription>{pickupLat == null || destLat == null ? 'Set pickup and destination first to see fare estimates.' : 'Choose your ride option.'}</CardDescription>
        </CardHeader>
        <CardContent>
          {vehicleTypesLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-lg" />
              ))}
            </div>
          ) : vehicleTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No vehicle types available</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {vehicleTypes.map((vt) => {
                const Icon = vehicleIcons[vt.slug] ?? Car
                const isSelected = selectedVehicleType === vt.id

                let totalFare: number | null = null
                if (fareEstimate && isSelected && selectedVehicleType === vt.id) {
                  totalFare = fareEstimate.fare
                }

                return (
                  <button
                    key={vt.id}
                    type="button"
                    onClick={() => setSelectedVehicleType(vt.id)}
                    disabled={pickupLat == null || destLat == null}
                    className={cn(
                      'relative rounded-lg border-2 p-4 text-left transition-all',
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                        : 'border-border hover:border-primary/50',
                      (pickupLat == null || destLat == null) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn(
                        'h-12 w-12 rounded-full flex items-center justify-center',
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      )}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{vt.name}</p>
                        <p className="text-xs text-muted-foreground">{vt.description}</p>
                      </div>
                    </div>
                    {pickupLat != null && destLat != null ? (
                      <>
                        {totalFare != null && (
                          <>
                            <Separator className="my-3" />
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {routeDistance != null ? `${routeDistance.toFixed(1)} km` : ''}
                              </span>
                              <span className="font-bold text-xl">{formatCurrency(totalFare)}</span>
                            </div>
                          </>
                        )}
                      </>
                    ) : null}
                    {isSelected && (
                      <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {PAYMENT_METHODS.map((pm) => {
              const Icon = pm.icon
              const isSelected = paymentMethod === pm.value
              return (
                <button
                  key={pm.value}
                  type="button"
                  onClick={() => setPaymentMethod(pm.value)}
                  disabled={pickupLat == null || destLat == null}
                  className={cn(
                    'relative rounded-lg border-2 p-4 text-left transition-all',
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                      : 'border-border hover:border-primary/50',
                    (pickupLat == null || destLat == null) && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'h-10 w-10 rounded-full flex items-center justify-center',
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{pm.label}</p>
                      <p className="text-xs text-muted-foreground">{pm.desc}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {isFemale && pickupLat != null && destLat != null && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <p className="font-medium">Female driver preferred</p>
                  <p className="text-xs text-muted-foreground">
                    Search for female drivers first
                  </p>
                </div>
              </div>
              <Switch
                checked={femaleDriverPreferred}
                onCheckedChange={setFemaleDriverPreferred}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {fareEstimate && selectedVehicleType && (
        <Card>
          <CardHeader>
            <CardTitle>Fare Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Base Fare</span>
              <span>{formatCurrency(fareEstimate.breakdown?.base ?? 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Distance</span>
              <span>{formatCurrency(fareEstimate.breakdown?.distance ?? 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Time</span>
              <span>{formatCurrency(fareEstimate.breakdown?.time ?? 0)}</span>
            </div>
            {fareEstimate.breakdown?.surge > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Surge {fareEstimate.breakdown.surge_multiplier != null && `(×${fareEstimate.breakdown.surge_multiplier})`}
                </span>
                <span className="text-amber-600 font-semibold">{formatCurrency(fareEstimate.breakdown.surge)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatCurrency(fareEstimate.fare)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        size="lg"
        className="w-full gap-2"
        disabled={!canRequest || createRide.isPending || routeLoading}
        onClick={handleRequestRide}
      >
        {createRide.isPending ? (
          'Requesting...'
        ) : routeLoading ? (
          <>
            <Navigation className="h-5 w-5" />
            Loading Route...
          </>
        ) : (
          <>
            <Navigation className="h-5 w-5" />
            {femaleDriverPreferred ? 'Request with Female Driver' : 'Request Ride'}
          </>
        )}
      </Button>
    </div>
  )
}
