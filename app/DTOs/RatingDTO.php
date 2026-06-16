<?php

namespace App\DTOs;

class RatingDTO
{
    public function __construct(
        public readonly int $rideId,
        public readonly int $raterId,
        public readonly string $raterType,
        public readonly int $rating,
        public readonly ?string $comment = null,
    ) {}

    public static function fromRequest(array $data, int $raterId, string $raterType): self
    {
        return new self(
            rideId: $data['ride_id'],
            raterId: $raterId,
            raterType: $raterType,
            rating: $data['rating'],
            comment: $data['comment'] ?? null,
        );
    }
}
