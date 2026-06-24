<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\PromoCodeResource;
use App\Models\PromoCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminPromoCodeController extends Controller
{
    public function index(): JsonResponse
    {
        $paginator = PromoCode::latest()->paginate(20);
        return response()->json([
            'success' => true,
            'data' => [
                'data' => PromoCodeResource::collection($paginator->items()),
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
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:promo_codes,code',
            'type' => 'required|string|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'min_ride_amount' => 'nullable|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'expires_at' => 'nullable|date',
            'is_active' => 'boolean',
        ]);

        $promo = PromoCode::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Promo code created',
            'data' => new PromoCodeResource($promo),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $promo = PromoCode::find($id);
        if (!$promo) {
            return response()->json(['success' => false, 'message' => 'Promo code not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new PromoCodeResource($promo),
        ]);
    }

    public function update(int $id, Request $request): JsonResponse
    {
        $promo = PromoCode::find($id);
        if (!$promo) {
            return response()->json(['success' => false, 'message' => 'Promo code not found'], 404);
        }

        $validated = $request->validate([
            'code' => 'sometimes|string|max:50|unique:promo_codes,code,' . $id,
            'type' => 'sometimes|string|in:percentage,fixed',
            'value' => 'sometimes|numeric|min:0',
            'min_ride_amount' => 'nullable|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'expires_at' => 'nullable|date',
            'is_active' => 'boolean',
        ]);

        $promo->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Promo code updated',
            'data' => new PromoCodeResource($promo->fresh()),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $promo = PromoCode::find($id);
        if (!$promo) {
            return response()->json(['success' => false, 'message' => 'Promo code not found'], 404);
        }

        $promo->delete();

        return response()->json([
            'success' => true,
            'message' => 'Promo code deleted',
        ]);
    }
}
