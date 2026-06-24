<?php

use App\Models\Ride;
use Illuminate\Support\Facades\Broadcast;

Broadcast::routes(['middleware' => ['auth:sanctum']]);

Broadcast::channel('ride.{rideId}', function ($user, int $rideId) {
    $ride = Ride::with('driver')->find($rideId);
    if (!$ride) return false;

    $isRider = $ride->rider_id === $user->id;
    $isDriver = $ride->driver_id !== null && $ride->driver?->user_id === $user->id;

    return $isRider || $isDriver;
});

Broadcast::channel('driver.{driverId}', function ($user, int $driverId) {
    return $user->driver?->id === $driverId;
});

Broadcast::channel('driver.status.{driverId}', function ($user, int $driverId) {
    return $user->driver?->id === $driverId;
});

Broadcast::channel('driver.location.{driverId}', function ($user, int $driverId) {
    if ($user->driver?->id === $driverId) {
        return true;
    }

    $hasActiveRide = Ride::where('driver_id', $driverId)
        ->whereIn('status', ['driver_assigned', 'driver_arrived', 'ride_started'])
        ->where('rider_id', $user->id)
        ->exists();

    return $hasActiveRide;
});

Broadcast::channel('rider.{riderId}', function ($user, int $riderId) {
    return $user->id === $riderId;
});

Broadcast::channel('chat.{rideId}', function ($user, int $rideId) {
    $ride = \App\Models\Ride::with('driver')->find($rideId);
    if (!$ride) return false;

    $isRider = $ride->rider_id === $user->id;
    $isDriver = $ride->driver_id !== null && $ride->driver?->user_id === $user->id;

    return $isRider || $isDriver;
});
