<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CancellationReason;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CancellationReasonController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $actor = $request->input('actor', 'rider');

        $reasons = CancellationReason::forActor($actor)->get();

        return response()->json([
            'success' => true,
            'data' => $reasons->map(fn($r) => [
                'id' => $r->id,
                'reason' => $r->reason,
            ]),
        ]);
    }
}
