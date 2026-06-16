<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RiderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'userId' => (string) $this->user_id,
            'user' => new UserResource($this->whenLoaded('user')),
            'gender' => $this->gender,
            'totalRides' => $this->total_rides,
            'totalSpent' => (float) $this->total_spent,
            'averageRating' => (float) $this->average_rating,
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
