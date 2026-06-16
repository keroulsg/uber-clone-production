<?php

namespace App\Services;

use App\Models\User;
use App\Models\Ticket;
use App\DTOs\SupportTicketDTO;
use App\Repositories\TicketRepository;
use App\Models\TicketMessage;
use Illuminate\Database\Eloquent\Collection;

class SupportService
{
    public function __construct(
        private TicketRepository $ticketRepo,
    ) {}

    public function createTicket(SupportTicketDTO $dto): Ticket
    {
        return $this->ticketRepo->create([
            'ticket_id' => 'TKT-' . strtoupper(uniqid()),
            'user_id' => $dto->userId,
            'subject' => $dto->subject,
            'message' => $dto->message,
            'priority' => $dto->priority,
            'category' => $dto->category,
        ]);
    }

    public function addMessage(int $ticketId, int $userId, string $message, bool $isStaff = false): TicketMessage
    {
        return TicketMessage::create([
            'ticket_id' => $ticketId,
            'user_id' => $userId,
            'message' => $message,
            'is_staff' => $isStaff,
        ]);
    }

    public function closeTicket(int $ticketId): bool
    {
        return Ticket::where('id', $ticketId)->update([
            'status' => 'closed',
            'resolved_at' => now(),
        ]);
    }
}
