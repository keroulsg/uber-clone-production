<?php

namespace App\Repositories;

use App\Models\Rating;
use Illuminate\Database\Eloquent\Collection;

class RatingRepository
{
    public function create(array $data): Rating
    {
        return Rating::create($data);
    }

    public function findByRide(int $rideId): Collection
    {
        return Rating::where('ride_id', $rideId)->get();
    }

    public function findByRater(int $raterId, string $raterType): Collection
    {
        return Rating::where('rater_id', $raterId)->where('rater_type', $raterType)->get();
    }
}
