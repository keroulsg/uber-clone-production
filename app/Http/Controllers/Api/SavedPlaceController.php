<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SavedPlace;
use App\Services\FeatureFlagService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SavedPlaceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if (!app(FeatureFlagService::class)->isEnabled('saved_places')) {
            return response()->json(['success' => false, 'message' => 'Feature not available'], 403);
        }

        $places = SavedPlace::where('user_id', $request->user()->id)
            ->orderBy('is_favorite', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $places->map(fn($p) => $this->formatPlace($p)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if (!app(FeatureFlagService::class)->isEnabled('saved_places')) {
            return response()->json(['success' => false, 'message' => 'Feature not available'], 403);
        }

        $request->validate([
            'label' => 'required|string|in:home,work,custom',
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:500',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'is_favorite' => 'boolean',
        ]);

        $place = SavedPlace::create([
            'user_id' => $request->user()->id,
            'label' => $request->input('label'),
            'name' => $request->input('name'),
            'address' => $request->input('address'),
            'latitude' => $request->input('latitude'),
            'longitude' => $request->input('longitude'),
            'is_favorite' => $request->input('is_favorite', false),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Place saved',
            'data' => $this->formatPlace($place),
        ], 201);
    }

    public function show(int $id, Request $request): JsonResponse
    {
        if (!app(FeatureFlagService::class)->isEnabled('saved_places')) {
            return response()->json(['success' => false, 'message' => 'Feature not available'], 403);
        }

        $place = SavedPlace::where('id', $id)->first();

        if (!$place) {
            return response()->json(['success' => false, 'message' => 'Place not found'], 404);
        }

        if ($place->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatPlace($place),
        ]);
    }

    public function update(int $id, Request $request): JsonResponse
    {
        if (!app(FeatureFlagService::class)->isEnabled('saved_places')) {
            return response()->json(['success' => false, 'message' => 'Feature not available'], 403);
        }

        $place = SavedPlace::where('id', $id)->first();

        if (!$place) {
            return response()->json(['success' => false, 'message' => 'Place not found'], 404);
        }

        if ($place->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'label' => 'sometimes|string|in:home,work,custom',
            'name' => 'sometimes|string|max:255',
            'address' => 'sometimes|string|max:500',
            'latitude' => 'sometimes|numeric|between:-90,90',
            'longitude' => 'sometimes|numeric|between:-180,180',
            'is_favorite' => 'boolean',
        ]);

        $place->update($request->only(['label', 'name', 'address', 'latitude', 'longitude', 'is_favorite']));

        return response()->json([
            'success' => true,
            'message' => 'Place updated',
            'data' => $this->formatPlace($place),
        ]);
    }

    public function destroy(int $id, Request $request): JsonResponse
    {
        if (!app(FeatureFlagService::class)->isEnabled('saved_places')) {
            return response()->json(['success' => false, 'message' => 'Feature not available'], 403);
        }

        $place = SavedPlace::where('id', $id)->first();

        if (!$place) {
            return response()->json(['success' => false, 'message' => 'Place not found'], 404);
        }

        if ($place->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $place->delete();

        return response()->json([
            'success' => true,
            'message' => 'Place deleted',
        ]);
    }

    private function formatPlace(SavedPlace $place): array
    {
        return [
            'id' => (string) $place->id,
            'label' => $place->label,
            'name' => $place->name,
            'address' => $place->address,
            'latitude' => (float) $place->latitude,
            'longitude' => (float) $place->longitude,
            'isFavorite' => $place->is_favorite,
            'createdAt' => $place->created_at?->toISOString(),
        ];
    }
}
