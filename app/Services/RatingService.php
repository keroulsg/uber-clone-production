<?php

namespace App\Services;

use App\Models\Rating;
use App\Models\Ride;
use App\Models\Driver;
use App\Models\Rider;
use App\Repositories\RatingRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class RatingService
{
    public function __construct(
        private RatingRepository $ratingRepo,
    ) {}

    public function rateDriver(int $rideId, int $raterId, int $rating, ?string $comment = null): Rating
    {
        $ratingModel = DB::transaction(function () use ($rideId, $raterId, $rating, $comment) {
            $ratingModel = $this->ratingRepo->create([
                'ride_id' => $rideId,
                'rater_id' => $raterId,
                'rater_type' => 'rider',
                'rating' => $rating,
                'comment' => $comment,
            ]);

            Ride::where('id', $rideId)->update(['rating_by_rider' => true]);

            $ride = Ride::find($rideId);
            if ($ride && $ride->driver_id) {
                $avg = Rating::whereHas('ride', fn($q) => $q->where('driver_id', $ride->driver_id))
                    ->where('rater_type', 'rider')
                    ->avg('rating');
                Driver::where('id', $ride->driver_id)->update(['average_rating' => round($avg ?: 0, 2)]);
            }

            return $ratingModel;
        });

        return $ratingModel;
    }

    public function rateRider(int $rideId, int $raterId, int $rating, ?string $comment = null): Rating
    {
        $ratingModel = DB::transaction(function () use ($rideId, $raterId, $rating, $comment) {
            $ratingModel = $this->ratingRepo->create([
                'ride_id' => $rideId,
                'rater_id' => $raterId,
                'rater_type' => 'driver',
                'rating' => $rating,
                'comment' => $comment,
            ]);

            Ride::where('id', $rideId)->update(['rating_by_driver' => true]);

            $ride = Ride::find($rideId);
            if ($ride && $ride->rider_id) {
                $rider = Rider::where('user_id', $ride->rider_id)->first();
                if ($rider) {
                    $avg = Rating::whereHas('ride', fn($q) => $q->where('rider_id', $ride->rider_id))
                        ->where('rater_type', 'driver')
                        ->avg('rating');
                    $rider->update(['average_rating' => round($avg ?: 0, 2)]);
                }
            }

            return $ratingModel;
        });

        return $ratingModel;
    }

    public function getDriverRatings(int $driverId): Collection
    {
        return Rating::whereHas('ride', fn($q) => $q->where('driver_id', $driverId))
            ->where('rater_type', 'rider')
            ->get();
    }

    public function getRiderRatings(int $riderId): Collection
    {
        return Rating::whereHas('ride', fn($q) => $q->where('rider_id', $riderId))
            ->where('rater_type', 'driver')
            ->get();
    }
}
