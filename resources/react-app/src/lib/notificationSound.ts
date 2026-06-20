const SOUND_URL = '/sounds/notification.wav'
const STORAGE_KEY = 'notification_sound_unlocked'

let audioElement: HTMLAudioElement | null = null
let unlocked = typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'true'

export function unlockNotificationSound(): boolean {
  unlocked = true
  try { localStorage.setItem(STORAGE_KEY, 'true') } catch { /* ok */ }
  return true
}

export function canPlaySound(): boolean {
  return unlocked
}

export function playNotificationSound(volume: number = 100): void {
  if (!unlocked) return

  const vol = Math.max(0, Math.min(100, volume)) / 100
  if (vol <= 0) return

  try {
    if (audioElement) {
      audioElement.pause()
      audioElement = null
    }
    audioElement = new Audio(SOUND_URL)
    audioElement.volume = vol
    audioElement.play().catch(() => {})
  } catch { /* audio not available */ }
}
