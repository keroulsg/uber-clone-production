<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\RiderResource;
use App\Models\Rider;
use App\Models\BanHistory;
use App\Models\Ride;
use App\Models\Payment;
use App\Enums\PaymentStatus;
use App\Enums\RideStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminRiderController extends Controller
{
    public function index(): JsonResponse
    {
        $paginator = Rider::with('user')->latest()->paginate(20);
        return response()->json([
            'success' => true,
            'data' => [
                'data' => RiderResource::collection($paginator->items()),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ],
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $rider = Rider::with('user')->find($id);
        if (!$rider) {
            return response()->json(['success' => false, 'message' => 'Rider not found'], 404);
        }

        $rides = Ride::where('rider_id', $id)->get();
        $completedRides = $rides->filter(fn($r) => $r->status === RideStatus::RideCompleted)->count();
        $cancelledRides = $rides->filter(fn($r) => in_array($r->status, [
            RideStatus::Cancelled,
            RideStatus::CancelledByRider,
            RideStatus::CancelledByDriver,
        ], true))->count();

        $wallet = \App\Models\Wallet::where('user_id', $rider->user_id)->first();

        return response()->json([
            'success' => true,
            'data' => [
                'rider' => new RiderResource($rider),
                'stats' => [
                    'total_rides' => (int) $rides->count(),
                    'completed_rides' => $completedRides,
                    'cancelled_rides' => $cancelledRides,
                    'total_spent' => (float) Payment::whereHas('ride', fn($q) => $q->where('rider_id', $id))->where('status', PaymentStatus::Completed)->sum('amount'),
                    'average_rating' => (float) $rider->average_rating,
                ],
                'wallet' => $wallet ? [
                    'balance' => (float) $wallet->balance,
                    'currency' => $wallet->currency,
                ] : null,
                'recent_rides' => \App\Http\Resources\RideResource::collection(
                    Ride::where('rider_id', $id)
                        ->with('driver.user', 'vehicle', 'vehicleType')
                        ->latest()
                        ->take(5)
                        ->get()
                ),
            ],
        ]);
    }

    public function suspend(int $id, Request $request): JsonResponse
    {
        $rider = Rider::find($id);
        if (!$rider) {
            return response()->json(['success' => false, 'message' => 'Rider not found'], 404);
        }

        $rider->update(['is_active' => false]);

        \App\Services\AuditLogService::log(
            'user_suspended',
            $request->user()->id,
            'admin',
            Rider::class,
            $rider->id,
            null,
            ['profile_type' => 'rider']
        );

        return response()->json([
            'success' => true,
            'message' => 'Rider suspended',
        ]);
    }

    public function reactivate(int $id, Request $request): JsonResponse
    {
        $rider = Rider::find($id);
        if (!$rider) {
            return response()->json(['success' => false, 'message' => 'Rider not found'], 404);
        }

        $rider->update(['is_active' => true]);

        \App\Services\AuditLogService::log(
            'user_reactivated',
            $request->user()->id,
            'admin',
            Rider::class,
            $rider->id,
            null,
            ['profile_type' => 'rider']
        );

        return response()->json([
            'success' => true,
            'message' => 'Rider reactivated',
        ]);
    }

    public function block(int $id, Request $request): JsonResponse
    {
        $rider = Rider::with('user')->findOrFail($id);

        BanHistory::create([
            'user_id' => $rider->user_id,
            'action' => 'blocked',
            'reason' => $request->input('reason'),
            'acted_by' => $request->user()->id,
        ]);

        $rider->user()->update(['is_active' => false]);

        \App\Services\AuditLogService::log(
            'user_blocked',
            $request->user()->id,
            'admin',
            \App\Models\User::class,
            $rider->user_id,
            null,
            ['reason' => $request->input('reason'), 'profile_type' => 'rider']
        );

        return response()->json([
            'success' => true,
            'message' => 'Rider blocked',
        ]);
    }

    public function unblock(int $id, Request $request): JsonResponse
    {
        $rider = Rider::with('user')->findOrFail($id);

        BanHistory::create([
            'user_id' => $rider->user_id,
            'action' => 'unblocked',
            'reason' => $request->input('reason'),
            'acted_by' => $request->user()->id,
        ]);

        $rider->user()->update(['is_active' => true]);

        \App\Services\AuditLogService::log(
            'user_unblocked',
            $request->user()->id,
            'admin',
            \App\Models\User::class,
            $rider->user_id,
            null,
            ['reason' => $request->input('reason'), 'profile_type' => 'rider']
        );

        return response()->json([
            'success' => true,
            'message' => 'Rider unblocked',
        ]);
    }

    public function rides(int $id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => \App\Http\Resources\RideResource::collection(
                Ride::where('rider_id', $id)
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
                \App\Models\Payment::whereHas('ride', fn($q) => $q->where('rider_id', $id))
                    ->with('ride.rider', 'ride.driver.user')
                    ->latest()
                    ->paginate(20)
            ),
        ]);
    }
}
