<?php

namespace App\Repositories;

use App\Models\Ticket;
use Illuminate\Database\Eloquent\Collection;

class TicketRepository
{
    public function findById(int $id): ?Ticket
    {
        return Ticket::with('user', 'messages.user', 'assignedTo')->find($id);
    }

    public function create(array $data): Ticket
    {
        return Ticket::create($data);
    }

    public function findByUser(int $userId): Collection
    {
        return Ticket::where('user_id', $userId)->latest()->get();
    }

    public function all(): Collection
    {
        return Ticket::with('user')->latest()->get();
    }
}
