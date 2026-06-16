import { useState, useMemo } from 'react'
import {
  Star, MessageSquare, ThumbsUp, ThumbsDown, Filter,
} from 'lucide-react'
import { useDriverRatings } from '@/hooks/useRatings'
import { useDriverStore } from '@/stores/driverStore'
import { formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { RatingStars } from '@/components/common/RatingStars'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import type { Rating } from '@/types'

type FilterType = 'all' | 'positive' | 'negative'

export default function DriverRatingPage() {
  const { driverProfile } = useDriverStore()
  const [filter, setFilter] = useState<FilterType>('all')

  const { data, isLoading, error, refetch } = useDriverRatings(driverProfile?.id ?? '', {})

  const ratings = (data?.data?.data ?? []) as Rating[]
  const totalRatings = ratings.length

  const distribution = useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    ratings.forEach((r) => {
      const key = Math.round(r.rating) as keyof typeof dist
      if (key >= 1 && key <= 5) dist[key]++
    })
    return dist
  }, [ratings])

  const averageRating = useMemo(() => {
    if (ratings.length === 0) return 0
    return ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
  }, [ratings])

  const filteredRatings = useMemo(() => {
    switch (filter) {
      case 'positive':
        return ratings.filter((r) => r.rating >= 4)
      case 'negative':
        return ratings.filter((r) => r.rating <= 2)
      default:
        return ratings
    }
  }, [ratings, filter])

  if (isLoading) return <LoadingScreen />
  if (error) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader title="Ratings & Reviews" description="See what riders think about you" />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Average Rating */}
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-6xl font-bold mb-2">{averageRating.toFixed(1)}</p>
            <RatingStars rating={averageRating} size="lg" className="justify-center mb-2" />
            <p className="text-sm text-muted-foreground">
              {totalRatings} {totalRatings === 1 ? 'review' : 'reviews'}
            </p>
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const count = distribution[star]
              const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-8">{star} ★</span>
                  <Progress value={percentage} className="flex-1 h-2.5" />
                  <span className="text-sm text-muted-foreground w-10 text-right">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Reviews */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Reviews</CardTitle>
            <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reviews</SelectItem>
                <SelectItem value="positive">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="h-3.5 w-3.5 text-emerald-500" />
                    Positive
                  </div>
                </SelectItem>
                <SelectItem value="negative">
                  <div className="flex items-center gap-2">
                    <ThumbsDown className="h-3.5 w-3.5 text-red-500" />
                    Negative
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRatings.length === 0 ? (
            <EmptyState title="No reviews yet" description="Reviews will appear here after riders rate you" />
          ) : (
            <div className="space-y-4">
              {filteredRatings.map((rating: Rating) => (
                <div key={rating.id} className="p-4 rounded-lg border space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-primary">
                          {rating.rater?.name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{rating.rater?.name}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(rating.createdAt)}</p>
                      </div>
                    </div>
                    <RatingStars rating={rating.rating} size="sm" />
                  </div>
                  {rating.comment && (
                    <div className="flex items-start gap-2 pt-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-sm text-muted-foreground">{rating.comment}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
