import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

let echo: Echo<'pusher'> | null = null

const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY

if (pusherKey) {
  Pusher.logToConsole = import.meta.env.DEV

  echo = new Echo<'pusher'>({
    broadcaster: 'pusher',
    key: pusherKey,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
    wsHost: import.meta.env.VITE_PUSHER_HOST || undefined,
    wsPort: import.meta.env.VITE_PUSHER_PORT || 443,
    wssPort: import.meta.env.VITE_PUSHER_PORT || 443,
    forceTLS: (import.meta.env.VITE_PUSHER_SCHEME || 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${import.meta.env.VITE_API_URL}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        Accept: 'application/json',
      },
    },
  })
}

export { echo }
export default echo
