<?php

namespace App\Http\Controllers\Api\Report;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use App\Models\Ride;
use App\Models\Driver;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

    public function custom(Request $request): JsonResponse
    {
        $request->validate([
            'from' => 'required|date',
            'to' => 'required|date|after_or_equal:from',
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->reportService->custom($request->input('from'), $request->input('to')),
        ]);
    }

    public function revenue(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->reportService->revenue(),
        ]);
    }

    public function charts(Request $request): JsonResponse
    {
        $period = $request->input('period', 'daily');

        return response()->json([
            'success' => true,
            'data' => $this->reportService->charts($period),
        ]);
    }

    public function rides(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => Ride::with('rider', 'driver.user', 'vehicleType')
                ->latest()
                ->paginate(20),
        ]);
    }

    public function drivers(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => Driver::with('user', 'vehicles')
                ->latest()
                ->paginate(20),
        ]);
    }

    public function users(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => User::latest()->paginate(20),
        ]);
    }

    public function export(Request $request): JsonResponse
    {
        $request->validate([
            'from' => 'required|date',
            'to' => 'required|date|after_or_equal:from',
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->reportService->export(
                $request->input('from'),
                $request->input('to')
            ),
        ]);
    }
}
