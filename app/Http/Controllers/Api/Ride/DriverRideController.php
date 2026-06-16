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
        $rides = $this->rideRepo->findPendingRides();

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

        $ride->update([
            'driver_id' => $driver->id,
            'status' => \App\Enums\RideStatus::DriverAssigned,
        ]);

        \App\Models\RideDriverOffer::where('ride_id', $ride->id)
            ->where('driver_id', $driver->id)
            ->update(['status' => 'accepted']);

        \App\Models\RideStatusHistory::create([
            'ride_id' => $ride->id,
            'status' => \App\Enums\RideStatus::DriverAssigned->value,
            'created_at' => now(),
        ]);

        // Notify rider
        Notification::create([
            'type' => 'ride_accepted',
            'notifiable_type' => \App\Models\User::class,
            'notifiable_id' => $ride->rider_id,
            'data' => ['ride_id' => $ride->id, 'driver_id' => $driver->id, 'message' => 'A driver has accepted your ride.'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ride accepted',
            'data' => new RideResource($ride->fresh()->load('rider', 'vehicleType', 'pickup', 'destination')),
        ]);
    }

    public function reject(int $rideId, Request $request): JsonResponse
    {
        $driver = $this->driverRepo->findByUserId($request->user()->id);
        if ($driver) {
            \App\Models\RideDriverOffer::where('ride_id', $rideId)
                ->where('driver_id', $driver->id)
                ->update(['status' => 'rejected']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Ride rejected',
        ]);
    }

    public function arrived(int $rideId, Request $request): JsonResponse
    {
        try {
            $ride = $this->rideService->driverArrived($rideId);

            Notification::create([
                'type' => 'driver_arrived',
                'notifiable_type' => \App\Models\User::class,
                'notifiable_id' => $ride->rider_id,
                'data' => ['ride_id' => $ride->id, 'message' => 'Your driver has arrived.'],
            ]);

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
            $ride = $this->rideService->startRide($rideId);

            Notification::create([
                'type' => 'ride_started',
                'notifiable_type' => \App\Models\User::class,
                'notifiable_id' => $ride->rider_id,
                'data' => ['ride_id' => $ride->id, 'message' => 'Your ride has started.'],
            ]);

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
            $ride = $this->rideService->completeRide(
                $rideId,
                $request->input('actual_distance'),
                $request->input('actual_duration')
            );

            $ride->refresh();

            Notification::create([
                'type' => 'ride_completed',
                'notifiable_type' => \App\Models\User::class,
                'notifiable_id' => $ride->rider_id,
                'data' => ['ride_id' => $ride->id, 'message' => 'Your ride has been completed.'],
            ]);

            Notification::create([
                'type' => 'ride_completed',
                'notifiable_type' => \App\Models\User::class,
                'notifiable_id' => $ride->driver?->user_id,
                'data' => ['ride_id' => $ride->id, 'message' => 'Ride completed.'],
            ]);

            return response()->json([
                'success' => true,
                'data' => new RideResource($ride),
            ]);
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function summary(int $rideId): JsonResponse
    {
        $ride = $this->rideRepo->findById($rideId);
        if (!$ride) {
            return response()->json(['success' => false, 'message' => 'Ride not found'], 404);
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
