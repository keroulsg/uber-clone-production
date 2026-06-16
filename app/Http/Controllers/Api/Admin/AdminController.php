<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Http\Resources\RideResource;
use App\Http\Resources\DriverResource;
use App\Models\User;
use App\Models\Ride;
use App\Models\Setting;
use App\Models\Driver;
use App\Services\AdminService;
use App\Repositories\RideRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function __construct(
        private AdminService $adminService,
        private RideRepository $rideRepo,
    ) {}

    public function dashboard(): JsonResponse
    {
        $stats = $this->adminService->dashboard();

        return response()->json([
            'success' => true,
            'data' => new \App\Http\Resources\DashboardStatsResource((object) $stats),
        ]);
    }

    public function stats(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->adminService->dashboard(),
        ]);
    }

    public function charts(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'labels' => [],
                'datasets' => [],
            ],
        ]);
    }

    public function recentActivities(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [],
        ]);
    }

    public function settings(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->adminService->getSettings(),
        ]);
    }

    public function updateSetting(Request $request): JsonResponse
    {
        $request->validate([
            'key' => 'required|string',
            'value' => 'required|string',
        ]);

        $this->adminService->updateSetting($request->input('key'), $request->input('value'));

        return response()->json([
            'success' => true,
            'message' => 'Setting updated',
        ]);
    }

    public function auditLogs(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [],
        ]);
    }

    public function users(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => UserResource::collection(User::with('rider', 'driver')->latest()->paginate(20)),
        ]);
    }

    public function rides(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => RideResource::collection(Ride::with('rider', 'driver.user', 'vehicleType', 'payment')->latest()->paginate(20)),
        ]);
    }

    public function rideDetail(int $id): JsonResponse
    {
        $ride = $this->rideRepo->findById($id);
        if (!$ride) {
            return response()->json(['success' => false, 'message' => 'Ride not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new RideResource($ride),
        ]);
    }

    public function payments(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => \App\Http\Resources\PaymentResource::collection(
                \App\Models\Payment::with('ride.rider', 'ride.driver.user')->latest()->paginate(20)
            ),
        ]);
    }

    public function paymentDetail(int $id): JsonResponse
    {
        $payment = \App\Models\Payment::with('ride.rider', 'ride.driver.user')->find($id);
        if (!$payment) {
            return response()->json(['success' => false, 'message' => 'Payment not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new \App\Http\Resources\PaymentResource($payment),
        ]);
    }

    public function supportTickets(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => \App\Http\Resources\TicketResource::collection(
                \App\Models\Ticket::with('user', 'messages.user')->latest()->paginate(20)
            ),
        ]);
    }

    public function banHistory(int $userId): JsonResponse
    {
        $history = \App\Models\BanHistory::where('user_id', $userId)
            ->with('actedBy')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $history->map(fn($h) => [
                'id' => $h->id,
                'user_id' => $h->user_id,
                'action' => $h->action,
                'reason' => $h->reason,
                'acted_by' => $h->actedBy ? ['id' => $h->actedBy->id, 'name' => $h->actedBy->name] : null,
                'auto_blocked' => $h->auto_blocked,
                'created_at' => $h->created_at?->toISOString(),
            ]),
        ]);
    }

    public function liveDrivers(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => DriverResource::collection(
                Driver::with('user', 'vehicles.vehicleType')
                    ->where('is_online', true)
                    ->get()
            ),
        ]);
    }

    public function surgeData(): JsonResponse
    {
        $zones = \App\Models\SurgeZone::where('is_active', true)->get();

        return response()->json([
            'success' => true,
            'data' => $zones->map(fn($z) => [
                'id' => $z->id,
                'name' => $z->name,
                'bounds' => $z->bounds,
                'center_latitude' => (float) $z->center_latitude,
                'center_longitude' => (float) $z->center_longitude,
                'radius_km' => (float) $z->radius_km,
                'multiplier' => (float) $z->multiplier,
                'open_requests' => Ride::where('status', \App\Enums\RideStatus::SearchingDriver)->count(),
                'available_drivers' => Driver::where('is_online', true)->count(),
                'started_at' => $z->started_at?->toISOString(),
                'ended_at' => $z->ended_at?->toISOString(),
            ]),
        ]);
    }
}
