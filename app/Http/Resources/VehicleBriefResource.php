<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VehicleBriefResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'make' => $this->make,
            'model' => $this->model,
            'year' => $this->year,
            'color' => $this->color,
            'licensePlate' => $this->license_plate,
            'imageUrl' => $this->image_url,
            'vehicleType' => new VehicleTypeResource($this->whenLoaded('vehicleType')),
        ];
    }
}
