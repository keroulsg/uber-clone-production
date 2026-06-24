<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ServiceArea;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminServiceAreaController extends Controller
{
    public function index(): JsonResponse
    {
        $areas = ServiceArea::orderBy('name')->get();
        return response()->json([
            'success' => true,
            'data' => $areas,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:100|unique:service_areas,slug',
            'city' => 'nullable|string|max:100',
            'governorate' => 'nullable|string|max:100',
            'center_latitude' => 'nullable|numeric|between:-90,90',
            'center_longitude' => 'nullable|numeric|between:-180,180',
            'radius_km' => 'nullable|numeric|min:1',
            'cities' => 'nullable|array',
            'cities.*' => 'string|max:100',
            'is_active' => 'boolean',
        ]);

        if (isset($validated['cities'])) {
            $validated['cities'] = json_encode($validated['cities']);
        }

        $area = ServiceArea::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Service area created',
            'data' => $area,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $area = ServiceArea::find($id);
        if (!$area) {
            return response()->json(['success' => false, 'message' => 'Service area not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $area,
        ]);
    }

    public function update(int $id, Request $request): JsonResponse
    {
        $area = ServiceArea::find($id);
        if (!$area) {
            return response()->json(['success' => false, 'message' => 'Service area not found'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:100|unique:service_areas,slug,' . $id,
            'city' => 'nullable|string|max:100',
            'governorate' => 'nullable|string|max:100',
            'center_latitude' => 'nullable|numeric|between:-90,90',
            'center_longitude' => 'nullable|numeric|between:-180,180',
            'radius_km' => 'nullable|numeric|min:1',
            'cities' => 'nullable|array',
            'cities.*' => 'string|max:100',
            'is_active' => 'boolean',
        ]);

        if (isset($validated['cities'])) {
            $validated['cities'] = json_encode($validated['cities']);
        }

        $area->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Service area updated',
            'data' => $area->fresh(),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $area = ServiceArea::find($id);
        if (!$area) {
            return response()->json(['success' => false, 'message' => 'Service area not found'], 404);
        }

        $area->delete();

        return response()->json([
            'success' => true,
            'message' => 'Service area deleted',
        ]);
    }
}
