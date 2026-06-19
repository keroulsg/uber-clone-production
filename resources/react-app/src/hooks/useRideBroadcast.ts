import { useEffect, useRef } from 'react'
import { getEcho } from '@/lib/echo'

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
    const e = getEcho()
    if (!rideId || !e) return

    const channel = e.private(`ride.${rideId}`)

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
      try { e.leave(`ride.${rideId}`) } catch { /* ok */ }
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
    const e = getEcho()
    if (!driverId || !e) return

    const channel = e.private(`driver.location.${driverId}`)

    const handler = (data: unknown) => {
      const d = data as { lat: number; lng: number; bearing?: number }
      handlerRef.current({ lat: d.lat, lng: d.lng, bearing: d.bearing })
    }
    channel.listen('.driver.location.updated', handler)

    return () => {
      try { channel.stopListening('.driver.location.updated', handler) } catch { /* ok */ }
      try { e.leave(`driver.location.${driverId}`) } catch { /* ok */ }
    }
  }, [driverId])
}
