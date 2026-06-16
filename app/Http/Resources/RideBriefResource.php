<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RideBriefResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'bookingId' => $this->booking_id ?? 'RIDE-' . str_pad((string) $this->id, 6, '0', STR_PAD_LEFT),
            'pickup' => [
                'address' => $this->pickup_address,
                'lat' => (float) $this->pickup_latitude,
                'lng' => (float) $this->pickup_longitude,
            ],
            'destination' => [
                'address' => $this->destination_address,
            ],
            'status' => $this->status->value,
            'estimatedFare' => (float) ($this->estimated_fare ?? 0),
            'actualFare' => $this->actual_fare ? (float) $this->actual_fare : null,
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
