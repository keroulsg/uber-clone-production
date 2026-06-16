import { cn } from '@/lib/utils'
import { StatCard } from '@/components/common/StatCard'

interface StatItem {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend?: { value: number; isPositive: boolean }
  variant?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
}

interface StatsGridProps {
  stats: StatItem[]
  columns?: 2 | 3 | 4
  className?: string
}

const columnMap = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

export function StatsGrid({ stats, columns = 4, className }: StatsGridProps) {
  if (stats.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No statistics available
      </div>
    )
  }

  return (
    <div className={cn('grid gap-4', columnMap[columns], className)}>
      {stats.map((stat) => (
        <StatCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          trend={stat.trend}
          variant={stat.variant}
        />
      ))}
    </div>
  )
}
