<?php

namespace App\Listeners;

use App\Events\RideAccepted;
use App\Notifications\RideAcceptedNotification;

class SendRideAcceptedNotification
{
    public function handle(RideAccepted $event): void
    {
        if ($event->ride->rider) {
            $event->ride->rider->notify(new RideAcceptedNotification($event->ride));
        }
    }
}
