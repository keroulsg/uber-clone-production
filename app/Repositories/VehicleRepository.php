<?php

namespace App\Repositories;

use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Collection;

class VehicleRepository
{
    public function findById(int $id): ?Vehicle
    {
        return Vehicle::with('vehicleType', 'driver')->find($id);
    }

    public function findByDriver(int $driverId): Collection
    {
        return Vehicle::where('driver_id', $driverId)->get();
    }

    public function create(array $data): Vehicle
    {
        return Vehicle::create($data);
    }

    public function findActiveByDriver(int $driverId): ?Vehicle
    {
        return Vehicle::where('driver_id', $driverId)->where('is_active', true)->first();
    }
}
