import { useRef, useEffect, useCallback, useState } from 'react'
import { MapService } from '@/maps/MapService'
import { useDriverLocationChannel } from '@/hooks/useRideBroadcast'
import type { LatLng } from '@/maps/types'

interface TrackingState {
  position: LatLng | null
  previousPosition: LatLng | null
  isMoving: boolean
  error: string | null
}

interface UseDriverTrackingOptions {
  driverId?: string | number | null
  rideId?: string | number | null
  pollInterval?: number
  animate?: boolean
  animationDuration?: number
  onError?: (error: string) => void
}

function isValidLatLng(pos: { lat?: number; lng?: number; latitude?: number; longitude?: number }): boolean {
  const lat = pos.latitude ?? pos.lat
  const lng = pos.longitude ?? pos.lng
  if (lat == null || lng == null) return false
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false
  return true
}

export function useDriverTracking(options: UseDriverTrackingOptions = {}) {
  const {
    driverId,
    rideId,
    pollInterval = 3000,
    animate = true,
    animationDuration = 1500,
    onError,
  } = options

  const [state, setState] = useState<TrackingState>({
    position: null,
    previousPosition: null,
    isMoving: false,
    error: null,
  })

  const cancelAnimRef = useRef<(() => void) | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const updatePosition = useCallback((newPos: LatLng) => {
    setState((prev) => {
      if (prev.position && animate) {
        const distance = MapService.haversineDistance(prev.position, newPos)
        if (distance < 0.01) return prev

        cancelAnimRef.current?.()
        const duration = Math.min(animationDuration, distance * 50000)
        cancelAnimRef.current = MapService.animateMovement(
          prev.position,
          newPos,
          duration,
          (interpolated) => {
            setState((s) => ({ ...s, position: interpolated, isMoving: true }))
          },
          () => {
            setState((s) => ({ ...s, position: newPos, previousPosition: newPos, isMoving: false }))
          },
        )

        return {
          position: prev.position,
          previousPosition: prev.position,
          isMoving: true,
          error: null,
        }
      }

      return {
        position: newPos,
        previousPosition: prev.position ?? newPos,
        isMoving: false,
        error: null,
      }
    })
  }, [animate, animationDuration])

  // WebSocket: listen to driver location channel
  useDriverLocationChannel(
    driverId ? String(driverId) : null,
    useCallback((data) => {
      updatePosition({ lat: data.lat, lng: data.lng })
      cancelAnimRef.current?.()
    }, [updatePosition]),
  )

  // Polling fallback: fetch driver location via HTTP
  const fetchLocation = useCallback(async () => {
    if (!driverId) return
    try {
      const url = `/api/v1/rides/track-driver/${driverId}`
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) {
        if (res.status === 404) {
          setState((s) => ({ ...s, isMoving: false }))
          return
        }
        throw new Error(`HTTP ${res.status}`)
      }

      const body = await res.json()
      const pos = body?.data ?? body

      if (isValidLatLng(pos)) {
        updatePosition({ lat: pos.latitude ?? pos.lat, lng: pos.longitude ?? pos.lng })
      }
    } catch (err) {
      const msg = String(err)
      setState((s) => ({ ...s, error: msg, isMoving: false }))
      onError?.(msg)
    }
  }, [driverId, updatePosition, onError])

  const startTracking = useCallback(() => {
    pollRef.current = setInterval(fetchLocation, pollInterval)
    fetchLocation()
  }, [fetchLocation, pollInterval])

  const stopTracking = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    cancelAnimRef.current?.()
    cancelAnimRef.current = null
  }, [])

  useEffect(() => {
    startTracking()
    return stopTracking
  }, [startTracking, stopTracking])

  return {
    ...state,
    startTracking,
    stopTracking,
    refresh: fetchLocation,
  }
}
