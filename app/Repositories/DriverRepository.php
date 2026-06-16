<?php

namespace App\Repositories;

use App\Models\Driver;
use Illuminate\Database\Eloquent\Collection;

class DriverRepository
{
    public function findById(int $id): ?Driver
    {
        return Driver::with('user', 'vehicles.vehicleType')->find($id);
    }

    public function findByUserId(int $userId): ?Driver
    {
        return Driver::where('user_id', $userId)->first();
    }

    public function create(array $data): Driver
    {
        return Driver::create($data);
    }

    public function findOnline(): Collection
    {
        return Driver::online()->get();
    }

    public function findNearby(float $lat, float $lng, float $radiusKm): Collection
    {
        $latDelta = $radiusKm / 111.32;
        $lngDelta = $radiusKm / (111.32 * cos(deg2rad($lat)));
        return Driver::online()
            ->whereBetween('latitude', [$lat - $latDelta, $lat + $latDelta])
            ->whereBetween('longitude', [$lng - $lngDelta, $lng + $lngDelta])
            ->get();
    }
}
