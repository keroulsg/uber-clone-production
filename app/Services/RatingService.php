<?php

namespace App\Services;

use App\Models\Rating;
use App\Models\Ride;
use App\Models\Driver;
use App\Models\Rider;
use App\Repositories\RatingRepository;
use App\Events\RatingReceived;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class RatingService
{
    public function __construct(
        private RatingRepository $ratingRepo,
    ) {}

    public function rateDriver(int $rideId, int $raterId, int $rating, ?string $comment = null): Rating
    {
        $existing = Rating::where('ride_id', $rideId)->where('rater_type', 'rider')->exists();
        if ($existing) {
            throw new \RuntimeException('You have already rated this ride');
        }

        $ride = Ride::find($rideId);
        if (!$ride || $ride->status->value !== 'ride_completed' && $ride->status->value !== 'completed') {
            throw new \RuntimeException('You can only rate a completed ride');
        }

        $ratingModel = DB::transaction(function () use ($rideId, $raterId, $rating, $comment) {
            $ratingModel = $this->ratingRepo->create([
                'ride_id' => $rideId,
                'rater_id' => $raterId,
                'rater_type' => 'rider',
                'rating' => $rating,
                'comment' => $comment,
            ]);

            Ride::where('id', $rideId)->update(['rating_by_rider' => true, 'rider_completed_dismissed_at' => now()]);

            $ride = Ride::find($rideId);
            if ($ride && $ride->driver_id) {
                $avg = Rating::whereHas('ride', fn($q) => $q->where('driver_id', $ride->driver_id))
                    ->where('rater_type', 'rider')
                    ->avg('rating');
                Driver::where('id', $ride->driver_id)->update(['average_rating' => round($avg ?: 0, 2)]);

                // Send rating notification to driver
                $driver = Driver::find($ride->driver_id);
                if ($driver) {
                    \App\Models\Notification::create([
                        'type' => 'rating_received',
                        'notifiable_type' => \App\Models\User::class,
                        'notifiable_id' => $driver->user_id,
                        'data' => [
                            'ride_id' => $rideId,
                            'rating' => $rating,
                            'message' => "You received a {$rating}-star rating.",
                        ],
                    ]);

                    event(new RatingReceived($ratingModel, $driver->user_id));
                }
            }

            return $ratingModel;
        });

        return $ratingModel;
    }

    public function rateRider(int $rideId, int $raterId, int $rating, ?string $comment = null): Rating
    {
        $existing = Rating::where('ride_id', $rideId)->where('rater_type', 'driver')->exists();
        if ($existing) {
            throw new \RuntimeException('You have already rated this ride');
        }

        $ride = Ride::find($rideId);
        if (!$ride || $ride->status->value !== 'ride_completed' && $ride->status->value !== 'completed') {
            throw new \RuntimeException('You can only rate a completed ride');
        }

        $ratingModel = DB::transaction(function () use ($rideId, $raterId, $rating, $comment) {
            $ratingModel = $this->ratingRepo->create([
                'ride_id' => $rideId,
                'rater_id' => $raterId,
                'rater_type' => 'driver',
                'rating' => $rating,
                'comment' => $comment,
            ]);

            Ride::where('id', $rideId)->update(['rating_by_driver' => true, 'driver_completed_dismissed_at' => now()]);

            $ride = Ride::find($rideId);
            if ($ride && $ride->rider_id) {
                $rider = Rider::where('user_id', $ride->rider_id)->first();
                if ($rider) {
                    $avg = Rating::whereHas('ride', fn($q) => $q->where('rider_id', $ride->rider_id))
                        ->where('rater_type', 'driver')
                        ->avg('rating');
                    $rider->update(['average_rating' => round($avg ?: 0, 2)]);

                    // Send rating notification to rider
                    \App\Models\Notification::create([
                        'type' => 'rating_received',
                        'notifiable_type' => \App\Models\User::class,
                        'notifiable_id' => $ride->rider_id,
                        'data' => [
                            'ride_id' => $rideId,
                            'rating' => $rating,
                            'message' => "You received a {$rating}-star rating from your driver.",
                        ],
                    ]);

                    event(new RatingReceived($ratingModel, $ride->rider_id));
                }
            }

            return $ratingModel;
        });

        return $ratingModel;
    }

    public function getDriverRatings(int $driverId): Collection
    {
        return Rating::with(['raterUser', 'ride'])
            ->whereHas('ride', fn($q) => $q->where('driver_id', $driverId))
            ->where('rater_type', 'rider')
            ->latest()
            ->get();
    }

    public function getRiderRatings(int $riderId): Collection
    {
        return Rating::with(['raterUser', 'ride'])
            ->whereHas('ride', fn($q) => $q->where('rider_id', $riderId))
            ->where('rater_type', 'driver')
            ->latest()
            ->get();
    }
}
