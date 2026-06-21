<?php

namespace App\Policies;

use App\Models\User;

class VehiclePolicy
{
    public function create(User $user): bool
    {
        return in_array('driver', $user->roles ?? []);
    }

    public function update(User $user, User $model): bool
    {
        return in_array('driver', $user->roles ?? []);
    }
}
