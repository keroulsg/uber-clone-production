<?php

namespace App\Notifications;

use App\Models\Ride;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class RideRequestedNotification extends Notification
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
            'title' => 'New Ride Request',
            'message' => 'A new ride has been requested.',
        ];
    }
}
