<?php

namespace App\DTOs;

class CreateRideDTO
{
    public function __construct(
        public readonly int $riderId,
        public readonly float $pickupLatitude,
        public readonly float $pickupLongitude,
        public readonly string $pickupAddress,
        public readonly float $destinationLatitude,
        public readonly float $destinationLongitude,
        public readonly string $destinationAddress,
        public readonly int $vehicleTypeId,
        public readonly ?string $paymentMethod = null,
        public readonly bool $femaleDriverPreferred = false,
    ) {}

    public static function fromRequest(array $data, int $riderId): self
    {
        return new self(
            riderId: $riderId,
            pickupLatitude: $data['pickup_latitude'],
            pickupLongitude: $data['pickup_longitude'],
            pickupAddress: $data['pickup_address'],
            destinationLatitude: $data['destination_latitude'],
            destinationLongitude: $data['destination_longitude'],
            destinationAddress: $data['destination_address'],
            vehicleTypeId: $data['vehicle_type_id'],
            paymentMethod: $data['payment_method'] ?? null,
            femaleDriverPreferred: $data['female_driver_preferred'] ?? false,
        );
    }
}
