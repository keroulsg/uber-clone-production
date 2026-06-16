import { useRef, useEffect, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { MapPin, Crosshair, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OSM_RASTER_STYLE, OSM_TILE_MAX_ZOOM } from '@/maps/types'
import { MapService } from '@/maps/MapService'
import type { GeoLocation } from '@/maps/types'

interface MapPickerProps {
  onLocationSelect: (location: GeoLocation) => void
  defaultCenter?: { lat: number; lng: number }
  defaultZoom?: number
  className?: string
  height?: string | number
}

const defaultCenter = { lat: 40.7128, lng: -74.006 }

export function MapPicker({
  onLocationSelect,
  defaultCenter: initialCenter,
  defaultZoom = 14,
  className,
  height = 400,
}: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const [state, setState] = useState<{ loaded: boolean; error: string | null }>({ loaded: false, error: null })
  const [selectedPos, setSelectedPos] = useState<{ lat: number; lng: number } | null>(null)
  const [address, setAddress] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GeoLocation[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    try {
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: OSM_RASTER_STYLE as any,
        center: [initialCenter?.lng ?? defaultCenter.lng, initialCenter?.lat ?? defaultCenter.lat],
        zoom: defaultZoom,
        maxZoom: OSM_TILE_MAX_ZOOM,
      })

      map.addControl(new maplibregl.NavigationControl(), 'top-right')

      map.on('load', () => {
        mapRef.current = map
        setState({ loaded: true, error: null })
      })

      map.on('click', async (e) => {
        const lat = e.lngLat.lat
        const lng = e.lngLat.lng
        handleLocationSelect(lat, lng)
      })

      map.on('error', (e) => {
        console.error('[MapPicker]', e.error?.message ?? 'Map error')
        setState((s) => (s.loaded ? s : { loaded: false, error: 'Failed to load map' }))
      })

      return () => {
        map.remove()
        mapRef.current = null
      }
    } catch (err) {
      console.error('[MapPicker] Init error:', err)
      setState({ loaded: false, error: 'Failed to initialize map picker' })
    }
  }, [])

  const handleLocationSelect = useCallback(async (lat: number, lng: number) => {
    setSelectedPos({ lat, lng })
    const addr = await MapService.reverseGeocode(lat, lng)
    setAddress(addr)
    onLocationSelect({ lat, lng, address: addr })

    const map = mapRef.current
    if (map) {
      if (markerRef.current) markerRef.current.remove()

      const el = document.createElement('div')
      el.style.width = '24px'
      el.style.height = '24px'
      el.style.borderRadius = '50%'
      el.style.backgroundColor = '#3b82f6'
      el.style.border = '3px solid white'
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)'

      markerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map)
    }
  }, [onLocationSelect])

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        handleLocationSelect(lat, lng)
        mapRef.current?.flyTo({ center: [lng, lat], zoom: 14, duration: 500 })
      },
      () => {},
    )
  }, [handleLocationSelect])

  // Search
  const handleSearchInput = useCallback((value: string) => {
    setSearchQuery(value)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    if (value.length < 3) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true)
      const results = await MapService.searchLocation(value)
      setSearchResults(results)
      setShowResults(results.length > 0)
      setIsSearching(false)
    }, 400)
  }, [])

  const handleSelectSearchResult = useCallback((loc: GeoLocation) => {
    handleLocationSelect(loc.lat, loc.lng)
    setSearchQuery(loc.address)
    setShowResults(false)
    mapRef.current?.flyTo({ center: [loc.lng, loc.lat], zoom: 14, duration: 500 })
  }, [handleLocationSelect])

  if (state.error) {
    return (
      <div
        className={cn('flex flex-col items-center justify-center bg-muted rounded-lg border', className)}
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        <MapPin className="h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Map picker unavailable</p>
      </div>
    )
  }

  if (!state.loaded) {
    return (
      <Skeleton
        className={cn('rounded-lg', className)}
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      />
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex gap-2 relative">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for a place..."
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            className="pl-9"
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
              {searchResults.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors truncate"
                  onMouseDown={() => handleSelectSearchResult(r)}
                >
                  {r.address}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button variant="outline" size="icon" onClick={handleUseCurrentLocation} title="Use current location">
          <Crosshair className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={containerRef}
        className="rounded-lg overflow-hidden border"
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      />

      {address && (
        <p className="text-sm text-muted-foreground">
          Selected: <span className="font-medium text-foreground">{address}</span>
        </p>
      )}
    </div>
  )
}
