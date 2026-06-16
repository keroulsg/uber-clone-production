<?php

namespace App\Services;

use App\Models\Rating;
use App\Repositories\RatingRepository;
use Illuminate\Database\Eloquent\Collection;

class RatingService
{
    public function __construct(
        private RatingRepository $ratingRepo,
    ) {}

    public function rateDriver(int $rideId, int $raterId, int $rating, ?string $comment = null): Rating
    {
        return $this->ratingRepo->create([
            'ride_id' => $rideId,
            'rater_id' => $raterId,
            'rater_type' => 'driver',
            'rating' => $rating,
            'comment' => $comment,
        ]);
    }

    public function rateRider(int $rideId, int $raterId, int $rating, ?string $comment = null): Rating
    {
        return $this->ratingRepo->create([
            'ride_id' => $rideId,
            'rater_id' => $raterId,
            'rater_type' => 'rider',
            'rating' => $rating,
            'comment' => $comment,
        ]);
    }

    public function getDriverRatings(int $driverId): Collection
    {
        return $this->ratingRepo->findByRater($driverId, 'driver');
    }

    public function getRiderRatings(int $riderId): Collection
    {
        return $this->ratingRepo->findByRater($riderId, 'rider');
    }
}
