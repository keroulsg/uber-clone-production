<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DriverBriefResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'user' => new UserBriefResource($this->whenLoaded('user')),
            'averageRating' => (float) $this->average_rating,
            'totalRides' => $this->total_rides,
            'vehicle' => $this->whenLoaded('vehicles', fn() => new VehicleBriefResource($this->vehicles->first())),
        ];
    }
}
