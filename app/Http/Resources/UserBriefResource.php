<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserBriefResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'avatarUrl' => $this->avatar_url,
            'rating' => $this->when($this->relationLoaded('driver'), fn() => $this->driver?->average_rating),
        ];
    }
}
