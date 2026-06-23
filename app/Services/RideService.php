<?php

namespace App\Services;

use App\Models\Ride;
use App\Models\RideDriverOffer;
use App\Models\RideStatusHistory;
use App\Models\Notification;
use App\Enums\RideStatus;
use App\Repositories\DriverRepository;
use App\Repositories\RideRepository;
use Illuminate\Support\Facades\Log;

class RideService
{
    public function __construct(
        private RideRepository $rideRepo,
        private FareCalculationService $fareCalc,
        private PaymentService $paymentService,
        private DriverMatchingService $matchingService,
        private DriverRepository $driverRepo,
    ) {}

    public function createRide(array $data): Ride
    {
        $ride = $this->rideRepo->create($data);

        RideStatusHistory::create([
            'ride_id' => $ride->id,
            'status' => RideStatus::SearchingDriver->value,
            'created_at' => now(),
        ]);

        $this->matchingService->findAndNotifyDrivers($ride);

        return $ride->fresh();
    }

    public function processDriverOffers(Ride $ride): void
    {
        if ($ride->status !== RideStatus::SearchingDriver) {
            return;
        }

        $latestOffer = RideDriverOffer::where('ride_id', $ride->id)
            ->where('status', 'pending')
            ->latest()
            ->first();

        if ($latestOffer) {
            $offerAge = now()->diffInSeconds($latestOffer->created_at);
            if ($offerAge < 60) {
                return;
            }
            $latestOffer->update(['status' => 'expired']);
            Log::info('Offer expired for driver', [
                'ride_id' => $ride->id,
                'driver_id' => $latestOffer->driver_id,
            ]);
        }

        if (!RideDriverOffer::where('ride_id', $ride->id)->where('status', 'pending')->exists()) {
            $this->assignToNextDriver($ride);
        }
    }

    private function assignToNextDriver(Ride $ride): void
    {
        $eligibleDrivers = $this->driverRepo->findEligibleForRide(
            $ride->pickup_latitude,
            $ride->pickup_longitude,
            $ride->vehicle_type_id,
            $ride->id,
        );

        if ($eligibleDrivers->isEmpty()) {
            Log::info('No eligible drivers for ride', ['ride_id' => $ride->id]);
            return;
        }

        $nearest = $eligibleDrivers->first();

        RideDriverOffer::create([
            'ride_id' => $ride->id,
            'driver_id' => $nearest->id,
            'status' => 'pending',
        ]);

        Log::info('Offer reassigned to next driver', [
            'ride_id' => $ride->id,
            'driver_id' => $nearest->id,
        ]);
    }

    public function driverArrived(int $rideId): Ride
    {
        $ride = $this->rideRepo->findById($rideId);
        if (!$ride || $ride->status !== RideStatus::DriverAssigned) {
            throw new \RuntimeException('Invalid state transition');
        }

        $ride->update(['status' => RideStatus::DriverArrived]);
        RideStatusHistory::create([
            'ride_id' => $ride->id,
            'status' => RideStatus::DriverArrived->value,
            'created_at' => now(),
        ]);

        Notification::create([
            'type' => 'driver_arrived',
            'notifiable_type' => \App\Models\User::class,
            'notifiable_id' => $ride->rider_id,
            'data' => ['ride_id' => $ride->id, 'message' => 'Your driver has arrived.'],
        ]);

        return $ride->fresh();
    }

    public function startRide(int $rideId): Ride
    {
        $ride = $this->rideRepo->findById($rideId);
        if (!$ride || $ride->status !== RideStatus::DriverArrived) {
            throw new \RuntimeException('Invalid state transition');
        }

        $ride->update([
            'status' => RideStatus::RideStarted,
            'started_at' => now(),
        ]);
        RideStatusHistory::create([
            'ride_id' => $ride->id,
            'status' => RideStatus::RideStarted->value,
            'created_at' => now(),
        ]);

        Notification::create([
            'type' => 'ride_started',
            'notifiable_type' => \App\Models\User::class,
            'notifiable_id' => $ride->rider_id,
            'data' => ['ride_id' => $ride->id, 'message' => 'Your ride has started.'],
        ]);

        return $ride->fresh();
    }

