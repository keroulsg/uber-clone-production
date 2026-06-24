<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PromoCodeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'code' => $this->code,
            'type' => $this->type?->value,
            'value' => (float) $this->value,
            'minRideAmount' => $this->min_ride_amount ? (float) $this->min_ride_amount : null,
            'maxDiscount' => $this->max_discount ? (float) $this->max_discount : null,
            'usageLimit' => $this->usage_limit,
            'usedCount' => $this->used_count,
            'expiresAt' => $this->expires_at?->toISOString(),
            'isActive' => $this->is_active,
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
