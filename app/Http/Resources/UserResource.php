<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'gender' => $this->gender,
            'avatarUrl' => $this->avatar_url,
            'isActive' => $this->is_active,
            'roles' => $this->getRoleNames(),
            'emailVerifiedAt' => $this->email_verified_at?->toISOString(),
            'phoneVerifiedAt' => $this->phone_verified_at?->toISOString(),
            'createdAt' => $this->created_at?->toISOString(),
            'blockedAt' => $this->relationLoaded('latestBan') && $this->latestBan && $this->latestBan->action === 'blocked'
                ? $this->latestBan->created_at?->toISOString() : null,
            'blockedById' => $this->relationLoaded('latestBan') && $this->latestBan && $this->latestBan->action === 'blocked'
                ? (string) ($this->latestBan->acted_by ?? '') : null,
            'blockReason' => $this->relationLoaded('latestBan') && $this->latestBan && $this->latestBan->action === 'blocked'
                ? $this->latestBan->reason : null,
        ];
    }
}
