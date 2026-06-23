<?php

namespace App\Http\Controllers\Api\Settlement;

use App\Http\Controllers\Controller;
use App\Models\DriverSettlement;
use App\Models\DriverDebt;
use App\Models\Driver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSettlementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DriverSettlement::with('driver.user');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $settlements = $query->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $settlements->items(),
                'meta' => [
                    'currentPage' => $settlements->currentPage(),
                    'lastPage' => $settlements->lastPage(),
                    'perPage' => $settlements->perPage(),
                    'total' => $settlements->total(),
                    'from' => $settlements->firstItem() ?? 0,
                    'to' => $settlements->lastItem() ?? 0,
                ],
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $settlement = DriverSettlement::with('driver.user', 'reviewer')->find($id);
        if (!$settlement) {
            return response()->json(['success' => false, 'message' => 'Settlement not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $settlement,
        ]);
    }

    public function approve(Request $request, int $id): JsonResponse
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $id) {
            $settlement = DriverSettlement::where('id', $id)->lockForUpdate()->first();
            if (!$settlement) {
                return response()->json(['success' => false, 'message' => 'Settlement not found'], 404);
            }

            if ($settlement->status !== 'pending') {
                return response()->json(['success' => false, 'message' => 'Only pending settlements can be approved'], 422);
            }

            $unpaidDebts = DriverDebt::where('driver_id', $settlement->driver_id)
                ->whereNull('paid_at')
                ->orderBy('created_at')
                ->lockForUpdate()
                ->get();

            $remaining = (float) $settlement->amount;

            foreach ($unpaidDebts as $debt) {
                if ($remaining <= 0) break;

                $debtAmount = (float) $debt->amount;
                if ($debtAmount <= $remaining) {
                    $debt->update(['paid_at' => now()]);
                    $remaining -= $debtAmount;
                } else {
                    // Partial payment not supported in MVP — settle full debts in order
                    break;
                }
            }

            $settlement->update([
                'status' => 'approved',
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Settlement approved. Applicable debts marked as paid.',
            ]);
        });
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'rejection_reason' => 'required|string|max:1000',
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $id) {
            $settlement = DriverSettlement::where('id', $id)->lockForUpdate()->first();
            if (!$settlement) {
                return response()->json(['success' => false, 'message' => 'Settlement not found'], 404);
            }

            if ($settlement->status !== 'pending') {
                return response()->json(['success' => false, 'message' => 'Only pending settlements can be rejected'], 422);
            }

            $settlement->update([
                'status' => 'rejected',
                'rejection_reason' => $request->input('rejection_reason'),
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Settlement rejected. Debt remains unpaid.',
            ]);
        });
    }

    public function driverSettlements(int $driverId): JsonResponse
    {
        $settlements = DriverSettlement::where('driver_id', $driverId)
            ->with('reviewer')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $settlements,
        ]);
    }
}
