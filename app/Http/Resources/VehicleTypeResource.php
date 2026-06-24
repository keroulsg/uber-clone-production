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
            'commission_rate' => $this->commission_rate ? (float) $this->commission_rate : null,
            'fuel_multiplier' => (float) $this->fuel_multiplier,
            'seating_capacity' => $this->seating_capacity,
            'image_url' => $this->image_url,
            'is_active' => $this->is_active,
            'vip_enabled' => (bool) $this->vip_enabled,
            'vip_base_fare' => $this->vip_base_fare ? (float) $this->vip_base_fare : null,
            'vip_multiplier' => (float) $this->vip_multiplier,
            'vip_commission_rate' => $this->vip_commission_rate ? (float) $this->vip_commission_rate : null,
            'vip_priority_multiplier' => (float) $this->vip_priority_multiplier,
            'female_driver_enabled' => (bool) $this->female_driver_enabled,
            'female_base_fare' => $this->female_base_fare ? (float) $this->female_base_fare : null,
            'female_multiplier' => (float) $this->female_multiplier,
            'female_commission_rate' => $this->female_commission_rate ? (float) $this->female_commission_rate : null,
        ];
    }
}
