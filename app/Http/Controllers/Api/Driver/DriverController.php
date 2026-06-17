<?php

namespace App\Http\Controllers\Api\Driver;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateDriverProfileRequest;
use App\Http\Requests\UpdateDriverLocationRequest;
use App\Http\Resources\DriverResource;
use App\Services\DriverService;
use App\DTOs\UpdateDriverLocationDTO;
use App\Repositories\DriverRepository;
use App\Repositories\RideRepository;
use App\Enums\RideStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverController extends Controller
{
    public function __construct(
        private DriverService $driverService,
        private DriverRepository $driverRepo,
        private RideRepository $rideRepo,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $driver = $this->driverService->getProfile($request->user()->id);

        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new DriverResource($driver->load('user', 'vehicles.vehicleType')),
        ]);
    }

    public function update(UpdateDriverProfileRequest $request): JsonResponse
    {
        $this->driverService->updateProfile($request->user()->id, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Profile updated',
        ]);
    }

    public function toggleOnlineStatus(Request $request): JsonResponse
    {
        $isOnline = $this->driverService->toggleOnline($request->user()->id);

        if ($isOnline === null) {
            return response()->json(['success' => false, 'message' => 'Driver not found'], 404);
        }

        return response()->json([
            'success' => true,
            'message' => $isOnline ? 'You are now online' : 'You are now offline',
            'is_online' => $isOnline,
        ]);
    }

    public function updateLocation(UpdateDriverLocationRequest $request): JsonResponse
    {
        $driver = $this->driverRepo->findByUserId($request->user()->id);
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver not found'], 404);
        }

        $dto = UpdateDriverLocationDTO::fromRequest($request->validated(), $driver->id);
        $this->driverService->updateLocation($dto);

        return response()->json([
            'success' => true,
            'message' => 'Location updated',
        ]);
    }

    public function earnings(Request $request): JsonResponse
    {
        $driver = $this->driverRepo->findByUserId($request->user()->id);
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver not found'], 404);
        }

        $allPayments = \App\Models\Payment::whereHas('ride', fn($q) => $q->where('driver_id', $driver->id));
        $totalEarnings = (float) $allPayments->sum('driver_amount');

        $now = now();
        $todayEarnings = (float) (clone $allPayments)->whereDate('paid_at', $now->toDateString())->sum('driver_amount');
        $weekEarnings = (float) (clone $allPayments)->whereBetween('paid_at', [$now->startOfWeek()->toDateString(), $now->endOfWeek()->toDateString()])->sum('driver_amount');
        $monthEarnings = (float) (clone $allPayments)->whereMonth('paid_at', $now->month)->whereYear('paid_at', $now->year)->sum('driver_amount');

        $recentTransactions = $allPayments->latest()->take(10)->get()->map(fn($p) => [
            'id' => (string) $p->id,
            'amount' => (float) $p->driver_amount,
            'type' => 'earning',
            'description' => 'Ride payment #' . ($p->ride_id ?? ''),
            'status' => $p->status->value,
            'createdAt' => $p->paid_at?->toISOString(),
        ]);

        $chartData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = $now->copy()->subDays($i);
            $dayEarnings = (float) (clone $allPayments)->whereDate('paid_at', $date->toDateString())->sum('driver_amount');
            $chartData[] = ['date' => $date->format('Y-m-d'), 'earnings' => $dayEarnings];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'today' => $todayEarnings,
                'weekly' => $weekEarnings,
                'monthly' => $monthEarnings,
                'total' => $totalEarnings,
                'currentBalance' => (float) $driver->current_balance,
                'breakdown' => [
                    'baseFare' => $totalEarnings,
                    'tips' => 0,
                    'bonuses' => 0,
                ],
                'chartData' => $chartData,
                'recentTransactions' => $recentTransactions,
            ],
        ]);
    }

    public function performance(Request $request): JsonResponse
    {
        $driver = $this->driverRepo->findByUserId($request->user()->id);
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'acceptance_rate' => (float) $driver->acceptance_rate,
                'completion_rate' => (float) $driver->completion_rate,
                'average_rating' => (float) $driver->average_rating,
                'total_rides' => $driver->total_rides,
            ],
        ]);
    }

    public function rideHistory(Request $request): JsonResponse
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

    public function nearby(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [],
        ]);
    }

    public function uploadDocument(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Document uploaded',
        ]);
    }

    public function submitVerification(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Verification submitted',
        ]);
    }

    public function payout(Request $request): JsonResponse
    {
        if ($request->isMethod('post')) {
            $request->validate([
                'payout_method' => 'required|string',
                'payout_phone' => 'required|string',
                'payout_account_name' => 'nullable|string',
            ]);

            $driver = $this->driverRepo->findByUserId($request->user()->id);
            if ($driver) {
                $driver->update($request->only(['payout_method', 'payout_phone', 'payout_account_name']));
            }

            return response()->json([
                'success' => true,
                'message' => 'Payout info updated',
            ]);
        }

        $driver = $this->driverRepo->findByUserId($request->user()->id);

        return response()->json([
            'success' => true,
            'data' => [
                'payout_method' => $driver?->payout_method,
                'payout_phone' => $driver?->payout_phone,
                'payout_account_name' => $driver?->payout_account_name,
            ],
        ]);
    }

    public function updatePayout(Request $request): JsonResponse
    {
        return $this->payout($request);
    }
}
