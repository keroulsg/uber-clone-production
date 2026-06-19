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
use App\Models\DriverDebt;
use App\Repositories\WalletRepository;
use App\Http\Resources\WalletResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverController extends Controller
{
    public function __construct(
        private DriverService $driverService,
        private DriverRepository $driverRepo,
        private RideRepository $rideRepo,
        private WalletRepository $walletRepo,
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

        $allPayments = \App\Models\Payment::whereHas('ride', fn($q) => $q->where('driver_id', $driver->id))
            ->where('status', \App\Enums\PaymentStatus::Completed);
        $totalEarnings = (float) $allPayments->sum('driver_amount');
        $cashPayments = (clone $allPayments)->where('payment_method', 'cash');
        $walletPayments = (clone $allPayments)->where('payment_method', 'wallet');
        $cashCollected = (float) $cashPayments->sum('amount');
        $walletEarnings = (float) $walletPayments->sum('driver_amount');

        $now = now();
        $todayEarnings = (float) (clone $allPayments)->whereDate('paid_at', $now->toDateString())->sum('driver_amount');
        $weekEarnings = (float) (clone $allPayments)->whereBetween('paid_at', [$now->startOfWeek()->toDateString(), $now->endOfWeek()->toDateString()])->sum('driver_amount');
        $monthEarnings = (float) (clone $allPayments)->whereMonth('paid_at', $now->month)->whereYear('paid_at', $now->year)->sum('driver_amount');

        $recentTransactions = $allPayments->latest()->take(10)->get()->map(fn($p) => [
            'id' => (string) $p->id,
            'amount' => (float) $p->driver_amount,
            'type' => 'credit',
            'description' => 'Ride payment #' . ($p->ride_id ?? ''),
            'status' => $p->status->value,
            'createdAt' => $p->paid_at?->toISOString(),
        ]);

        $chartData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = $now->copy()->subDays($i);
            $dayEarnings = (float) (clone $allPayments)->whereDate('paid_at', $date->toDateString())->sum('driver_amount');
            $chartData[] = ['label' => $date->format('Y-m-d'), 'amount' => $dayEarnings];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'today' => $todayEarnings,
                'weekly' => $weekEarnings,
                'monthly' => $monthEarnings,
                'total' => $totalEarnings,
                'cashCollected' => $cashCollected,
                'walletEarnings' => $walletEarnings,
                'currentBalance' => (float) $driver->current_balance,
                'outstandingDebt' => (float) DriverDebt::where('driver_id', $driver->id)->whereNull('paid_at')->sum('amount'),
                'outstandingCommission' => (float) DriverDebt::where('driver_id', $driver->id)->whereNull('paid_at')->where('type', 'commission')->sum('amount'),
                'cashChangeLiability' => (float) DriverDebt::where('driver_id', $driver->id)->whereNull('paid_at')->where('type', 'cash_change_liability')->sum('amount'),
                'todayCommission' => (float) DriverDebt::where('driver_id', $driver->id)->whereNull('paid_at')->where('type', 'commission')->whereDate('created_at', now()->toDateString())->sum('amount'),
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

        $allPayments = \App\Models\Payment::whereHas('ride', fn($q) => $q->where('driver_id', $driver->id))
            ->where('status', \App\Enums\PaymentStatus::Completed);
        $todayEarnings = (float) (clone $allPayments)->whereDate('paid_at', now()->toDateString())->sum('driver_amount');
        $weekEarnings = (float) (clone $allPayments)->whereBetween('paid_at', [now()->startOfWeek()->toDateString(), now()->endOfWeek()->toDateString()])->sum('driver_amount');

        $rides = \App\Models\Ride::where('driver_id', $driver->id)->get();
        $completed = $rides->where('status', \App\Enums\RideStatus::RideCompleted->value)->count();
        $total = $rides->count();

        return response()->json([
            'success' => true,
            'data' => [
                'acceptanceRate' => (float) $driver->acceptance_rate,
                'completionRate' => $total > 0 ? round(($completed / $total) * 100, 1) : 0,
                'averageRating' => (float) $driver->average_rating,
                'totalRides' => $total,
                'completedRides' => $completed,
                'todayEarnings' => $todayEarnings,
                'weeklyEarnings' => $weekEarnings,
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

    public function wallet(Request $request): JsonResponse
    {
        $driver = $this->driverRepo->findByUserId($request->user()->id);
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver not found'], 404);
        }

        $wallet = $this->walletRepo->findByUser($request->user()->id);

        $allCompletedPayments = \App\Models\Payment::whereHas('ride', fn($q) => $q->where('driver_id', $driver->id))
            ->where('status', \App\Enums\PaymentStatus::Completed);
        $totalEarnings = (float) (clone $allCompletedPayments)->sum('driver_amount');
        $cashCollected = (float) (clone $allCompletedPayments)->where('payment_method', 'cash')->sum('amount');
        $walletEarnings = (float) (clone $allCompletedPayments)->where('payment_method', 'wallet')->sum('driver_amount');

        $now = now();
        $todayEarnings = (float) (clone $allCompletedPayments)->whereDate('paid_at', $now->toDateString())->sum('driver_amount');
        $weekEarnings = (float) (clone $allCompletedPayments)->whereBetween('paid_at', [$now->startOfWeek()->toDateString(), $now->endOfWeek()->toDateString()])->sum('driver_amount');

        $unpaidDebts = DriverDebt::where('driver_id', $driver->id)->whereNull('paid_at');
        $debts = [
            'outstanding_debt' => (float) (clone $unpaidDebts)->sum('amount'),
            'unpaid_commission' => (float) (clone $unpaidDebts)->where('type', 'commission')->sum('amount'),
            'cash_change_liability' => (float) (clone $unpaidDebts)->where('type', 'cash_change_liability')->sum('amount'),
            'today_commission' => (float) (clone $unpaidDebts)->where('type', 'commission')->whereDate('created_at', $now->toDateString())->sum('amount'),
            'weekly_commission' => (float) (clone $unpaidDebts)->where('type', 'commission')->whereBetween('created_at', [$now->startOfWeek()->toDateString(), $now->endOfWeek()->toDateString()])->sum('amount'),
            'monthly_commission' => (float) (clone $unpaidDebts)->where('type', 'commission')->whereMonth('created_at', $now->month)->sum('amount'),
            'last_debt_at' => DriverDebt::where('driver_id', $driver->id)->latest()->first()?->created_at?->toISOString(),
        ];

        $transactions = \App\Models\LedgerEntry::where('user_id', $request->user()->id)
            ->latest()
            ->take(20)
            ->get()
            ->map(fn($e) => [
                'id' => $e->id,
                'type' => $e->type,
                'amount' => (float) $e->amount,
                'balance_before' => (float) $e->balance_before,
                'balance_after' => (float) $e->balance_after,
                'description' => $e->description,
                'reference_type' => $e->reference_type,
                'reference_id' => $e->reference_id,
                'created_at' => $e->created_at?->toISOString(),
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'wallet' => $wallet ? new WalletResource($wallet) : null,
                'balance' => $wallet ? (float) $wallet->balance : 0,
                'today_earnings' => $todayEarnings,
                'weekly_earnings' => $weekEarnings,
                'total_earnings' => $totalEarnings,
                'cash_collected' => $cashCollected,
                'wallet_earnings' => $walletEarnings,
                'debts' => $debts,
                'transactions' => $transactions,
            ],
        ]);
    }
}
