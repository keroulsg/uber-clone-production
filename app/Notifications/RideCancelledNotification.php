<?php

namespace App\Notifications;

use App\Models\Ride;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class RideCancelledNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Ride $ride,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'ride_id' => $this->ride->id,
            'title' => 'Ride Cancelled',
            'message' => 'Your ride has been cancelled.',
        ];
    }
}
