<?php

namespace App\Http\Controllers\Api\Settlement;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Models\DriverSettlement;
use App\Models\DriverDebt;
use App\Services\FeatureFlagService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverSettlementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if (!app(FeatureFlagService::class)->isEnabled('driver_settlements')) {
            return response()->json(['success' => false, 'message' => 'Driver settlements are currently disabled'], 403);
        }

        $driver = Driver::where('user_id', $request->user()->id)->first();
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver not found'], 404);
        }

        $settlements = DriverSettlement::where('driver_id', $driver->id)
            ->latest()
            ->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'amount' => (float) $s->amount,
                'method' => $s->method,
                'reference' => $s->reference,
                'note' => $s->note,
                'status' => $s->status,
                'rejection_reason' => $s->rejection_reason,
                'created_at' => $s->created_at?->toISOString(),
                'reviewed_at' => $s->reviewed_at?->toISOString(),
            ]);

        return response()->json([
            'success' => true,
            'data' => $settlements,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if (!app(FeatureFlagService::class)->isEnabled('driver_settlements')) {
            return response()->json(['success' => false, 'message' => 'Driver settlements are currently disabled'], 403);
        }

        $driver = Driver::where('user_id', $request->user()->id)->first();
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver not found'], 404);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'method' => 'required|string|in:cash,instapay,vodafone_cash,bank_transfer,card,fawry,paymob,other',
            'reference' => 'nullable|string|max:255',
            'note' => 'nullable|string|max:1000',
            'attachment' => 'nullable|image|max:2048',
        ]);

        $outstandingDebt = (float) DriverDebt::where('driver_id', $driver->id)
            ->whereNull('paid_at')
            ->sum('amount');

        if ((float) $validated['amount'] > $outstandingDebt) {
            return response()->json([
                'success' => false,
                'message' => 'Settlement amount cannot exceed outstanding debt of ' . number_format($outstandingDebt, 2),
            ], 422);
        }

        if (!in_array($validated['method'], ['cash']) && empty($validated['reference'])) {
            return response()->json([
                'success' => false,
                'message' => 'Reference number is required for this payment method',
            ], 422);
        }

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('settlements', 'public');
        }

        $settlement = DriverSettlement::create([
            'driver_id' => $driver->id,
            'amount' => $validated['amount'],
            'method' => $validated['method'],
            'reference' => $validated['reference'] ?? null,
            'note' => $validated['note'] ?? null,
            'attachment_path' => $attachmentPath,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Settlement request submitted. Awaiting admin approval.',
            'data' => [
                'id' => $settlement->id,
                'amount' => (float) $settlement->amount,
                'method' => $settlement->method,
                'status' => $settlement->status,
                'created_at' => $settlement->created_at?->toISOString(),
            ],
        ], 201);
    }
}
