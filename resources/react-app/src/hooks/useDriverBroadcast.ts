import { useEffect, useRef } from 'react'
import { getEcho } from '@/lib/echo'

export interface IncomingRideRequest {
  ride_id: number
  booking_id: string
  pickup: { lat: number; lng: number; address: string }
  dropoff: { lat: number; lng: number; address: string }
  distance_km: number
  duration_min: number
  estimated_price: number
  status: string
}

export function useDriverBroadcast(
  driverId: number | string | null,
  onRideRequested?: (ride: IncomingRideRequest) => void,
) {
  const handlerRef = useRef(onRideRequested)
  handlerRef.current = onRideRequested

  useEffect(() => {
    const e = getEcho()
    if (!driverId || !e) return

    const channel = e.private(`driver.${driverId}`)

    const handler = (data: unknown) => {
      handlerRef.current?.(data as IncomingRideRequest)
    }
    channel.listen('.ride.requested', handler)

    return () => {
      try { channel.stopListening('.ride.requested', handler) } catch { /* ok */ }
      try { e.leave(`driver.${driverId}`) } catch { /* ok */ }
    }
  }, [driverId])
}

export function useDriverRideChannel(
  rideId: number | string | null,
  events: {
    onCancelled?: (data: Record<string, unknown>) => void
    onRejected?: (data: Record<string, unknown>) => void
  },
) {
  const eventsRef = useRef(events)
  eventsRef.current = events

  useEffect(() => {
    const e = getEcho()
    if (!rideId || !e) return

    const channel = e.private(`ride.${rideId}`)

    const cleanups: (() => void)[] = []

    if (events.onCancelled) {
      const handler = (d: unknown) => eventsRef.current.onCancelled?.(d as Record<string, unknown>)
      channel.listen('.ride.cancelled', handler)
      cleanups.push(() => { try { channel.stopListening('.ride.cancelled', handler) } catch { /* ok */ } })
    }

    if (events.onRejected) {
      const handler = (d: unknown) => eventsRef.current.onRejected?.(d as Record<string, unknown>)
      channel.listen('.ride.rejected', handler)
      cleanups.push(() => { try { channel.stopListening('.ride.rejected', handler) } catch { /* ok */ } })
    }

    return () => {
      cleanups.forEach((fn) => fn())
      try { e.leave(`ride.${rideId}`) } catch { /* ok */ }
    }
  }, [rideId])
}
