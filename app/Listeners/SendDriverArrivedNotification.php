<?php

namespace App\Listeners;

use App\Events\DriverArrived;
use App\Notifications\DriverArrivedNotification;

class SendDriverArrivedNotification
{
    public function handle(DriverArrived $event): void
    {
        if ($event->ride->rider) {
            $event->ride->rider->notify(new DriverArrivedNotification($event->ride));
        }
    }
}
