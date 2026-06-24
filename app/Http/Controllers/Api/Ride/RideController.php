<?php

namespace App\Http\Controllers\Api\Ride;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateRideRequest;
use App\Http\Requests\CancelRideRequest;
use App\Http\Resources\RideResource;
use App\Http\Resources\RideBriefResource;
use App\Services\RideService;
use App\Services\FareCalculationService;
use App\Services\FeatureFlagService;
use App\Repositories\RideRepository;
use App\Repositories\VehicleTypeRepository;
use App\Repositories\DriverRepository;
use App\DTOs\CreateRideDTO;
use App\DTOs\FareEstimationDTO;
use App\Models\Ride;
use App\Models\Rider;
use App\Models\Driver;
use App\Models\Wallet;
use App\Models\LedgerEntry;
use App\Models\RideDriverOffer;
use App\Models\Notification;
use App\Events\RideRequested;
use App\Events\RideCancelled;
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
        $query = \App\Models\Ride::where('rider_id', $request->user()->id)
            ->with('driver.user', 'vehicleType', 'payment');

        // Status filter
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $statusMap = [
                'completed' => ['ride_completed', 'completed'],
                'cancelled' => ['cancelled'],
                'in_progress' => ['pending', 'searching_driver', 'driver_assigned', 'driver_arrived', 'ride_started'],
            ];
            if (isset($statusMap[$request->input('status')])) {
                $query->whereIn('status', $statusMap[$request->input('status')]);
            }
        }

        // Date range filter
        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->input('from'));
        }
        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->input('to'));
        }

        // Search by booking ID
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('booking_id', 'like', "%{$search}%")
                  ->orWhere('id', $search);
            });
        }

        $perPage = min((int) $request->input('per_page', 20), 100);

        $paginator = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => RideBriefResource::collection($paginator->items()),
                'meta' => [
                    'currentPage' => $paginator->currentPage(),
                    'lastPage' => $paginator->lastPage(),
                    'perPage' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'from' => $paginator->firstItem() ?? 0,
                    'to' => $paginator->lastItem() ?? 0,
                ],
            ],
        ]);
    }

    public function store(CreateRideRequest $request): JsonResponse
    {
        $rider = Rider::where('user_id', $request->user()->id)->firstOrFail();
        $dto = CreateRideDTO::fromRequest($request->validated(), $request->user()->id);

        $paymentMethod = $dto->paymentMethod ?? 'wallet';
        $featureService = app(FeatureFlagService::class);
        if ($paymentMethod === 'cash' && !$featureService->isEnabled('cash_payments')) {
            return response()->json(['success' => false, 'message' => 'Cash payments are currently disabled'], 403);
        }
        if ($paymentMethod === 'wallet' && !$featureService->isEnabled('wallet_payments')) {
            return response()->json(['success' => false, 'message' => 'Wallet payments are currently disabled'], 403);
        }

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

        // Broadcast ride requested event
        event(new RideRequested($ride));

        // Create ride requested notification for rider
        Notification::create([
            'type' => 'ride_requested',
            'notifiable_type' => \App\Models\User::class,
            'notifiable_id' => $request->user()->id,
            'data' => ['ride_id' => $ride->id, 'status' => 'searching_driver', 'message' => 'Your ride has been requested.'],
        ]);

        // Create new ride request notifications for eligible drivers
        foreach ($eligibleDrivers->take(5) as $driver) {
            if ($driver->user_id) {
                Notification::create([
                    'type' => 'new_ride_request',
                    'notifiable_type' => \App\Models\User::class,
                    'notifiable_id' => $driver->user_id,
                    'data' => [
                        'ride_id' => $ride->id,
                        'pickup_address' => $dto->pickupAddress,
                        'message' => 'New ride request near ' . $dto->pickupAddress,
                    ],
                ]);
            }
        }

        $responseData = [
            'success' => true,
            'message' => 'Ride created',
            'data' => new RideResource($ride->fresh()->load('vehicleType', 'rider')),
        ];

        if ($eligibleDrivers->isEmpty()) {
            $responseData['no_driver_message'] = 'No nearby eligible drivers available';
        }

        return response()->json($responseData, 201);
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
            'distance' => 'nullable|numeric|min:0',
            'duration' => 'nullable|integer|min:0',
            'pickup_distance' => 'nullable|numeric|min:0',
            'fuel_price' => 'nullable|numeric|min:0',
            'fuel_consumption' => 'nullable|numeric|min:0',
            'surge_multiplier' => 'nullable|numeric|min:1',
            'is_peak' => 'nullable|boolean',
            'is_night' => 'nullable|boolean',
            'is_female' => 'nullable|boolean',
        ]);

        $vehicleType = $this->vehicleTypeRepo->findById($request->input('vehicle_type_id'));

        if (!$vehicleType) {
            return response()->json(['success' => false, 'message' => 'Vehicle type not found'], 404);
        }

        $distance = $request->input('distance');
        if ($distance === null) {
            $distance = $this->calculateDistance(
                $request->input('pickup_latitude'),
                $request->input('pickup_longitude'),
                $request->input('destination_latitude'),
                $request->input('destination_longitude')
            );
        }

        if ($distance > 80) {
            return response()->json(['success' => false, 'message' => 'Pickup and destination are too far apart for a local trip'], 422);
        }

        $duration = $request->input('duration');
        if ($duration === null) {
            $duration = (int) ($distance / 40 * 60);
        }

        $fare = $this->fareCalc->calculateEstimatedFare(
            $vehicleType,
            $distance,
            $duration,
            null,
            $request->input('pickup_distance'),
            (float) ($request->input('surge_multiplier', 1)),
            (bool) $request->input('is_peak', false),
            (bool) $request->input('is_night', false),
            (bool) $request->input('is_female', false),
            $request->input('fuel_price'),
            $request->input('fuel_consumption'),
        );

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
            $penaltyApplied = false;
            $penaltyAmount = 0.0;

            $ride = \Illuminate\Support\Facades\DB::transaction(function () use ($id, $request, &$penaltyApplied, &$penaltyAmount) {
                $lockedRide = \App\Models\Ride::where('id', $id)->lockForUpdate()->first();
                if (!$lockedRide) {
                    throw new \RuntimeException('Ride not found', 404);
                }
                if ($lockedRide->rider_id !== $request->user()->id) {
                    throw new \RuntimeException('Unauthorized', 403);
                }

                // If already cancelled, do nothing and return safely (idempotent)
                if ($lockedRide->status === \App\Enums\RideStatus::Cancelled) {
                    return $lockedRide;
                }

                // Completed or started rides cannot be cancelled
                if (in_array($lockedRide->status, [\App\Enums\RideStatus::RideCompleted, \App\Enums\RideStatus::Completed, \App\Enums\RideStatus::RideStarted])) {
                    throw new \RuntimeException('Cannot cancel a started or completed ride', 422);
                }

                $reasonId = $request->input('cancellation_reason_id');
                $reasonText = $request->input('cancellation_reason');
                $comment = $request->input('cancellation_comment');

                // Penalty: if driver is assigned and within 150m of pickup, apply penalty
                if ($lockedRide->driver_id && $lockedRide->driver) {
                    $driverLat = $lockedRide->driver->latitude;
                    $driverLng = $lockedRide->driver->longitude;

                    if ($driverLat && $driverLng) {
                        $distanceToPickup = $this->calculateDistance(
                            (float) $driverLat,
                            (float) $driverLng,
                            (float) $lockedRide->pickup_latitude,
                            (float) $lockedRide->pickup_longitude
                        );

                        if ($distanceToPickup <= 0.15) {
                            // Apply cancellation penalty
                            $penaltyAmount = $lockedRide->vehicleType?->cancellation_fee ?? 5.00;
                            Log::info('Rider cancellation penalty triggered', [
                                'ride_id' => $lockedRide->id,
                                'distance_km' => $distanceToPickup,
                                'penalty' => $penaltyAmount,
                            ]);

                            // Record penalty via wallet/ledger
                            $wallet = \App\Models\Wallet::where('user_id', $request->user()->id)->lockForUpdate()->first();
                            if (!$wallet || $wallet->balance < $penaltyAmount) {
                                throw new \RuntimeException('Insufficient wallet balance to cover the cancellation fee.', 422);
                            }

                            $balanceBefore = (float) $wallet->balance;
                            $wallet->balance = $balanceBefore - $penaltyAmount;
                            $wallet->save();
                            $balanceAfter = (float) $wallet->balance;

                            \App\Models\LedgerEntry::create([
                                'user_id' => $request->user()->id,
                                'type' => 'debit',
                                'amount' => $penaltyAmount,
                                'balance_before' => $balanceBefore,
                                'balance_after' => $balanceAfter,
                                'description' => 'Cancellation penalty — ride #' . $lockedRide->booking_id,
                            ]);

                            \App\Services\AuditLogService::log(
                                'wallet_debit',
                                $request->user()->id,
                                null,
                                \App\Models\Wallet::class,
                                $wallet->id,
                                $penaltyAmount,
                                ['ride_id' => $lockedRide->id, 'description' => 'Cancellation penalty — ride #' . $lockedRide->booking_id]
                            );

                            $penaltyApplied = true;

                            Notification::create([
                                'type' => 'wallet_debit',
                                'notifiable_type' => \App\Models\User::class,
                                'notifiable_id' => $request->user()->id,
                                'data' => [
                                    'ride_id' => $lockedRide->id,
                                    'amount' => $penaltyAmount,
                                    'message' => "Cancellation penalty of {$penaltyAmount} applied for ride #{$lockedRide->booking_id}.",
                                ],
                            ]);
                        }
                    } else {
                        Log::info('Cannot calculate cancellation penalty — driver location unknown', [
                            'ride_id' => $lockedRide->id,
                        ]);
                    }
                }

                $updatedRide = $this->rideService->cancelRide(
                    $id,
                    $reasonText,
                    'rider',
                    $reasonId,
                    $comment
                );

                return $updatedRide;
            });

            $responseData = new RideResource($ride->fresh()->load('driver.user', 'vehicleType'));

            event(new RideCancelled($ride));

            return response()->json([
                'success' => true,
                'message' => 'Ride cancelled' . ($penaltyApplied ? ' — penalty applied' : ''),
                'data' => $responseData,
                'penalty' => $penaltyApplied ? [
                    'applied' => true,
                    'amount' => $penaltyAmount,
                ] : null,
            ]);
        } catch (\RuntimeException $e) {
            $code = $e->getCode();
            if ($code < 400 || $code >= 600) {
                $code = 400;
            }
            return response()->json(['success' => false, 'message' => $e->getMessage()], $code);
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

    public function recentCompletedPendingRating(Request $request): JsonResponse
    {
        $user = $request->user();
        $isRider = $user->rider()->exists();

        if ($isRider) {
            $ride = Ride::with('driver.user', 'driver.vehicles.vehicleType', 'vehicle.vehicleType', 'vehicleType', 'vehicle')
                ->where('rider_id', $user->id)
                ->whereIn('status', ['ride_completed', 'completed'])
                ->where('rating_by_rider', false)
                ->whereNull('rider_completed_dismissed_at')
                ->whereNotNull('driver_id')
                ->orderBy('completed_at', 'desc')
                ->first();
        } else {
            $driver = $user->driver;
            if (!$driver) {
                return response()->json(['success' => true, 'data' => null]);
            }
            $ride = Ride::with('rider', 'vehicle.vehicleType', 'vehicleType')
                ->where('driver_id', $driver->id)
                ->whereIn('status', ['ride_completed', 'completed'])
                ->where('rating_by_driver', false)
                ->whereNull('driver_completed_dismissed_at')
                ->whereNotNull('rider_id')
                ->orderBy('completed_at', 'desc')
                ->first();
        }

        return response()->json([
            'success' => true,
            'data' => $ride ? new RideResource($ride) : null,
        ]);
    }

    public function dismissCompleted(int $id, Request $request): JsonResponse
    {
        $ride = Ride::find($id);
        if (!$ride) {
            return response()->json(['success' => false, 'message' => 'Ride not found'], 404);
        }

        if (!in_array($ride->status->value, ['ride_completed', 'completed'])) {
            return response()->json(['success' => false, 'message' => 'Ride is not completed'], 422);
        }

        $user = $request->user();
        $isRider = $ride->rider_id === $user->id;
        $isDriver = $ride->driver_id && $ride->driver?->user_id === $user->id;

        if ($isRider) {
            $ride->update(['rider_completed_dismissed_at' => now()]);
        } elseif ($isDriver) {
            $ride->update(['driver_completed_dismissed_at' => now()]);
        } else {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Ride dismissed',
            'data' => new RideResource($ride->fresh()),
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
