<?php

namespace App\Listeners;

use App\Events\RideCancelled;
use App\Notifications\RideCancelledNotification;

class SendRideCancelledNotification
{
    public function handle(RideCancelled $event): void
    {
        if ($event->ride->rider) {
            $event->ride->rider->notify(new RideCancelledNotification($event->ride));
        }
    }
}
