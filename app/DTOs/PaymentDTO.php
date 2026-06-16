<?php

namespace App\DTOs;

class PaymentDTO
{
    public function __construct(
        public readonly int $rideId,
        public readonly float $amount,
        public readonly string $paymentMethod,
        public readonly string $currency = 'USD',
    ) {}

    public static function fromRequest(array $data, int $rideId): self
    {
        return new self(
            rideId: $rideId,
            amount: $data['amount'],
            paymentMethod: $data['payment_method'],
            currency: $data['currency'] ?? 'USD',
        );
    }
}
