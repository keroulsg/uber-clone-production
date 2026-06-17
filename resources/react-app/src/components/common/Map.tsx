import { useRef, useEffect, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { MapPin, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createOSMStyle, OSM_TILE_MAX_ZOOM, MAP_COLORS } from '@/maps/types'
import type { MapMarker, MapState } from '@/maps/types'

export interface SurgeZone {
  lat: number
  lng: number
  radiusKm: number
  multiplier: number
  zone: 'normal' | 'medium' | 'high'
  openRequests: number
  availableDrivers: number
  demandSupplyRatio: number
}

interface MapProps {
  center?: { lat: number; lng: number }
  zoom?: number
  markers?: MapMarker[]
  polyline?: { lat: number; lng: number }[]
  onMapClick?: (lat: number, lng: number) => void
  className?: string
  height?: string | number
  surgeZone?: SurgeZone | null
}

const defaultCenter = { lat: 0, lng: 0 }

export function Map({
  center = defaultCenter,
  zoom = 13,
  markers = [],
  polyline,
  onMapClick,
  className,
  height = 400,
  surgeZone,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRefs = useRef<maplibregl.Marker[]>([])
  const polylineDataRef = useRef<string>('')
  const initCalledRef = useRef(false)
  const popupRef = useRef<maplibregl.Popup | null>(null)
  const prevSurgeKeyRef = useRef<string>('')
  const [state, setState] = useState<MapState>({ loaded: false, error: null })
  const clickHandlerRef = useRef<((e: maplibregl.MapMouseEvent) => void) | null>(null)

  const initMap = useCallback(() => {
    if (!containerRef.current || initCalledRef.current) return
    initCalledRef.current = true

    try {
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: createOSMStyle() as any,
        center: [center.lng, center.lat],
        zoom,
        maxZoom: OSM_TILE_MAX_ZOOM,
      })

      map.addControl(new maplibregl.NavigationControl(), 'top-right')

      map.on('load', () => {
        mapRef.current = map
        setState({ loaded: true, error: null })
      })

      map.on('error', () => {
        setState((s) => (s.loaded ? s : { loaded: false, error: 'Failed to load map' }))
      })
    } catch (err) {
      setState({ loaded: false, error: 'Failed to initialize map' })
    }
  }, [])

  // Initialize map on mount
  useEffect(() => {
    initMap()
    return () => {
      initCalledRef.current = false
      markerRefs.current.forEach((m) => m.remove())
      markerRefs.current = []
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [initMap])

  // Update center/zoom
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded?.()) return
    map.flyTo({ center: [center.lng, center.lat], zoom, duration: 500 })
  }, [center.lat, center.lng, zoom])

  // Update markers
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markerRefs.current.forEach((m) => m.remove())
    markerRefs.current = []

    markers.forEach((mkr) => {
      const el = document.createElement('div')
      el.className = 'flex items-center justify-center'
      el.style.width = '28px'
      el.style.height = '28px'
      el.style.borderRadius = '50%'
      el.style.backgroundColor = MAP_COLORS[mkr.color ?? 'blue'] ?? mkr.color ?? '#3b82f6'
      el.style.border = '2px solid white'
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)'
      el.style.cursor = 'pointer'

      if (mkr.label) {
        el.style.color = 'white'
        el.style.fontSize = '11px'
        el.style.fontWeight = 'bold'
        el.textContent = mkr.label
      }

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([mkr.lng, mkr.lat])
        .addTo(map)
      markerRefs.current.push(marker)
    })
  }, [markers])

  // Update polyline
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const nextData = polyline ? polyline.map((p) => `${p.lat},${p.lng}`).join('|') : ''
    if (nextData === polylineDataRef.current) return
    polylineDataRef.current = nextData

    const id = 'route-polyline'
    try { map.removeLayer(id) } catch { /* ok */ }
    try { map.removeSource(id) } catch { /* ok */ }

    if (polyline && polyline.length > 0) {
      const coords = polyline.map((p) => [p.lng, p.lat] as [number, number])
      map.addSource(id, {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} },
      })
      map.addLayer({
        id,
        type: 'line',
        source: id,
        paint: { 'line-color': '#3b82f6', 'line-opacity': 0.8, 'line-width': 3 },
      })
    }
  }, [polyline, state.loaded])

  // Surge zone circle overlay
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const surgeKey = surgeZone ? `${surgeZone.lat},${surgeZone.lng},${surgeZone.multiplier},${surgeZone.radiusKm}` : ''
    if (surgeKey === prevSurgeKeyRef.current) return
    prevSurgeKeyRef.current = surgeKey

    const layerId = 'surge-zone-fill'
    const outlineId = 'surge-zone-outline'
    try { map.removeLayer(layerId) } catch { /* ok */ }
    try { map.removeSource(layerId) } catch { /* ok */ }
    try { map.removeLayer(outlineId) } catch { /* ok */ }
    try { map.removeSource(outlineId) } catch { /* ok */ }
    if (popupRef.current) { popupRef.current.remove(); popupRef.current = null }

    if (!surgeZone || surgeZone.multiplier <= 1.0) return

    const kmPerDeg = 111.32
    const latR = surgeZone.radiusKm / kmPerDeg
    const lngR = surgeZone.radiusKm / (kmPerDeg * Math.cos((surgeZone.lat * Math.PI) / 180))
    const pts = 64
    const coords: [number, number][] = []
    for (let i = 0; i <= pts; i++) {
      const angle = (i / pts) * 2 * Math.PI
      coords.push([
        surgeZone.lng + lngR * Math.cos(angle),
        surgeZone.lat + latR * Math.sin(angle),
      ])
    }

    const fillColor = surgeZone.zone === 'high' ? '#ef4444' : surgeZone.zone === 'medium' ? '#f59e0b' : '#22c55e'

    map.addSource(layerId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [coords] },
        properties: {},
      },
    })
    map.addLayer({
      id: layerId,
      type: 'fill',
      source: layerId,
      paint: {
        'fill-color': fillColor,
        'fill-opacity': 0.15,
      },
    })
    map.addLayer({
      id: outlineId,
      type: 'line',
      source: layerId,
      paint: {
        'line-color': fillColor,
        'line-opacity': 0.6,
        'line-width': 2,
        'line-dasharray': [2, 2],
      },
    })

    map.on('click', layerId, (e) => {
      if (popupRef.current) popupRef.current.remove()
      const popup = new maplibregl.Popup({ closeButton: true, maxWidth: '240px' })
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="font-size:13px;line-height:1.6">
            <strong style="color:${fillColor}">${surgeZone.zone === 'high' ? 'High' : surgeZone.zone === 'medium' ? 'Medium' : 'Normal'} Surge</strong><br/>
            <strong>${surgeZone.multiplier}x</strong> multiplier<br/>
            <hr style="margin:4px 0;border-color:#eee"/>
            Open requests: ${surgeZone.openRequests}<br/>
            Available drivers: ${surgeZone.availableDrivers}<br/>
            Demand/supply ratio: ${surgeZone.demandSupplyRatio}<br/>
            Radius: ${surgeZone.radiusKm} km
          </div>
        `)
        .addTo(map)
      popupRef.current = popup
    })

    map.on('mouseenter', layerId, () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', layerId, () => {
      map.getCanvas().style.cursor = ''
    })
  }, [surgeZone])

  // Click handler
  useEffect(() => {
    const map = mapRef.current
    if (!map || !onMapClick) return

    if (clickHandlerRef.current) {
      map.off('click', clickHandlerRef.current)
    }

    const handler = (e: maplibregl.MapMouseEvent) => {
      onMapClick(e.lngLat.lat, e.lngLat.lng)
    }
    clickHandlerRef.current = handler
    map.on('click', handler)

    return () => {
      if (clickHandlerRef.current) {
        map.off('click', clickHandlerRef.current)
        clickHandlerRef.current = null
      }
    }
  }, [onMapClick])

  // Resize observer
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      mapRef.current?.resize()
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleRetry = useCallback(() => {
    if (mapRef.current) {
      markerRefs.current.forEach((m) => m.remove())
      markerRefs.current = []
      mapRef.current.remove()
      mapRef.current = null
    }
    initCalledRef.current = false
    setState({ loaded: false, error: null })
  }, [])

  const style = { height: typeof height === 'number' ? `${height}px` : height }

  return (
    <div className={cn('relative rounded-lg overflow-hidden border', className)} style={style}>
      <div ref={containerRef} className="absolute inset-0" />
      {!state.loaded && !state.error && (
        <Skeleton className="absolute inset-0 rounded-none" />
      )}
      {state.error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted z-10">
          <MapPin className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-3">Map unavailable</p>
          <Button variant="outline" size="sm" onClick={handleRetry}>
            <RotateCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      )}
    </div>
  )
}
