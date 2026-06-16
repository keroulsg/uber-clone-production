import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InlineErrorProps {
  message?: string
  className?: string
}

export function InlineError({ message, className }: InlineErrorProps) {
  if (!message) return null

  return (
    <p className={cn('flex items-center gap-1.5 text-sm text-destructive mt-1', className)}>
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      <span>{message}</span>
    </p>
  )
}
