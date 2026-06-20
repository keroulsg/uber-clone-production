<?php

namespace App\Events;

use App\Models\Rating;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RatingReceived implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Rating $rating,
        public int $targetUserId,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('user.' . $this->targetUserId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'rating.received';
    }
}
