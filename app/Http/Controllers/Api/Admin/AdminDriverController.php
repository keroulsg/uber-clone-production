<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\DriverResource;
use App\Models\Driver;
use App\Models\DriverWarning;
use App\Models\DriverPenalty;
use App\Models\BanHistory;
use App\Models\Ride;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDriverController extends Controller
{
    public function index(): JsonResponse
    {
        $paginator = Driver::with('user', 'vehicles.vehicleType')->latest()->paginate(20);
        return response()->json([
            'success' => true,
            'data' => [
                'data' => DriverResource::collection($paginator->items()),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
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

        $rides = Ride::where('driver_id', $id)->get();
        $completedRides = $rides->where('status', 'completed')->count();
        $cancelledRides = $rides->whereIn('status', ['cancelled', 'cancelled_by_rider', 'cancelled_by_driver'])->count();

        return response()->json([
            'success' => true,
            'data' => [
                'driver' => new DriverResource($driver),
                'performance' => [
                    'total_rides' => (int) $driver->total_rides,
                    'completed_rides' => $completedRides,
                    'cancelled_rides' => $cancelledRides,
                    'completion_rate' => (float) $driver->completion_rate,
                    'average_rating' => (float) $driver->average_rating,
                    'total_earnings' => (float) $driver->total_earnings,
                ],
                'total_debt' => (float) $driver->debts()->sum('amount'),
                'warnings' => $driver->warnings,
                'penalties' => $driver->penalties,
                'recent_rides' => \App\Http\Resources\RideResource::collection(
                    Ride::where('driver_id', $id)
                        ->with('rider.user', 'vehicle', 'vehicleType')
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
