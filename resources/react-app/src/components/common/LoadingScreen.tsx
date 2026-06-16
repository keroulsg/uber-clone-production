import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingScreenProps {
  message?: string
  className?: string
  fullScreen?: boolean
}

export function LoadingScreen({ message = 'Loading...', className, fullScreen = true }: LoadingScreenProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        fullScreen ? 'fixed inset-0 bg-background/80 backdrop-blur-sm z-50' : 'min-h-[400px]',
        className
      )}
    >
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  )
}
