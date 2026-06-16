<?php

namespace App\Listeners;

use App\Events\RideRequested;
use App\Notifications\RideRequestedNotification;

class SendRideRequestedNotification
{
    public function handle(RideRequested $event): void
    {
        if ($event->ride->rider) {
            $event->ride->rider->notify(new RideRequestedNotification($event->ride));
        }
    }
}
