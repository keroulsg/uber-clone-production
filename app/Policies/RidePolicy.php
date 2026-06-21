<?php

namespace App\Policies;

use App\Models\Ride;
use App\Models\User;

class RidePolicy
{
    public function view(User $user, Ride $ride): bool
    {
        return $user->id === $ride->rider_id || in_array('admin', $user->roles ?? []);
    }

    public function cancel(User $user, Ride $ride): bool
    {
        return $user->id === $ride->rider_id;
    }
}