    public function completeRide(int $rideId, float $actualDistanceKm, int $actualDurationMin, ?float $cashReceived = null, bool $creditChange = false): Ride
    {
        $ride = $this->rideRepo->findById($rideId);
        if (!$ride) {
            throw new \RuntimeException('Ride not found');
        }

        $ride = \Illuminate\Support\Facades\DB::transaction(function () use ($ride, $actualDistanceKm, $actualDurationMin, $cashReceived, $creditChange) {
            $lockedRide = \App\Models\Ride::where('id', $ride->id)->lockForUpdate()->first();
            if (!$lockedRide || $lockedRide->status !== RideStatus::RideStarted) {
                throw new \RuntimeException('Invalid state transition');
            }

            $lockedRide->update([
                'status' => RideStatus::RideCompleted,
                'actual_distance' => $actualDistanceKm,
                'actual_duration' => $actualDurationMin,
                'completed_at' => now(),
            ]);

            RideStatusHistory::create([
                'ride_id' => $lockedRide->id,
                'status' => RideStatus::RideCompleted->value,
                'created_at' => now(),
            ]);

            $this->paymentService->processPayment($lockedRide, $actualDistanceKm, $actualDurationMin, $cashReceived, $creditChange);

            Notification::create([
                'type' => 'ride_completed',
                'notifiable_type' => \App\Models\User::class,
                'notifiable_id' => $lockedRide->rider_id,
                'data' => ['ride_id' => $lockedRide->id, 'message' => 'Your ride has been completed.'],
            ]);

            if ($lockedRide->driver) {
                Notification::create([
                    'type' => 'ride_completed',
                    'notifiable_type' => \App\Models\User::class,
                    'notifiable_id' => $lockedRide->driver->user_id,
                    'data' => ['ride_id' => $lockedRide->id, 'message' => 'Ride completed.'],
                ]);
            }

            return $lockedRide->fresh();
        });

        return $ride;
    }

    public function cancelRide(int $rideId, ?string $reason = null, ?string $cancelledBy = null, ?int $reasonId = null, ?string $comment = null): Ride
    {
        $ride = $this->rideRepo->findById($rideId);
        if (!$ride || in_array($ride->status, [RideStatus::RideCompleted, RideStatus::Cancelled, RideStatus::RideStarted])) {
            throw new \RuntimeException('Invalid state transition');
        }

        $updateData = [
            'status' => RideStatus::Cancelled,
            'cancelled_at' => now(),
            'cancelled_by' => $cancelledBy,
            'cancellation_reason' => $reason,
        ];

        if ($reasonId) {
            $updateData['cancellation_reason_id'] = $reasonId;
        }
        if ($comment) {
            $updateData['cancellation_comment'] = $comment;
        }

        $ride->update($updateData);

        RideStatusHistory::create([
            'ride_id' => $ride->id,
            'status' => RideStatus::Cancelled->value,
            'created_at' => now(),
            'metadata' => [
                'cancelled_by' => $cancelledBy,
                'reason' => $reason,
                'reason_id' => $reasonId,
                'comment' => $comment,
            ],
        ]);

        // Send cancellation notification to rider
        Notification::create([
            'type' => 'ride_cancelled',
            'notifiable_type' => \App\Models\User::class,
            'notifiable_id' => $ride->rider_id,
            'data' => [
                'ride_id' => $ride->id,
                'message' => $reason ? "Ride cancelled: {$reason}" : 'Ride was cancelled.',
            ],
        ]);

        // Notify driver if assigned
        if ($ride->driver_id) {
            Notification::create([
                'type' => 'ride_cancelled',
                'notifiable_type' => \App\Models\User::class,
                'notifiable_id' => $ride->driver->user_id,
                'data' => [
                    'ride_id' => $ride->id,
                    'message' => $reason ? "Ride cancelled by rider: {$reason}" : 'Ride was cancelled by rider.',
                ],
            ]);
        }

        return $ride->fresh();
    }
}
