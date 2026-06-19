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
            'rider' => new UserBriefResource($this->whenLoaded('rider')),
            'driver' => new DriverBriefResource($this->whenLoaded('driver')),
            'vehicle' => new VehicleBriefResource($this->whenLoaded('vehicle')),
            'vehicleType' => new VehicleTypeResource($this->whenLoaded('vehicleType')),
            'pickup' => [
                'address' => $this->pickup_address,
                'lat' => (float) $this->pickup_latitude,
                'lng' => (float) $this->pickup_longitude,
            ],
            'destination' => [
                'address' => $this->destination_address,
                'lat' => (float) $this->destination_latitude,
                'lng' => (float) $this->destination_longitude,
            ],
            'status' => $this->status->value,
            'estimatedDistance' => $this->estimated_distance ? (float) $this->estimated_distance : null,
            'estimatedDuration' => $this->estimated_duration,
            'estimatedFare' => (float) ($this->estimated_fare ?? 0),
            'actualDistance' => $this->actual_distance ? (float) $this->actual_distance : null,
            'actualDuration' => $this->actual_duration,
            'actualFare' => $this->actual_fare ? (float) $this->actual_fare : null,
            'paymentMethod' => $this->payment_method,
            'paymentStatus' => $this->payment_status,
            'driverAmount' => $this->whenLoaded('payment', fn() => (float) $this->payment->driver_amount),
            'driverRated' => (bool) $this->rating_by_driver,
            'riderRated' => (bool) $this->rating_by_rider,
            'createdAt' => $this->created_at?->toISOString(),
            'completedAt' => $this->completed_at?->toISOString(),
            'cancelledAt' => $this->cancelled_at?->toISOString(),
            'cancelledBy' => $this->cancelled_by,
            'cancellationReason' => $this->cancellation_reason,
        ];
    }
}
