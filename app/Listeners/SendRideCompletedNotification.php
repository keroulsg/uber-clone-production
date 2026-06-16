<?php

namespace App\Listeners;

use App\Events\RideCompleted;
use App\Notifications\RideCompletedNotification;

class SendRideCompletedNotification
{
    public function handle(RideCompleted $event): void
    {
        if ($event->ride->rider) {
            $event->ride->rider->notify(new RideCompletedNotification($event->ride));
        }
    }
}
