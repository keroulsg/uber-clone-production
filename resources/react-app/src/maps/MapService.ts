import type { LatLng, RoutePoint, GeoLocation, MapBounds } from './types'
import { NOMINATIM_BASE, OSRM_BASE } from './types'

export class MapService {
  private static traceId(): string {
    return crypto.randomUUID?.() ?? `map-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }

  private static log(level: string, message: string, data?: Record<string, unknown>) {
    const trace_id = this.traceId()
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    fn(`[MapService:${trace_id}] ${message}`, data ?? '')
  }

  // --- Geocoding ---

  static async searchLocation(query: string): Promise<GeoLocation[]> {
    try {
      const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en' },
      })
      if (!res.ok) throw new Error(`Nominatim search failed: ${res.status}`)

      const data: Array<{ lat: string; lon: string; display_name: string }> = await res.json()
      return data.map((item) => ({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        address: item.display_name,
      }))
    } catch (err) {
      this.log('error', 'Location search failed', { query, error: String(err) })
      return []
    }
  }

  static async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const url = `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en' },
      })
      if (!res.ok) throw new Error(`Nominatim reverse geocode failed: ${res.status}`)

      const data: { display_name?: string; error?: string } = await res.json()
      if (data.error) throw new Error(data.error)

      return data.display_name ?? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    } catch (err) {
      this.log('error', 'Reverse geocode failed', { lat, lng, error: String(err) })
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }
  }

  // --- Routing ---

  static async getRoute(start: LatLng, end: LatLng): Promise<{ points: RoutePoint[]; distance: number; duration: number }> {
    try {
      const coords = `${start.lng},${start.lat};${end.lng},${end.lat}`
      const url = `${OSRM_BASE}/route/v1/driving/${coords}?geometries=geojson&overview=full`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`OSRM routing failed: ${res.status}`)

      const data: {
        code: string
        routes?: Array<{ geometry: { coordinates: [number, number][] }; distance: number; duration: number }>
      } = await res.json()

      if (data.code !== 'Ok' || !data.routes?.length) {
        throw new Error(`OSRM returned code: ${data.code}`)
      }

      const route = data.routes[0]
      const points = route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }))
      const distance = route.distance / 1000
      const duration = Math.round(route.duration / 60)

      return { points, distance, duration }
    } catch (err) {
      this.log('error', 'Routing failed, using straight line', {
        start,
        end,
        error: String(err),
      })
      const dist = this.haversineDistance(start, end)
      const dur = Math.max(1, Math.round((dist / 30) * 60))
      return {
        points: [
          { lat: start.lat, lng: start.lng },
          { lat: end.lat, lng: end.lng },
        ],
        distance: Math.round(dist * 10) / 10,
        duration: dur,
      }
    }
  }

  // -- Bounds ---

  static computeBounds(points: LatLng[]): MapBounds {
    let north = -90, south = 90, east = -180, west = 180
    for (const p of points) {
      if (p.lat > north) north = p.lat
      if (p.lat < south) south = p.lat
      if (p.lng > east) east = p.lng
      if (p.lng < west) west = p.lng
    }
    return { north, south, east, west }
  }

  static centerOf(points: LatLng[]): LatLng {
    if (!points.length) return { lat: 40.7128, lng: -74.006 }
    const sum = points.reduce((acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }), { lat: 0, lng: 0 })
    return { lat: sum.lat / points.length, lng: sum.lng / points.length }
  }

  // --- Animation ---

  static interpolatePosition(from: LatLng, to: LatLng, progress: number): LatLng {
    return {
      lat: from.lat + (to.lat - from.lat) * progress,
      lng: from.lng + (to.lng - from.lng) * progress,
    }
  }

  static animateMovement(
    from: LatLng,
    to: LatLng,
    duration: number,
    onFrame: (pos: LatLng) => void,
    onComplete?: () => void,
  ): () => void {
    const startTime = performance.now()
    let frameId: number

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      onFrame(this.interpolatePosition(from, to, eased))

      if (progress < 1) {
        frameId = requestAnimationFrame(tick)
      } else {
        onComplete?.()
      }
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }

  // --- Distance ---

  static haversineDistance(a: LatLng, b: LatLng): number {
    const R = 6371
    const dLat = ((b.lat - a.lat) * Math.PI) / 180
    const dLng = ((b.lng - a.lng) * Math.PI) / 180
    const sinLat = Math.sin(dLat / 2)
    const sinLng = Math.sin(dLng / 2)
    const h =
      sinLat * sinLat + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinLng * sinLng
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  }

  // --- Throttle ---

  static throttle<T extends (...args: any[]) => void>(fn: T, ms: number): T {
    let last = 0
    return ((...args: any[]) => {
      const now = Date.now()
      if (now - last >= ms) {
        last = now
        fn(...args)
      }
    }) as T
  }

  // --- Coordinate conversion ---

  static toLngLat(latlng: LatLng): [number, number] {
    return [latlng.lng, latlng.lat]
  }

  static toLatLng(lnglat: [number, number]): LatLng {
    return { lat: lnglat[1], lng: lnglat[0] }
  }
}
