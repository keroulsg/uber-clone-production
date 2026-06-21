<?php

namespace App\Http\Controllers\Api\Admin;

    use App\Http\Controllers\Controller;
    use App\Http\Resources\DriverResource;
    use App\Http\Resources\RideResource;
    use App\Http\Resources\PaymentResource;
    use App\Models\Driver;
    use App\Models\DriverWarning;
    use App\Models\DriverPenalty;
    use App\Models\BanHistory;
    use App\Models\Ride;
    use App\Models\Payment;
    use App\Enums\PaymentStatus;
    use App\Enums\RideStatus;
    use App\Models\DriverDebt;
    use Illuminate\Http\JsonResponse;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Storage;

class AdminDriverController extends Controller
{
    public function index(): JsonResponse
    {
        $paginator = Driver::with('user', 'vehicles.vehicleType', 'debts')->latest()->paginate(20);
        $drivers = $paginator->items();
        $now = now();

        $driverData = array_map(fn($d) => [
            'driver' => new DriverResource($d),
            'outstanding_debt' => (float) $d->debts->whereNull('paid_at')->sum('amount'),
            'unpaid_commission' => (float) $d->debts->whereNull('paid_at')->where('type', 'commission')->sum('amount'),
            'cash_change_liability' => (float) $d->debts->whereNull('paid_at')->where('type', 'cash_change_liability')->sum('amount'),
            'total_rides' => (int) Ride::where('driver_id', $d->id)->count(),
            'completed_rides' => (int) Ride::where('driver_id', $d->id)->where('status', RideStatus::RideCompleted)->count(),
            'today_completed_rides' => (int) Ride::where('driver_id', $d->id)->where('status', RideStatus::RideCompleted)->whereDate('completed_at', $now->toDateString())->count(),
            'today_earnings' => (float) Payment::whereHas('ride', fn($q) => $q->where('driver_id', $d->id))->where('status', PaymentStatus::Completed)->whereDate('paid_at', $now->toDateString())->sum('driver_amount'),
            'total_earnings' => (float) Payment::whereHas('ride', fn($q) => $q->where('driver_id', $d->id))->where('status', PaymentStatus::Completed)->sum('driver_amount'),
            'cash_collected' => (float) Payment::whereHas('ride', fn($q) => $q->where('driver_id', $d->id))->where('status', PaymentStatus::Completed)->where('payment_method', 'cash')->sum('amount'),
            'wallet_earnings' => (float) Payment::whereHas('ride', fn($q) => $q->where('driver_id', $d->id))->where('status', PaymentStatus::Completed)->where('payment_method', 'wallet')->sum('driver_amount'),
        ], $drivers);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $driverData,
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

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'license_number' => 'nullable|string',
        ]);

        $driver = Driver::create($request->only(['user_id', 'license_number']));

        return response()->json([
            'success' => true,
            'message' => 'Driver created',
            'data' => new DriverResource($driver->load('user')),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $driver = Driver::with('user', 'vehicles.vehicleType', 'warnings', 'penalties')->find($id);
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver not found'], 404);
        }

        $now = now();
        $allCompletedPayments = Payment::whereHas('ride', fn($q) => $q->where('driver_id', $id))
            ->where('status', PaymentStatus::Completed);

        $totalEarnings = (float) (clone $allCompletedPayments)->sum('driver_amount');
        $todayEarnings = (float) (clone $allCompletedPayments)->whereDate('paid_at', $now->toDateString())->sum('driver_amount');
        $weekEarnings = (float) (clone $allCompletedPayments)->whereBetween('paid_at', [$now->startOfWeek()->toDateString(), $now->endOfWeek()->toDateString()])->sum('driver_amount');
        $monthEarnings = (float) (clone $allCompletedPayments)->whereMonth('paid_at', $now->month)->whereYear('paid_at', $now->year)->sum('driver_amount');
        $totalCashCollected = (float) (clone $allCompletedPayments)->where('payment_method', 'cash')->sum('amount');
        $walletRevenue = (float) (clone $allCompletedPayments)->where('payment_method', 'wallet')->sum('driver_amount');
        $cashRidesCount = (int) (clone $allCompletedPayments)->where('payment_method', 'cash')->count();
        $walletRidesCount = (int) (clone $allCompletedPayments)->where('payment_method', 'wallet')->count();

        $rides = Ride::where('driver_id', $id)->get();
        $completedRides = $rides->where('status', RideStatus::RideCompleted->value)->count();
        $todayCompletedRides = Ride::where('driver_id', $id)->where('status', RideStatus::RideCompleted)->whereDate('completed_at', $now->toDateString())->count();
        $cancelledRides = $rides->whereIn('status', [
            RideStatus::Cancelled->value,
            RideStatus::CancelledByRider->value,
            RideStatus::CancelledByDriver->value,
        ])->count();

        $unpaidDebts = $driver->debts()->whereNull('paid_at');
        $totalDebt = (float) (clone $unpaidDebts)->sum('amount');
        $unpaidCommission = (float) (clone $unpaidDebts)->where('type', 'commission')->sum('amount');
        $cashChangeLiability = (float) (clone $unpaidDebts)->where('type', 'cash_change_liability')->sum('amount');
        $todayCommissionDue = (float) (clone $unpaidDebts)->where('type', 'commission')->whereDate('created_at', $now->toDateString())->sum('amount');
        $weekCommissionDue = (float) (clone $unpaidDebts)->where('type', 'commission')->whereBetween('created_at', [$now->startOfWeek()->toDateString(), $now->endOfWeek()->toDateString()])->sum('amount');
        $lastDebtAt = $unpaidDebts->latest()->first()?->created_at?->toISOString();

        $recentFinanceRows = Payment::whereHas('ride', fn($q) => $q->where('driver_id', $id))
            ->with('ride')
            ->where('status', PaymentStatus::Completed)
            ->latest()
            ->take(10)
            ->get()
            ->map(fn($p) => [
                'payment_id' => (string) $p->id,
                'booking_id' => $p->ride?->booking_id ?? 'RIDE-' . str_pad((string) $p->ride_id, 6, '0', STR_PAD_LEFT),
                'date' => $p->paid_at?->toISOString(),
                'payment_method' => $p->payment_method,
                'total_fare' => (float) $p->amount,
                'commission' => (float) $p->company_commission,
                'driver_payout' => (float) $p->driver_amount,
                'has_debt' => DriverDebt::where('ride_id', $p->ride_id)->where('driver_id', $id)->exists(),
                'debt_status' => DriverDebt::where('ride_id', $p->ride_id)->where('driver_id', $id)->value('paid_at') ? 'paid' : 'unpaid',
            ]);

        $docFields = ['license_front_image', 'license_back_image', 'identity_front_image', 'identity_back_image', 'criminal_record'];
        $documentUrls = [];
        foreach ($docFields as $field) {
            $value = $driver->$field;
            if ($value) {
                $documentUrls[$field] = Storage::disk('public')->url($value);
            } else {
                $documentUrls[$field] = null;
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'driver' => new DriverResource($driver),
                'documents' => $documentUrls,
                'performance' => [
                    'total_rides' => $rides->count(),
                    'completed_rides' => $completedRides,
                    'today_completed_rides' => $todayCompletedRides,
                    'cancelled_rides' => $cancelledRides,
                    'completion_rate' => $rides->count() > 0 ? round(($completedRides / $rides->count()) * 100, 1) : 0,
                    'average_rating' => (float) $driver->average_rating,
                    'total_earnings' => $totalEarnings,
                    'today_earnings' => $todayEarnings,
                    'weekly_earnings' => $weekEarnings,
                    'monthly_earnings' => $monthEarnings,
                    'total_cash_collected' => $totalCashCollected,
                    'wallet_revenue' => $walletRevenue,
                    'cash_rides_count' => $cashRidesCount,
                    'wallet_rides_count' => $walletRidesCount,
                ],
                'company_dues' => [
                    'total_debt' => $totalDebt,
                    'unpaid_commission' => $unpaidCommission,
                    'cash_change_liability' => $cashChangeLiability,
                    'today_commission_due' => $todayCommissionDue,
                    'weekly_commission_due' => $weekCommissionDue,
                    'last_debt_created_at' => $lastDebtAt,
                ],
                'recent_finance_rows' => $recentFinanceRows,
                'warnings' => $driver->warnings ?? [],
                'penalties' => $driver->penalties ?? [],
                'recent_rides' => RideResource::collection(
                    Ride::where('driver_id', $id)
                        ->with('rider', 'driver.user', 'vehicle', 'vehicleType', 'payment')
                        ->latest()
                        ->take(5)
                        ->get()
                ),
            ],
        ]);
    }

    public function update(int $id, Request $request): JsonResponse
    {
        $driver = Driver::find($id);
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver not found'], 404);
        }

        $driver->update($request->only([
            'license_number', 'address', 'city', 'state',
            'is_active', 'is_approved', 'is_verified',
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Driver updated',
        ]);
    }

    public function approve(int $id): JsonResponse
    {
        $driver = Driver::find($id);
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver not found'], 404);
        }

        $driver->update([
            'is_approved' => true,
            'is_verified' => true,
            'status' => 'approved',
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Driver approved',
        ]);
    }

    public function reject(int $id): JsonResponse
    {
        $driver = Driver::find($id);
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver not found'], 404);
        }

        $driver->update([
            'is_approved' => false,
            'status' => 'rejected',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Driver rejected',
        ]);
    }

    public function verificationApprove(int $id, Request $request): JsonResponse
    {
        $driver = Driver::find($id);
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver not found'], 404);
        }

        $driver->update([
            'is_verified' => true,
            'verification_document' => [
                'status' => 'verified',
                'submitted_at' => data_get($driver->verification_document, 'submitted_at', now()->toISOString()),
                'reviewed_at' => now()->toISOString(),
                'reviewed_by' => $request->user()->id,
            ],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Driver documents verified',
        ]);
    }

    public function verificationReject(int $id, Request $request): JsonResponse
    {
        $driver = Driver::find($id);
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver not found'], 404);
        }

        $validated = $request->validate([
            'reason' => 'required|string|min:3|max:1000',
        ]);

        $driver->update([
            'is_verified' => false,
            'verification_document' => [
                'status' => 'rejected',
                'submitted_at' => data_get($driver->verification_document, 'submitted_at', now()->toISOString()),
                'reviewed_at' => now()->toISOString(),
                'reviewed_by' => $request->user()->id,
                'rejection_reason' => $validated['reason'],
            ],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Driver documents rejected',
        ]);
    }

    public function suspend(int $id): JsonResponse
    {
        $driver = Driver::find($id);
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver not found'], 404);
        }

        $driver->update([
            'is_active' => false,
            'status' => 'suspended',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Driver suspended',
        ]);
    }

    public function reactivate(int $id): JsonResponse
    {
        $driver = Driver::find($id);
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver not found'], 404);
        }

        $driver->update([
            'is_active' => true,
            'status' => 'approved',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Driver reactivated',
        ]);
    }

    public function block(int $id, Request $request): JsonResponse
    {
        $driver = Driver::with('user')->findOrFail($id);

        BanHistory::create([
            'user_id' => $driver->user_id,
            'action' => 'blocked',
            'reason' => $request->input('reason'),
            'acted_by' => $request->user()->id,
        ]);

        $driver->user()->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Driver blocked',
        ]);
    }

    public function unblock(int $id, Request $request): JsonResponse
    {
        $driver = Driver::with('user')->findOrFail($id);

        BanHistory::create([
            'user_id' => $driver->user_id,
            'action' => 'unblocked',
            'reason' => $request->input('reason'),
            'acted_by' => $request->user()->id,
        ]);

        $driver->user()->update(['is_active' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Driver unblocked',
        ]);
    }

    public function warnings(int $id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => DriverWarning::where('driver_id', $id)->with('issuedBy')->latest()->get(),
        ]);
    }

    public function storeWarning(int $id, Request $request): JsonResponse
    {
        $request->validate(['reason' => 'required|string']);

        DriverWarning::create([
            'driver_id' => $id,
            'issued_by' => $request->user()->id,
            'reason' => $request->input('reason'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Warning issued',
        ]);
    }

    public function penalties(int $id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => DriverPenalty::where('driver_id', $id)->with('issuedBy')->latest()->get(),
        ]);
    }

    public function storePenalty(int $id, Request $request): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string',
            'amount' => 'required|numeric|min:0',
        ]);

        DriverPenalty::create([
            'driver_id' => $id,
            'issued_by' => $request->user()->id,
            'reason' => $request->input('reason'),
            'amount' => $request->input('amount'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Penalty issued',
        ]);
    }

    public function rides(int $id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => \App\Http\Resources\RideResource::collection(
                Ride::where('driver_id', $id)
                    ->with('rider', 'driver.user', 'vehicle', 'vehicleType', 'payment')
                    ->latest()
                    ->paginate(20)
            ),
        ]);
    }

    public function payments(int $id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => \App\Http\Resources\PaymentResource::collection(
                \App\Models\Payment::whereHas('ride', fn($q) => $q->where('driver_id', $id))
                    ->with('ride.rider', 'ride.driver.user')
                    ->latest()
                    ->paginate(20)
            ),
        ]);
    }
}
