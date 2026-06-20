<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $avatarUrl = $this->avatar_url;

        // Normalize avatar URL to use configured app URL
        if ($avatarUrl && !str_starts_with($avatarUrl, 'http')) {
            $avatarUrl = rtrim(config('app.url'), '/') . '/' . ltrim($avatarUrl, '/');
        } elseif ($avatarUrl && !str_contains($avatarUrl, (string) parse_url(config('app.url'), PHP_URL_PORT))) {
            // Replace wrong host/port with configured app URL
            $path = parse_url($avatarUrl, PHP_URL_PATH) ?? '';
            $avatarUrl = rtrim(config('app.url'), '/') . $path;
        }

        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'address' => $this->address,
            'city' => $this->city,
            'gender' => $this->gender,
            'avatarUrl' => $avatarUrl,
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
