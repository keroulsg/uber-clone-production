import { ServerCrash, WifiOff, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorScreenProps {
  type?: 'server' | 'offline' | 'timeout'
  onRetry?: () => void
  message?: string
}

const config = {
  server: {
    icon: ServerCrash,
    title: 'Server Error',
    description: 'Our servers are having trouble. Please try again later.',
  },
  offline: {
    icon: WifiOff,
    title: 'No Connection',
    description: 'You appear to be offline. Check your internet connection.',
  },
  timeout: {
    icon: Clock,
    title: 'Request Timed Out',
    description: 'The request took too long to complete. Please try again.',
  },
}

export function ErrorScreen({ type = 'server', onRetry, message }: ErrorScreenProps) {
  const { icon: Icon, title, description } = config[type]

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
      <div className="rounded-full bg-muted p-6 mb-6">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground max-w-md mb-8">{message || description}</p>
      {onRetry && (
        <Button onClick={onRetry} size="lg">
          Try Again
        </Button>
      )}
    </div>
  )
}
