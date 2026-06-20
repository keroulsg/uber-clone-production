<?php

namespace App\Http\Controllers\Api\Rating;

use App\Http\Controllers\Controller;
use App\Http\Requests\RateDriverRequest;
use App\Http\Requests\RateRiderRequest;
use App\Http\Resources\RatingResource;
use App\Services\RatingService;
use App\Services\FeatureFlagService;
use Illuminate\Http\JsonResponse;

class RatingController extends Controller
{
    public function __construct(
        private RatingService $ratingService,
    ) {}

    public function rateDriver(RateDriverRequest $request): JsonResponse
    {
        if (!app(FeatureFlagService::class)->isEnabled('ratings')) {
            return response()->json(['success' => false, 'message' => 'Ratings are currently disabled'], 403);
        }

        $rating = $this->ratingService->rateDriver(
            $request->input('ride_id'),
            $request->user()->id,
            $request->input('rating'),
            $request->input('comment')
        );

        return response()->json([
            'success' => true,
            'message' => 'Rating submitted',
            'data' => new RatingResource($rating),
        ], 201);
    }

    public function rateRider(RateRiderRequest $request): JsonResponse
    {
        if (!app(FeatureFlagService::class)->isEnabled('ratings')) {
            return response()->json(['success' => false, 'message' => 'Ratings are currently disabled'], 403);
        }

        $rating = $this->ratingService->rateRider(
            $request->input('ride_id'),
            $request->user()->id,
            $request->input('rating'),
            $request->input('comment')
        );

        return response()->json([
            'success' => true,
            'message' => 'Rating submitted',
            'data' => new RatingResource($rating),
        ], 201);
    }

    public function driverRatings(int $driverId): JsonResponse
    {
        $ratings = $this->ratingService->getDriverRatings($driverId);

        return response()->json([
            'success' => true,
            'data' => RatingResource::collection($ratings),
        ]);
    }

    public function riderRatings(int $riderId): JsonResponse
    {
        $ratings = $this->ratingService->getRiderRatings($riderId);

        return response()->json([
            'success' => true,
            'data' => RatingResource::collection($ratings),
        ]);
    }
}
