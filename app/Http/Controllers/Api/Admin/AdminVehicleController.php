<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\VehicleResource;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminVehicleController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => VehicleResource::collection(
                Vehicle::with('driver.user', 'vehicleType')->latest()->paginate(20)
            ),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $vehicle = Vehicle::with('driver.user', 'vehicleType')->find($id);
        if (!$vehicle) {
            return response()->json(['success' => false, 'message' => 'Vehicle not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new VehicleResource($vehicle),
        ]);
    }

    public function approve(int $id): JsonResponse
    {
        Vehicle::where('id', $id)->update(['status' => 'approved', 'is_active' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Vehicle approved',
        ]);
    }

    public function reject(int $id, Request $request): JsonResponse
    {
        Vehicle::where('id', $id)->update(['status' => 'rejected']);

        return response()->json([
            'success' => true,
            'message' => 'Vehicle rejected',
        ]);
    }

    public function suspend(int $id): JsonResponse
    {
        Vehicle::where('id', $id)->update(['status' => 'suspended', 'is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Vehicle suspended',
        ]);
    }
}
