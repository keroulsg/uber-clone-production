import { useEffect, useRef, useCallback } from 'react'
import { echo } from '@/lib/echo'

interface RideBroadcastEvents {
  onAccepted?: (data: Record<string, unknown>) => void
  onArrived?: (data: Record<string, unknown>) => void
  onStarted?: (data: Record<string, unknown>) => void
  onCompleted?: (data: Record<string, unknown>) => void
  onCancelled?: (data: Record<string, unknown>) => void
  onLocationUpdated?: (data: Record<string, unknown>) => void
}

export function useRideBroadcast(rideId: number | string | null, events: RideBroadcastEvents) {
  const eventsRef = useRef(events)
  eventsRef.current = events

  const cleanupRef = useRef<(() => void)[]>([])

  useEffect(() => {
    if (!rideId || !echo) return

    const channel = echo.private(`ride.${rideId}`)

    const subscriptions: Array<{ event: string; handler: (data: unknown) => void }> = [
      { event: '.ride.accepted', handler: (d) => eventsRef.current.onAccepted?.(d as Record<string, unknown>) },
      { event: '.driver.arrived', handler: (d) => eventsRef.current.onArrived?.(d as Record<string, unknown>) },
      { event: '.ride.started', handler: (d) => eventsRef.current.onStarted?.(d as Record<string, unknown>) },
      { event: '.ride.completed', handler: (d) => eventsRef.current.onCompleted?.(d as Record<string, unknown>) },
      { event: '.ride.cancelled', handler: (d) => eventsRef.current.onCancelled?.(d as Record<string, unknown>) },
    ]

    subscriptions.forEach(({ event, handler }) => {
      channel.listen(event, handler)
    })

    cleanupRef.current = subscriptions.map(({ event, handler }) => {
      return () => {
        try { channel.stopListening(event, handler) } catch { /* ok */ }
      }
    })

    return () => {
      cleanupRef.current.forEach((fn) => fn())
      try { echo?.leave(`ride.${rideId}`) } catch { /* ok */ }
    }
  }, [rideId])
}

export function useDriverLocationChannel(
  driverId: number | string | null,
  onLocation: (data: { lat: number; lng: number; bearing?: number }) => void,
) {
  const handlerRef = useRef(onLocation)
  handlerRef.current = onLocation

  useEffect(() => {
    if (!driverId || !echo) return

    const channel = echo.private(`driver.location.${driverId}`)

    channel.listen('.driver.location.updated', (data: unknown) => {
      const d = data as { lat: number; lng: number; bearing?: number }
      handlerRef.current({ lat: d.lat, lng: d.lng, bearing: d.bearing })
    })

    return () => {
      try { echo?.leave(`driver.location.${driverId}`) } catch { /* ok */ }
    }
  }, [driverId])
}
