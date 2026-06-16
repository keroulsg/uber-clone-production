<?php

namespace App\Http\Controllers\Api\Vehicle;

use App\Http\Controllers\Controller;
use App\Http\Requests\VehicleRegistrationRequest;
use App\Http\Resources\VehicleTypeResource;
use App\Http\Resources\VehicleResource;
use App\Services\VehicleService;
use App\Repositories\DriverRepository;
use App\Repositories\VehicleRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    public function __construct(
        private VehicleService $vehicleService,
        private VehicleRepository $vehicleRepo,
        private DriverRepository $driverRepo,
    ) {}

    public function types(): JsonResponse
    {
        $types = $this->vehicleService->getTypes();

        return response()->json([
            'success' => true,
            'data' => VehicleTypeResource::collection($types),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $driver = $this->driverRepo->findByUserId($request->user()->id);
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver not found'], 404);
        }

        $vehicles = $this->vehicleRepo->findByDriver($driver->id);

        return response()->json([
            'success' => true,
            'data' => VehicleResource::collection($vehicles),
        ]);
    }

    public function store(VehicleRegistrationRequest $request): JsonResponse
    {
        $driver = $this->driverRepo->findByUserId($request->user()->id);
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver not found'], 404);
        }

        $vehicle = $this->vehicleService->register($driver->id, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Vehicle registered',
            'data' => new VehicleResource($vehicle->load('vehicleType')),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $vehicle = $this->vehicleRepo->findById($id);
        if (!$vehicle) {
            return response()->json(['success' => false, 'message' => 'Vehicle not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new VehicleResource($vehicle),
        ]);
    }

    public function update(int $id, Request $request): JsonResponse
    {
        $vehicle = $this->vehicleRepo->findById($id);
        if (!$vehicle) {
            return response()->json(['success' => false, 'message' => 'Vehicle not found'], 404);
        }

        $vehicle->update($request->only([
            'make', 'model', 'year', 'color', 'license_plate',
            'vehicle_class', 'vehicle_type_id', 'features',
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Vehicle updated',
            'data' => new VehicleResource($vehicle->fresh()->load('vehicleType')),
        ]);
    }

    public function uploadDocument(int $id, Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Document uploaded',
        ]);
    }
}
