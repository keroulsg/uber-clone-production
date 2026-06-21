const SOUND_URL = '/sounds/notification.wav'
const STORAGE_KEY = 'notification_sound_unlocked'
const LEGACY_KEYS = ['lastSeenNotifIds', 'notification_sound_seen_ids']

let unlocked = typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'true'
const activeLoops: Map<string, { timer: ReturnType<typeof setInterval>; timeout: ReturnType<typeof setTimeout> }> = new Map()

export function clearLegacySoundState(): void {
  if (typeof window === 'undefined') return
  for (const key of LEGACY_KEYS) {
    try { localStorage.removeItem(key) } catch {}
  }
}

export function unlockNotificationSound(): boolean {
  if (unlocked) return true
  unlocked = true
  try { localStorage.setItem(STORAGE_KEY, 'true') } catch {}
  return true
}

export function canPlaySound(): boolean { return unlocked }

function playOnce(volume: number): void {
  if (!unlocked) return
  const vol = Math.max(0, Math.min(100, volume)) / 100
  if (vol <= 0) return
  try {
    const a = new Audio(SOUND_URL)
    a.volume = vol
    a.currentTime = 0
    a.play().catch(() => {})
  } catch {}
}

export function playNotificationSound(volume: number = 100): void {
  playOnce(volume)
}

export function startLimitedSoundLoop(key: string, volume: number, intervalMs: number, maxDurationMs: number): void {
  stopSoundLoop(key)
  playOnce(volume)
  const timer = setInterval(() => playOnce(volume), intervalMs)
  const timeout = setTimeout(() => stopSoundLoop(key), maxDurationMs)
  activeLoops.set(key, { timer, timeout })
}

export function stopSoundLoop(key: string): void {
  const loop = activeLoops.get(key)
  if (!loop) return
  clearInterval(loop.timer)
  clearTimeout(loop.timeout)
  activeLoops.delete(key)
}

export function stopAllSoundLoops(): void {
  for (const key of activeLoops.keys()) stopSoundLoop(key)
}
