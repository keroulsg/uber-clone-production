<?php

namespace App\Http\Middleware;

use App\Services\FeatureFlagService;
use Closure;
use Illuminate\Http\Request;

class CheckFeatureFlag
{
    public function __construct(
        private FeatureFlagService $featureService,
    ) {}

    public function handle(Request $request, Closure $next, string $featureCode)
    {
        if (!$this->featureService->isEnabled($featureCode)) {
            return response()->json([
                'success' => false,
                'message' => 'Feature currently disabled',
            ], 403);
        }

        return $next($request);
    }
}
