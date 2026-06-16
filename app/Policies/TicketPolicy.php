<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    public function view(User $user, Ticket $ticket): bool
    {
        return $user->id === $ticket->user_id || in_array('admin', $user->roles ?? []);
    }

    public function create(User $user): bool
    {
        return true;
    }
}
