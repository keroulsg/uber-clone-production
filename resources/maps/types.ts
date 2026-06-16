export interface LatLng {
  lat: number
  lng: number
}

export interface MapMarker {
  lat: number
  lng: number
  label?: string
  color?: string
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface GeoLocation {
  lat: number
  lng: number
  address: string
}

export interface RoutePoint {
  lat: number
  lng: number
}

export interface MapOptions {
  center: LatLng
  zoom: number
  interactive?: boolean
}

export interface MapState {
  loaded: boolean
  error: string | null
}

export const MAP_COLORS: Record<string, string> = {
  green: '#22c55e',
  red: '#ef4444',
  blue: '#3b82f6',
  yellow: '#eab308',
  purple: '#a855f7',
}

// Primary tile provider (Carto - very reliable, always responds)
export const OSM_TILE_URL_PRIMARY = 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
// Fallback to OpenStreetMap standard tile server
export const OSM_TILE_URL_FALLBACK = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
// Legacy URL for compatibility
export const OSM_TILE_URL = OSM_TILE_URL_PRIMARY
export const OSM_TILE_MAX_ZOOM = 19

export function createOSMStyle(tileUrl?: string) {
  // Use primary URL, but allow override
  const url = tileUrl ?? OSM_TILE_URL_PRIMARY
  const attribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' +
    ' | &copy; <a href="https://carto.com/attributions">CARTO</a>'
  
  return {
    version: 8,
    sources: {
      osm: {
        type: 'raster' as const,
        tiles: [url],
        tileSize: 256,
        attribution,
      },
    },
    layers: [
      {
        id: 'osm',
        type: 'raster' as const,
        source: 'osm',
      },
    ],
  }
}

export const OSM_RASTER_STYLE = createOSMStyle()

export const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'
export const OSRM_BASE = 'https://router.project-osrm.org'
