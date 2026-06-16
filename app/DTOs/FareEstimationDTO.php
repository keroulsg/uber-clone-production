<?php

namespace App\DTOs;

class FareEstimationDTO
{
    public function __construct(
        public readonly int $vehicleTypeId,
        public readonly float $pickupLatitude,
        public readonly float $pickupLongitude,
        public readonly float $destinationLatitude,
        public readonly float $destinationLongitude,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            vehicleTypeId: $data['vehicle_type_id'],
            pickupLatitude: $data['pickup_latitude'],
            pickupLongitude: $data['pickup_longitude'],
            destinationLatitude: $data['destination_latitude'],
            destinationLongitude: $data['destination_longitude'],
        );
    }
}
