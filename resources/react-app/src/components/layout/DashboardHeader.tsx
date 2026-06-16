'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface DashboardHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function DashboardHeader({ title, description, actions, className }: DashboardHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6', className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <time
          dateTime={currentTime.toISOString()}
          className="text-sm text-muted-foreground hidden sm:block"
        >
          {format(currentTime, 'EEEE, MMMM d, yyyy h:mm a')}
        </time>
        {actions}
      </div>
    </div>
  )
}
