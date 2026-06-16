<?php

namespace App\Repositories;

use App\Models\Ride;
use App\Models\Rider;
use App\Models\Driver;
use App\Enums\RideStatus;
use Illuminate\Database\Eloquent\Collection;

class RideRepository
{
    public function findById(int $id): ?Ride
    {
        return Ride::with('rider', 'driver.user', 'vehicle', 'vehicleType', 'payment')->find($id);
    }

    public function create(array $data): Ride
    {
        return Ride::create($data);
    }

    public function updateStatus(int $id, RideStatus $status): bool
    {
        return Ride::where('id', $id)->update(['status' => $status]);
    }

    public function findByRider(int $riderId): Collection
    {
        return Ride::where('rider_id', $riderId)->latest()->get();
    }

    public function findByDriver(int $driverId): Collection
    {
        return Ride::where('driver_id', $driverId)->latest()->get();
    }

    public function findActiveByRider(int $riderId): ?Ride
    {
        return Ride::where('rider_id', $riderId)
            ->whereIn('status', [
                RideStatus::SearchingDriver,
                RideStatus::DriverAssigned,
                RideStatus::DriverArrived,
                RideStatus::RideStarted,
            ])
            ->first();
    }

    public function findActiveByDriver(int $driverId): ?Ride
    {
        return Ride::where('driver_id', $driverId)
            ->whereIn('status', [
                RideStatus::DriverAssigned,
                RideStatus::DriverArrived,
                RideStatus::RideStarted,
            ])
            ->first();
    }

    public function findPendingRides(): Collection
    {
        return Ride::with('rider', 'vehicleType')
            ->where('status', RideStatus::SearchingDriver)
            ->latest()
            ->get();
    }
}
