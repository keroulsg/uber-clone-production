import { useEffect, useRef } from 'react'
import { startLimitedSoundLoop, stopSoundLoop, stopAllSoundLoops } from '@/lib/notificationSound'
import { useAuthStore } from '@/stores/authStore'

export function useNewRequestSound(requests: any[], volume: number = 100): void {
  const user = useAuthStore((s) => s.user)
  const isDriver = user?.roles?.includes('driver')
  const initializedRef = useRef(false)
  const seenIdsRef = useRef(new Set<string>())

  useEffect(() => {
    if (!isDriver) return

    const currentIds = new Set(requests.map((r: any) => String(r.id)))

    if (!initializedRef.current) {
      currentIds.forEach((id) => seenIdsRef.current.add(id))
      initializedRef.current = true
      return
    }

    // Play sound for new IDs
    for (const id of currentIds) {
      if (!seenIdsRef.current.has(id)) {
        seenIdsRef.current.add(id)
        startLimitedSoundLoop(`driver_request_${id}`, volume, 2000, 10000)
      }
    }

    // Stop loops for IDs that disappeared
    for (const seenId of seenIdsRef.current) {
      if (!currentIds.has(seenId)) {
        stopSoundLoop(`driver_request_${seenId}`)
      }
    }

    seenIdsRef.current = currentIds
  }, [requests, isDriver, volume])

  useEffect(() => {
    return () => stopAllSoundLoops()
  }, [])
}
