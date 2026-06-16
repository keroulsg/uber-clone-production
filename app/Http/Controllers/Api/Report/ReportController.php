<?php

namespace App\Http\Controllers\Api\Report;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function __construct(
        private ReportService $reportService,
    ) {}

    public function daily(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->reportService->daily(),
        ]);
    }

    public function weekly(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->reportService->weekly(),
        ]);
    }

    public function monthly(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->reportService->monthly(),
        ]);
    }

    public function revenue(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->reportService->revenue(),
        ]);
    }

    public function rides(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => \App\Models\Ride::with('rider', 'driver.user', 'vehicleType')
                ->latest()
                ->paginate(20),
        ]);
    }

    public function drivers(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => \App\Models\Driver::with('user', 'vehicles')
                ->latest()
                ->paginate(20),
        ]);
    }

    public function users(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => \App\Models\User::latest()->paginate(20),
        ]);
    }
}
