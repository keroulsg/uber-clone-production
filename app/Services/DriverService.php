<?php

namespace App\Services;

use App\Models\Driver;
use App\Repositories\DriverRepository;
use App\Repositories\VehicleRepository;
use App\DTOs\UpdateDriverLocationDTO;

class DriverService
{
    public function __construct(
        private DriverRepository $driverRepo,
        private VehicleRepository $vehicleRepo,
    ) {}

    public function getProfile(int $userId): ?Driver
    {
        return $this->driverRepo->findByUserId($userId);
    }

    public function updateProfile(int $userId, array $data): bool
    {
        $driver = $this->driverRepo->findByUserId($userId);
        if (!$driver) {
            return false;
        }
        return $this->driverRepo->findById($driver->id)?->update($data);
    }

    public function updateLocation(UpdateDriverLocationDTO $dto): bool
    {
        return Driver::where('id', $dto->driverId)->update([
            'latitude' => $dto->latitude,
            'longitude' => $dto->longitude,
        ]);
    }

    public function toggleOnline(int $userId): ?bool
    {
        $driver = $this->driverRepo->findByUserId($userId);
        if (!$driver) {
            return null;
        }
        $driver->update(['is_online' => !$driver->is_online]);
        return $driver->fresh()->is_online;
    }
}
