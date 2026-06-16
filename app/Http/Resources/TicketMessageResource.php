<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketMessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'user' => new UserBriefResource($this->whenLoaded('user')),
            'message' => $this->message,
            'isStaff' => $this->is_staff,
            'createdAt' => $this->created_at?->toISOString(),
            'readAt' => $this->read_at?->toISOString(),
        ];
    }
}
