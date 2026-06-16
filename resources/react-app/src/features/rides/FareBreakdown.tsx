import { cn, formatCurrency } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import type { FareBreakdown as FareBreakdownType } from '@/types'

interface FareBreakdownProps {
  breakdown: FareBreakdownType
  className?: string
}

interface FareLine {
  label: string
  amount: number
  highlight?: boolean
  negative?: boolean
}

export function FareBreakdown({ breakdown, className }: FareBreakdownProps) {
  const lines: FareLine[] = [
    { label: 'Base fare', amount: breakdown.base },
    { label: 'Distance', amount: breakdown.distance },
    { label: 'Time', amount: breakdown.time },
    ...(breakdown.waiting > 0 ? [{ label: 'Waiting', amount: breakdown.waiting }] : []),
    ...(breakdown.surge > 0 ? [{ label: 'Surge pricing', amount: breakdown.surge, highlight: true }] : []),
    ...(breakdown.night > 0 ? [{ label: 'Night surcharge', amount: breakdown.night, highlight: true }] : []),
    ...(breakdown.peak > 0 ? [{ label: 'Peak pricing', amount: breakdown.peak, highlight: true }] : []),
    ...(breakdown.toll > 0 ? [{ label: 'Toll', amount: breakdown.toll }] : []),
    ...(breakdown.cancellation > 0 ? [{ label: 'Cancellation fee', amount: breakdown.cancellation }] : []),
    ...(breakdown.discount > 0 ? [{ label: 'Discount', amount: -breakdown.discount, negative: true }] : []),
    ...(breakdown.promo > 0 ? [{ label: 'Promo applied', amount: -breakdown.promo, negative: true }] : []),
  ]

  return (
    <div className={cn('space-y-2', className)}>
      {lines.map((line) => (
        <div
          key={line.label}
          className={cn(
            'flex items-center justify-between text-sm',
            line.highlight && 'text-amber-600 dark:text-amber-400',
            line.negative && 'text-emerald-600 dark:text-emerald-400'
          )}
        >
          <span className="text-muted-foreground">{line.label}</span>
          <span className="font-medium tabular-nums">
            {line.negative ? '-' : '+'}{formatCurrency(Math.abs(line.amount))}
          </span>
        </div>
      ))}

      <Separator className="my-2" />

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Total</span>
        <span className="text-lg font-bold tabular-nums">{formatCurrency(breakdown.total)}</span>
      </div>
    </div>
  )
}
