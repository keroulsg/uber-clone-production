import { cn } from '@/lib/utils'
import type { RideStatus } from '@/types'

interface Step {
  key: RideStatus | 'requested'
  label: string
  description?: string
}

const DEFAULT_STEPS: Step[] = [
  { key: 'requested', label: 'Requested', description: 'Ride request sent' },
  { key: 'driver_assigned', label: 'Driver Assigned', description: 'A driver is on the way' },
  { key: 'driver_arrived', label: 'Driver Arrived', description: 'Driver has reached your location' },
  { key: 'ride_started', label: 'Ride Started', description: 'Your trip has begun' },
  { key: 'ride_completed', label: 'Completed', description: 'You have arrived at your destination' },
]

interface RideStatusStepperProps {
  currentStatus: RideStatus
  steps?: Step[]
  className?: string
}

const STATUS_ORDER: RideStatus[] = [
  'pending',
  'searching_driver',
  'driver_assigned',
  'driver_arrived',
  'ride_started',
  'ride_completed',
]

export function RideStatusStepper({ currentStatus, steps = DEFAULT_STEPS, className }: RideStatusStepperProps) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus)

  return (
    <div className={cn('space-y-0', className)}>
      {steps.map((step, index) => {
        const stepStatus = step.key === 'requested' ? -1 : STATUS_ORDER.indexOf(step.key as RideStatus)
        const isCompleted = stepStatus !== -1 && currentIndex > stepStatus
        const isCurrent = step.key === currentStatus || (step.key === 'requested' && currentStatus === 'pending')
        const isPending = !isCompleted && !isCurrent

        return (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors',
                  isCompleted && 'border-primary bg-primary text-primary-foreground',
                  isCurrent && 'border-primary text-primary',
                  isPending && 'border-muted-foreground/30 text-muted-foreground/30'
                )}
              >
                {isCompleted ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-0.5 h-8 transition-colors',
                    isCompleted ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </div>
            <div className={cn('pb-8', index === steps.length - 1 && 'pb-0')}>
              <p
                className={cn(
                  'text-sm font-medium leading-8',
                  isCompleted && 'text-muted-foreground',
                  isCurrent && 'text-primary font-semibold',
                  isPending && 'text-muted-foreground/40'
                )}
              >
                {step.label}
              </p>
              {step.description && (isCurrent || isCompleted) && (
                <p className="text-xs text-muted-foreground -mt-1">{step.description}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
