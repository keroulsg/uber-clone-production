<?php

namespace App\DTOs;

class SupportTicketDTO
{
    public function __construct(
        public readonly int $userId,
        public readonly string $subject,
        public readonly string $message,
        public readonly string $priority = 'medium',
        public readonly ?string $category = null,
    ) {}

    public static function fromRequest(array $data, int $userId): self
    {
        return new self(
            userId: $userId,
            subject: $data['subject'],
            message: $data['message'],
            priority: $data['priority'] ?? 'medium',
            category: $data['category'] ?? null,
        );
    }
}
