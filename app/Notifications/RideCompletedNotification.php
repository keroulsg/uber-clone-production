<?php

namespace App\Notifications;

use App\Models\Ride;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class RideCompletedNotification extends Notification
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
            'title' => 'Ride Completed',
            'message' => 'Your ride has been completed.',
        ];
    }
}
