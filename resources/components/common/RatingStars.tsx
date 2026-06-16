import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingStarsProps {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onChange?: (rating: number) => void
  className?: string
  showValue?: boolean
}

const sizeMap = {
  sm: 'h-3.5 w-3.5',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
}

const starGapMap = {
  sm: 'gap-0.5',
  md: 'gap-1',
  lg: 'gap-1.5',
}

export function RatingStars({
  rating,
  size = 'md',
  interactive = false,
  onChange,
  className,
  showValue = false,
}: RatingStarsProps) {
  const [hoveredRating, setHoveredRating] = useState(0)

  const displayRating = interactive && hoveredRating > 0 ? hoveredRating : rating

  const stars = Array.from({ length: 5 }, (_, i) => {
    const starValue = i + 1
    const filled = displayRating >= starValue
    const halfFilled = !filled && displayRating >= starValue - 0.5

    return { starValue, filled, halfFilled }
  })

  return (
    <div className={cn('inline-flex items-center', className)}>
      <div className={cn('flex', starGapMap[size])}>
        {stars.map(({ starValue, filled, halfFilled }) => (
          <button
            key={starValue}
            type="button"
            disabled={!interactive}
            className={cn(
              'transition-colors',
              interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default',
              filled && 'text-amber-400',
              !filled && !halfFilled && 'text-muted-foreground/30',
              halfFilled && !filled && 'text-amber-400/50'
            )}
            onClick={() => {
              if (interactive && onChange) {
                onChange(starValue)
              }
            }}
            onMouseEnter={() => interactive && setHoveredRating(starValue)}
            onMouseLeave={() => interactive && setHoveredRating(0)}
          >
            {halfFilled && !filled ? (
              <span className="relative inline-block">
                <Star className={cn(sizeMap[size], 'fill-current')} />
              </span>
            ) : (
              <Star
                className={cn(
                  sizeMap[size],
                  filled ? 'fill-current' : 'fill-none'
                )}
              />
            )}
          </button>
        ))}
      </div>
      {showValue && (
        <span className="ml-2 text-sm font-medium text-muted-foreground">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
