<?php

namespace App\Http\Controllers\Api\Chat;

use App\Http\Controllers\Controller;
use App\Events\MessageSent;
use App\Models\ChatMessage;
use App\Models\Ride;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function index(int $rideId, Request $request): JsonResponse
    {
        $ride = Ride::find($rideId);
        if (!$ride) {
            return response()->json(['success' => false, 'message' => 'Ride not found'], 404);
        }

        $user = $request->user();
        $isRider = $ride->rider_id === $user->id;
        $isDriver = $ride->driver_id !== null && $ride->driver?->user_id === $user->id;

        if (!$isRider && !$isDriver) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $messages = ChatMessage::with('user')
            ->where('ride_id', $rideId)
            ->oldest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $messages->map(fn ($m) => [
                'id' => $m->id,
                'ride_id' => $m->ride_id,
                'user_id' => $m->user_id,
                'user_name' => $m->user?->name ?? 'Unknown',
                'message' => $m->message,
                'created_at' => $m->created_at?->toISOString(),
            ]),
        ]);
    }

    public function store(int $rideId, Request $request): JsonResponse
    {
        $ride = Ride::find($rideId);
        if (!$ride) {
            return response()->json(['success' => false, 'message' => 'Ride not found'], 404);
        }

        $user = $request->user();
        $isRider = $ride->rider_id === $user->id;
        $isDriver = $ride->driver_id !== null && $ride->driver?->user_id === $user->id;

        if (!$isRider && !$isDriver) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'message' => 'required|string|max:5000',
        ]);

        $message = ChatMessage::create([
            'ride_id' => $rideId,
            'user_id' => $user->id,
            'message' => $validated['message'],
        ]);

        broadcast(new MessageSent($message->load('user')));

        return response()->json([
            'success' => true,
            'message' => 'Message sent',
            'data' => [
                'id' => $message->id,
                'ride_id' => $message->ride_id,
                'user_id' => $message->user_id,
                'message' => $message->message,
                'created_at' => $message->created_at?->toISOString(),
            ],
        ], 201);
    }
}
