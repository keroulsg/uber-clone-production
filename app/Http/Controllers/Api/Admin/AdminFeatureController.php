<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\FeatureFlagService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminFeatureController extends Controller
{
    public function __construct(
        private FeatureFlagService $featureService,
    ) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'features' => $this->featureService->all(),
                'categories' => $this->featureService->categories(),
            ],
        ]);
    }

    public function update(Request $request, string $code): JsonResponse
    {
        $request->validate([
            'is_enabled' => 'required|boolean',
        ]);

        $enabled = $request->boolean('is_enabled');

        if ($enabled) {
            $this->featureService->enable($code);
        } else {
            $this->featureService->disable($code);
        }

        return response()->json([
            'success' => true,
            'message' => ($enabled ? 'Enabled' : 'Disabled') . " feature: {$code}",
        ]);
    }
}
