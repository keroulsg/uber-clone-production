<?php

namespace App\Http\Controllers\Api\Rating;

use App\Http\Controllers\Controller;
use App\Http\Requests\RateDriverRequest;
use App\Http\Requests\RateRiderRequest;
use App\Http\Resources\RatingResource;
use App\Models\Ride;
use App\Services\RatingService;
use App\Services\FeatureFlagService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

        $rideId = (int) $request->input('ride_id');
        $raterId = $request->user()->id;

        // Validate ride exists and belongs to this rider
        $ride = Ride::find($rideId);
        if (!$ride) {
            return response()->json(['success' => false, 'message' => 'Ride not found'], 404);
        }
        if ($ride->rider_id !== $raterId) {
            return response()->json(['success' => false, 'message' => 'You can only rate rides you took'], 403);
        }
        if (!$ride->driver_id) {
            return response()->json(['success' => false, 'message' => 'Cannot rate this ride because no driver was assigned'], 422);
        }

        try {
            $rating = $this->ratingService->rateDriver(
                $rideId,
                $raterId,
                (int) $request->input('rating'),
                $request->input('comment')
            );

            return response()->json([
                'success' => true,
                'message' => 'Rating submitted',
                'data' => new RatingResource($rating),
            ], 201);
        } catch (\RuntimeException $e) {
            $message = $e->getMessage();

            if (str_contains($message, 'already rated')) {
                return response()->json(['success' => false, 'message' => 'You already rated this driver for this ride'], 409);
            }
            if (str_contains($message, 'completed ride')) {
                return response()->json(['success' => false, 'message' => 'You can only rate a completed ride'], 422);
            }

            return response()->json(['success' => false, 'message' => $message], 400);
        }
    }

    public function rateRider(RateRiderRequest $request): JsonResponse
    {
        if (!app(FeatureFlagService::class)->isEnabled('ratings')) {
            return response()->json(['success' => false, 'message' => 'Ratings are currently disabled'], 403);
        }

        $rideId = (int) $request->input('ride_id');
        $raterId = $request->user()->id;

        $ride = Ride::find($rideId);
        if (!$ride) {
            return response()->json(['success' => false, 'message' => 'Ride not found'], 404);
        }
        if (!$ride->driver || $ride->driver->user_id !== $raterId) {
            return response()->json(['success' => false, 'message' => 'You can only rate rides you drove'], 403);
        }
        if (!$ride->rider_id) {
            return response()->json(['success' => false, 'message' => 'Cannot rate this ride because no rider was assigned'], 422);
        }

        try {
            $rating = $this->ratingService->rateRider(
                $rideId,
                $raterId,
                (int) $request->input('rating'),
                $request->input('comment')
            );

            return response()->json([
                'success' => true,
                'message' => 'Rating submitted',
                'data' => new RatingResource($rating),
            ], 201);
        } catch (\RuntimeException $e) {
            $message = $e->getMessage();

            if (str_contains($message, 'already rated')) {
                return response()->json(['success' => false, 'message' => 'You already rated this rider for this ride'], 409);
            }
            if (str_contains($message, 'completed ride')) {
                return response()->json(['success' => false, 'message' => 'You can only rate a completed ride'], 422);
            }

            return response()->json(['success' => false, 'message' => $message], 400);
        }
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

    public function myDriverRatings(Request $request): JsonResponse
    {
        $user = $request->user();
        $driver = \App\Models\Driver::where('user_id', $user->id)->first();
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver profile not found'], 404);
        }

        $ratings = $this->ratingService->getDriverRatings($driver->id);

        return $this->formatRatingsResponse($ratings);
    }

    public function myRiderRatings(Request $request): JsonResponse
    {
        $user = $request->user();

        $ratings = $this->ratingService->getRiderRatings($user->id);

        return $this->formatRatingsResponse($ratings);
    }

    private function formatRatingsResponse($ratings): JsonResponse
    {
        $total = $ratings->count();
        $average = $total > 0 ? round($ratings->avg('rating'), 2) : 0;

        $distribution = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];
        foreach ($ratings as $r) {
            $star = (int) $r->rating;
            if (isset($distribution[$star])) {
                $distribution[$star]++;
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'data' => RatingResource::collection($ratings),
                'meta' => [
                    'averageRating' => (float) $average,
                    'totalReviews' => $total,
                    'distribution' => $distribution,
                ],
            ],
        ]);
    }
}
