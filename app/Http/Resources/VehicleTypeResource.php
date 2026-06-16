<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VehicleTypeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'icon' => $this->icon,
            'base_fare' => (float) $this->base_fare,
            'per_km_rate' => (float) $this->per_km_rate,
            'per_minute_rate' => (float) $this->per_minute_rate,
            'minimum_fare' => (float) $this->minimum_fare,
            'cancellation_fee' => (float) $this->cancellation_fee,
            'seating_capacity' => $this->seating_capacity,
            'image_url' => $this->image_url,
            'is_active' => $this->is_active,
        ];
    }
}
