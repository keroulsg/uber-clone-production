<?php

namespace App\Services;

use App\Models\Vehicle;
use App\Models\VehicleType;
use App\Repositories\VehicleRepository;
use App\Repositories\VehicleTypeRepository;
use Illuminate\Database\Eloquent\Collection;

class VehicleService
{
    public function __construct(
        private VehicleRepository $vehicleRepo,
        private VehicleTypeRepository $vehicleTypeRepo,
    ) {}

    public function getTypes(): Collection
    {
        return $this->vehicleTypeRepo->all();
    }

    public function register(int $driverId, array $data): Vehicle
    {
        return $this->vehicleRepo->create(array_merge($data, ['driver_id' => $driverId]));
    }

    public function getByDriver(int $driverId): Collection
    {
        return $this->vehicleRepo->findByDriver($driverId);
    }
}
