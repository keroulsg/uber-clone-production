import { useEffect, useRef, useCallback, useState } from 'react'
import { echo } from '@/lib/echo'

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
    if (!driverId || !echo) return

    const channel = echo.private(`driver.${driverId}`)

    channel.listen('.ride.requested', (data: unknown) => {
      handlerRef.current?.(data as IncomingRideRequest)
    })

    return () => {
      try { echo?.leave(`driver.${driverId}`) } catch { /* ok */ }
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
    if (!rideId || !echo) return

    const channel = echo.private(`ride.${rideId}`)

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
      try { echo?.leave(`ride.${rideId}`) } catch { /* ok */ }
    }
  }, [rideId])
}
