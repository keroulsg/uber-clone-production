<?php

namespace App\Services;

use App\Models\Ride;
use App\Models\RideDriverOffer;
use App\Models\RideStatusHistory;
use App\Models\Notification;
use App\Enums\RideStatus;
use App\Repositories\DriverRepository;
use App\Repositories\RideRepository;
use App\Repositories\VehicleRepository;
use App\Repositories\WalletRepository;

class DriverMatchingService
{
    public function __construct(
        private DriverRepository $driverRepo,
        private RideRepository $rideRepo,
        private VehicleRepository $vehicleRepo,
        private WalletRepository $walletRepo,
    ) {}

    public function findAndNotifyDrivers(Ride $ride): void
    {
        $drivers = $this->driverRepo->findOnline();

        foreach ($drivers as $driver) {
            RideDriverOffer::create([
                'ride_id' => $ride->id,
                'driver_id' => $driver->id,
                'status' => 'pending',
            ]);
        }
    }

    public function acceptRide(Ride $ride, int $driverId): Ride
    {
        RideDriverOffer::where('ride_id', $ride->id)
            ->where('driver_id', $driverId)
            ->update(['status' => 'accepted']);

        RideDriverOffer::where('ride_id', $ride->id)
            ->where('driver_id', '!=', $driverId)
            ->update(['status' => 'rejected']);

        $ride->update([
            'driver_id' => $driverId,
            'status' => RideStatus::DriverAssigned,
        ]);

        RideStatusHistory::create([
            'ride_id' => $ride->id,
            'status' => RideStatus::DriverAssigned->value,
            'created_at' => now(),
        ]);

        Notification::create([
            'type' => 'ride_accepted',
            'notifiable_type' => \App\Models\User::class,
            'notifiable_id' => $ride->rider_id,
            'data' => ['ride_id' => $ride->id, 'driver_id' => $driverId, 'message' => 'A driver has accepted your ride.'],
        ]);

        return $ride->fresh();
    }
}
