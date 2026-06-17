<?php

namespace App\Http\Controllers\Api\Ride;

use App\Http\Controllers\Controller;
use App\Http\Resources\RideResource;
use App\Services\RideService;
use App\Services\PaymentService;
use App\Services\FareCalculationService;
use App\Repositories\RideRepository;
use App\Repositories\DriverRepository;
use App\Repositories\VehicleTypeRepository;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverRideController extends Controller
{
    public function __construct(
        private RideService $rideService,
        private PaymentService $paymentService,
        private FareCalculationService $fareCalc,
        private RideRepository $rideRepo,
        private DriverRepository $driverRepo,
        private VehicleTypeRepository $vehicleTypeRepo,
    ) {}

    public function pending(Request $request): JsonResponse
    {
        $driver = $this->driverRepo->findByUserId($request->user()->id);
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver not found'], 404);
        }

        $pendingOffers = \App\Models\RideDriverOffer::where('driver_id', $driver->id)
            ->where('status', 'pending')
            ->where('created_at', '<', now()->subSeconds(60))
            ->get();

        foreach ($pendingOffers as $offer) {
            $ride = $this->rideRepo->findById($offer->ride_id);
            if ($ride) {
                $this->rideService->processDriverOffers($ride);
            }
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

        $activeRide = $this->rideRepo->findActiveByDriver($driver->id);
        if ($activeRide) {
            return response()->json(['success' => false, 'message' => 'You already have an active ride'], 409);
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

        $ride = $this->rideRepo->findById($rideId);
        if ($ride && $ride->status === \App\Enums\RideStatus::SearchingDriver) {
            $this->rideService->processDriverOffers($ride);
        }

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

        $actualDistance = (float) $request->input('actual_distance', $ride->estimated_distance ?? 0);
        $actualDuration = (int) $request->input('actual_duration', $ride->estimated_duration ?? 0);

        $vehicleType = $ride->vehicleType ?? $this->vehicleTypeRepo->findById($ride->vehicle_type_id);
        $vehicle = $ride->vehicle;

        $fareBreakdown = $this->fareCalc->calculateEstimatedFare($vehicleType, $actualDistance, $actualDuration, $vehicle);

        $outstandingDebt = \App\Models\DriverDebt::where('driver_id', $driver->id)
            ->whereNull('paid_at')
            ->sum('amount');

        $rideData = new RideResource($ride);

        return response()->json([
            'success' => true,
            'data' => [
                'ride_id' => (int) $ride->id,
                'booking_id' => $rideData['bookingId'] ?? ('RIDE-' . str_pad((string) $ride->id, 6, '0', STR_PAD_LEFT)),
                'actual_distance' => $actualDistance,
                'actual_duration' => $actualDuration,
                'fare_breakdown' => $fareBreakdown,
                'driver_outstanding_debt' => (float) $outstandingDebt,
                'payment_method' => $ride->payment_method ?? 'wallet',
            ],
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
            return response()->json(['success' => true, 'data' => null]);
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
