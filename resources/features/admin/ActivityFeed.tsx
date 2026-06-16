import { cn, formatDate, getInitials } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

interface Activity {
  id: string
  user: {
    name: string
    avatarUrl?: string
  }
  action: string
  target?: string
  timestamp: string
  icon?: React.ComponentType<{ className?: string }>
}

interface ActivityFeedProps {
  activities: Activity[]
  className?: string
  maxItems?: number
}

export function ActivityFeed({ activities, className, maxItems }: ActivityFeedProps) {
  const displayActivities = maxItems ? activities.slice(0, maxItems) : activities

  if (displayActivities.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No recent activity
      </div>
    )
  }

  return (
    <div className={cn('space-y-0', className)}>
      {displayActivities.map((activity, index) => (
        <div key={activity.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <Avatar className="h-8 w-8">
              <AvatarImage src={activity.user.avatarUrl} alt={activity.user.name} />
              <AvatarFallback className="text-xs">{getInitials(activity.user.name)}</AvatarFallback>
            </Avatar>
            {index < displayActivities.length - 1 && (
              <div className="w-0.5 flex-1 bg-border min-h-[24px]" />
            )}
          </div>

          <div className={cn('pb-4 flex-1', index === displayActivities.length - 1 && 'pb-0')}>
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{activity.user.name}</span>
                  <span className="text-muted-foreground"> {activity.action}</span>
                  {activity.target && (
                    <span className="font-medium"> {activity.target}</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(activity.timestamp)}
                </p>
              </div>
              {activity.icon && (
                <activity.icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
