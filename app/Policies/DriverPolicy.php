<?php

namespace App\Policies;

use App\Models\User;

class DriverPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array('admin', $user->getRoleNames()->toArray());
    }

    public function view(User $user, User $model): bool
    {
        return $user->id === $model->id || in_array('admin', $user->getRoleNames()->toArray());
    }

    public function update(User $user, User $model): bool
    {
        return $user->id === $model->id || in_array('admin', $user->getRoleNames()->toArray());
    }
}
