<?php

namespace App\Policies;

use App\Models\User;

class PaymentPolicy
{
    public function view(User $user): bool
    {
        return true;
    }
}
