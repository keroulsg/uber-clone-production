<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RatingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'rideId' => (string) $this->ride_id,
            'rater' => new UserBriefResource($this->whenLoaded('raterUser')),
            'ride' => $this->whenLoaded('ride', fn() => [
                'bookingId' => $this->ride->booking_id ?? null,
            ]),
            'rating' => $this->rating,
            'comment' => $this->comment,
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
