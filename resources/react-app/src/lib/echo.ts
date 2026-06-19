import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

let echo: Echo<'pusher'> | null = null

function isRealtimeEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_REALTIME === 'true'
}

function createEcho(): Echo<'pusher'> | null {
  if (!isRealtimeEnabled()) return null

  const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY
  if (!pusherKey) return null

  Pusher.logToConsole = import.meta.env.DEV

  const token = localStorage.getItem('auth_token')

  return new Echo<'pusher'>({
    broadcaster: 'pusher',
    key: pusherKey,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
    wsHost: import.meta.env.VITE_PUSHER_HOST || undefined,
    wsPort: import.meta.env.VITE_PUSHER_PORT ? Number(import.meta.env.VITE_PUSHER_PORT) : 443,
    wssPort: import.meta.env.VITE_PUSHER_PORT ? Number(import.meta.env.VITE_PUSHER_PORT) : 443,
    forceTLS: (import.meta.env.VITE_PUSHER_SCHEME || 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${import.meta.env.VITE_API_URL}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  })
}

export function getEcho(): Echo<'pusher'> | null {
  if (!isRealtimeEnabled()) return null
  if (!echo) {
    echo = createEcho()
  }
  return echo
}

export function reconnectEcho(): Echo<'pusher'> | null {
  if (!isRealtimeEnabled()) return null
  if (echo) {
    try { echo.disconnect() } catch { /* ok */ }
    echo = null
  }
  return getEcho()
}

export function destroyEcho() {
  if (echo) {
    try { echo.disconnect() } catch { /* ok */ }
    echo = null
  }
}
