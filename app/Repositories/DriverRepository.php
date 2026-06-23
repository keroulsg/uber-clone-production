<?php

namespace App\Repositories;

use App\Models\Driver;
use App\Models\Ride;
use App\Enums\RideStatus;
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

    public function findEligibleForRide(float $pickupLat, float $pickupLng, int $vehicleTypeId, ?int $excludeRideId = null): Collection
    {
        $activeRideDriverIds = Ride::whereIn('status', [
            RideStatus::DriverAssigned,
            RideStatus::DriverArrived,
            RideStatus::RideStarted,
        ])->pluck('driver_id')->filter()->toArray();

        $radiusKm = 50;
        $latDelta = $radiusKm / 111.32;
        $lngDelta = $radiusKm / (111.32 * cos(deg2rad($pickupLat)));

        $drivers = Driver::online()
            ->where('is_approved', true)
            ->where('status', 'approved')
            ->whereHas('user', fn($q) => $q->where('is_active', true))
            ->whereHas('vehicles', fn($q) => $q->where('vehicle_type_id', $vehicleTypeId)->where('is_active', true)->where('status', 'active'))
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->whereBetween('latitude', [$pickupLat - $latDelta, $pickupLat + $latDelta])
            ->whereBetween('longitude', [$pickupLng - $lngDelta, $pickupLng + $lngDelta])
            ->get()
            ->reject(fn(Driver $d) => in_array($d->id, $activeRideDriverIds));

        if ($excludeRideId) {
            $excludedDriverIds = \App\Models\RideDriverOffer::where('ride_id', $excludeRideId)
                ->whereIn('status', ['rejected', 'expired'])
                ->pluck('driver_id')
                ->toArray();
            $drivers = $drivers->reject(fn(Driver $d) => in_array($d->id, $excludedDriverIds));
        }

        return $drivers->sortBy(fn(Driver $d) => $this->haversine($pickupLat, $pickupLng, $d->latitude, $d->longitude))->values();
    }

    private function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLng / 2) * sin($dLng / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return $earthRadius * $c;
    }
}
