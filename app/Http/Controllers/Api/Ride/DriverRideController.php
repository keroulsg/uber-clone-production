<?php

namespace App\Http\Controllers\Api\Ride;

use App\Http\Controllers\Controller;
use App\Http\Resources\RideResource;
use App\Services\RideService;
use App\Services\PaymentService;
use App\Repositories\RideRepository;
use App\Repositories\DriverRepository;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverRideController extends Controller
{
    public function __construct(
        private RideService $rideService,
        private PaymentService $paymentService,
        private RideRepository $rideRepo,
        private DriverRepository $driverRepo,
    ) {}

    public function pending(Request $request): JsonResponse
    {
        $driver = $this->driverRepo->findByUserId($request->user()->id);
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver not found'], 404);
        }

        $offerRideIds = \App\Models\RideDriverOffer::where('driver_id', $driver->id)
            ->where('status', 'pending')
            ->pluck('ride_id');

        $rides = \App\Models\Ride::with('rider', 'vehicleType')
            ->whereIn('id', $offerRideIds)
            ->where('status', \App\Enums\RideStatus::SearchingDriver)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => RideResource::collection($rides),
        ]);
    }

    public function accept(int $rideId, Request $request): JsonResponse
    {
        $ride = $this->rideRepo->findById($rideId);
        if (!$ride) {
            return response()->json(['success' => false, 'message' => 'Ride not found'], 404);
        }

        $driver = $this->driverRepo->findByUserId($request->user()->id);
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver not found'], 404);
        }

        if ($ride->status !== \App\Enums\RideStatus::SearchingDriver) {
            return response()->json(['success' => false, 'message' => 'Ride is no longer available'], 409);
        }

        $offer = \App\Models\RideDriverOffer::where('ride_id', $ride->id)
            ->where('driver_id', $driver->id)
            ->where('status', 'pending')
            ->first();

        if (!$offer) {
            return response()->json(['success' => false, 'message' => 'No pending offer for this ride'], 403);
        }

        $ride->update([
            'driver_id' => $driver->id,
            'status' => \App\Enums\RideStatus::DriverAssigned,
        ]);

        $offer->update(['status' => 'accepted']);

        \App\Models\RideDriverOffer::where('ride_id', $ride->id)
            ->where('driver_id', '!=', $driver->id)
            ->update(['status' => 'rejected']);

        \App\Models\RideStatusHistory::create([
            'ride_id' => $ride->id,
            'status' => \App\Enums\RideStatus::DriverAssigned->value,
            'created_at' => now(),
        ]);

        Notification::create([
            'type' => 'ride_accepted',
            'notifiable_type' => \App\Models\User::class,
            'notifiable_id' => $ride->rider_id,
            'data' => ['ride_id' => $ride->id, 'driver_id' => $driver->id, 'message' => 'A driver has accepted your ride.'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ride accepted',
            'data' => new RideResource($ride->fresh()->load('rider', 'vehicleType', 'driver.user', 'vehicle')),
        ]);
    }

    public function reject(int $rideId, Request $request): JsonResponse
    {
        $driver = $this->driverRepo->findByUserId($request->user()->id);
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver not found'], 404);
        }

        $offer = \App\Models\RideDriverOffer::where('ride_id', $rideId)
            ->where('driver_id', $driver->id)
            ->where('status', 'pending')
            ->first();

        if (!$offer) {
            return response()->json(['success' => false, 'message' => 'No pending offer for this ride'], 404);
        }

        $offer->update(['status' => 'rejected']);

        return response()->json([
            'success' => true,
            'message' => 'Ride rejected',
        ]);
    }

    public function arrived(int $rideId, Request $request): JsonResponse
    {
        try {
            $driver = $this->driverRepo->findByUserId($request->user()->id);
            if (!$driver) {
                return response()->json(['success' => false, 'message' => 'Driver not found'], 404);
            }

            $ride = $this->rideRepo->findById($rideId);
            if (!$ride) {
                return response()->json(['success' => false, 'message' => 'Ride not found'], 404);
            }
            if ($ride->driver_id !== $driver->id) {
                return response()->json(['success' => false, 'message' => 'This ride is not assigned to you'], 403);
            }

            $ride = $this->rideService->driverArrived($rideId);

            return response()->json([
                'success' => true,
                'data' => new RideResource($ride),
            ]);
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function start(int $rideId, Request $request): JsonResponse
    {
        try {
            $driver = $this->driverRepo->findByUserId($request->user()->id);
            if (!$driver) {
                return response()->json(['success' => false, 'message' => 'Driver not found'], 404);
            }

            $ride = $this->rideRepo->findById($rideId);
            if (!$ride) {
                return response()->json(['success' => false, 'message' => 'Ride not found'], 404);
            }
            if ($ride->driver_id !== $driver->id) {
                return response()->json(['success' => false, 'message' => 'This ride is not assigned to you'], 403);
            }

            $ride = $this->rideService->startRide($rideId);

            return response()->json([
                'success' => true,
                'data' => new RideResource($ride),
            ]);
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function complete(int $rideId, Request $request): JsonResponse
    {
        $request->validate([
            'actual_distance' => 'required|numeric',
            'actual_duration' => 'required|integer',
        ]);

        try {
            $driver = $this->driverRepo->findByUserId($request->user()->id);
            if (!$driver) {
                return response()->json(['success' => false, 'message' => 'Driver not found'], 404);
            }

            $ride = $this->rideRepo->findById($rideId);
            if (!$ride) {
                return response()->json(['success' => false, 'message' => 'Ride not found'], 404);
            }
            if ($ride->driver_id !== $driver->id) {
                return response()->json(['success' => false, 'message' => 'This ride is not assigned to you'], 403);
            }

            $ride = $this->rideService->completeRide(
                $rideId,
                $request->input('actual_distance'),
                $request->input('actual_duration')
            );

            $ride->refresh();

            return response()->json([
                'success' => true,
                'data' => new RideResource($ride->load('driver.user', 'vehicleType', 'vehicle', 'payment')),
            ]);
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function summary(int $rideId, Request $request): JsonResponse
    {
        $driver = $this->driverRepo->findByUserId($request->user()->id);
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver not found'], 404);
        }

        $ride = $this->rideRepo->findById($rideId);
        if (!$ride) {
            return response()->json(['success' => false, 'message' => 'Ride not found'], 404);
        }
        if ($ride->driver_id !== $driver->id) {
            return response()->json(['success' => false, 'message' => 'This ride is not assigned to you'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => new RideResource($ride),
        ]);
    }

    public function current(Request $request): JsonResponse
    {
        $driver = $this->driverRepo->findByUserId($request->user()->id);
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver not found'], 404);
        }

        $ride = $this->rideRepo->findActiveByDriver($driver->id);

        if (!$ride) {
            return response()->json(['success' => false, 'message' => 'No active ride'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new RideResource($ride),
        ]);
    }

    public function history(Request $request): JsonResponse
    {
        $driver = $this->driverRepo->findByUserId($request->user()->id);
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver not found'], 404);
        }

        $rides = $this->rideRepo->findByDriver($driver->id);

        return response()->json([
            'success' => true,
            'data' => \App\Http\Resources\RideBriefResource::collection($rides),
        ]);
    }
}
