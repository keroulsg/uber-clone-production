<?php

namespace App\Http\Controllers\Api\Ride;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateRideRequest;
use App\Http\Requests\CancelRideRequest;
use App\Http\Resources\RideResource;
use App\Http\Resources\RideBriefResource;
use App\Services\RideService;
use App\Services\FareCalculationService;
use App\Repositories\RideRepository;
use App\Repositories\VehicleTypeRepository;
use App\Repositories\DriverRepository;
use App\DTOs\CreateRideDTO;
use App\DTOs\FareEstimationDTO;
use App\Models\Ride;
use App\Models\Rider;
use App\Models\Driver;
use App\Models\RideDriverOffer;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;

class RideController extends Controller
{
    public function __construct(
        private RideService $rideService,
        private FareCalculationService $fareCalc,
        private RideRepository $rideRepo,
        private VehicleTypeRepository $vehicleTypeRepo,
        private DriverRepository $driverRepo,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = \App\Models\Ride::where('rider_id', $request->user()->id)
            ->with('driver.user', 'vehicleType', 'payment')
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => RideBriefResource::collection($paginator->items()),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ],
            ],
        ]);
    }

    public function store(CreateRideRequest $request): JsonResponse
    {
        $rider = Rider::where('user_id', $request->user()->id)->firstOrFail();
        $dto = CreateRideDTO::fromRequest($request->validated(), $request->user()->id);

        $vehicleType = $this->vehicleTypeRepo->findById($dto->vehicleTypeId);
        if (!$vehicleType) {
            return response()->json(['success' => false, 'message' => 'Vehicle type not found'], 422);
        }

        $distance = $this->calculateDistance(
            $dto->pickupLatitude,
            $dto->pickupLongitude,
            $dto->destinationLatitude,
            $dto->destinationLongitude
        );

        if ($distance > 80) {
            Log::warning('Suspiciously large distance for ride', [
                'pickup' => [$dto->pickupLatitude, $dto->pickupLongitude],
                'destination' => [$dto->destinationLatitude, $dto->destinationLongitude],
                'distance_km' => $distance,
            ]);
            return response()->json(['success' => false, 'message' => 'Pickup and destination are too far apart'], 422);
        }

        $duration = (int) ($distance / 40 * 60);
        $fare = $this->fareCalc->calculateEstimatedFare($vehicleType, $distance, $duration);

        $ride = Ride::create([
            'booking_id' => 'RIDE-' . str_pad((string) (Ride::max('id') + 1), 6, '0', STR_PAD_LEFT),
            'rider_id' => $request->user()->id,
            'pickup_latitude' => $dto->pickupLatitude,
            'pickup_longitude' => $dto->pickupLongitude,
            'pickup_address' => $dto->pickupAddress,
            'destination_latitude' => $dto->destinationLatitude,
            'destination_longitude' => $dto->destinationLongitude,
            'destination_address' => $dto->destinationAddress,
            'vehicle_type_id' => $dto->vehicleTypeId,
            'payment_method' => $dto->paymentMethod ?? 'wallet',
            'status' => \App\Enums\RideStatus::SearchingDriver,
            'female_driver_preferred' => $dto->femaleDriverPreferred,
            'estimated_fare' => $fare['total_fare'],
            'estimated_distance' => $distance,
            'estimated_duration' => $duration,
        ]);

        \App\Models\RideStatusHistory::create([
            'ride_id' => $ride->id,
            'status' => \App\Enums\RideStatus::SearchingDriver->value,
            'created_at' => now(),
        ]);

        // Create offer for nearest eligible driver
        $eligibleDrivers = $this->driverRepo->findEligibleForRide(
            $dto->pickupLatitude,
            $dto->pickupLongitude,
            $dto->vehicleTypeId,
        );

        if ($eligibleDrivers->isEmpty()) {
            Log::info('No eligible drivers for ride', ['ride_id' => $ride->id]);
        } else {
            $nearest = $eligibleDrivers->first();
            RideDriverOffer::create([
                'ride_id' => $ride->id,
                'driver_id' => $nearest->id,
                'status' => 'pending',
            ]);
            Log::info('Offer sent to driver', [
                'ride_id' => $ride->id,
                'driver_id' => $nearest->id,
            ]);
        }

        // Create ride requested notification
        Notification::create([
            'type' => 'ride_requested',
            'notifiable_type' => \App\Models\User::class,
            'notifiable_id' => $request->user()->id,
            'data' => ['ride_id' => $ride->id, 'status' => 'searching_driver', 'message' => 'Your ride has been requested.'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ride created',
            'data' => new RideResource($ride->fresh()->load('vehicleType', 'rider')),
        ], 201);
    }

    public function show(int $id, Request $request): JsonResponse
    {
        $ride = $this->rideRepo->findById($id);

        if (!$ride) {
            return response()->json(['success' => false, 'message' => 'Ride not found'], 404);
        }

        if ($ride->rider_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => new RideResource($ride),
        ]);
    }

    public function current(Request $request): JsonResponse
    {
        $ride = $this->rideRepo->findActiveByRider($request->user()->id);

        if (!$ride) {
            return response()->json(['success' => true, 'data' => null]);
        }

        return response()->json([
            'success' => true,
            'data' => new RideResource($ride),
        ]);
    }

    public function estimateFare(Request $request): JsonResponse
    {
        $request->validate([
            'vehicle_type_id' => 'required|exists:vehicle_types,id',
            'pickup_latitude' => 'required|numeric',
            'pickup_longitude' => 'required|numeric',
            'destination_latitude' => 'required|numeric',
            'destination_longitude' => 'required|numeric',
        ]);

        $vehicleType = $this->vehicleTypeRepo->findById($request->input('vehicle_type_id'));

        if (!$vehicleType) {
            return response()->json(['success' => false, 'message' => 'Vehicle type not found'], 404);
        }

        $distance = $this->calculateDistance(
            $request->input('pickup_latitude'),
            $request->input('pickup_longitude'),
            $request->input('destination_latitude'),
            $request->input('destination_longitude')
        );

        if ($distance > 80) {
            return response()->json(['success' => false, 'message' => 'Pickup and destination are too far apart for a local trip'], 422);
        }

        $duration = (int) ($distance / 40 * 60); // assume 40 km/h avg speed

        $fare = $this->fareCalc->calculateEstimatedFare($vehicleType, $distance, $duration);

        return response()->json([
            'success' => true,
            'data' => [
                'fare' => $fare['total_fare'],
                'breakdown' => $fare,
            ],
        ]);
    }

    public function cancel(int $id, CancelRideRequest $request): JsonResponse
    {
        try {
            $ride = $this->rideRepo->findById($id);
            if (!$ride) {
                return response()->json(['success' => false, 'message' => 'Ride not found'], 404);
            }
            if ($ride->rider_id !== $request->user()->id) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $ride = $this->rideService->cancelRide(
                $id,
                $request->input('cancellation_reason'),
                'rider'
            );

            return response()->json([
                'success' => true,
                'message' => 'Ride cancelled',
                'data' => new RideResource($ride),
            ]);
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function trackDriver(int $driverId): JsonResponse
    {
        $driver = Driver::find($driverId);

        if (!$driver || !$driver->is_online) {
            return response()->json([
                'success' => true,
                'data' => null,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'latitude' => $driver->latitude ? (float) $driver->latitude : null,
                'longitude' => $driver->longitude ? (float) $driver->longitude : null,
                'bearing' => 0,
            ],
        ]);
    }

    public function acceptAnyDriver(int $id): JsonResponse
    {
        Ride::where('id', $id)->update(['fallback_to_any_driver_accepted' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Fallback enabled',
        ]);
    }

    private function calculateDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLng / 2) * sin($dLng / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return round($earthRadius * $c, 2);
    }
}
