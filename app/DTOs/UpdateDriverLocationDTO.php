<?php

namespace App\DTOs;

class UpdateDriverLocationDTO
{
    public function __construct(
        public readonly int $driverId,
        public readonly float $latitude,
        public readonly float $longitude,
    ) {}

    public static function fromRequest(array $data, int $driverId): self
    {
        return new self(
            driverId: $driverId,
            latitude: $data['latitude'],
            longitude: $data['longitude'],
        );
    }
}
