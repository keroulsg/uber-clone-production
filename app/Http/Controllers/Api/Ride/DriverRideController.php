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
use App\Repositories\WalletRepository;
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
        private WalletRepository $walletRepo,
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
        $driver = $this->driverRepo->findByUserId($request->user()->id);
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver not found'], 404);
        }

        $activeRide = $this->rideRepo->findActiveByDriver($driver->id);
        if ($activeRide) {
            return response()->json(['success' => false, 'message' => 'You already have an active ride'], 409);
        }

        try {
            $ride = \Illuminate\Support\Facades\DB::transaction(function () use ($rideId, $driver) {
                $lockedRide = \App\Models\Ride::where('id', $rideId)->lockForUpdate()->first();
                if (!$lockedRide) {
                    throw new \RuntimeException('Ride not found', 404);
                }

                if ($lockedRide->status !== \App\Enums\RideStatus::SearchingDriver) {
                    throw new \RuntimeException('Ride is no longer available', 409);
                }

                $offer = \App\Models\RideDriverOffer::where('ride_id', $lockedRide->id)
                    ->where('driver_id', $driver->id)
                    ->where('status', 'pending')
                    ->lockForUpdate()
                    ->first();

                if (!$offer) {
                    throw new \RuntimeException('No pending offer for this ride', 403);
                }

                $lockedRide->update([
                    'driver_id' => $driver->id,
                    'status' => \App\Enums\RideStatus::DriverAssigned,
                ]);

                $offer->update(['status' => 'accepted']);

                \App\Models\RideDriverOffer::where('ride_id', $lockedRide->id)
                    ->where('driver_id', '!=', $driver->id)
                    ->update(['status' => 'rejected']);

                \App\Models\RideStatusHistory::create([
                    'ride_id' => $lockedRide->id,
                    'status' => \App\Enums\RideStatus::DriverAssigned->value,
                    'created_at' => now(),
                ]);

                return $lockedRide;
            });

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
        } catch (\RuntimeException $e) {
            $code = $e->getCode();
            if ($code < 100 || $code >= 600) $code = 400;
            return response()->json(['success' => false, 'message' => $e->getMessage()], $code);
        }
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

            // Already completed — return 200 with existing data
            if ($ride->status === \App\Enums\RideStatus::RideCompleted) {
                return response()->json([
                    'success' => true,
                    'message' => 'Ride already completed',
                    'data' => new RideResource($ride->load('driver.user', 'vehicleType', 'vehicle', 'payment')),
                ]);
            }

            // Backend is source of truth for distance/duration — ignore driver-provided values
            $actualDistance = (float) ($ride->estimated_distance ?? 0);
            $actualDuration = (int) ($ride->estimated_duration ?? 0);

            // Wallet balance check before completing
            if ($ride->payment_method === 'wallet') {
                $vehicleType = $ride->vehicleType ?? ($ride->vehicle_type_id ? $this->vehicleTypeRepo->findById($ride->vehicle_type_id) : null);
                if ($vehicleType) {
                    $estimatedFare = $this->fareCalc->calculateEstimatedFare($vehicleType, $actualDistance, $actualDuration, $ride->vehicle);
                    $requiredAmount = (float) ($estimatedFare['total_fare'] ?? 0);
                    $currentBalance = $this->walletRepo->getBalance($ride->rider_id);
                    if ($currentBalance < $requiredAmount) {
                        return response()->json([
                            'success' => false,
                            'error_code' => 'INSUFFICIENT_WALLET_BALANCE',
                            'message' => 'Insufficient wallet balance. Please choose cash or top up wallet.',
                            'data' => [
                                'current_balance' => $currentBalance,
                                'required_amount' => $requiredAmount,
                            ],
                        ], 402);
                    }
                }
            }

            // Cash validation
            $cashReceived = $request->input('cash_received');
            $creditChange = $request->boolean('credit_change', false);
            if ($ride->payment_method === 'cash' && $cashReceived !== null) {
                $vehicleType = $ride->vehicleType ?? ($ride->vehicle_type_id ? $this->vehicleTypeRepo->findById($ride->vehicle_type_id) : null);
                if ($vehicleType) {
                    $estimatedFare = $this->fareCalc->calculateEstimatedFare($vehicleType, $actualDistance, $actualDuration, $ride->vehicle);
                    $totalFare = round(max($estimatedFare['total_fare'] ?? 0, 0), 2);
                    $cashReceived = (float) $cashReceived;
                    if ($cashReceived < $totalFare) {
                        return response()->json([
                            'success' => false,
                            'error_code' => 'CASH_UNDERPAID',
                            'message' => 'Cash received is less than total fare. Please collect the full fare.',
                            'data' => [
                                'total_fare' => $totalFare,
                                'cash_received' => $cashReceived,
                            ],
                        ], 400);
                    }
                }
            }

            $ride = $this->rideService->completeRide(
                $rideId,
                $actualDistance,
                $actualDuration,
                $cashReceived !== null ? (float) $cashReceived : null,
                $creditChange
            );

            $ride->refresh();

            return response()->json([
                'success' => true,
                'data' => new RideResource($ride->load('driver.user', 'vehicleType', 'vehicle', 'payment')),
            ]);
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Ride complete failed', ['ride_id' => $rideId, 'error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'An unexpected error occurred'], 500);
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

        $vehicleType = $ride->vehicleType ?? ($ride->vehicle_type_id ? $this->vehicleTypeRepo->findById($ride->vehicle_type_id) : null);
        $vehicle = $ride->vehicle;

        if (!$vehicleType) {
            return response()->json(['success' => false, 'message' => 'Ride has no vehicle type assigned'], 400);
        }

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

        $paginator = \App\Models\Ride::where('driver_id', $driver->id)
            ->with('rider', 'vehicleType', 'payment')
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => \App\Http\Resources\RideBriefResource::collection($paginator->items()),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ],
            ],
        ]);
    }
}
