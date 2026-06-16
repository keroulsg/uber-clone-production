<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VehicleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'driverId' => (string) $this->driver_id,
            'make' => $this->make,
            'model' => $this->model,
            'year' => $this->year,
            'color' => $this->color,
            'licensePlate' => $this->license_plate,
            'registrationNumber' => $this->registration_number,
            'vehicleType' => new VehicleTypeResource($this->whenLoaded('vehicleType')),
            'features' => $this->features,
            'status' => $this->status,
            'isActive' => $this->is_active,
            'imageUrl' => $this->image_url,
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
