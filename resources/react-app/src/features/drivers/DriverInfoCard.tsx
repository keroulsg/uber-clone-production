import { Phone, Star, Car } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import type { Driver } from '@/types'

interface DriverInfoCardProps {
  driver: Driver
  onContact?: (driverId: string) => void
  className?: string
}

export function DriverInfoCard({ driver, onContact, className }: DriverInfoCardProps) {
  const vehicle = driver.vehicle

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={driver.user?.avatarUrl} alt={driver.user?.name} />
            <AvatarFallback>{getInitials(driver.user?.name)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{driver.user?.name}</h3>

            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {driver.averageRating?.toFixed(1) ?? 'N/A'}
              </span>
              <span>{driver.totalRides} rides</span>
            </div>

            {vehicle && (
              <div className="mt-3 pt-3 border-t space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {vehicle.color} {vehicle.make} {vehicle.model} ({vehicle.year})
                  </span>
                </div>
                <p className="text-xs text-muted-foreground ml-6 font-mono">
                  {vehicle.licensePlate}
                </p>
              </div>
            )}
          </div>
        </div>

        {onContact && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => onContact(driver.id)}
          >
            <Phone className="h-4 w-4 mr-2" />
            Contact Driver
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
