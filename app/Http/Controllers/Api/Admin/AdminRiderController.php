<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\RiderResource;
use App\Models\Rider;
use App\Models\BanHistory;
use App\Models\Ride;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminRiderController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => RiderResource::collection(
                Rider::with('user')->latest()->paginate(20)
            ),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $rider = Rider::with('user')->find($id);
        if (!$rider) {
            return response()->json(['success' => false, 'message' => 'Rider not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new RiderResource($rider),
        ]);
    }

    public function suspend(int $id): JsonResponse
    {
        Rider::where('id', $id)->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Rider suspended',
        ]);
    }

    public function reactivate(int $id): JsonResponse
    {
        Rider::where('id', $id)->update(['is_active' => true]);

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
                    ->with('driver.user', 'vehicleType', 'payment')
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
                    ->with('ride.driver.user')
                    ->latest()
                    ->paginate(20)
            ),
        ]);
    }
}
