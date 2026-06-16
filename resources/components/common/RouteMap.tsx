import { useRef, useEffect, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { MapPin } from 'lucide-react'
import { createOSMStyle, OSM_TILE_MAX_ZOOM } from '@/maps/types'
import { MapService } from '@/maps/MapService'
import type { RoutePoint, LatLng } from '@/maps/types'

type RouteType = 'pickup-dest' | 'driver-pickup' | 'driver-dest'

interface RouteMapProps {
  pickupLat: number
  pickupLng: number
  destLat: number
  destLng: number
  driverLat?: number
  driverLng?: number
  routeType?: RouteType
  className?: string
  height?: string | number
}

export function RouteMap({
  pickupLat, pickupLng, destLat, destLng, driverLat, driverLng,
  routeType = 'pickup-dest', className, height = 400,
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const [state, setState] = useState<{ loaded: boolean; error: string | null }>({ loaded: false, error: null })
  const [routePath, setRoutePath] = useState<RoutePoint[]>([])

  const routeStart = useCallback((): LatLng | null => {
    if (routeType === 'driver-pickup' || routeType === 'driver-dest') {
      if (driverLat != null && driverLng != null) return { lat: driverLat, lng: driverLng }
      return null
    }
    return { lat: pickupLat, lng: pickupLng }
  }, [routeType, driverLat, driverLng, pickupLat, pickupLng])

  const routeEnd = useCallback((): LatLng => {
    if (routeType === 'driver-pickup') return { lat: pickupLat, lng: pickupLng }
    return { lat: destLat, lng: destLng }
  }, [routeType, pickupLat, pickupLng, destLat, destLng])

  const fetchRoute = useCallback(async () => {
    const start = routeStart()
    if (!start) { setRoutePath([]); return }
    const end = routeEnd()
    const path = await MapService.getRoute(start, end)
    setRoutePath(path)
  }, [routeStart, routeEnd])

  useEffect(() => { fetchRoute() }, [fetchRoute])

  const fitAll = useCallback((map: maplibregl.Map) => {
    const pts: [number, number][] = [[pickupLng, pickupLat], [destLng, destLat]]
    if (driverLat != null && driverLng != null) pts.push([driverLng, driverLat])
    if (pts.length < 2) return
    const bounds = pts.reduce((b, p) => b.extend(p), new maplibregl.LngLatBounds(pts[0], pts[0]))
    map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 500 })
  }, [pickupLat, pickupLng, destLat, destLng, driverLat, driverLng])

  const ensureRouteLayer = useCallback((map: maplibregl.Map, path: RoutePoint[]) => {
    if (!path.length) return
    const coords = path.map((p) => [p.lng, p.lat] as [number, number])
    const src = map.getSource('route') as maplibregl.GeoJSONSource | undefined
    if (src) {
      src.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} })
    } else if (map.isStyleLoaded()) {
      try {
        map.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} },
        })
        map.addLayer({
          id: 'route', type: 'line', source: 'route',
          paint: { 'line-color': '#3b82f6', 'line-opacity': 0.8, 'line-width': 4 },
        })
      } catch { /* layer may already exist */ }
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const center = MapService.centerOf([
      { lat: pickupLat, lng: pickupLng },
      { lat: destLat, lng: destLng },
      ...(driverLat != null && driverLng != null ? [{ lat: driverLat, lng: driverLng }] : []),
    ])
    try {
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: createOSMStyle() as any,
        center: [center.lng, center.lat],
        zoom: 12, maxZoom: OSM_TILE_MAX_ZOOM,
      })
      map.on('load', () => {
        mapRef.current = map
        if (routePath.length > 0) ensureRouteLayer(map, routePath)
        addCircleMarker(map, [pickupLng, pickupLat], '#22c55e', 'A')
        addCircleMarker(map, [destLng, destLat], '#ef4444', 'B')
        if (driverLat != null && driverLng != null) {
          markerRef.current = addDriverMarker(map, [driverLng, driverLat])
        }
        fitAll(map)
        setState({ loaded: true, error: null })
      })
      map.on('error', () => {
        setState((s) => (s.loaded ? s : { loaded: false, error: 'Failed to load route map' }))
      })
      return () => {
        try { map.removeLayer('route') } catch { /* ok */ }
        try { map.removeSource('route') } catch { /* ok */ }
        markerRef.current = null
        map.remove()
        mapRef.current = null
      }
    } catch {
      setState({ loaded: false, error: 'Failed to initialize route map' })
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !routePath.length) return
    ensureRouteLayer(map, routePath)
  }, [routePath, ensureRouteLayer])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (driverLat != null && driverLng != null) {
      if (markerRef.current) {
        markerRef.current.setLngLat([driverLng, driverLat])
      } else {
        markerRef.current = addDriverMarker(map, [driverLng, driverLat])
      }
    }
  }, [driverLat, driverLng])

  useEffect(() => {
    const map = mapRef.current
    if (!map || driverLat == null || driverLng == null) return
    fitAll(map)
  }, [driverLat, driverLng, fitAll])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => { mapRef.current?.resize() })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const mapStyle = { height: typeof height === 'number' ? `${height}px` : height }

  return (
    <div className={cn('relative rounded-lg overflow-hidden border', className)} style={mapStyle}>
      <div ref={containerRef} className="absolute inset-0" />
      {!state.loaded && !state.error && <Skeleton className="absolute inset-0 rounded-none" />}
      {state.error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted z-10">
          <MapPin className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Route map unavailable</p>
        </div>
      )}
    </div>
  )
}

function addCircleMarker(map: maplibregl.Map, coords: [number, number], color: string, label: string) {
  const el = document.createElement('div')
  el.style.width = '30px'
  el.style.height = '30px'
  el.style.borderRadius = '50%'
  el.style.backgroundColor = color
  el.style.border = '3px solid white'
  el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)'
  el.style.color = 'white'
  el.style.fontSize = '12px'
  el.style.fontWeight = 'bold'
  el.style.display = 'flex'
  el.style.alignItems = 'center'
  el.style.justifyContent = 'center'
  el.textContent = label
  new maplibregl.Marker({ element: el }).setLngLat(coords).addTo(map)
}

function addDriverMarker(map: maplibregl.Map, coords: [number, number]): maplibregl.Marker {
  const el = document.createElement('div')
  el.style.width = '36px'
  el.style.height = '36px'
  el.style.borderRadius = '50%'
  el.style.backgroundColor = '#3b82f6'
  el.style.border = '3px solid white'
  el.style.boxShadow = '0 2px 8px rgba(59,130,246,0.5)'
  el.style.display = 'flex'
  el.style.alignItems = 'center'
  el.style.justifyContent = 'center'
  const marker = new maplibregl.Marker({ element: el }).setLngLat(coords).addTo(map)
  const pulse = document.createElement('div')
  pulse.style.position = 'absolute'
  pulse.style.bottom = '-2px'
  pulse.style.left = '50%'
  pulse.style.transform = 'translateX(-50%)'
  pulse.style.width = '10px'
  pulse.style.height = '10px'
  pulse.style.borderRadius = '50%'
  pulse.style.backgroundColor = '#3b82f6'
  pulse.style.animation = 'pulse 1.5s infinite'
  marker.getElement().appendChild(pulse)
  return marker
}
