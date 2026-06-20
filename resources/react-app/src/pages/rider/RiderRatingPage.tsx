import { useState, useMemo } from 'react'
import {
  Star, MessageSquare,
} from 'lucide-react'
import { useMyRiderRatings } from '@/hooks/useRatings'
import { formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { RatingStars } from '@/components/common/RatingStars'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import type { Rating } from '@/types'

type FilterType = 'all' | '5' | '4' | '3' | '2' | '1'

export default function RiderRatingPage() {
  const [filter, setFilter] = useState<FilterType>('all')

  const { data, isLoading, error, refetch } = useMyRiderRatings()

  const response = data?.data
  const ratings = (response?.data ?? []) as Rating[]
  const meta = response?.meta as { averageRating: number; totalReviews: number; distribution: Record<number, number> } | undefined

  const averageRating = meta?.averageRating ?? 0
  const totalRatings = meta?.totalReviews ?? ratings.length
  const distribution = meta?.distribution ?? { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }

  const filteredRatings = useMemo(() => {
    if (filter === 'all') return ratings
    const star = parseInt(filter)
    return ratings.filter((r) => Math.round(r.rating) === star)
  }, [ratings, filter])

  if (isLoading) return <LoadingScreen />
  if (error) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader title="My Ratings" description="See what drivers think about you" />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-6xl font-bold mb-2">{averageRating.toFixed(1)}</p>
            <RatingStars rating={averageRating} size="lg" className="justify-center mb-2" />
            <p className="text-sm text-muted-foreground">
              {totalRatings} {totalRatings === 1 ? 'review' : 'reviews'}
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const count = distribution[star] ?? 0
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
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRatings.length === 0 ? (
            <EmptyState title="No reviews yet" description="Reviews will appear here after drivers rate you" />
          ) : (
            <div className="space-y-4">
              {filteredRatings.map((rating: Rating) => (
                <div key={rating.id} className="p-4 rounded-lg border space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-primary">
                          {rating.rater?.name?.charAt(0) ?? 'D'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{rating.rater?.name ?? 'Driver'}</p>
                        <p className="text-xs text-muted-foreground">
                          {rating.ride?.bookingId ? `Ride ${rating.ride.bookingId}` : ''} &middot; {formatDate(rating.createdAt)}
                        </p>
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
