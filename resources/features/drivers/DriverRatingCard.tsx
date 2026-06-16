import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RatingStars } from '@/components/common/RatingStars'

interface DriverRatingCardProps {
  driverName: string
  rideId: string
  onSubmit: (rating: number, comment: string) => void
  isSubmitting?: boolean
  className?: string
}

export function DriverRatingCard({ driverName, rideId, onSubmit, isSubmitting, className }: DriverRatingCardProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (rating === 0) {
      setError('Please select a rating')
      return
    }
    setError('')
    onSubmit(rating, comment)
  }

  const prompts = [
    { min: 1, max: 2, text: 'Tell us what went wrong' },
    { min: 3, max: 3, text: 'How could we improve?' },
    { min: 4, max: 5, text: 'What did you enjoy?' },
  ]

  const currentPrompt = prompts.find((p) => rating >= p.min && rating <= p.max)

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="text-lg text-center">Rate {driverName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <RatingStars
            rating={rating}
            size="lg"
            interactive
            onChange={(value) => {
              setRating(value)
              setError('')
            }}
          />
        </div>

        {currentPrompt && (
          <p className="text-center text-sm text-muted-foreground">{currentPrompt.text}</p>
        )}

        <Input
          placeholder="Leave a comment (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
        />

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Rating'}
        </Button>
      </CardContent>
    </Card>
  )
}
