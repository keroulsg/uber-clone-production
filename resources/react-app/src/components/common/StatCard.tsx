import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

type StatVariant = 'blue' | 'green' | 'yellow' | 'red' | 'purple'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend?: { value: number; isPositive: boolean }
  variant?: StatVariant
  className?: string
  href?: string
}

const variantStyles: Record<StatVariant, { bg: string; icon: string; text: string }> = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-950/50', icon: 'text-blue-600 dark:text-blue-400', text: 'text-blue-700 dark:text-blue-300' },
  green: { bg: 'bg-emerald-50 dark:bg-emerald-950/50', icon: 'text-emerald-600 dark:text-emerald-400', text: 'text-emerald-700 dark:text-emerald-300' },
  yellow: { bg: 'bg-amber-50 dark:bg-amber-950/50', icon: 'text-amber-600 dark:text-amber-400', text: 'text-amber-700 dark:text-amber-300' },
  red: { bg: 'bg-red-50 dark:bg-red-950/50', icon: 'text-red-600 dark:text-red-400', text: 'text-red-700 dark:text-red-300' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-950/50', icon: 'text-purple-600 dark:text-purple-400', text: 'text-purple-700 dark:text-purple-300' },
}

export function StatCard({ title, value, icon: Icon, trend, variant = 'blue', className, href }: StatCardProps) {
  const styles = variantStyles[variant]

  const card = (
    <Card className={cn('overflow-hidden transition-shadow hover:shadow-md cursor-pointer', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 text-sm">
                {trend.isPositive ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                  {Math.abs(trend.value)}%
                </span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            )}
          </div>
          <div className={cn('rounded-xl p-3', styles.bg)}>
            <Icon className={cn('h-6 w-6', styles.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (href) {
    return <Link to={href}>{card}</Link>
  }

  return card
}
