<?php

namespace App\Listeners;

use App\Events\RideStarted;
use App\Notifications\RideStartedNotification;

class SendRideStartedNotification
{
    public function handle(RideStarted $event): void
    {
        if ($event->ride->rider) {
            $event->ride->rider->notify(new RideStartedNotification($event->ride));
        }
    }
}
