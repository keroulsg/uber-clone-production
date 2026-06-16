<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'ticketId' => $this->ticket_id,
            'user' => new UserBriefResource($this->whenLoaded('user')),
            'subject' => $this->subject,
            'message' => $this->message,
            'priority' => $this->priority?->value,
            'status' => $this->status?->value,
            'category' => $this->category,
            'assignedTo' => new UserBriefResource($this->whenLoaded('assignedTo')),
            'createdAt' => $this->created_at?->toISOString(),
            'resolvedAt' => $this->resolved_at?->toISOString(),
            'messages' => TicketMessageResource::collection($this->whenLoaded('messages')),
        ];
    }
}
