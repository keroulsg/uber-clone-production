import { Car, Users, Clock } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import type { VehicleType } from '@/types'

interface VehicleOption extends VehicleType {
  eta?: number
  estimatedFare: number
}

interface VehicleTypeSelectorProps {
  vehicles: VehicleOption[]
  selectedId?: string
  onSelect: (vehicle: VehicleOption) => void
  className?: string
}

export function VehicleTypeSelector({ vehicles, selectedId, onSelect, className }: VehicleTypeSelectorProps) {
  if (vehicles.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No vehicles available at the moment
      </div>
    )
  }

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-3', className)}>
      {vehicles.map((vehicle) => {
        const isSelected = vehicle.id === selectedId

        return (
          <Card
            key={vehicle.id}
            className={cn(
              'relative p-4 cursor-pointer transition-all border-2 hover:border-primary/50',
              isSelected ? 'border-primary bg-primary/5' : 'border-border'
            )}
            onClick={() => onSelect(vehicle)}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                <Car className="h-6 w-6" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold truncate">{vehicle.name}</h4>
                  <span className="font-bold tabular-nums text-sm">{formatCurrency(vehicle.estimatedFare)}</span>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {vehicle.description}
                </p>

                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  {vehicle.eta != null && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {vehicle.eta} min
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {vehicle.seating_capacity}
                  </span>
                </div>
              </div>
            </div>

            {/* Radio indicator */}
            <div
              className={cn(
                'absolute top-3 right-3 h-4 w-4 rounded-full border-2 transition-colors',
                isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
              )}
            >
              {isSelected && (
                <svg className="h-full w-full p-0.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
